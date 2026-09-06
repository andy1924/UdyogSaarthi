/**
 * Wave 0 API contract test (pure unit test — no live server).
 *
 * Asserts URL / method / auth-flag construction for every `SaarthiApi`
 * method against docs/apiDocs.md + docs/frontend/DESIGN.md §4 by stubbing
 * `globalThis.fetch` and capturing the outgoing requests:
 * - base default is `http://localhost:8000`
 * - `POST /auth/token` sends an OAuth2 FORM-ENCODED body (never JSON)
 * - scheme / feasibility / compliance / nearby / dpr paths + auth flags
 *
 * Typechecks with `npx tsc --noEmit`. Executed via `npm test` (compiled
 * by `tsconfig.test.json`, run by `src/lib/run-tests.ts`); standalone via
 * `node .test-out/src/lib/api-contract.test.js` after compiling —
 * importing this module from app code has no side effects.
 */

import { DEFAULT_API_BASE, getApiBase } from "./api-base";
import {
  JWT_KEY,
  SaarthiApi,
  getToken,
  setToken,
} from "./api-client";

// ── Minimal test harness (no framework) ─────────────────────────────────────

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`contract: ${msg}`);
}

interface Captured {
  url: string;
  method: string;
  headers: Record<string, string>;
  bodyText: string | undefined;
}

interface FakeHeaders {
  get(name: string): string | null;
}

class FakeResponse {
  ok = true;
  status = 200;
  statusText = "OK";
  headers: FakeHeaders = { get: () => "application/json" };
  async json(): Promise<unknown> {
    return {};
  }
  async text(): Promise<string> {
    return "";
  }
  async blob(): Promise<Blob> {
    return new Blob(["%PDF-fake"], { type: "application/pdf" });
  }
}

function memStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k) ?? null : null),
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
  };
}

const TEST_TOKEN = "test-jwt-token";

function installHarness(captured: Captured[]): () => void {
  const store = memStorage();
  const g = globalThis as unknown as Record<string, unknown>;
  const prevFetch = g.fetch;
  const prevWindow = g.window;
  g.window = { localStorage: store };
  store.setItem(JWT_KEY, TEST_TOKEN);
  g.fetch = (async (url: unknown, init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }): Promise<FakeResponse> => {
    captured.push({
      url: String(url),
      method: init?.method ?? "GET",
      headers: { ...(init?.headers ?? {}) },
      bodyText: typeof init?.body === "string" ? init.body : undefined,
    });
    return new FakeResponse();
  }) as unknown as typeof fetch;
  return () => {
    g.fetch = prevFetch;
    g.window = prevWindow;
  };
}

function last(captured: Captured[]): Captured {
  assert(captured.length > 0, "expected fetch to be called");
  return captured[captured.length - 1] as Captured;
}

function expectAuth(headers: Record<string, string>, want: boolean, where: string): void {
  const got = headers.Authorization ?? headers.authorization;
  if (want) assert(got === `Bearer ${TEST_TOKEN}`, `${where} must send Bearer JWT`);
  else assert(got === undefined, `${where} must NOT send Authorization`);
}

// ── Tests ───────────────────────────────────────────────────────────────────

