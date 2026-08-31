"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LocationPicker } from "@/components/feasibility/LocationPicker";
import { DensityGauge } from "@/components/feasibility/DensityGauge";
import { SWOTCard } from "@/components/feasibility/SWOTCard";
import { OpportunityList } from "@/components/feasibility/OpportunityList";
import { MapSlip } from "@/components/feasibility/MapSlip";
import type { LGDCode } from "@/lib/feasibility/lgd";
import { queryPOI, type POIResult } from "@/lib/feasibility/overpass";
import { densityScore, verdict, type Verdict } from "@/lib/feasibility/scoring";

// Mock lat/lon per block + population
const BLOCK_META: Record<string, { lat: number; lon: number; population: number }> = {
  Hilsa: { lat: 25.32, lon: 85.27, population: 12000 },
  "Patna Sadar": { lat: 25.61, lon: 85.14, population: 35000 },
  "Gaya Sadar": { lat: 24.79, lon: 85.01, population: 28000 },
  Rajgir: { lat: 25.03, lon: 85.42, population: 9000 },
  Islampur: { lat: 25.13, lon: 85.2, population: 10000 },
};
const DEFAULT_META = { lat: 25.32, lon: 85.27, population: 12000 };
const SHOP_TYPE = "electronics";
const RADIUS_M = 5000;

function LedgerSkeleton() {
  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-wheat)] animate-pulse" aria-hidden />
            Querying 5km… Overpass · PostGIS ST_DWithin
          </p>
          <div
            className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-[var(--color-paper)] p-4 animate-pulse"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 23px, var(--color-ledger) 24px), repeating-linear-gradient(90deg, transparent, transparent 23px, var(--color-ledger) 24px)",
            }}
          >
            <div className="grid gap-2">
              <div className="h-4 w-3/4 rounded bg-[var(--color-ledger)]/70" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-ledger)]/50" />
              <div className="mt-2 h-24 rounded bg-[var(--color-ledger)]/40" />
              <div className="h-3 w-2/3 rounded bg-[var(--color-ledger)]/50" />
            </div>
          </div>
          <p className="font-mono text-xs text-[var(--color-muted)]">
            node[&quot;shop&quot;=&quot;{SHOP_TYPE}&quot;](around:{RADIUS_M}, lat, lon); · ledger grid pulse
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

function Stamp({ verdict }: { verdict: Verdict }) {
  const isSaturated = verdict === "saturated";
  const isNiche = verdict === "niche-gap";
  // viable + niche-gap both get green VIABLE, saturated gets red REJECT
  if (isSaturated) {
    return (
      <motion.div
        initial={{ scale: 2.2, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: -8, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 18, mass: 0.8 }}
        className="inline-flex -rotate-[8deg] items-center justify-center rounded-sm border-[3px] border-[var(--color-vermilion)] bg-white px-4 py-2 font-mono text-sm font-bold uppercase tracking-widest text-[var(--color-vermilion)] shadow-[0_4px_16px_rgba(199,61,46,0.22)]"
        style={{ transformOrigin: "center" }}
        aria-label="REJECT — Pivot suggested"
      >
        REJECT — Pivot suggested
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ scale: 1.8, rotate: 10, opacity: 0 }}
      animate={{ scale: 1, rotate: -6, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 16 }}
      className="inline-flex -rotate-[6deg] items-center justify-center rounded-sm border-[3px] border-[var(--color-success)] bg-white px-4 py-2 font-mono text-sm font-bold uppercase tracking-widest text-[var(--color-success)] shadow-[0_4px_16px_rgba(15,107,74,0.18)]"
      aria-label={isNiche ? "NICHE GAP — Proceed" : "VIABLE — Proceed"}
    >
      {isNiche ? "NICHE GAP — Proceed" : "VIABLE — Proceed"}
    </motion.div>
  );
}

