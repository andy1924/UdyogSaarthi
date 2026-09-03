"use client";

/**
 * C12 Verdict — mono uppercase chip (`VIABLE|SATURATED|NICHE-GAP`),
 * plain-language headline, and sub `{category} in {block} · {opportunity}`.
 *
 * Export contract: `VerdictCard({ verdict, category, block, opportunity })`.
 */

import type { Verdict } from "../lib/types";

export interface VerdictCardProps {
  verdict: Verdict;
  category: string;
  block: string;
  opportunity: string;
}

const HEADLINES: Record<Verdict, string> = {
  viable: "Yes — go for it",
  saturated: "Tough market here",
  "niche-gap": "A gap worth exploring",
};

const CHIP_COLOR: Record<Verdict, string> = {
  viable: "var(--accent)",
  "niche-gap": "var(--fg)",
  saturated: "var(--caution)",
};

export default function VerdictCard({
  verdict,
  category,
  block,
  opportunity,
}: VerdictCardProps) {
  return (
    <div>
      <span
        id="verdictChip"
        className="num"
        style={{
          display: "inline-block",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: CHIP_COLOR[verdict],
          border: `1px solid ${CHIP_COLOR[verdict]}`,
          borderRadius: "999px",
          padding: "4px 12px",
          minHeight: "44px",
          lineHeight: "34px",
        }}
      >
        {verdict.toUpperCase()}
      </span>
      <h2 id="verdict" style={{ margin: "12px 0 4px" }}>
        {HEADLINES[verdict]}
      </h2>
      <p id="verdictSub" style={{ color: "var(--muted)", margin: 0 }}>
        {category} in {block} · {opportunity}
      </p>
    </div>
  );
}
