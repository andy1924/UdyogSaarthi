import { createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const API_URL = (process.env.BACKEND_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function signingSecret(): Promise<string | null> {
  if (process.env.BACKEND_HMAC_SECRET) return process.env.BACKEND_HMAC_SECRET;
  const file = process.env.BACKEND_HMAC_SECRET_FILE;
  if (!file) return null;
  try { return (await readFile(file, "utf8")).trim() || null; } catch { return null; }
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const upstreamPath = `/${path.map(encodeURIComponent).join("/")}`;
  const body = request.method === "GET" || request.method === "HEAD" ? Buffer.alloc(0) : Buffer.from(await request.arrayBuffer());
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    const secret = await signingSecret();
    if (!secret) return Response.json({ detail: "Backend proxy signing is not configured." }, { status: 503 });
    const timestamp = String(Date.now() / 1000);
    const nonce = randomUUID();
    const signature = createHmac("sha256", secret).update(Buffer.concat([Buffer.from(request.method), Buffer.from(upstreamPath), Buffer.from(timestamp), Buffer.from(nonce), body])).digest("hex");
    headers.set("x-timestamp", timestamp);
    headers.set("x-nonce", nonce);
    headers.set("x-signature", signature);
  }
  try {
    const upstream = await fetch(`${API_URL}${upstreamPath}${request.nextUrl.search}`, { method: request.method, headers, body: body.length ? body : undefined, cache: "no-store" });
    const responseHeaders = new Headers();
    for (const name of ["content-type", "content-disposition", "retry-after"]) { const value = upstream.headers.get(name); if (value) responseHeaders.set(name, value); }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch { return Response.json({ detail: "Backend service is unavailable." }, { status: 503 }); }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