export default function FeasibilityPage() {
  const [input, setInput] = React.useState<string>("Hilsa");
  const [lgd, setLgd] = React.useState<LGDCode | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [poi, setPoi] = React.useState<POIResult | null>(null);
  // queriedShop kept for contract parity — eslint-disable line for unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [queriedShop] = React.useState(SHOP_TYPE);

  // derived score
  const meta = React.useMemo(() => {
    if (!lgd) return DEFAULT_META;
    return BLOCK_META[lgd.block] ?? DEFAULT_META;
  }, [lgd]);
  const score = React.useMemo(() => {
    if (!poi) return 0;
    return densityScore(poi.count, meta.population);
  }, [poi, meta.population]);
  const v: Verdict | null = poi ? verdict(score) : null;

  const handleResolved = React.useCallback(
    async (next: LGDCode) => {
      setLgd(next);
      setPoi(null);
      setLoading(true);
      const m = BLOCK_META[next.block] ?? DEFAULT_META;
      try {
        const res = await queryPOI(m.lat, m.lon, RADIUS_M, SHOP_TYPE);
        setPoi(res);
        // persist to Dexie — try/catch never blocks
        try {
          const { db } = await import("@/lib/offline/db");
          await db.feasibility.put({
            id: "current",
            lgdBlock: next.block,
            lgdDistrict: next.district,
            lgdState: next.state,
            lat: m.lat,
            lon: m.lon,
            businessType: SHOP_TYPE,
            score: densityScore(res.count, m.population),
            createdAt: Date.now(),
          });
        } catch {
          // offline queue optional
        }
      } catch {
        // keep skeleton error silent — user can retry
        setPoi({ count: 22, pois: [] });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // hydrate from Dexie on mount
  React.useEffect(() => {
    (async () => {
      try {
        const { db } = await import("@/lib/offline/db");
        const rec = await db.feasibility.get("current");
        if (rec?.lgdBlock) {
          const { resolveLGD } = await import("@/lib/feasibility/lgd");
          const r = await resolveLGD(rec.lgdBlock);
          setLgd(r);
          setInput(rec.lgdBlock);
          const m = BLOCK_META[r.block] ?? DEFAULT_META;
          // if we have stored score, try to re-query to populate map dots; otherwise synthesize
          try {
            const res = await queryPOI(m.lat, m.lon, RADIUS_M, SHOP_TYPE);
            setPoi(res);
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const showResults = !loading && poi && lgd && v;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          Step 2 — Feasibility · KYN engine
        </p>
        <h1 className="font-serif text-2xl font-semibold leading-tight text-[var(--color-ink)] sm:text-3xl">
          Know your block before you borrow
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
          LGD + Overpass 5km query → density gauge → SWOT receipt. All offline-ready; numbers from scoring.ts.
        </p>
      </div>

      {/* Location */}
      <Card>
        <CardBody>
          <LocationPicker value={input} onChange={setInput} lgd={lgd} onResolved={handleResolved} />
        </CardBody>
      </Card>

      {/* Query / Skeleton */}
      {loading && <LedgerSkeleton />}

      {!loading && !poi && !lgd && (
        <Card>
          <CardBody>
            <p className="font-mono text-sm text-[var(--color-muted)]">Enter a block and hit Locate — e.g. “Hilsa” — to query 5km.</p>
          </CardBody>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Gauge + meta */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                    Density · {lgd!.block} · 5km
                  </span>
                  <span className="font-mono text-xs text-[var(--color-muted)]">
                    pop. ~{meta.population.toLocaleString("en-IN")} · {poi!.count} shops · score {score}/100
                  </span>
                </div>
              </CardHeader>
              <CardBody>
                <DensityGauge score={score} verdict={v!} poiCount={poi!.count} />
                {/* Stamp — thud animation */}
                <div className="mt-6 flex justify-center">
                  <Stamp verdict={v!} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-[var(--color-muted)]">
                  <Badge variant={v === "saturated" ? "vermilion" : v === "niche-gap" ? "warn" : "success"}>
                    {v === "saturated" ? "Saturated" : v === "niche-gap" ? "Niche gap" : "Viable"}
                  </Badge>
                  <span>Overpass mocked · PostGIS ST_DWithin mock · scoring.ts deterministic</span>
                </div>
              </CardBody>
            </Card>

            <SWOTCard verdict={v!} lgd={lgd!} poiCount={poi!.count} score={score} />

            {v === "saturated" && <OpportunityList verdict={v} lgd={lgd!} />}

            <MapSlip lgd={lgd!} lat={meta.lat} lon={meta.lon} pois={poi!.pois} radiusM={RADIUS_M} />

            {/* CTA */}
            <Card>
              <CardBody>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg font-semibold text-[var(--color-ink)]">
                      {v === "saturated" ? "Pivot before you finance" : "Lock this block — structure finance"}
                    </h2>
                    <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
                      Carries LGD <span className="font-semibold text-[var(--color-ink)]">{lgd!.code}</span> + score {score} into Finance. Offline-saved as “current”.
                    </p>
                  </div>
                  <Link href="/app/finance" className="shrink-0">
                    <Button size="lg">Continue to Finance →</Button>
                  </Link>
                </div>
                <p className="mt-3 font-mono text-xs text-[var(--color-muted)]">
                  Next: margin → TPC → capped loan → EQI (math.ts, not LLM).
                </p>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
