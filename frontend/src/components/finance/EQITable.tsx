"use client";

import type { QuarterlyObligation } from "@/lib/scheme/rules";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function EQITable({
  schedule,
  loan,
}: {
  schedule: QuarterlyObligation[];
  loan: number;
}) {
  if (!schedule.length) {
    return (
      <p className="font-mono text-sm text-[var(--color-muted)]">
        No schedule — set margin to generate EQI.
      </p>
    );
  }

  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
  const totalPaid = schedule.reduce((s, r) => s + r.total, 0);

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-ledger)] bg-[var(--color-paper)]/60 px-4 py-2.5">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          Equated Quarterly Instalment (EQI) — quarter by quarter
        </h3>
        <span className="font-mono text-xs text-[var(--color-muted)]">
          Loan ₹{fmt(loan)} · {schedule.length} quarters
        </span>
      </div>

      <div className="max-h-[420px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--color-ink)] text-[var(--color-wheat)]">
            <tr className="text-left font-mono text-xs uppercase tracking-widest">
              <th className="px-3 py-2.5 font-semibold">Q</th>
              <th className="px-3 py-2.5 font-semibold">Due</th>
              <th className="px-3 py-2.5 text-right font-semibold">Principal</th>
              <th className="px-3 py-2.5 text-right font-semibold">Interest</th>
              <th className="px-3 py-2.5 text-right font-semibold">Total</th>
              <th className="px-3 py-2.5 text-right font-semibold">Balance</th>
            </tr>
          </thead>
        <tbody className="font-mono text-xs">
            {schedule.map((row) => (
              <tr
                key={row.quarter}
                className={[
                  "border-t border-[var(--color-ledger)]",
                  row.isMoratorium
                    ? "bg-[var(--color-wheat)]/20"
                    : row.quarter % 2 === 0
                      ? "bg-[var(--color-paper)]/40"
                      : "bg-white",
                ].join(" ")}
              >
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-semibold text-[var(--color-ink)]">
                      {row.quarter}
                    </span>
                    {row.isMoratorium && (
                      <span className="rounded-full bg-[var(--color-wheat)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink)]">
                        moratorium
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2 text-[var(--color-muted)]">{row.dueDate}</td>
                <td className="px-3 py-2 text-right text-[var(--color-ink)]">
                  {row.isMoratorium ? "—" : `₹${fmt(row.principal)}`}
                </td>
                <td className="px-3 py-2 text-right text-[var(--color-muted)]">₹{fmt(row.interest)}</td>
                <td className="px-3 py-2 text-right font-semibold text-[var(--color-ink)]">₹{fmt(row.total)}</td>
                <td className="px-3 py-2 text-right text-[var(--color-muted)]">₹{fmt(row.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-[var(--color-paper)] font-mono text-xs font-semibold">
            <tr className="border-t-2 border-[var(--color-ink)]">
              <td colSpan={3} className="px-3 py-2.5 text-right text-[var(--color-muted)]">
                Total interest
              </td>
              <td className="px-3 py-2.5 text-right text-[var(--color-vermilion)]">₹{fmt(totalInterest)}</td>
              <td className="px-3 py-2.5 text-right text-[var(--color-ink)]">₹{fmt(totalPaid)}</td>
              <td className="px-3 py-2.5" />
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="border-t border-dashed border-[var(--color-ledger)] bg-[var(--color-paper)]/40 px-4 py-2 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
        EMI = P·r·(1+r)<sup>n</sup> / ((1+r)<sup>n</sup>−1), r = annual/4, n = repayment quarters. Moratorium quarters
        are interest-only (principal 0). Last instalment adjusted to zero balance (paise).
      </p>
    </div>
  );
}
