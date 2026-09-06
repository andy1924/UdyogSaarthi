"use client";

/**
 * C06 Margin slider — range 5000–5000000 step 5000 synced with a mono
 * numeric input, plus a display-only `fmtINR` readout.
 *
 * Client pre-guard: out-of-range values surface a MARGIN_OUT_OF_RANGE
 * message inline without any fetch. Never computes finance — the readout
 * only echoes the chosen margin.
 *
 * Export contract: `MarginStep({ margin, onMargin })` + `fmtINR(n)`.
 */

import { useState } from "react";

export const MARGIN_MIN = 5000;
export const MARGIN_MAX = 5000000;
export const MARGIN_STEP = 5000;

export function fmtINR(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export interface MarginStepProps {
  margin: number;
  onMargin: (v: number) => void;
}

export default function MarginStep({ margin, onMargin }: MarginStepProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const outOfRange =
    !Number.isFinite(margin) || margin < MARGIN_MIN || margin > MARGIN_MAX;

  function handleNumChange(raw: string) {
    setDraft(raw);
    if (raw.trim() === "") return;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) onMargin(Math.round(parsed));
  }

  return (
    <div>
      <label
        htmlFor="marginRange"
        style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}
      >
        Own margin (your investment)
      </label>
      <input
        id="marginRange"
        type="range"
        min={MARGIN_MIN}
        max={MARGIN_MAX}
        step={MARGIN_STEP}
        value={Number.isFinite(margin) ? Math.min(Math.max(margin, MARGIN_MIN), MARGIN_MAX) : MARGIN_MIN}
        onChange={(e) => {
          setDraft(null);
          onMargin(Number(e.target.value));
        }}
        aria-describedby="marginReadout"
        style={{ width: "100%", minHeight: "44px", accentColor: "var(--accent)" }}
      />
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
        <input
          id="marginNum"
          type="number"
          className="num"
          min={MARGIN_MIN}
          max={MARGIN_MAX}
          step={MARGIN_STEP}
          value={draft ?? (Number.isFinite(margin) ? String(margin) : "")}
          onChange={(e) => handleNumChange(e.target.value)}
          onBlur={() => setDraft(null)}
          aria-invalid={outOfRange}
          aria-describedby={outOfRange ? "marginErr" : "marginReadout"}
          style={{
            minHeight: "44px",
            minWidth: 0,
            flex: "1 1 auto",
            padding: "10px 12px",
            fontSize: "16px",
            border: outOfRange
              ? "2px solid var(--danger)"
              : "1px solid var(--border)",
            borderRadius: "8px",
            background: "var(--surface)",
            color: "var(--fg)",
          }}
        />
        <output
          id="marginReadout"
          className="num"
          htmlFor="marginRange marginNum"
          style={{ flex: "0 0 auto", fontWeight: 700, fontSize: "1rem" }}
        >
          {fmtINR(margin)}
        </output>
      </div>
      {outOfRange && (
        <p
          id="marginErr"
          role="alert"
          style={{ fontSize: "0.875rem", color: "var(--danger)", margin: "8px 0 0" }}
        >
          MARGIN_OUT_OF_RANGE: margin must be between {fmtINR(MARGIN_MIN)} and{" "}
          {fmtINR(MARGIN_MAX)}.
        </p>
      )}
    </div>
  );
}
