"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MarginSlider } from "@/components/finance/MarginSlider";
import { SchemeBadge } from "@/components/finance/SchemeBadge";
import { EQITable } from "@/components/finance/EQITable";
import { WorkingCapitalCallout } from "@/components/finance/WorkingCapitalCallout";
import { CashflowQA, type CashflowAnswers } from "@/components/finance/CashflowQA";
import { schemeRules } from "@/lib/scheme/rules";
import { computeTPC, routeScheme, maxLoan, generateEQI } from "@/lib/scheme/math";

function formatINR0(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function formatINR2(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function FinancePage() {
  const [margin, setMargin] = React.useState<number>(25000);
  const [answers, setAnswers] = React.useState<CashflowAnswers>({
    equipment: "",
    setup: "",
    monthlyOpex: "",
    monthlySales: "",
  });

  // Derived — zero LLM arithmetic
  const tpc = React.useMemo(() => computeTPC(margin), [margin]);
  const tier = React.useMemo(() => routeScheme(tpc), [tpc]);
  const loan = React.useMemo(() => maxLoan(tpc), [tpc]);
  const rule = tier === "micro" ? schemeRules.micro : schemeRules.term;
  const schedule = React.useMemo(
    () => generateEQI(loan, rule.rate, rule.tenureY, rule.moratoriumM),
    [loan, rule.rate, rule.tenureY, rule.moratoriumM]
  );

  // Persist FinanceState to Dexie (optional, try/catch — never blocks render)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("@/lib/offline/db");
        if (cancelled) return;
        await mod.db.finance.put({
          id: "current",
          marginAmount: margin,
          scheme: tier,
          tpc,
          createdAt: Date.now(),
        });
      } catch {
        // Dexie missing or put failed — local-first is optional per spec
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [margin, tier, tpc]);

  // Hydrate from Dexie on mount (once)
  React.useEffect(() => {
    (async () => {
      try {
        const mod = await import("@/lib/offline/db");
        const rec = await mod.db.finance.get("current");
        if (rec && typeof rec.marginAmount === "number" && rec.marginAmount >= 5000 && rec.marginAmount <= 500000) {
          setMargin(rec.marginAmount);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          Step 3 — Finance · Deterministic
        </p>
        <h1 className="font-serif text-2xl font-semibold leading-tight text-[var(--color-ink)] sm:text-3xl">
          Structure your loan — no guesses
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
          Margin → TPC → capped loan → scheme → EQI. All numbers come from{" "}
          <span className="font-semibold text-[var(--color-ink)]">math.ts + rules.ts</span>, not an LLM. Slide margin;
          ledger updates instantly.
        </p>
      </div>

      {/* Margin + Ledger */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              Margin → Ledger
            </span>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              Rule {schemeRules.version} · {schemeRules.effectiveFrom}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col gap-6">
            <MarginSlider value={margin} onChange={setMargin} />

            {/* Live ledger rows */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--color-ledger)] bg-[var(--color-paper)]/40 px-3.5 py-3">
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">TPC</p>
                <p className="mt-1 font-mono text-lg font-semibold leading-none text-[var(--color-ink)]">
                  {formatINR0(tpc)}
                </p>
                <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">margin / 0.10 · 10% promoter contribution</p>
              </div>

              <div className="rounded-lg border border-[var(--color-ledger)] bg-white px-3.5 py-3">
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Max loan (90% capped)</p>
                <p className="mt-1 font-mono text-lg font-semibold leading-none text-[var(--color-ink)]">
                  {formatINR0(loan)}
                </p>
                <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
                  min(TPC×90%, ₹{new Intl.NumberFormat("en-IN").format(rule.cap)} cap)
                </p>
              </div>

              <div className="rounded-lg border border-[var(--color-ledger)] bg-white px-3.5 py-3 sm:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SchemeBadge tier={tier} />
                  <span className="font-mono text-xs text-[var(--color-muted)]">
                    TPC {tpc <= 140000 ? "≤" : ">"} ₹1.40L → {tier}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-3 font-mono text-xs">
                  <div>
                    <dt className="uppercase tracking-widest text-[var(--color-muted)]">Rate</dt>
                    <dd className="mt-1 font-semibold text-[var(--color-ink)]">{(rule.rate * 100).toFixed(1)}% p.a.</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-widest text-[var(--color-muted)]">Tenure</dt>
                    <dd className="mt-1 font-semibold text-[var(--color-ink)]">{rule.tenureY} years</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-widest text-[var(--color-muted)]">Moratorium</dt>
                    <dd className="mt-1 font-semibold text-[var(--color-ink)]">{rule.moratoriumM} months</dd>
                  </div>
                </dl>
              </div>
            </div>

            <WorkingCapitalCallout loan={loan} />

            {/* Quick math audit row */}
            <div className="rounded-lg border border-dashed border-[var(--color-ledger)] bg-white px-3 py-2.5">
              <p className="font-mono text-xs leading-relaxed text-[var(--color-muted)]">
                Audit: margin {formatINR0(margin)} → TPC {formatINR0(tpc)} → 90% ={" "}
                {formatINR0(tpc * 0.9)} → capped loan {formatINR0(loan)} → EQI {schedule.length} quarters (incl.{" "}
                {Math.ceil(rule.moratoriumM / 3)} moratorium, interest-only). EMI ≈{" "}
                {schedule.filter((s) => !s.isMoratorium)[0]
                  ? `₹${formatINR2(schedule.filter((s) => !s.isMoratorium)[0]!.total)}`
                  : "—"}{" "}
                per quarter.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* EQI Table */}
      <EQITable schedule={schedule} loan={loan} />

      {/* Cashflow Q&A — simple form not ledger */}
      <CashflowQA value={answers} onChange={setAnswers} loan={loan} />

      {/* CTA + Provenance */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-semibold text-[var(--color-ink)]">Ready for DPR?</h2>
              <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
                DPR will carry these exact numbers — auditable at the DIC. No LLM recomputation.
              </p>
            </div>
            <Link href="/app/dpr" className="shrink-0">
              <Button size="lg">Generate DPR →</Button>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-[var(--color-ledger)] pt-3">
            <span className="rounded-full border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-2.5 py-1 font-mono text-xs font-semibold text-[var(--color-success)]">
              Rule {schemeRules.version} · validated, LLM did not compute
            </span>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              effective {schemeRules.effectiveFrom} · Caps ₹1.25L (micro) · ₹45L (term) · Math = math.ts
            </span>
          </div>

          <p className="mt-2 font-mono text-xs text-[var(--color-muted)]">
            Offline-ready — your finance state is saved locally (Dexie “current”) and resumes without network.
          </p>
        </CardBody>
      </Card>

      {/* Ledger grid footer decoration */}
      <div
        aria-hidden
        className="h-px w-full bg-[repeating-linear-gradient(90deg,var(--color-ledger)_0_8px,transparent_8px_16px)] opacity-60"
      />
    </div>
  );
}
