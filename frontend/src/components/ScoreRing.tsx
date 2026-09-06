"use client";

/**
 * C11 Score ring — 96px SVG ring, `stroke-dasharray` from `density_score`
 * 0–100. Color: viable → var(--accent), niche-gap → var(--fg) pine,
 * saturated → var(--caution). The number is a centered SVG `<text>`
 * (flex-centered svg, NOT an absolute overlay) in Plex Mono 22px.
 *
 * Export contract: `ScoreRing({ score, verdict })`.
 */

import type { Verdict } from "../lib/types";

export interface ScoreRingProps {
  score: number;
  verdict: Verdict;
}

const R = 40;
const C = 2 * Math.PI * R;

const STROKE: Record<Verdict, string> = {
  viable: "var(--accent)",
  "niche-gap": "var(--fg)",
  saturated: "var(--caution)",
};

export default function ScoreRing({ score, verdict }: ScoreRingProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const filled = (clamped / 100) * C;

  return (
    <div
      role="img"
      aria-label={`Density score ${clamped} of 100 (${verdict})`}
      style={{
        width: "96px",
        height: "96px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
        <circle
          cx="48"
          cy="48"
          r={R}
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
        />
        <circle
          id="scoreArc"
          cx="48"
          cy="48"
          r={R}
          fill="none"
          stroke={STROKE[verdict]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${C}`}
          transform="rotate(-90 48 48)"
        />
        <text
          id="scoreNo"
          x="48"
          y="48"
          textAnchor="middle"
          dominantBaseline="central"
          className="num"
          fill="var(--fg)"
          fontSize="22"
          fontWeight="700"
        >
          {clamped}
        </text>
      </svg>
    </div>
  );
}
