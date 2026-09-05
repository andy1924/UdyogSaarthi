"use client";

/**
 * C09 Progress — 4-dot stepper with `aria-current="step"` and a determinate
 * bar (width 33/66/100%). No step counter text (removed per UX review).
 *
 * Steps: 1 = business, 2 = location, 3 = margin/check, 4 = result ready.
 *
 * Export contract: `ProgressBar({ step })` with `step: 1 | 2 | 3 | 4`.
 */

export interface ProgressBarProps {
  step: 1 | 2 | 3 | 4;
}

const WIDTHS: Record<ProgressBarProps["step"], string> = {
  1: "33%",
  2: "66%",
  3: "100%",
  4: "100%",
};

export default function ProgressBar({ step }: ProgressBarProps) {
  // Steps 1–3 are the three taps; step 4 (result ready) keeps the
  // completed "Tap 3 of 3" label per C09.
  return (
    <div aria-label="Wizard progress">
      <div
        role="list"
        aria-label="Steps"
        style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
      >
        {[1, 2, 3, 4].map((n) => {
          const done = n < step;
          const current = n === step;
          return (
            <span
              key={n}
              role="listitem"
              aria-current={current ? "step" : undefined}
              aria-label={`Step ${n}${current ? " (current)" : done ? " (done)" : ""}`}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: done || current ? "var(--accent)" : "var(--border)",
                border: current ? "2px solid var(--accent-ink)" : "none",
              }}
            />
          );
        })}
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={step}
        aria-label="Feasibility progress"
        style={{
          height: "8px",
          borderRadius: "4px",
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          id="progressFill"
          style={{
            height: "100%",
            width: WIDTHS[step],
            background: "var(--accent)",
            transition: "width 150ms cubic-bezier(.2,0,0,1)",
          }}
        />
      </div>
      <p
        id="progressLbl"
        className="num"
        style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "8px 0 0" }}
      >
        Tap {Math.min(step, 3)} of 3{step === 4 ? " · ready" : ""}
      </p>
    </div>
  );
}
