/**
 * api-base unit tests (pure, dependency-free — no framework).
 *
 * Covers `getApiBase` / `setApiBase` (`src/lib/api-base.ts`):
 * - default origin is `http://localhost:8000` (no window / empty store)
 * - stored override wins; trailing slashes are trimmed everywhere
 * - `setApiBase("")` and `setApiBase(DEFAULT)` reset to default
 * - private-mode / throwing storage never breaks callers (SSR-safe)
 *
 * Typechecks with `npx tsc --noEmit`. Executed via `npm test` (compiled
 * by `tsconfig.test.json`, run by `src/lib/run-tests.ts`) — importing
 * this module from app code has no side effects.
 */

import { API_BASE_KEY, DEFAULT_API_BASE, getApiBase, setApiBase } from "./api-base";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`api-base: ${msg}`);
}

function memStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(initial));
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

type WinStub = { localStorage: Storage };
const g = globalThis as unknown as Record<string, unknown>;

/** Install a fake `window.localStorage`; returns restore + the store. */
function useStore(store: Storage): () => void {
  const prev = g.window;
  g.window = { localStorage: store } satisfies WinStub;
  return () => {
    g.window = prev;
  };
}

/** Remove `window` entirely (SSR); returns restore. */
function useNoWindow(): () => void {
  const prev = g.window;
  delete g.window;
  return () => {
    g.window = prev;
  };
}

function throwingStore(): Storage {
  const s = memStorage();
  s.getItem = () => {
    throw new Error("private mode");
  };
  s.setItem = () => {
    throw new Error("private mode");
  };
  s.removeItem = () => {
    throw new Error("private mode");
  };
  return s;
}

async function runApiBaseTests(): Promise<void> {
  const results: string[] = [];

  // 1. No window (SSR) → default, no throw.
  {
    const restore = useNoWindow();
    try {
      assert(getApiBase() === DEFAULT_API_BASE, "SSR defaults to localhost:8000");
      setApiBase("http://x:8000"); // must not throw
      results.push("ok SSR-safe default");
    } finally {
      restore();
    }
  }
  assert(DEFAULT_API_BASE === "http://localhost:8000", "default origin pinned");

  // 2. Empty store → default; whitespace-only → default.
  {
    const restore = useStore(memStorage());
    try {
      assert(getApiBase() === DEFAULT_API_BASE, "empty store defaults");
    } finally {
      restore();
    }
    const restore2 = useStore(memStorage({ [API_BASE_KEY]: "   " }));
    try {
      assert(getApiBase() === DEFAULT_API_BASE, "whitespace stored defaults");
      results.push("ok empty/whitespace defaults");
    } finally {
      restore2();
    }
  }

  // 3. Stored override wins; trailing slashes trimmed.
  {
    const restore = useStore(memStorage({ [API_BASE_KEY]: "http://backend:8000///" }));
    try {
      assert(getApiBase() === "http://backend:8000", "stored override trims slashes");
      results.push("ok stored override + trim");
    } finally {
      restore();
    }
  }

  // 4. setApiBase persists trimmed value.
  {
    const store = memStorage();
    const restore = useStore(store);
    try {
      setApiBase("  https://api.example.com// ");
      assert(store.getItem(API_BASE_KEY) === "https://api.example.com", "set persists trimmed");
      assert(getApiBase() === "https://api.example.com", "get reads what set wrote");
      results.push("ok set persists trimmed");
    } finally {
      restore();
    }
  }

  // 5. Empty string resets (removes key); default value resets too.
  {
    const store = memStorage({ [API_BASE_KEY]: "http://backend:8000" });
    const restore = useStore(store);
    try {
      setApiBase("");
      assert(store.getItem(API_BASE_KEY) === null, "empty string removes override");
      assert(getApiBase() === DEFAULT_API_BASE, "reset reads default");
      setApiBase("http://backend:8000");
      setApiBase(DEFAULT_API_BASE);
      assert(store.getItem(API_BASE_KEY) === null, "setting default removes override");
      results.push("ok reset-to-default");
    } finally {
      restore();
    }
  }

  // 6. Throwing storage (private mode) → default, no throw.
  {
    const restore = useStore(throwingStore());
    try {
      assert(getApiBase() === DEFAULT_API_BASE, "throwing store defaults");
      setApiBase("http://x:8000"); // must not throw
      results.push("ok throwing storage safe");
    } finally {
      restore();
    }
  }

  for (const line of results) console.log(line);
  console.log(`api-base: ${results.length}/6 groups passed`);
}

export { runApiBaseTests };
