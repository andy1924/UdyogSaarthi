/**
 * C13 finance card (`#tpcNo #loanNo #eqiNo`).
 *
 * KV rows (label muted left + value `.num` mono right): TPC,
 * `max_loan_capped`, `eqi_amount`, tier — plus `working_capital_buffer`.
 * Footnote pill always shows the versioned scheme rules.
 *
 * HARD RULE: renders PURELY from the `scheme` prop (a
 * SchemeCalculateOut-shaped server payload). No fetch, no arithmetic —
 * server values are displayed verbatim.
 *
 * Styling: `var(--…)` tokens only, no hexes.
 */

import type { SchemeCalculateOut } from "../lib/api-client";

export interface FinanceCardProps {
  scheme: SchemeCalculateOut;
}

const FOOTNOTE =
  "Scheme rules v2024-11 \u00B7 micro \u2264\u20B91.40L 6.5%/3y \u00B7 term \u226450L 8%/7y";

function fmtINR(value: number): string {
  return `\u20B9${value.toLocaleString("en-IN")}`;
}

function KvRow({
  label,
  value,
  valueId,
  mono = true,
}: {
  label: string;
  value: string;
  valueId?: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
        minHeight: 44,
      }}
    >
      <span className="muted">{label}</span>
      <span id={valueId} className={mono ? "num" : undefined}>
        {value}
      </span>
    </div>
  );
}

export default function FinanceCard({ scheme }: FinanceCardProps) {
  const schedule = scheme.eqi_schedule ?? [];
  const showAll = schedule.length <= 5;
  const visibleRows = showAll ? schedule : [...schedule.slice(0, 4), schedule[schedule.length - 1]];
  const collapsedCount = schedule.length - visibleRows.length;

  return (
    <section className="card" aria-label="Finance estimate" aria-live="polite">
      <h2 style={{ margin: "0 0 8px" }}>Finance</h2>
      <div role="list">
        <KvRow label="Total project cost" value={fmtINR(scheme.tpc)} valueId="tpcNo" />
        <KvRow label="Max loan (capped)" value={fmtINR(scheme.max_loan_capped)} valueId="loanNo" />
        <KvRow
          label="Quarterly instalment (EQI)"
          value={scheme.eqi_amount === null ? "\u2014" : fmtINR(scheme.eqi_amount)}
          valueId="eqiNo"
        />
        <KvRow label="Tier" value={scheme.tier} mono={false} />
        <KvRow label="Working capital buffer" value={fmtINR(scheme.working_capital_buffer)} />
      </div>

      {schedule.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary
            style={{
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Repayment schedule ({schedule.length} quarters)
          </summary>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr className="muted">
                  <th scope="col" style={{ textAlign: "left", padding: "8px 8px 8px 0" }}>Due</th>
                  <th scope="col" style={{ textAlign: "right", padding: 8 }}>Principal</th>
                  <th scope="col" style={{ textAlign: "right", padding: 8 }}>Interest</th>
                  <th scope="col" style={{ textAlign: "right", padding: 8 }}>EMI</th>
                  <th scope="col" style={{ textAlign: "right", padding: "8px 0 8px 8px" }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.quarter} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="num" style={{ padding: "8px 8px 8px 0" }}>{row.due_label}</td>
                    <td className="num" style={{ textAlign: "right", padding: 8 }}>{fmtINR(row.principal)}</td>
                    <td className="num" style={{ textAlign: "right", padding: 8 }}>{fmtINR(row.interest)}</td>
                    <td className="num" style={{ textAlign: "right", padding: 8 }}>{fmtINR(row.emi)}</td>
                    <td className="num" style={{ textAlign: "right", padding: "8px 0 8px 8px" }}>
                      {fmtINR(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAll && (
            <p className="muted num" style={{ margin: "8px 0 0", fontSize: "0.875rem" }}>
              Showing first 4 + last 1 of {schedule.length} quarters ({collapsedCount} hidden).
            </p>
          )}
        </details>
      )}

      <p style={{ margin: "12px 0 0" }}>
        <span
          className="num"
          style={{
            display: "inline-block",
            border: "1px solid var(--border)",
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: "0.8125rem",
          }}
        >
          {FOOTNOTE}
        </span>
      </p>
    </section>
  );
}
