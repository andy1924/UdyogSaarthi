"use client";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { Verdict } from "@/lib/feasibility/scoring";
import type { LGDCode } from "@/lib/feasibility/lgd";

export interface SWOTCardProps {
  verdict: Verdict;
  lgd: LGDCode;
  poiCount: number;
  score: number;
}

type Quadrant = { title: string; items: string[] };

function buildSwot(verdict: Verdict, lgd: LGDCode, poiCount: number): Record<"S" | "W" | "O" | "T", Quadrant> {
  const block = lgd.block;
  const district = lgd.district;
  if (verdict === "saturated") {
    return {
      S: { title: "Strength", items: [`${block} has proven demand — ${poiCount} shops survive in 5km`, `Road + mandi access in ${district}`] },
      W: { title: "Weakness", items: ["High competition squeezes margin", "Price wars on same SKU set"] },
      O: { title: "Opportunity", items: ["Pivot to service/repair or agro value-add", "Tie-up with FPO / cold chain gap"] },
      T: { title: "Threat", items: ["New entrant with same shop = 3-month churn risk", "Working capital stuck in inventory"] },
    };
  }
  if (verdict === "niche-gap") {
    return {
      S: { title: "Strength", items: [`Low density in ${block} — first-mover window`, `Only ${poiCount} comparables in 5km`] },
      W: { title: "Weakness", items: ["Demand must be validated — footfall is thin", "Supply chain distance for spares"] },
      O: { title: "Opportunity", items: ["Own the category before others arrive", "Bundle service + sale (install + AMC)"] },
      T: { title: "Threat", items: ["If you dont market, gap stays invisible", "Seasonal demand in rural blocks"] },
    };
  }
  // viable
  return {
    S: { title: "Strength", items: [`Balanced density — ${poiCount} shops, room for one more`, `${block} trades all year`] },
    W: { title: "Weakness", items: ["Need clear differentiator vs 3–4 incumbents", "Working capital for 2-month stock"] },
    O: { title: "Opportunity", items: ["Differentiate on warranty / credit / home service", "Add allied SKU (accessories, repair)"] },
    T: { title: "Threat", items: ["Two similar openings this year could tip to saturated", "Price-sensitive buyers — keep EMI pitch ready"] },
  };
}

function QuadrantBlock({ q, variant }: { q: Quadrant; variant: "S" | "W" | "O" | "T" }) {
  const accent: Record<string, string> = {
    S: "var(--color-success)",
    W: "var(--color-vermilion)",
    O: "var(--color-ink)",
    T: "var(--color-warn)",
  };
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white px-3 py-3">
      <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-ink)]">
        <span className="h-2 w-2 rounded-full" style={{ background: accent[variant] }} aria-hidden />
        {q.title}
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-4 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
        {q.items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

export function SWOTCard({ verdict, lgd, poiCount, score }: SWOTCardProps) {
  const swot = React.useMemo(() => buildSwot(verdict, lgd, poiCount), [verdict, lgd, poiCount]);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            SWOT — receipt 4-quadrant
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            {lgd.block} · {verdict} · {score}/100
          </span>
        </div>
        <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
          Mock verbalization (template per LGD partition key — LLM phrasing only, numbers from scoring.ts).
        </p>
      </CardHeader>
      <CardBody>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuadrantBlock q={swot.S} variant="S" />
          <QuadrantBlock q={swot.W} variant="W" />
          <QuadrantBlock q={swot.O} variant="O" />
          <QuadrantBlock q={swot.T} variant="T" />
        </div>
        <p className="mt-3 font-mono text-xs text-[var(--color-muted)]">
          Partition key: <span className="font-semibold text-[var(--color-ink)]">{lgd.block} / {lgd.district}</span> · PostGIS ST_DWithin(5km) mock
        </p>
      </CardBody>
    </Card>
  );
}
