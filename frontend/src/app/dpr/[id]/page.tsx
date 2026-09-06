"use client";

/**
 * DPR deep-link view (`/dpr/[id]`, applicant hardening track).
 *
 * Loads the DPR record via `SaarthiApi.dprGet(id)`; while `status` is
 * `queued`, polls every 3 s up to 10 attempts (same cadence as DprDialog).
 * When `ready`, downloads the PDF via `SaarthiApi.dprDownload(id)` as a
 * blob (Bearer attached, object-URL anchor). Workflow history loads via
 * `fetchDprHistory` and renders read-only with `HistoryTimeline`.
 *
 * Guards (no duplicate login UI — the existing `AuthCard` nudge is reused):
 * - 401 / missing JWT → login nudge + AuthCard (id stays in the URL, so
 *   nothing the user entered is lost).
 * - 403 → role-gated messaging (kept separate for the record vs history:
 *   an applicant locked out of workflow history still sees their DPR).
 * - 404 → unknown-id copy.
 *
 * Never computes finance — only the server-provided `status` string drives
 * the state machine. Styling: `var(--…)` tokens + `.shell`/`.card` only.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import HistoryTimeline from "@/components/HistoryTimeline";
import { ApiError, SaarthiApi, getToken } from "@/lib/api-client";
import { fetchDprHistory, type DprHistoryOut } from "@/lib/workflow-client";

const POLL_INTERVAL_MS = 3_000;
const POLL_MAX_ATTEMPTS = 10;

type Phase = "loading" | "queued" | "ready" | "error";

function statusOf(err: unknown): number {
  return err instanceof ApiError ? err.status : 0;
}

function errorCopy(status: number): string {
  if (status === 401) {
    return "Please log in first — bank paper needs your account. Your DPR id is kept in the address bar.";
  }
  if (status === 403) {
    return "Not permitted — your role cannot view this DPR. If you filed it with a different account, log in with that account.";
  }
  if (status === 404) {
    return "Unknown DPR id — it may have expired. Render the bank paper again from the home page.";
  }
  if (status === 0) {
    return "Network error — the server could not be reached. Try again.";
  }
  return `Bank paper failed (${status}) — please try again.`;
}

function recordStatus(rec: Record<string, unknown>): string {
  return typeof rec["status"] === "string" ? rec["status"] : "queued";
}

/** DB record statuses that mean the PDF exists and download should be offered.
 *  GET /api/dpr/{id} returns generated|verified|archived|pdf_failed, never the
 *  render-response "ready". A 404 on download still resumes polling. */
function isDownloadable(status: string): boolean {
  return status === "ready" || status === "generated" || status === "verified";
}

