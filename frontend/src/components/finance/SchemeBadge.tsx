"use client";

import type { SchemeTier } from "@/lib/scheme/rules";
import { schemeRules } from "@/lib/scheme/rules";

export function SchemeBadge({ tier }: { tier: SchemeTier }) {
  const rule = tier === "micro" ? schemeRules.micro : schemeRules.term;
  const isMicro = tier === "micro";
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        isMicro
          ? "border-[var(--color-wheat)] bg-[var(--color-wheat)]/20 text-[var(--color-ink)]"
          : "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-wheat)]",
      ].join(" ")}
      aria-label={`Scheme ${tier}`}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isMicro ? "bg-[var(--color-warn)]" : "bg-[var(--color-wheat)]",
        ].join(" ")}
        aria-hidden
      />
      {isMicro ? "Micro" : "Term"} · {(rule.rate * 100).toFixed(1)}% · {rule.tenureY}y
    </span>
  );
}
