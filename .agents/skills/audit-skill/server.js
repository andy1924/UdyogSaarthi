// audit-skill collector: zero-dependency Node server.
// Serves the audit wrapper (/audit?url=...) which frames the target site
// through a same-origin proxy (/p/...), so the parent page can pick
// elements directly — no console injection needed.
// Receives batched notes via POST /api/notes into audit-notes.json.
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || process.argv[2] || 4317);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const NOTES_FILE = path.join(ROOT, "audit-notes.json");

let notes = [];
try {
  notes = JSON.parse(fs.readFileSync(NOTES_FILE, "utf8"));
  if (!Array.isArray(notes)) notes = [];
} catch { notes = []; }

function save() {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

const b64enc = (s) =>
  Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64dec = (s) =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

function send(res, code, body, type = "application/json") {
  res.writeHead(code, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function serveFile(res, file, type) {
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, JSON.stringify({ error: "not found" }));
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  });
}

// --- Same-origin proxy ---
// Two routes share one fetch core:
//   /p/<b64url-target-base>/<path...>?<query>  explicit proxy (iframe src)
//   any other unmatched path                   fallback proxy to the current
//                                              audit target (set by the wrapper
//                                              via POST /api/target), so
//                                              root-absolute assets AND api
//                                              calls (/api/..., /health,
//                                              /@vite/...) just work.
// Both strip framing headers so the site can live in the wrapper iframe,
// and HTML gets a <base> pointing back into /p/ so relative links stay
// inside the proxy (keeps picking + per-page notes working).
let currentTarget = null;

function proxyFetch(targetUrl, enc, dir, req, res) {
  const lib = targetUrl.startsWith("https:") ? https : http;
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const headers = { "Accept-Encoding": "identity" };
    if (req.headers["content-type"]) headers["Content-Type"] = req.headers["content-type"];
    if (req.headers.accept) headers.Accept = req.headers.accept;
    const up = lib.request(
      targetUrl,
      { method: req.method, headers: { ...headers, "User-Agent": req.headers["user-agent"] || "audit-skill" } },
      (upRes) => {
        const ctype = String(upRes.headers["content-type"] || "");
        const isHtml = ctype.includes("text/html");
        const out = [];
        upRes.on("data", (c) => out.push(c));
        upRes.on("end", () => {
          let buf = Buffer.concat(out);
          const rh = {};
          for (const [k, v] of Object.entries(upRes.headers)) {
            if (["x-frame-options", "content-security-policy", "content-security-policy-report-only", "content-length", "content-encoding", "transfer-encoding", "connection"].includes(k.toLowerCase())) continue;
            rh[k] = v;
          }
          if (isHtml) {
            let html = buf.toString("utf8");
            const base = `http://localhost:${PORT}/p/${enc}/${dir}`;
            if (/<head[^>]*>/i.test(html)) {
              html = html.replace(/<head[^>]*>/i, (m) => `${m}<base href="${base}">`);
            } else {
              html = `<base href="${base}">` + html;
            }
            buf = Buffer.from(html, "utf8");
          }
          rh["Content-Length"] = buf.length;
          res.writeHead(upRes.statusCode || 200, rh);
          res.end(buf);
        });
      }
    );
    up.on("error", () => send(res, 502, JSON.stringify({ error: "upstream failed", target: targetUrl })));
    if (body) up.write(body);
    up.end();
  });
}

function splitProxyPath(raw) {
  const qi = raw.indexOf("?");
  const pathPart = qi === -1 ? raw : raw.slice(0, qi);
  const query = qi === -1 ? "" : raw.slice(qi);
  const slash = pathPart.indexOf("/");
  const enc = slash === -1 ? pathPart : pathPart.slice(0, slash);
  const subPath = slash === -1 ? "" : pathPart.slice(slash + 1);
  return { enc, subPath, query };
}

function handleProxy(req, res) {
  const { enc, subPath, query } = splitProxyPath(req.url.slice(3)); // after /p/
  let targetBase;
  try {
    targetBase = b64dec(enc).replace(/\/+$/, "");
    if (!/^https?:\/\//.test(targetBase)) throw new Error("bad target");
  } catch {
    return send(res, 400, JSON.stringify({ error: "bad target" }));
  }
  const dir = subPath.includes("/") ? subPath.slice(0, subPath.lastIndexOf("/") + 1) : "";
  proxyFetch(targetBase + "/" + subPath + query, enc, dir, req, res);
}

function handleFallback(req, res, pathname) {
  if (!currentTarget) return send(res, 404, JSON.stringify({ error: "not found" }));
  const qi = req.url.indexOf("?");
  const query = qi === -1 ? "" : req.url.slice(qi);
  const rel = pathname.replace(/^\/+/, "");
  const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/") + 1) : "";
  proxyFetch(currentTarget + "/" + rel + query, b64enc(currentTarget), dir, req, res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");

  if (req.method === "OPTIONS") return send(res, 204, "");

  // --- API ---
  if (url.pathname === "/api/notes" && req.method === "GET") {
    return send(res, 200, JSON.stringify(notes));
  }
  if (url.pathname === "/api/notes" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        const body = JSON.parse(raw || "{}");
        const incoming = Array.isArray(body) ? body : body.notes || [];
        const seen = new Set(notes.map((n) => n.id));
        let added = 0;
        for (const n of incoming) {
          if (!n || !n.id || seen.has(n.id)) continue;
          seen.add(n.id);
          notes.push(n);
          added++;
        }
        save();
        send(res, 200, JSON.stringify({ ok: true, added, total: notes.length }));
      } catch {
        send(res, 400, JSON.stringify({ ok: false }));
      }
    });
    return;
  }
  if (url.pathname === "/api/notes" && req.method === "DELETE") {
    notes = [];
    save();
    return send(res, 200, JSON.stringify({ ok: true, total: 0 }));
  }

  // --- Target registration (wrapper sets this; fallback proxy uses it) ---
  if (url.pathname === "/api/target" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        const body = JSON.parse(raw || "{}");
        if (!body.url || !/^https?:\/\//.test(body.url)) throw new Error("bad url");
        currentTarget = body.url.replace(/\/+$/, "");
        send(res, 200, JSON.stringify({ ok: true, target: currentTarget }));
      } catch {
        send(res, 400, JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  // --- Wrapper UI ---
  if (url.pathname === "/audit") {
    return serveFile(res, path.join(PUBLIC, "wrapper.html"), "text/html");
  }

  // --- Proxy ---
  if (url.pathname === "/p/" || url.pathname.startsWith("/p/")) {
    return handleProxy(req, res);
  }

  // --- Status ---
  if (url.pathname === "/") {
    return send(res, 200, JSON.stringify({ ok: true, audit: "/audit?url=<site>", total: notes.length }));
  }

  // --- Fallback: root-absolute assets + api calls go to the audit target ---
  if (req.method !== "CONNECT" && req.method !== "TRACE") {
    return handleFallback(req, res, url.pathname);
  }

  send(res, 404, JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`[audit-skill] wrapper: http://localhost:${PORT}/audit?url=<site>`);
  console.log(`[audit-skill] notes:   ${NOTES_FILE}`);
});
