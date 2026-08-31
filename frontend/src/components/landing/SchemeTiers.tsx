"use client";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Slider } from "@/components/ui/Slider";
import { computeTPC, maxLoan, routeScheme } from "@/lib/scheme/math";
import { schemeRules } from "@/lib/scheme/rules";

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function SchemeTiers() {
  const [margin, setMargin] = React.useState(25_000);

  const tpc = computeTPC(margin);
  const loan = maxLoan(tpc);
  const tier = routeScheme(tpc);
  const rule = schemeRules[tier];

  return (
    <section aria-labelledby="scheme-heading" className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-vermilion)]">
          Scheme tiers — deterministic
        </p>
        <h2
          id="scheme-heading"
          className="font-serif text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl"
        >
          How much margin do you have? We’ll do the rest.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
          Slide your margin money. TPC and loan are computed instantly — no LLM, versioned
          rules the SCA can audit.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Calculator */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Margin → TPC calculator
              </span>
              <Badge variant={tier === "micro" ? "success" : "default"}>
                {tier === "micro" ? "Micro ≤₹1.40L" : "Term ₹1.40L–₹50L"}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-5">
            <Slider
              label="Your margin money"
              min={5_000}
              max={500_000}
              step={5_000}
              value={margin}
              displayValue={formatINR(margin)}
              onChange={(e) => setMargin(Number((e.target as HTMLInputElement).value))}
              hint="Range ₹5k – ₹5L (10% of project cost). Drag to update live."
            />

            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white px-4 py-3">
                <span className="text-sm font-medium text-[var(--color-muted)]">Total Project Cost</span>
                <span className="font-mono text-sm font-semibold text-[var(--color-ink)]">{formatINR(tpc)}</span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-[var(--color-paper)]/70 px-4 py-3">
                <span className="text-sm font-medium text-[var(--color-muted)]">Max loan (90% · capped)</span>
                <span className="font-mono text-sm font-semibold text-[var(--color-ink)]">{formatINR(loan)}</span>
              </div>
              <p className="font-mono text-xs text-[var(--color-muted)]">
                Caps: ₹1.25L (Micro) · ₹45L (Term) · Margin fixed 10% · TPC = margin ÷ 0.10
              </p>
            </div>

            {/* Tier detail rows */}
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ledger)]">
              <div className="grid grid-cols-3 gap-px bg-[var(--color-ledger)]">
                <div className="bg-white px-3 py-3 text-center">
                  <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Rate</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[var(--color-ink)]">
                    {(rule.rate * 100).toFixed(1)}% <span className="text-xs font-normal text-[var(--color-muted)]">p.a.</span>
                  </p>
                </div>
                <div className="bg-white px-3 py-3 text-center">
                  <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Tenure</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[var(--color-ink)]">{rule.tenureY}y</p>
                </div>
                <div className="bg-white px-3 py-3 text-center">
                  <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Moratorium</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[var(--color-ink)]">{rule.moratoriumM} mo</p>
                </div>
              </div>
              <div className="bg-[var(--color-paper)]/60 px-3 py-2 text-center font-mono text-xs text-[var(--color-muted)]">
                Scheme rules v2024.11 · beneficiary rate · EQI schedule in Task 5
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tier explainer */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardBody className="p-5">
              <h3 className="font-serif text-base font-semibold text-[var(--color-ink)]">Two tiers, same 10% skin in the game</h3>
              <div className="mt-3 grid gap-3">
                <div className="rounded-[var(--radius-card)] border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 px-3 py-3">
                  <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-success)]">Micro Finance</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink)]">
                    TPC up to <strong>₹1.40L</strong> · Loan max <strong>₹1.25L</strong> · <strong>6.5%</strong> p.a. · <strong>3 years</strong>, 3-mo moratorium. For kirana, tailoring, food cart.
                  </p>
                </div>
                <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white px-3 py-3">
                  <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-ink)]">Term Loan</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                    TPC <strong className="text-[var(--color-ink)]">₹1.40L – ₹50L</strong> · Loan max <strong className="text-[var(--color-ink)]">₹45L</strong> · <strong className="text-[var(--color-ink)]">8%</strong> p.a. · <strong className="text-[var(--color-ink)]">7 years</strong>, 6-mo moratorium. For dairy, processing, workshop.
                  </p>
                </div>
              </div>
              <p className="mt-3 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
                Your TPC routes automatically. EQI table + working-capital buffer (20–30%) land in the Operate calculator.
              </p>
            </CardBody>
          </Card>
          <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-ledger)] bg-white px-4 py-3 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
            No LLM does arithmetic here. Numbers are validated before any verbalization — the LLM only phrases the result in your language.
          </p>
        </div>
      </div>
    </section>
  );
}
