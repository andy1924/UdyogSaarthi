"use client";

/**
 * Officer workflow — state chip + allowed-trigger action buttons.
 *
 * Pure presentational panel: the officer page owns fetching (`fetchDprHistory`)
 * and transitions (`transitionDpr`) and passes the current state, the
 * server-provided `allowed_triggers`, a shared note field, and callbacks.
 * Role gating stays server-side (403 on wrong role/transition).
 */

import type { DprTransitionAction } from "../lib/workflow-client";

export interface WorkflowPanelProps {
  currentState: string;
  allowedTriggers: string[];
  note: string;
  onNoteChange: (note: string) => void;
  onAction: (action: DprTransitionAction) => void;
  busyAction: DprTransitionAction | null;
  disabled?: boolean;
}

const ACTION_LABELS: Record<DprTransitionAction, string> = {
  submit_for_review: "Submit for review",
  approve_sca: "Approve (SCA)",
  reject: "Reject",
  send_to_bank: "Send to bank",
  finalize: "Finalize",
  force_reject: "Force reject",
};

function labelFor(trigger: string): string {
  const known = (Object.keys(ACTION_LABELS) as DprTransitionAction[]).find(
    (action) => action === trigger,
  );
  if (known) return ACTION_LABELS[known];
  return trigger.replace(/_/g, " ");
}

function isDestructive(trigger: string): boolean {
  return trigger === "reject" || trigger === "force_reject";
}

export default function WorkflowPanel({
  currentState,
  allowedTriggers,
  note,
  onNoteChange,
  onAction,
  busyAction,
  disabled = false,
}: WorkflowPanelProps) {
  const busy = busyAction !== null || disabled;

  return (
    <div>
      <p style={{ margin: "0 0 12px" }}>
        Current state:{" "}
        <span
          className="num"
          style={{
            display: "inline-block",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent-ink)",
            border: "1px solid var(--accent)",
            borderRadius: "999px",
            padding: "4px 12px",
            minHeight: "44px",
            lineHeight: "34px",
          }}
        >
          {currentState}
        </span>
      </p>

      <label
        htmlFor="officerNote"
        style={{
          display: "block",
          marginBottom: "6px",
          color: "var(--muted)",
        }}
      >
        Note (sent with the transition)
      </label>
      <textarea
        id="officerNote"
        rows={3}
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Optional note for the audit trail"
        disabled={busy}
        style={{
          width: "100%",
          minHeight: "44px",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "10px 12px",
          color: "var(--fg)",
          background: "var(--surface)",
          fontFamily: "var(--font-body)",
          fontSize: "1rem",
          marginBottom: "12px",
        }}
      />

      {allowedTriggers.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>
          No actions available — this DPR is in a terminal state.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {allowedTriggers.map((trigger) => {
            const destructive = isDestructive(trigger);
            const isBusy = busyAction === trigger;
            return (
              <button
                key={trigger}
                type="button"
                disabled={busy}
                onClick={() =>
                  onAction(trigger as DprTransitionAction)
                }
                style={{
                  minHeight: "44px",
                  minWidth: "44px",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border: destructive
                    ? "1px solid var(--danger)"
                    : "1px solid var(--accent)",
                  background: destructive
                    ? "var(--surface)"
                    : "var(--accent)",
                  color: destructive
                    ? "var(--danger)"
                    : "var(--surface)",
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy && !isBusy ? 0.6 : 1,
                }}
              >
                {isBusy ? "Working…" : labelFor(trigger)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
