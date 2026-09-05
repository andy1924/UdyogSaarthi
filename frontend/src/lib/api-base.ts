/**
 * API base-URL helper (WAVE 1, Agent 2).
 *
 * Single source of truth for the backend origin. Persisted in
 * `localStorage` under `saarthi-api-base` so the C20 config footer can
 * override it at runtime. Defaults to `http://localhost:8000`.
 *
 * NOTE: Agent 1 owns layout/shell/tokens.css — this file did not exist
 * when the API layer was built, so it was created here.
 */

export const API_BASE_KEY = "saarthi-api-base";

export const DEFAULT_API_BASE = "http://localhost:8000";

function readStored(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(API_BASE_KEY);
  } catch {
    return null;
  }
}

/** Current backend origin (stored override or default). SSR-safe. */
export function getApiBase(): string {
  const stored = readStored();
  const base = (stored ?? "").trim();
  return base === "" ? DEFAULT_API_BASE : base.replace(/\/+$/, "");
}

/** Persist a backend origin override. Empty string resets to default. */
export function setApiBase(url: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const trimmed = (url ?? "").trim();
    if (trimmed === "" || trimmed === DEFAULT_API_BASE) {
      window.localStorage.removeItem(API_BASE_KEY);
    } else {
      window.localStorage.setItem(API_BASE_KEY, trimmed.replace(/\/+$/, ""));
    }
  } catch {
    // Storage (private mode / quota) must never break API calls.
  }
}