function recordText(rec: Record<string, unknown>, key: string): string | null {
  const v = rec[key];
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

const btnPrimary: React.CSSProperties = {
  minHeight: "44px",
  minWidth: "44px",
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  background: "var(--accent)",
  color: "var(--surface)",
  fontFamily: "var(--font-body)",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  ...btnPrimary,
  background: "var(--surface)",
  color: "var(--fg)",
  border: "1px solid var(--border)",
  // Links render as inline anchors (which ignore min-height); inline-flex
  // makes the 44px target real for both <button> and <a> usage.
  display: "inline-flex",
  alignItems: "center",
};

export default function DprDetailPage() {
  const params = useParams();
  const raw = params.id;
  const id = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const [phase, setPhase] = useState<Phase>("loading");
  const [attempt, setAttempt] = useState(0);
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [history, setHistory] = useState<DprHistoryOut | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const cancelled = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const objectUrl = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const revokeUrl = useCallback(() => {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }, []);

  const loadHistory = useCallback(async (dprId: string) => {
    try {
      const out = await fetchDprHistory(dprId);
      if (!cancelled.current) {
        setHistory(out);
        setHistoryError(null);
      }
    } catch (err) {
      if (cancelled.current) return;
      const status = statusOf(err);
      // History is auxiliary: an applicant locked out of workflow detail
      // (403) still keeps the DPR record + download above.
      if (status === 403) {
        setHistoryError(
          "Not permitted — your role cannot view this DPR's workflow history.",
        );
      } else if (status === 401) {
        setHistoryError("Log in to view the workflow history.");
      } else if (status === 404) {
        setHistoryError(null);
      } else {
        setHistoryError("Could not load the workflow history — try again.");
      }
    }
  }, []);

  const pollStatus = useCallback(
    (dprId: string, count: number) => {
      if (cancelled.current) return;
      if (count >= POLL_MAX_ATTEMPTS) {
        setPhase("error");
        setErrorStatus(null);
        setError(
          "Bank paper is taking too long — try the download again in a minute.",
        );
        return;
      }
      pollTimer.current = setTimeout(async () => {
        if (cancelled.current) return;
        try {
          const rec = await SaarthiApi.dprGet(dprId);
          if (cancelled.current) return;
          const next = count + 1;
          setAttempt(next);
          if (isDownloadable(recordStatus(rec))) {
            setRecord(rec);
            setPhase("ready");
            void loadHistory(dprId);
          } else {
            pollStatus(dprId, next);
          }
        } catch (err) {
          if (cancelled.current) return;
          const status = statusOf(err);
          // 404 while queued is normal (worker hasn't written the PDF yet).
          if (status === 404) {
            setAttempt(count + 1);
            pollStatus(dprId, count + 1);
            return;
          }
          setPhase("error");
          setErrorStatus(status);
          setError(errorCopy(status));
        }
      }, POLL_INTERVAL_MS);
    },
    [loadHistory],
  );

  const load = useCallback(() => {
    if (id.trim() === "") {
      setPhase("error");
      setErrorStatus(null);
      setError("Missing DPR id — open this page from a bank-paper link.");
      return;
    }
    cancelled.current = false;
    stopPolling();
    setPhase("loading");
    setAttempt(0);
    setRecord(null);
    setError(null);
    setErrorStatus(null);
    setHistory(null);
    setHistoryError(null);
    // No JWT → skip the doomed fetch and show the login nudge directly.
    // The id stays in the URL, so the deep link survives login.
    if (getToken() === null) {
      setPhase("error");
      setErrorStatus(401);
      setError(errorCopy(401));
      return;
    }
    void (async () => {
      try {
        const rec = await SaarthiApi.dprGet(id);
        if (cancelled.current) return;
        if (isDownloadable(recordStatus(rec))) {
          setRecord(rec);
          setPhase("ready");
          void loadHistory(id);
        } else {
          setRecord(rec);
          setPhase("queued");
          pollStatus(id, 0);
        }
      } catch (err) {
        if (cancelled.current) return;
        const status = statusOf(err);
        setPhase("error");
        setErrorStatus(status);
        setError(errorCopy(status));
      }
    })();
  }, [id, loadHistory, pollStatus, stopPolling]);

  useEffect(() => {
    load();
    return () => {
      cancelled.current = true;
      stopPolling();
    };
  }, [load, stopPolling]);

  // Revoke the blob URL on unmount only.
  useEffect(() => {
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await SaarthiApi.dprDownload(id);
      revokeUrl();
      objectUrl.current = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl.current;
      a.download = `${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      const status = statusOf(err);
      if (status === 404) {
        // Worker hasn't written the PDF yet — resume polling.
        setPhase("queued");
        setError(null);
        pollStatus(id, attempt);
      } else {
        setPhase("error");
        setErrorStatus(status);
        setError(errorCopy(status));
      }
    } finally {
      setDownloading(false);
    }
  }

  const needsLogin = errorStatus === 401;
  const verified = record ? recordText(record, "verified") : null;

  return (
    <main className="shell">
      <section
        className="card"
        aria-label="Bank paper"
        aria-live="polite"
        aria-busy={phase === "loading" || phase === "queued"}
        style={{ minWidth: 0 }}
      >
        <h1 style={{ overflowWrap: "break-word" }}>Bank paper (DPR)</h1>
        <p className="muted num" style={{ overflowWrap: "break-word" }}>
          {id === "" ? "—" : id}
        </p>

        {phase === "loading" && (
          <p role="status" style={{ color: "var(--muted)" }}>
            Loading bank paper…
          </p>
        )}

        {phase === "queued" && (
          <div role="status">
            <p style={{ color: "var(--muted)" }}>
              Rendering… check {attempt} of {POLL_MAX_ATTEMPTS}.
            </p>
            <div
              role="progressbar"
              aria-label="Bank paper render progress"
              aria-valuemin={0}
              aria-valuemax={POLL_MAX_ATTEMPTS}
              aria-valuenow={attempt}
              style={{
                height: "8px",
                borderRadius: "999px",
                background: "var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(attempt / POLL_MAX_ATTEMPTS) * 100}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
          </div>
        )}

        {phase === "ready" && (
          <div>
            <p>Your bank paper is ready.</p>
            {verified && (
              <p className="muted">
                Verification: <span className="num">{verified}</span>
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                style={btnPrimary}
                onClick={() => void handleDownload()}
                disabled={downloading}
              >
                {downloading ? "Downloading…" : "Download PDF"}
              </button>
              <Link href="/" style={{ ...btnGhost, textDecoration: "none" }}>
                Back to UdyogSaarthi
              </Link>
            </div>
          </div>
        )}

        {phase === "error" && error && (
          <div>
            <p role="alert" style={{ color: "var(--danger)", fontWeight: 700 }}>
              {error}
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {!needsLogin && (
                <button
                  type="button"
                  style={btnPrimary}
                  onClick={load}
                >
                  Retry
                </button>
              )}
              <Link href="/" style={{ ...btnGhost, textDecoration: "none" }}>
                Back to UdyogSaarthi
              </Link>
            </div>
          </div>
        )}
      </section>

      {needsLogin && (
        <AuthCard />
      )}

      {(history !== null || historyError !== null) && (
        <section
          className="card"
          aria-label="Workflow history"
          style={{ minWidth: 0 }}
        >
          <h2>History</h2>
          {history !== null && (
            <>
              <p className="muted">
                Current state:{" "}
                <span className="num">{history.current_state}</span>
              </p>
              <HistoryTimeline entries={history.history} />
            </>
          )}
          {history === null && historyError !== null && (
            <p role="status" className="muted">
              {historyError}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
