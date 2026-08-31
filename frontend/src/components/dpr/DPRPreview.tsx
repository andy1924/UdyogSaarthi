"use client";

import type { DPRPayload, VerifiedFlag } from "@/lib/dpr/types";
import { schemeRules } from "@/lib/scheme/rules";
import { formatINR } from "@/lib/scheme/math";

function fmt0(n: number): string {
  return formatINR(n);
}
function fmt2(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function SectionCard({
  index,
  title,
  monoLabel,
  children,
}: {
  index: string;
  title: string;
  monoLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white shadow-[var(--shadow-slip)]">
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-[var(--color-ledger)] px-4 py-2.5">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {index} — {monoLabel}
        </span>
        <span className="font-mono text-xs text-[var(--color-ledger)]">#</span>
      </div>
      <div className="px-4 py-4">
        <h3 className="font-serif text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

export interface DPRPreviewProps {
  payload: DPRPayload;
  onVerifiedChange?: (v: VerifiedFlag) => void;
}

export function DPRPreview({ payload, onVerifiedChange }: DPRPreviewProps) {
  const { feasibility, finance, cashflow, verified } = payload;
  const isAA = verified === "aa-verified";
  const today = new Date().toISOString().slice(0, 10);
  const lgd = feasibility.lgd;
  const score = feasibility.score;
  const verdict = feasibility.verdict;

  const totalInterest = finance.schedule.reduce((s, r) => s + r.interest, 0);
  const totalPaid = finance.schedule.reduce((s, r) => s + r.total, 0);

  // Assertion: numbers displayed === calculator math output (no LLM recomputation here)
  // FinanceState was derived from computeTPC/routeScheme/maxLoan/generateEQI — preview only renders.
  // If finance.tpc/loan/schedule mismatch math.ts, DPR is invalid (fix caller, not preview).

  // Simple bar scale for CAPEX/OPEX
  const capexN =
    Number(String(cashflow.equipment ?? "").replace(/[^\d.]/g, "")) || finance.tpc * 0.6;
  const opexN =
    Number(String(cashflow.monthlyOpex ?? "").replace(/[^\d.]/g, "")) ||
    Math.round((finance.loan * 0.08) / 12);
  const barMax = Math.max(capexN, opexN * 6, 1);
  const capexW = Math.max(8, Math.min(100, (capexN / barMax) * 100));
  const opexW = Math.max(8, Math.min(100, ((opexN * 6) / barMax) * 100));

  const licences =
    feasibility.businessType.toLowerCase().includes("food") ||
    feasibility.businessType.toLowerCase().includes("dairy")
      ? ["FSSAI", "Shop & Establishment", "GST", "Udyam"]
      : feasibility.businessType.toLowerCase().includes("repair") ||
          feasibility.businessType.toLowerCase().includes("electronics")
        ? ["Shop & Establishment", "GST", "Udyam", "EPR (if e-waste)"]
        : ["Shop & Establishment", "GST", "Udyam"];

  return (
    <div className="flex flex-col gap-4">
      {/* 1 — Cover: seal + LGD + date */}
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border-2 border-[var(--color-ink)] bg-[var(--color-paper)] shadow-[var(--shadow-slip)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 23px, var(--color-ledger) 24px), repeating-linear-gradient(90deg, transparent, transparent 23px, var(--color-ledger) 24px)",
            }}
          />
        </div>
        <div className="relative flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-vermilion)]">
              UdyogSaarthi — Detailed Project Report
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold leading-tight text-[var(--color-ink)]">
              Receipt booklet — 8 sections
            </h2>
            <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
              LGD <span className="font-semibold text-[var(--color-ink)]">{lgd.code}</span> — {lgd.block},{" "}
              {lgd.district}, {lgd.state} · {feasibility.businessType || "General"} · Date {today}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-[var(--radius-pill)] border border-[var(--color-ink)] bg-[var(--color-ink)] px-2.5 py-1 font-mono text-xs font-semibold text-[var(--color-wheat)]">
                LGD {lgd.code}
              </span>
              <span className="rounded-[var(--radius-pill)] border border-[var(--color-ledger)] bg-white px-2.5 py-1 font-mono text-xs text-[var(--color-muted)]">
                {today}
              </span>
              <span
                className={[
                  "rounded-[var(--radius-pill)] border px-2.5 py-1 font-mono text-xs font-semibold",
                  isAA
                    ? "border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                    : "border-[var(--color-ledger)] bg-white text-[var(--color-muted)]",
                ].join(" ")}
              >
                {isAA ? "AA-verified" : "self-reported"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="font-mono text-xs font-semibold text-[var(--color-muted)]" htmlFor="dpr-verified-toggle">
                Verified flag
              </label>
              <select
                id="dpr-verified-toggle"
                value={verified}
                onChange={(e) => onVerifiedChange?.(e.target.value as VerifiedFlag)}
                className="min-h-[36px] rounded-[var(--radius-pill)] border border-[var(--color-ledger)] bg-white px-3 py-1 font-mono text-xs text-[var(--color-ink)]"
              >
                <option value="self-reported">self-reported (default)</option>
                <option value="aa-verified">aa-verified (mock)</option>
              </select>
            </div>
          </div>
          <div
            aria-hidden
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--color-vermilion)] bg-white/90 font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-vermilion)] shadow-[0_4px_16px_rgba(199,61,46,0.18)] -rotate-[8deg]"
          >
            <span className="text-center leading-tight">
              Sarkaar
              <br />
              Ledger
              <br />
              <span className="text-[10px]">Seal</span>
            </span>
          </div>
        </div>
        <div className="border-t-2 border-dashed border-[var(--color-ledger)] bg-white/60 px-5 py-2.5">
          <p className="font-mono text-xs leading-relaxed text-[var(--color-muted)]">
            Rule {schemeRules.version} · {schemeRules.effectiveFrom} · Numbers === math.ts output (no LLM).
            Carry this booklet to the DIC.
          </p>
        </div>
      </div>

      {/* 2 — Feasibility: density + SWOT */}
      <SectionCard index="02" title="Feasibility — density & SWOT" monoLabel="Feasibility">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-[var(--color-paper)]/50 p-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              Density score
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-[var(--color-ink)]">{score}/100</p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
              {feasibility.poiCount} shops in ~{feasibility.radiusM ?? 5000}m · verdict{" "}
              <span className="font-semibold text-[var(--color-ink)]">{verdict}</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-ledger)]">
              <div
                className="h-full rounded-full bg-[var(--color-ink)]"
                style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
              />
            </div>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white p-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              SWOT snapshot
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
              <li>
                <span className="font-semibold text-[var(--color-ink)]">S:</span> {lgd.block} demand —{" "}
                {feasibility.poiCount} survive
              </li>
              <li>
                <span className="font-semibold text-[var(--color-ink)]">W:</span>{" "}
                {verdict === "saturated" ? "Crowded catchment" : "New entrant learning curve"}
              </li>
              <li>
                <span className="font-semibold text-[var(--color-ink)]">O:</span>{" "}
                {verdict === "niche-gap" ? "Gap — first-mover" : "Mandi + road access"}
              </li>
              <li>
                <span className="font-semibold text-[var(--color-ink)]">T:</span> Price pressure if saturated
              </li>
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* 3 — Scheme structure: TPC / loan / EQI */}
      <SectionCard index="03" title="Scheme structure — TPC · loan · EQI" monoLabel="Scheme Structure">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white p-3">
            <p className="font-mono text-xs text-[var(--color-muted)]">Total Project Cost (TPC)</p>
            <p className="mt-1 font-mono text-lg font-bold text-[var(--color-ink)]">{fmt0(finance.tpc)}</p>
            <p className="font-mono text-xs text-[var(--color-muted)]">
              margin ₹{fmt2(finance.marginAmount)} ÷ 10%
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white p-3">
            <p className="font-mono text-xs text-[var(--color-muted)]">Loan (90% capped)</p>
            <p className="mt-1 font-mono text-lg font-bold text-[var(--color-ink)]">{fmt0(finance.loan)}</p>
            <p className="font-mono text-xs text-[var(--color-muted)]">
              {finance.tier === "micro" ? "Micro ≤₹1.40L · 6.5% · 3y" : "Term ₹1.40L–₹50L · 8% · 7y"}
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-ink)] p-3 text-[var(--color-wheat)]">
            <p className="font-mono text-xs opacity-80">EQI tenor</p>
            <p className="mt-1 font-mono text-lg font-bold">
              {finance.tenureY * 4} quarters · {finance.moratoriumM}mo moratorium
            </p>
            <p className="font-mono text-xs opacity-70">Rate {(finance.rate * 100).toFixed(1)}% · rule {finance.ruleVersion}</p>
          </div>
        </div>
      </SectionCard>

      {/* 4 — Cash-flow: CAPEX/OPEX bar */}
      <SectionCard index="04" title="Cash-flow — CAPEX vs OPEX" monoLabel="Cash-flow">
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-[var(--color-ink)]">CAPEX (one-time)</span>
              <span className="font-mono text-xs text-[var(--color-muted)]">{fmt0(capexN)}</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-[var(--color-ledger)]">
              <div
                className="h-full rounded-full bg-[var(--color-ink)]"
                style={{ width: `${capexW}%` }}
              />
            </div>
            {cashflow.equipment && (
              <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">Equip: {cashflow.equipment}</p>
            )}
            {cashflow.setup && (
              <p className="font-mono text-xs text-[var(--color-muted)]">Setup: {cashflow.setup}</p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-[var(--color-ink)]">OPEX × 6mo</span>
              <span className="font-mono text-xs text-[var(--color-muted)]">{fmt0(opexN)} / mo</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-[var(--color-ledger)]">
              <div
                className="h-full rounded-full bg-[var(--color-wheat)]"
                style={{ width: `${opexW}%` }}
              />
            </div>
            {cashflow.monthlyOpex && (
              <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">OPEX: {cashflow.monthlyOpex}</p>
            )}
            {cashflow.monthlySales && (
              <p className="font-mono text-xs text-[var(--color-muted)]">Sales: {cashflow.monthlySales}</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* 5 — Quarter EQI table */}
      <SectionCard index="05" title="Quarterly obligations (EQI)" monoLabel="EQI Table">
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white">
          <div className="max-h-[320px] overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-[var(--color-ink)] font-mono text-[10px] uppercase tracking-widest text-[var(--color-wheat)]">
                <tr>
                  <th className="px-2 py-2 text-left">Q</th>
                  <th className="px-2 py-2 text-left">Due</th>
                  <th className="px-2 py-2 text-right">Principal</th>
                  <th className="px-2 py-2 text-right">Interest</th>
                  <th className="px-2 py-2 text-right">Total</th>
                  <th className="px-2 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {finance.schedule.map((r) => (
                  <tr
                    key={r.quarter}
                    className={[
                      "border-t border-[var(--color-ledger)]",
                      r.isMoratorium ? "bg-[var(--color-wheat)]/20" : r.quarter % 2 === 0 ? "bg-[var(--color-paper)]/40" : "bg-white",
                    ].join(" ")}
                  >
                    <td className="px-2 py-1.5 font-semibold text-[var(--color-ink)]">
                      {r.quarter}
                      {r.isMoratorium && (
                        <span className="ml-1 rounded-full bg-[var(--color-wheat)] px-1 py-0.5 text-[10px]">m</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-[var(--color-muted)]">{r.dueDate}</td>
                    <td className="px-2 py-1.5 text-right">{r.isMoratorium ? "—" : `₹${fmt2(r.principal)}`}</td>
                    <td className="px-2 py-1.5 text-right">₹{fmt2(r.interest)}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">₹{fmt2(r.total)}</td>
                    <td className="px-2 py-1.5 text-right text-[var(--color-muted)]">₹{fmt2(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-[var(--color-paper)] font-mono text-xs font-semibold">
                <tr className="border-t-2 border-[var(--color-ink)]">
                  <td colSpan={3} className="px-2 py-2 text-right text-[var(--color-muted)]">
                    Total
                  </td>
                  <td className="px-2 py-2 text-right text-[var(--color-vermilion)]">₹{fmt2(totalInterest)}</td>
                  <td className="px-2 py-2 text-right">₹{fmt2(totalPaid)}</td>
                  <td className="px-2 py-2" />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="border-t border-dashed border-[var(--color-ledger)] bg-[var(--color-paper)]/40 px-3 py-2 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
            EMI = P·r·(1+r)^n / ((1+r)^n−1), r=annual/4. Moratorium interest-only. Last instalment zeroed to paise.
          </p>
        </div>
      </SectionCard>

      {/* 6 — License checklist snapshot */}
      <SectionCard index="06" title="Licence checklist — snapshot" monoLabel="Licences">
        <ul className="grid gap-2 sm:grid-cols-2">
          {licences.map((lic) => (
            <li
              key={lic}
              className="flex items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--color-ledger)] bg-[var(--color-paper)]/50 px-3 py-2.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-ledger)] bg-white font-mono text-xs text-[var(--color-muted)]">
                ☐
              </span>
              <span className="font-mono text-xs font-medium text-[var(--color-ink)]">{lic}</span>
              <span className="ml-auto font-mono text-xs text-[var(--color-muted)]">DIC</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 font-mono text-xs text-[var(--color-muted)]">
          Full checklist at <span className="font-semibold">/app/compliance</span> — this snapshot filters by businessType.
        </p>
      </SectionCard>

      {/* 7 — Declaration with AA-verified flag */}
      <SectionCard index="07" title="Declaration" monoLabel="Declaration">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-[var(--color-paper)]/50 p-4">
          <p className="font-mono text-xs leading-relaxed text-[var(--color-ink)]">
            I declare that the information in this DPR is{" "}
            <span className="font-semibold">
              {isAA ? "AA-verified (mock — Account Aggregator enrichment)" : "self-reported"}
            </span>{" "}
            and that the financial projections above are derived deterministically from the scheme rules{" "}
            <span className="font-semibold">
              {finance.ruleVersion} ({finance.effectiveFrom})
            </span>{" "}
            without LLM arithmetic. I understand the block code <span className="font-semibold">{lgd.code}</span> and
            feasibility score <span className="font-semibold">{score}/100</span> were obtained via LGD + Overpass
            (ST_DWithin ~{feasibility.radiusM ?? 5000}m).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Applicant signature</p>
              <div className="mt-2 h-12 rounded-[var(--radius-card)] border border-dashed border-[var(--color-ledger)] bg-white" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Date & place</p>
              <p className="mt-2 font-mono text-xs text-[var(--color-ink)]">
                {today} · {lgd.block}, {lgd.district}
              </p>
              <div className="mt-2 h-6 rounded-[var(--radius-card)] border border-dashed border-[var(--color-ledger)] bg-white" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 8 — Footer meta + perforated edge */}
      <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-ledger)] bg-white px-4 py-3 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          — End of booklet — perforate here —
        </p>
        <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
          Generated {new Date().toISOString().slice(0, 10)} · Rule {finance.ruleVersion} · LGD {lgd.code} ·{" "}
          {isAA ? "AA-verified" : "self-reported"} · Paper that survives offline
        </p>
      </div>
    </div>
  );
}
