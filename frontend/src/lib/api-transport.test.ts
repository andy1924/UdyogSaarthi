/**
 * API transport-rule unit tests (dependency-free — no framework).
 *
 * Locks in the guarantees documented on `SaarthiApi` (`src/lib/api-client.ts`)
 * that the contract test does not cover:
 * - POST requests NEVER auto-retry (exactly 1 fetch on 500)
 * - GET retries idempotent reads (503 → success on attempt 2)
 * - GET never retries 404 (exactly 1 fetch, `ApiError` 404)
 * - GET retries network failures, then succeeds
 * - Bearer JWT attaches when stored; absent otherwise
 *
 * Only the 2-attempt-success paths are exercised so the suite stays fast
 * (each costs one 2 s backoff, ~4 s total) — full 3-attempt exhaustion would
 * burn 6 s per case for no extra signal.
 *
 * Typechecks with `npx tsc --noEmit`. Executed via `npm test` (compiled
 * by `tsconfig.test.json`, run by `src/lib/run-tests.ts`) — importing
 * this module from app code has no side effects.
 */

import { ApiError, JWT_KEY, SaarthiApi } from "./api-client";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`transport: ${msg}`);
}

interface FakeHeaders {
  get(name: string): string | null;
}

class FakeResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: FakeHeaders;
  #payload: unknown;
  constructor(ok: boolean, status: number, payload: unknown) {
    this.ok = ok;
    this.status = status;
    this.statusText = ok ? "OK" : `Error ${status}`;
    this.headers = { get: () => "application/json" };
    this.#payload = payload;
  }
  async json(): Promise<unknown> {
    return this.#payload;
  }
  async text(): Promise<string> {
    return "";
  }
}

function memStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? (map.get(k) ?? null) : null),
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
  };
}

const TEST_TOKEN = "test-jwt-token";
const g = globalThis as unknown as Record<string, unknown>;

type Planned = { ok: boolean; status: number; payload: unknown } | { networkError: string };

/**
 * Stub fetch with a per-call plan. Unplanned calls return `{}` 200.
 * Returns restore + per-call request log.
 */
function installHarness(
  store: Storage,
  plan: Planned[],
): { restore: () => void; calls: { url: string; method: string; headers: Record<string, string> }[] } {
  const prevFetch = g.fetch;
  const prevWindow = g.window;
  g.window = { localStorage: store };
  const calls: { url: string; method: string; headers: Record<string, string> }[] = [];
  let n = 0;
  g.fetch = (async (url: unknown, init?: {
    method?: string;
    headers?: Record<string, string>;
  }): Promise<FakeResponse> => {
    calls.push({ url: String(url), method: init?.method ?? "GET", headers: { ...(init?.headers ?? {}) } });
    const step = plan[n++];
    if (step && "networkError" in step) throw new Error(step.networkError);
    if (step) return new FakeResponse(step.ok, step.status, step.payload);
    return new FakeResponse(true, 200, {});
  }) as unknown as typeof fetch;
  return {
    restore: () => {
      g.fetch = prevFetch;
      g.window = prevWindow;
    },
    calls,
  };
}

async function throwsApiError(p: Promise<unknown>): Promise<ApiError> {
  try {
    await p;
  } catch (err: unknown) {
    assert(err instanceof ApiError, "throws ApiError");
    return err as ApiError;
  }
  throw new Error("transport: expected ApiError, request succeeded");
}

async function runTransportTests(): Promise<void> {
  const results: string[] = [];

  // 1. POST never retries: one fetch on 500, ApiError carries status+detail.
  {
    const store = memStorage();
    const { restore, calls } = installHarness(store, [
      { ok: false, status: 500, payload: { detail: "boom" } },
    ]);
    try {
      const err = await throwsApiError(SaarthiApi.schemeCalculate({ margin: 100000 }));
      assert(calls.length === 1, `POST made 1 fetch (got ${calls.length})`);
      assert(err.status === 500, "ApiError status 500");
      assert(err.detail === "boom", "ApiError detail through");
      assert(err.name === "ApiError", "ApiError name");
      results.push("ok POST never retries");
    } finally {
      restore();
    }
  }

  // 2. GET retries a retryable status, then succeeds.
  {
    const store = memStorage();
    const { restore, calls } = installHarness(store, [
      { ok: false, status: 503, payload: { detail: "warming up" } },
      { ok: true, status: 200, payload: { status: "ok", database: "up", redis: "up" } },
    ]);
    try {
      const out = await SaarthiApi.health();
      assert(calls.length === 2, `GET retried once (got ${calls.length})`);
      assert(out.status === "ok", "retried GET resolves payload");
      results.push("ok GET retries 503 → success");
    } finally {
      restore();
    }
  }

  // 3. GET never retries 404: one fetch, immediate ApiError.
  {
    const store = memStorage();
    store.setItem(JWT_KEY, TEST_TOKEN);
    const { restore, calls } = installHarness(store, [
      { ok: false, status: 404, payload: { detail: "No such DPR" } },
    ]);
    try {
      const err = await throwsApiError(SaarthiApi.dprGet("DPR-NOPE"));
      assert(calls.length === 1, `404 made 1 fetch (got ${calls.length})`);
      assert(err.status === 404, "ApiError status 404");
      assert(err.detail === "No such DPR", "404 detail through");
      results.push("ok GET 404 no retry");
    } finally {
      restore();
    }
  }

  // 4. GET retries network failure, then succeeds.
  {
    const store = memStorage();
    const { restore, calls } = installHarness(store, [
      { networkError: "socket hang up" },
      { ok: true, status: 200, payload: [] },
    ]);
    try {
      const out = await SaarthiApi.schemeRules();
      assert(calls.length === 2, `network failure retried (got ${calls.length})`);
      assert(Array.isArray(out), "retried GET resolves payload");
      results.push("ok GET retries network failure");
    } finally {
      restore();
    }
  }

  // 5. Auth wiring: Bearer attached when stored, absent otherwise.
  {
    const authed = memStorage();
    authed.setItem(JWT_KEY, TEST_TOKEN);
    const h1 = installHarness(authed, []);
    try {
      await SaarthiApi.me();
      assert(h1.calls[0]?.headers.Authorization === `Bearer ${TEST_TOKEN}`, "authed GET sends Bearer");
    } finally {
      h1.restore();
    }
    const anon = memStorage();
    const h2 = installHarness(anon, []);
    try {
      await SaarthiApi.health();
      assert(h2.calls[0]?.headers.Authorization === undefined, "public GET sends no auth");
    } finally {
      h2.restore();
    }
    results.push("ok Bearer wiring");
  }

  for (const line of results) console.log(line);
  console.log(`transport: ${results.length}/5 groups passed`);
}

export { runTransportTests };
