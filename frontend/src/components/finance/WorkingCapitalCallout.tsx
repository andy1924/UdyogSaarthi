"use client";

import { workingCapitalRange } from "@/lib/scheme/math";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function WorkingCapitalCallout({ loan }: { loan: number }) {
  const { low, high, mid } = workingCapitalRange(loan);

  if (loan <= 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-ledger)] bg-[var(--color-paper)]/60 px-4 py-3">
        <p className="font-mono text-xs text-[var(--color-muted)]">
          Set margin to see working-capital buffer (20–30% of loan).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-wheat)] bg-[var(--color-wheat)]/15 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-wheat)] text-sm"
          aria-hidden
        >
          ◈
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Working-capital buffer — keep 20–30% aside
          </h3>
          <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
            On ₹{new Intl.NumberFormat("en-IN").format(loan)} loan, keep{" "}
            <span className="font-semibold text-[var(--color-ink)]">{fmt(low)} – {fmt(high)}</span> liquid for
            stock, rent-float and first-quarter dues. Deterministic midpoint (25%) ={" "}
            <span className="font-semibold text-[var(--color-ink)]">{fmt(mid)}</span>.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-[var(--color-ledger)]">
              <div
                className="h-full rounded-full bg-[var(--color-ink)]"
                style={{ width: "25%" }}
                aria-hidden
              />
            </div>
            <span className="font-mono text-xs font-semibold text-[var(--color-ink)]">25%</span>
          </div>
          <p className="mt-1.5 font-mono text-xs text-[var(--color-muted)]">
            Tip: Don’t deploy entire loan to machines — your first EQI arrives after moratorium.
          </p>
        </div>
      </div>
    </div>
  );
}
