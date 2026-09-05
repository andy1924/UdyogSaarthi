/**
 * DPR workflow-client unit tests (dependency-free — no framework).
 *
 * Covers `transitionDpr` / `fetchDprHistory` / `WORKFLOW_ACTIONS`
 * (`src/lib/workflow-client.ts`) by stubbing `globalThis.fetch`:
 * - all six role-gated actions are registered
 * - transition POSTs `{action}` (note omitted when absent, sent when given)
 * - history GETs the append-only trail with a Bearer JWT
 * - server errors (e.g. 403 on wrong role) propagate as `ApiError`
 *
 * Typechecks with `npx tsc --noEmit`. Executed via `npm test` (compiled
 * by `tsconfig.test.json`, run by `src/lib/run-tests.ts`) — importing
 * this module from app code has no side effects.
 */

import { ApiError, JWT_KEY } from "./api-client";
import { WORKFLOW_ACTIONS, fetchDprHistory, transitionDpr } from "./workflow-client";
import type { DprTransitionAction } from "./workflow-client";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`workflow: ${msg}`);
}

interface Captured {
  url: string;
  method: string;
  headers: Record<string, string>;
  bodyJson: unknown;
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
    this.statusText = ok ? "OK" : "Forbidden";
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

const TEST_TOKEN = "test-officer-jwt";
const g = globalThis as unknown as Record<string, unknown>;

/** Stub fetch with a canned JSON payload; captures outgoing requests. */
function installHarness(captured: Captured[], payload: unknown): () => void {
  const store = memStorage();
  store.setItem(JWT_KEY, TEST_TOKEN);
  const prevFetch = g.fetch;
  const prevWindow = g.window;
  g.window = { localStorage: store };
  g.fetch = (async (url: unknown, init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }): Promise<FakeResponse> => {
    captured.push({
      url: String(url),
      method: init?.method ?? "GET",
      headers: { ...(init?.headers ?? {}) },
      bodyJson: typeof init?.body === "string" ? (JSON.parse(init.body) as unknown) : undefined,
    });
    return new FakeResponse(true, 200, payload);
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

async function runWorkflowTests(): Promise<void> {
  const results: string[] = [];

  // 1. All six workflow actions registered (server gates roles; 403 on misuse).
  {
    const expected: DprTransitionAction[] = [
      "submit_for_review",
      "approve_sca",
      "reject",
      "send_to_bank",
      "finalize",
      "force_reject",
    ];
    assert(WORKFLOW_ACTIONS.length === expected.length, "six actions registered");
    for (const a of expected) assert(WORKFLOW_ACTIONS.includes(a), `action ${a} registered`);
    results.push("ok WORKFLOW_ACTIONS complete");
  }

  // 2. transition without note → POST {action} only.
  {
    const captured: Captured[] = [];
    const restore = installHarness(captured, { current_state: "under_review" });
    try {
      await transitionDpr("DPR-1", "submit_for_review");
      const req = last(captured);
      assert(req.url === "http://localhost:8000/api/dpr/DPR-1/transition", "transition path");
      assert(req.method === "POST", "transition POST");
      const body = req.bodyJson as Record<string, unknown>;
      assert(body.action === "submit_for_review", "transition action sent");
      assert(!("note" in body), "note omitted when absent");
      assert(req.headers.Authorization === `Bearer ${TEST_TOKEN}`, "transition authed");
      results.push("ok transition without note");
    } finally {
      restore();
    }
  }

  // 3. transition with note → POST {action, note}.
  {
    const captured: Captured[] = [];
    const restore = installHarness(captured, { current_state: "rejected" });
    try {
      await transitionDpr("DPR-2", "reject", "missing land proof");
      const req = last(captured);
      const body = req.bodyJson as Record<string, unknown>;
      assert(body.action === "reject", "reject action sent");
      assert(body.note === "missing land proof", "note sent through");
      results.push("ok transition with note");
    } finally {
      restore();
    }
  }

  // 4. history → authed GET on the append-only trail.
  {
    const captured: Captured[] = [];
    const trail = { dpr_id: "DPR-1", current_state: "under_review", allowed_triggers: [], history: [] };
    const restore = installHarness(captured, trail);
    try {
      const out = await fetchDprHistory("DPR-1");
      const req = last(captured);
      assert(req.url === "http://localhost:8000/api/dpr/DPR-1/history", "history path");
      assert(req.method === "GET", "history GET");
      assert(req.headers.Authorization === `Bearer ${TEST_TOKEN}`, "history authed");
      assert((out as typeof trail).current_state === "under_review", "history payload returned");
      results.push("ok history fetch");
    } finally {
      restore();
    }
  }

  // 5. 403 (wrong role/transition) propagates as ApiError.
  {
    const store = memStorage();
    store.setItem(JWT_KEY, TEST_TOKEN);
    const prevFetch = g.fetch;
    const prevWindow = g.window;
    g.window = { localStorage: store };
    g.fetch = (async (): Promise<FakeResponse> =>
      new FakeResponse(false, 403, { detail: "Officer role required" })) as unknown as typeof fetch;
    try {
      let err: unknown = null;
      try {
        await transitionDpr("DPR-9", "approve_sca");
      } catch (e: unknown) {
        err = e;
      }
      assert(err instanceof ApiError, "403 throws ApiError");
      assert((err as ApiError).status === 403, "ApiError carries 403");
      assert((err as ApiError).detail === "Officer role required", "ApiError carries detail");
      results.push("ok 403 propagates");
    } finally {
      g.fetch = prevFetch;
      g.window = prevWindow;
    }
  }

  for (const line of results) console.log(line);
  console.log(`workflow: ${results.length}/5 groups passed`);
}

export { runWorkflowTests };