async function runContractTests(): Promise<void> {
  const captured: Captured[] = [];
  const restore = installHarness(captured);
  const results: string[] = [];
  try {
    // 1. Base default is :8000 (no stored override in a fresh harness).
    assert(DEFAULT_API_BASE === "http://localhost:8000", "DEFAULT_API_BASE must be :8000");
    assert(getApiBase() === "http://localhost:8000", "getApiBase() must default to :8000");
    results.push("ok base default :8000");

    // 2. JWT helpers use the saarthi-jwt key.
    assert(JWT_KEY === "saarthi-jwt", "JWT key must be saarthi-jwt");
    assert(getToken() === TEST_TOKEN, "getToken reads saarthi-jwt");
    setToken("rotated");
    assert(getToken() === "rotated", "setToken writes saarthi-jwt");
    setToken(TEST_TOKEN);
    results.push("ok jwt key saarthi-jwt");

    // 3. Token login is OAuth2 FORM-encoded, never JSON, never authed.
    await SaarthiApi.token("ravi@example.com", "Secure123");
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/auth/token", "token path");
      assert(req.method === "POST", "token method POST");
      assert(
        req.headers["Content-Type"] === "application/x-www-form-urlencoded",
        "token content-type is form-encoded",
      );
      const form = new URLSearchParams(req.bodyText ?? "");
      assert(form.get("username") === "ravi@example.com", "token form username");
      assert(form.get("password") === "Secure123", "token form password");
      assert(req.bodyText !== undefined && !req.bodyText.trim().startsWith("{"), "token body never JSON");
      expectAuth(req.headers, false, "POST /auth/token");
      results.push("ok token login form-encoding");
    }

    // 4. Register: public JSON POST.
    await SaarthiApi.register({ email: "a@b.c", password: "Secure123" });
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/auth/register", "register path");
      assert(req.method === "POST", "register method POST");
      assert(req.headers["Content-Type"] === "application/json", "register content-type JSON");
      expectAuth(req.headers, false, "POST /auth/register");
      results.push("ok register public JSON");
    }

    // 5. Me: authed GET.
    await SaarthiApi.me();
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/auth/me", "me path");
      assert(req.method === "GET", "me method GET");
      expectAuth(req.headers, true, "GET /auth/me");
      results.push("ok me authed");
    }

    // 6. Scheme rules: public GET.
    await SaarthiApi.schemeRules();
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/api/scheme/rules", "scheme rules path");
      assert(req.method === "GET", "scheme rules method GET");
      expectAuth(req.headers, false, "GET /api/scheme/rules");
      results.push("ok scheme rules public");
    }

    // 7. Scheme calculate: public POST (never authed, never computed client-side).
    await SaarthiApi.schemeCalculate({ margin: 100000, business_category: "dairy" });
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/api/scheme/calculate", "scheme calculate path");
      assert(req.method === "POST", "scheme calculate method POST");
      const body = JSON.parse(req.bodyText ?? "{}") as { margin?: unknown };
      assert(body.margin === 100000, "scheme calculate sends margin through");
      expectAuth(req.headers, false, "POST /api/scheme/calculate");
      results.push("ok scheme calculate public");
    }

    // 8. Feasibility score: authed POST.
    await SaarthiApi.feasibilityScore({
      location_text: "Hilsa, Nalanda, Bihar",
      business_category: "dairy",
    });
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/api/feasibility/score", "feasibility path");
      assert(req.method === "POST", "feasibility method POST");
      expectAuth(req.headers, true, "POST /api/feasibility/score");
      results.push("ok feasibility authed");
    }

    // 9. Compliance licenses: public GET with query params.
    await SaarthiApi.complianceLicenses("dairy", "Bihar", "Nalanda");
    {
      const req = last(captured);
      const u = new URL(req.url);
      assert(u.origin + u.pathname === "http://localhost:8000/api/compliance/licenses", "compliance path");
      assert(req.method === "GET", "compliance method GET");
      assert(u.searchParams.get("business_category") === "dairy", "compliance category param");
      assert(u.searchParams.get("state") === "Bihar", "compliance state param");
      assert(u.searchParams.get("district") === "Nalanda", "compliance district param");
      expectAuth(req.headers, false, "GET /api/compliance/licenses");
      results.push("ok compliance public");
    }

    // 10. Directory nearby: public GET, radius clamped to UI range ≤10000.
    await SaarthiApi.directoryNearby({ lat: 25.3, lon: 85.6, radius_m: 50000, category: "dairy" });
    {
      const req = last(captured);
      const u = new URL(req.url);
      assert(u.origin + u.pathname === "http://localhost:8000/api/directory/nearby", "nearby path");
      assert(req.method === "GET", "nearby method GET");
      assert(u.searchParams.get("lat") === "25.3", "nearby lat param");
      assert(u.searchParams.get("lon") === "85.6", "nearby lon param");
      assert(u.searchParams.get("radius_m") === "10000", "nearby radius clamped to 10000");
      assert(u.searchParams.get("category") === "dairy", "nearby category param");
      expectAuth(req.headers, false, "GET /api/directory/nearby");
      results.push("ok nearby public + clamped");
    }

    // 11. DPR render: authed POST.
    await SaarthiApi.dprRender({
      feasibility: {
        lgd: { state: "Bihar", district: "Nalanda", block: "Hilsa", gp: null, code: "BR-NA-HI", lat: 25.3, lon: 85.6 },
        business_category: "dairy",
        poi_count: 3,
        density_score: 42,
        verdict: "viable",
        swot: {},
        opportunities: [],
        overpass_ql: "",
      },
      scheme: {
        margin: 100000,
        tpc: 400000,
        max_loan_raw: 300000,
        max_loan_capped: 125000,
        tier: "micro",
        rules: { tier: "micro", cap: 125000, rate: 6.5, tenure_years: 3, moratorium_months: 6, effective_from: "2024-11-01", version: "v2024-11" },
        working_capital_buffer: 10000,
        eqi_schedule: [],
        eqi_amount: 3800,
      },
      applicant_name: "Ravi Kumar",
    });
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/api/dpr/render", "dpr render path");
      assert(req.method === "POST", "dpr render method POST");
      expectAuth(req.headers, true, "POST /api/dpr/render");
      results.push("ok dpr render authed");
    }

    // 12. DPR get / download-url / transition / history.
    await SaarthiApi.dprGet("DPR-ABC123");
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/api/dpr/DPR-ABC123", "dpr get path");
      assert(req.method === "GET", "dpr get method GET");
      expectAuth(req.headers, true, "GET /api/dpr/{id}");
    }
    assert(
      SaarthiApi.dprDownloadUrl("DPR-ABC123") === "http://localhost:8000/api/dpr/DPR-ABC123/download",
      "dpr download url",
    );
    await SaarthiApi.dprTransition("DPR-ABC123", { action: "submit_for_review" });
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/api/dpr/DPR-ABC123/transition", "dpr transition path");
      assert(req.method === "POST", "dpr transition method POST");
      const body = JSON.parse(req.bodyText ?? "{}") as { action?: unknown };
      assert(body.action === "submit_for_review", "dpr transition action");
      expectAuth(req.headers, true, "POST /api/dpr/{id}/transition");
    }
    await SaarthiApi.dprHistory("DPR-ABC123");
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/api/dpr/DPR-ABC123/history", "dpr history path");
      assert(req.method === "GET", "dpr history method GET");
      expectAuth(req.headers, true, "GET /api/dpr/{id}/history");
      results.push("ok dpr get/download/transition/history");
    }

    // 13. Health: public GET.
    await SaarthiApi.health();
    {
      const req = last(captured);
      assert(req.url === "http://localhost:8000/health", "health path");
      assert(req.method === "GET", "health method GET");
      expectAuth(req.headers, false, "GET /health");
      results.push("ok health public");
    }
  } finally {
    restore();
  }

  for (const line of results) console.log(line);
  console.log(`contract: ${results.length}/13 groups passed`);
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  ((process.argv[1] ?? "").endsWith("api-contract.test.ts") ||
    (process.argv[1] ?? "").endsWith("api-contract.test.js"));

if (invokedDirectly) {
  runContractTests().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}

export { runContractTests };
