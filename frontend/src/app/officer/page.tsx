"use client";

/**
 * Officer DPR workflow — load a DPR by id, review its state/history,
 * and fire role-gated workflow transitions.
 *
 * Data via `lib/workflow-client.ts` (`fetchDprHistory` / `transitionDpr`
 * over `SaarthiApi.dprHistory` / `dprTransition`). Auth/role gating is
 * server-side: 403 → role-or-transition error copy, 404 → unknown-id copy.
 */

import { useState } from "react";
import HistoryTimeline from "@/components/HistoryTimeline";
import WorkflowPanel from "@/components/WorkflowPanel";
import { ApiError } from "@/lib/api-client";
import {
  fetchDprHistory,
  transitionDpr,
  type DprTransitionAction,
} from "@/lib/workflow-client";

interface LoadedDpr {
  dprId: string;
  currentState: string;
  allowedTriggers: string[];
  history: Array<Record<string, unknown>>;
}

function errorCopy(status: number, kind: "load" | "transition"): string {
  if (status === 404) {
    return "Unknown DPR id — check the id and try again.";
  }
  if (status === 403) {
    return kind === "load"
      ? "Not permitted — your role cannot view this DPR's workflow."
      : "Not permitted — your role cannot fire this transition from the current state.";
  }
  if (status === 401) {
    return "Please log in first — this workflow view needs an officer session.";
  }
  if (status === 0) {
    return "Network error — the server could not be reached. Try again.";
  }
  return "Something went wrong — please try again.";
}

function statusOf(err: unknown): number {
  return err instanceof ApiError ? err.status : 0;
}

export default function OfficerPage() {
  const [dprIdInput, setDprIdInput] = useState("");
  const [loaded, setLoaded] = useState<LoadedDpr | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<DprTransitionAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleLoad() {
    const id = dprIdInput.trim();
    if (id === "" || loading) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const out = await fetchDprHistory(id);
      setLoaded({
        dprId: out.dpr_id,
        currentState: out.current_state,
        allowedTriggers: out.allowed_triggers,
        history: out.history,
      });
    } catch (err) {
      setLoaded(null);
      setError(errorCopy(statusOf(err), "load"));
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: DprTransitionAction) {
    if (loaded === null || busyAction !== null) return;
    setBusyAction(action);
    setError(null);
    setNotice(null);
    try {
      await transitionDpr(
        loaded.dprId,
        action,
        note.trim() === "" ? undefined : note.trim(),
      );
      const fresh = await fetchDprHistory(loaded.dprId);
      setLoaded({
        dprId: fresh.dpr_id,
        currentState: fresh.current_state,
        allowedTriggers: fresh.allowed_triggers,
        history: fresh.history,
      });
      setNote("");
      setNotice(`Done — DPR is now “${fresh.current_state}”.`);
    } catch (err) {
      setError(errorCopy(statusOf(err), "transition"));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="shell">
      <section className="card" aria-label="Officer workflow">
        <h1>Officer review</h1>
        <p className="muted">
          Load a DPR, review its workflow state and history, then fire the
          next transition.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleLoad();
          }}
          style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
        >
          <label htmlFor="officerDprId" className="muted">
            DPR id
          </label>
          <input
            id="officerDprId"
            className="num"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="DPR-XXXXXXXX"
            value={dprIdInput}
            onChange={(e) => setDprIdInput(e.target.value)}
            style={{
              flex: "1 1 220px",
              minHeight: "44px",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "10px 12px",
              color: "var(--fg)",
              background: "var(--surface)",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            disabled={loading || dprIdInput.trim() === ""}
            style={{
              minHeight: "44px",
              minWidth: "44px",
              padding: "10px 20px",
              borderRadius: "12px",
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "var(--surface)",
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Loading…" : "Load"}
          </button>
        </form>

        {error && (
          <p role="alert" style={{ color: "var(--danger)", margin: "12px 0 0" }}>
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            style={{ color: "var(--accent-ink)", margin: "12px 0 0" }}
          >
            {notice}
          </p>
        )}
      </section>

      {loaded && (
        <>
          <section className="card" aria-label="Workflow actions">
            <h2>
              DPR <span className="num">{loaded.dprId}</span>
            </h2>
            <WorkflowPanel
              currentState={loaded.currentState}
              allowedTriggers={loaded.allowedTriggers}
              note={note}
              onNoteChange={setNote}
              onAction={(action) => void handleAction(action)}
              busyAction={busyAction}
            />
          </section>

          <section className="card" aria-label="Workflow history">
            <h2>History</h2>
            <HistoryTimeline entries={loaded.history} />
          </section>
        </>
      )}
    </main>
  );
}
