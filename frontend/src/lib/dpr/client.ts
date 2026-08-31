/**
 * DPR render client — POST /api/dpr/render contract.
 * Mocked in dev: returns { pdfUrl: "/mock/dpr.pdf" } without network.
 * Offline: queues to Dexie dprRequests so background sync can retry.
 */
import type { DPRPayload, DPRRenderResponse } from "./types";

export async function renderDPR(payload: DPRPayload): Promise<DPRRenderResponse> {
  // Offline-first: if navigator absent (SSR) or offline, queue locally and return mock.
  const isOffline =
    typeof navigator !== "undefined" && navigator.onLine === false;

  if (isOffline) {
    try {
      const mod = await import("@/lib/offline/db");
      await mod.db.dprRequests.put({
        id: `dpr-${Date.now()}`,
        feasibilityId: payload.feasibility.lgd.code,
        financeId: String(payload.finance.tpc),
        status: "queued",
        createdAt: Date.now(),
      });
    } catch {
      // Dexie unavailable — still return mock so UX does not block
    }
    return { pdfUrl: "/mock/dpr.pdf", status: "ready" };
  }

  // Try real route — fallback to mock if route not present or fetch fails.
  try {
    if (typeof fetch !== "undefined") {
      const res = await fetch("/api/dpr/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as DPRRenderResponse;
        if (data && typeof data.pdfUrl === "string" && data.pdfUrl) return data;
      }
    }
  } catch {
    // network/route error — fall through to mock
  }

  // Optional: best-effort mirror to queue for audit (non-blocking)
  try {
    const mod = await import("@/lib/offline/db");
    await mod.db.dprRequests.put({
      id: `dpr-${Date.now()}`,
      feasibilityId: payload.feasibility.lgd.code,
      financeId: String(payload.finance.tpc),
      status: "generated",
      createdAt: Date.now(),
    });
  } catch {
    /* ignore */
  }

  return { pdfUrl: "/mock/dpr.pdf", status: "ready" };
}

/** Polling helper for callers that show "generating" → "ready" (mock 900ms transition). */
export function pollDPRMock(
  onStatus: (s: "generating" | "ready") => void,
  delayMs = 900
): () => void {
  onStatus("generating");
  const t = setTimeout(() => onStatus("ready"), delayMs);
  return () => clearTimeout(t);
}
