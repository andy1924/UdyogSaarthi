"use client";

import { Badge } from "@/components/ui/Badge";
import type { VerifiedFlag } from "@/lib/dpr/types";

export interface DPRMetaProps {
  verified: VerifiedFlag;
  ruleVersion: string;
  effectiveFrom: string;
  generatedAt: string;
  lgdCode?: string;
  className?: string;
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function DPRMeta({
  verified,
  ruleVersion,
  effectiveFrom,
  generatedAt,
  lgdCode,
  className = "",
}: DPRMetaProps) {
  const isAA = verified === "aa-verified";
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--color-ledger)] bg-[var(--color-paper)]/60 px-3 py-2.5",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-1 font-mono text-xs font-semibold",
          isAA
            ? "border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]"
            : "border-[var(--color-ledger)] bg-white text-[var(--color-muted)]",
        ].join(" ")}
        aria-label={isAA ? "AA-verified" : "self-reported"}
      >
        <span
          aria-hidden
          className={[
            "h-1.5 w-1.5 rounded-full",
            isAA ? "bg-[var(--color-success)]" : "bg-[var(--color-muted)]",
          ].join(" ")}
        />
        {isAA ? "AA-verified" : "self-reported"}
      </span>

      <Badge variant="ledger">Rule {ruleVersion}</Badge>
      <span className="font-mono text-xs text-[var(--color-muted)]">
        effective {effectiveFrom}
      </span>
      <span className="font-mono text-xs text-[var(--color-muted)]">·</span>
      <span className="font-mono text-xs text-[var(--color-muted)]">
        {fmtDate(generatedAt)}
      </span>
      {lgdCode && (
        <>
          <span className="font-mono text-xs text-[var(--color-muted)]">·</span>
          <span className="font-mono text-xs font-semibold text-[var(--color-ink)]">
            {lgdCode}
          </span>
        </>
      )}
    </div>
  );
}
