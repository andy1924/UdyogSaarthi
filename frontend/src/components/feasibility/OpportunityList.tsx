"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { Verdict } from "@/lib/feasibility/scoring";
import type { LGDCode } from "@/lib/feasibility/lgd";

export interface OpportunityListProps {
  verdict: Verdict;
  lgd: LGDCode;
}

const PIVOTS = [
  {
    title: "Agro-processing",
    blurb: "Pulse milling / oil expelling for rabi surplus — margins 18–22%, low SKU clash with electronics shops.",
    capex: "₹1.8–2.4L",
    tag: "FPO tie-up",
  },
  {
    title: "Cold storage (micro)",
    blurb: "5–10 MT rental cold room for potato / veg — payback via rental, not retail footfall.",
    capex: "₹3.0–4.5L",
    tag: "Niche infra",
  },
  {
    title: "Repair hub + spares",
    blurb: "Phone / appliance repair + spares counter — service revenue, not inventory-heavy sale.",
    capex: "₹0.9–1.4L",
    tag: "Service",
  },
];

export function OpportunityList({ verdict, lgd }: OpportunityListProps) {
  if (verdict !== "saturated") return null;
  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-vermilion)]">
          Saturated — 3 niche pivots for {lgd.block}
        </p>
        <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
          Same block, different job. These avoid head-on competition with the {lgd.block} cluster.
        </p>
      </CardHeader>
      <CardBody>
        <ul className="flex flex-col gap-3">
          {PIVOTS.map((p) => (
            <li
              key={p.title}
              className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-[var(--color-paper)] px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-ink)]">{p.title}</p>
                <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">{p.blurb}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--color-ledger)] bg-white px-2.5 py-1 font-mono text-xs text-[var(--color-ink)]">
                    {p.capex} TPC est.
                  </span>
                  <span className="rounded-full bg-[var(--color-ink)] px-2.5 py-1 font-mono text-xs text-[var(--color-wheat)]">
                    {p.tag}
                  </span>
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs text-[var(--color-muted)]">→ Finance pre-fill</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-xs text-[var(--color-muted)]">
          Pick a pivot to carry LGD <span className="font-semibold text-[var(--color-ink)]">{lgd.code}</span> into Finance — DPR will note the pivot.
        </p>
      </CardBody>
    </Card>
  );
}
