"use client";

import * as React from "react";

export interface CashflowAnswers {
  equipment: string;
  setup: string;
  monthlyOpex: string;
  monthlySales: string;
}

export interface CashflowSplit {
  capex: number;
  monthlyOpex: number;
  monthlySales: number;
  monthlyProfit: number;
  capexSharePct: number;
}

function toNum(s: string): number {
  const n = Number(String(s).replace(/[,₹\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function deriveSplit(a: CashflowAnswers, _loan: number): CashflowSplit {
  const equipment = toNum(a.equipment);
  const setup = toNum(a.setup);
  const monthlyOpex = toNum(a.monthlyOpex);
  const monthlySales = toNum(a.monthlySales);
  const capex = equipment + setup;
  const monthlyProfit = monthlySales - monthlyOpex;
  const capexSharePct = capex > 0 || monthlyOpex > 0 ? (capex / (capex + monthlyOpex * 12)) * 100 : 0;
  return { capex, monthlyOpex, monthlySales, monthlyProfit, capexSharePct };
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function CashflowQA({
  value,
  onChange,
  loan,
}: {
  value: CashflowAnswers;
  onChange: (next: CashflowAnswers) => void;
  loan: number;
}) {
  const split = deriveSplit(value, loan);
  const hasAny = Object.values(value).some((v) => String(v).trim() !== "");

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white">
      <div className="border-b border-[var(--color-ledger)] bg-[var(--color-paper)]/40 px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Cashflow Q&A — 4 quick questions</h3>
        <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
          Voice-guided · answers produce CAPEX vs OPEX split for DPR. Not a ledger — just your first-year picture.
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Field
          label="1. Equipment & machines (₹)"
          hint="What you’ll buy once — e.g. Nilkamal freezer, billing machine"
          placeholder="e.g. 65000"
          value={value.equipment}
          onChange={(v) => onChange({ ...value, equipment: v })}
          voiceHint="बोलें — मशीन की लागत"
        />
        <Field
          label="2. Setup & one-time costs (₹)"
          hint="Rent deposit, wiring, signage, licences"
          placeholder="e.g. 25000"
          value={value.setup}
          onChange={(v) => onChange({ ...value, setup: v })}
          voiceHint="सेटअप खर्च बोलें"
        />
        <Field
          label="3. Monthly running costs (₹/mo)"
          hint="Rent + power + staff + stock top-up"
          placeholder="e.g. 12000"
          value={value.monthlyOpex}
          onChange={(v) => onChange({ ...value, monthlyOpex: v })}
          voiceHint="महीने का खर्च"
        />
        <Field
          label="4. Expected monthly sales (₹/mo)"
          hint="Realistic estimate — your block, not Instagram"
          placeholder="e.g. 35000"
          value={value.monthlySales}
          onChange={(v) => onChange({ ...value, monthlySales: v })}
          voiceHint="बिक्री का अनुमान बोलें"
        />
      </div>

      {/* Split result */}
      <div className="border-t border-[var(--color-ledger)] bg-[var(--color-paper)]/30 px-4 py-3">
        {hasAny ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--color-ledger)] bg-white px-3 py-2.5">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">CAPEX</p>
              <p className="mt-1 font-mono text-sm font-semibold text-[var(--color-ink)]">₹{fmt(split.capex)}</p>
              <p className="font-mono text-xs text-[var(--color-muted)]">{split.capexSharePct.toFixed(0)}% of first-year use</p>
            </div>
            <div className="rounded-lg border border-[var(--color-ledger)] bg-white px-3 py-2.5">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Monthly OPEX</p>
              <p className="mt-1 font-mono text-sm font-semibold text-[var(--color-ink)]">₹{fmt(split.monthlyOpex)}/mo</p>
              <p className="font-mono text-xs text-[var(--color-muted)]">Annual ≈ ₹{fmt(split.monthlyOpex * 12)}</p>
            </div>
            <div
              className={[
                "rounded-lg border px-3 py-2.5",
                split.monthlyProfit >= 0
                  ? "border-[var(--color-success)]/20 bg-[var(--color-success)]/5"
                  : "border-[var(--color-vermilion)]/20 bg-[var(--color-vermilion)]/5",
              ].join(" ")}
            >
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Monthly margin</p>
              <p
                className={[
                  "mt-1 font-mono text-sm font-semibold",
                  split.monthlyProfit >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-vermilion)]",
                ].join(" ")}
              >
                ₹{fmt(split.monthlyProfit)}/mo
              </p>
              <p className="font-mono text-xs text-[var(--color-muted)]">
                Sales ₹{fmt(split.monthlySales)} − OPEX
              </p>
            </div>
          </div>
        ) : (
          <p className="font-mono text-xs text-[var(--color-muted)]">
            Fill any 2 fields to see split — used in DPR CAPEX/OPEX section.
          </p>
        )}
        <p className="mt-2 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
          Simple split, not double-entry. DPR will place CAPEX against loan and OPEX against working capital.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  placeholder,
  value,
  onChange,
  voiceHint,
}: {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  voiceHint: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <span className="font-mono text-xs text-[var(--color-muted)]">{hint}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[44px] flex-1 rounded-lg border border-[var(--color-ledger)] bg-white px-3 py-2 font-mono text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/10"
        />
        <span
          aria-hidden
          title="Voice mock — transcript editable"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-ledger)] bg-[var(--color-paper)] text-xs"
        >
          🎙
        </span>
      </div>
      <span className="font-mono text-xs text-[var(--color-muted)]" aria-hidden>
        {voiceHint} · tap mic to speak
      </span>
    </label>
  );
}
