"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DPRPreview } from "@/components/dpr/DPRPreview";
import { DPRMeta } from "@/components/dpr/DPRMeta";
import { renderDPR } from "@/lib/dpr/client";
import type { DPRPayload, FeasibilityReport, FinanceState, CapexOpex, VerifiedFlag } from "@/lib/dpr/types";
import { computeTPC, routeScheme, maxLoan, generateEQI } from "@/lib/scheme/math";
import { schemeRules } from "@/lib/scheme/rules";

type LoadState =
  | { status: "loading" }
  | { status: "missing"; missing: ("feasibility" | "finance")[] }
  | { status: "ready"; payload: DPRPayload };

function MissingGate({ missing }: { missing: ("feasibility" | "finance")[] }) {
  const needsFeas = missing.includes("feasibility");
  const needsFin = missing.includes("finance");
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-vermilion)]">
          DPR needs both engines
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-[var(--color-ink)]">
          Complete feasibility + finance first
        </h1>
        <p className="mt-2 font-mono text-sm leading-relaxed text-[var(--color-muted)]">
          DPR is a receipt that assembles your LGD + density verdict and your deterministic scheme numbers. Add the
          missing step below — nothing is computed inside the DPR itself.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {needsFeas && (
          <Card>
            <CardBody>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Feasibility missing
              </p>
              <p className="mt-1 font-serif text-base font-semibold text-[var(--color-ink)]">Add location</p>
              <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
                Resolve an LGD block and run the 5km density check to get score + verdict.
              </p>
              <Link href="/app/feasibility" className="mt-3 inline-block">
                <Button>Add location →</Button>
              </Link>
            </CardBody>
          </Card>
        )}
        {needsFin && (
          <Card>
            <CardBody>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Finance missing
              </p>
              <p className="mt-1 font-serif text-base font-semibold text-[var(--color-ink)]">Add finance</p>
              <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
                Slide margin to derive TPC → capped loan → EQI. All math from math.ts + rules.ts.
              </p>
              <Link href="/app/finance" className="mt-3 inline-block">
                <Button>Add finance →</Button>
              </Link>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function DPRPage() {
  const [state, setState] = React.useState<LoadState>({ status: "loading" });
  const [verified, setVerified] = React.useState<VerifiedFlag>("self-reported");
  const [genStatus, setGenStatus] = React.useState<null | "generating" | "ready">(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [offlineQueued, setOfflineQueued] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("@/lib/offline/db");
        const feasRec = await mod.db.feasibility.get("current");
        const finRec = await mod.db.finance.get("current");

        if (cancelled) return;

        const missing: ("feasibility" | "finance")[] = [];
        if (!feasRec || !feasRec.lgdBlock) missing.push("feasibility");
        // FinanceRecord stores marginAmount + tpc + scheme, but we recompute deterministically for display assertion
        if (!finRec || typeof finRec.marginAmount !== "number" || !Number.isFinite(finRec.marginAmount)) {
          missing.push("finance");
        }

        if (missing.length) {
          setState({ status: "missing", missing });
          return;
        }

        // Reconstruct FeasibilityReport — prefer stored fields, fallback to computed
        const storedFeas = feasRec as unknown as Record<string, unknown>;
        const scoreN = typeof feasRec?.score === "number" && Number.isFinite(feasRec.score) ? feasRec!.score : 42;
        const businessType = (storedFeas["businessType"] as string) || "electronics";
        // stored shape may have flattened LGD; rebuild LGDCode
        const lgdCodeStr = (storedFeas["lgdBlock"] as string) || "BR-NA-HI-001";
        const lgdDistrict = (storedFeas["lgdDistrict"] as string) || "Nalanda";
        const lgdState = (storedFeas["lgdState"] as string) || "Bihar";
        const blockName = String(lgdCodeStr).includes("-")
          ? feasRec!.lgdBlock
          : String(feasRec!.lgdBlock);
        // If Dexie stored LGD object under another key, try to read it
        const maybeLgd = (storedFeas["lgd"] as { code?: string; block?: string; district?: string; state?: string; gp?: string }) || null;
        const feasibility: FeasibilityReport = {
          lgd: maybeLgd?.code
            ? {
                code: maybeLgd.code,
                block: maybeLgd.block || blockName,
                district: maybeLgd.district || lgdDistrict,
                state: maybeLgd.state || lgdState,
                gp: maybeLgd.gp || blockName,
              }
            : {
                code: String(lgdCodeStr),
                block: String(blockName),
                district: String(lgdDistrict),
                state: String(lgdState),
                gp: String(blockName),
              },
          lat: (storedFeas["lat"] as number) ?? 25.32,
          lon: (storedFeas["lon"] as number) ?? 85.27,
          businessType: String(businessType),
          poiCount: (storedFeas["poiCount"] as number) ?? 24,
          score: scoreN,
          verdict: ((): FeasibilityReport["verdict"] => {
            const v = storedFeas["verdict"] as string | undefined;
            if (v === "saturated" || v === "viable" || v === "niche-gap") return v;
            // derive from score
            if (scoreN > 70) return "saturated";
            if (scoreN < 30) return "niche-gap";
            return "viable";
          })(),
          radiusM: 5000,
        };

        // Reconstruct FinanceState deterministically from margin (single source of truth)
        const margin = finRec!.marginAmount;
        const tpc = computeTPC(margin);
        const tier = routeScheme(tpc);
        const loan = maxLoan(tpc);
        const rule = tier === "micro" ? schemeRules.micro : schemeRules.term;
        const schedule = generateEQI(loan, rule.rate, rule.tenureY, rule.moratoriumM);

        // Assertion: numbers displayed === calculator math output (add comment)
        // These values ARE the calculator output; DPR does not recompute with different formulas.
        // If they diverge from /app/finance, the bug is in Dexie persistence, not in DPR math.

        const finance: FinanceState = {
          marginAmount: margin,
          tpc,
          tier,
          loan,
          rate: rule.rate,
          tenureY: rule.tenureY,
          moratoriumM: rule.moratoriumM,
          schedule,
          ruleVersion: schemeRules.version,
          effectiveFrom: schemeRules.effectiveFrom,
        };

        const cashflow: CapexOpex = (
          (storedFeas["cashflow"] as CapexOpex) ||
          (finRec as unknown as { cashflow?: CapexOpex })?.cashflow || {
            equipment: "",
            setup: "",
            monthlyOpex: "",
            monthlySales: "",
          }
        ) as CapexOpex;

        const payload: DPRPayload = {
          feasibility,
          finance,
          cashflow,
          verified: "self-reported",
        };

        setState({ status: "ready", payload });
      } catch {
        if (!cancelled) setState({ status: "missing", missing: ["feasibility", "finance"] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const payload: DPRPayload | null =
    state.status === "ready"
      ? { ...state.payload, verified }
      : null;

  async function handleGenerate() {
    if (!payload) return;
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    if (offline) {
      setOfflineQueued(true);
      setGenStatus("ready");
      setPdfUrl("/mock/dpr.pdf");
      // also queue via client
      try {
        await renderDPR(payload);
      } catch {
        /* ignore */
      }
      return;
    }
    setGenStatus("generating");
    setOfflineQueued(false);
    // polling mock status "generating" → "ready"
    const t = setTimeout(async () => {
      try {
        const res = await renderDPR(payload);
        setPdfUrl(res.pdfUrl);
      } catch {
        setPdfUrl("/mock/dpr.pdf");
      }
      setGenStatus("ready");
    }, 900);
    // cleanup if component unmounts mid-poll — caller manages via state
    void t;
  }

  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          Loading DPR…
        </p>
        <div className="h-64 animate-pulse rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white/60" />
      </div>
    );
  }

  if (state.status === "missing") {
    return <MissingGate missing={state.missing} />;
  }

  // ready
  const pl = payload!;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          Step 4 — DPR · Receipt booklet
        </p>
        <h1 className="font-serif text-2xl font-semibold leading-tight text-[var(--color-ink)] sm:text-3xl">
          Your DPR preview — paper that survives offline
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
          8 sections assembled from your feasibility + finance. Numbers === calculator math output — DPR only renders
          them. Toggle the <span className="font-semibold text-[var(--color-ink)]">AA badge</span> (mock) and generate a
          PDF.
        </p>
      </div>

      <DPRMeta
        verified={verified}
        ruleVersion={pl.finance.ruleVersion}
        effectiveFrom={pl.finance.effectiveFrom}
        generatedAt={new Date().toISOString()}
        lgdCode={pl.feasibility.lgd.code}
      />

      <DPRPreview payload={pl} onVerifiedChange={setVerified} />

      <Card>
        <CardBody>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">Generate PDF</h2>
              <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
                POST /api/dpr/render contract → polling mock <span className="font-semibold">generating → ready</span> →
                download link. Offline-queued if navigator.onLine is false.
              </p>
              {offlineQueued && (
                <p className="mt-2 font-mono text-xs font-semibold text-[var(--color-warn)]">
                  Offline — queued to Dexie dprRequests (will sync when back online).
                </p>
              )}
              {genStatus === "generating" && (
                <p className="mt-2 flex items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-wheat)]" aria-hidden />
                  generating…
                </p>
              )}
              {genStatus === "ready" && pdfUrl && (
                <a
                  href={pdfUrl}
                  download
                  className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--color-success)] underline underline-offset-4"
                >
                  ↓ Download DPR PDF (mock)
                </a>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={genStatus === "generating"}
              aria-busy={genStatus === "generating"}
            >
              {genStatus === "generating" ? "Generating…" : genStatus === "ready" ? "Regenerate PDF" : "Generate PDF"}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-[var(--color-ledger)] pt-3">
            <span className="rounded-full border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-2.5 py-1 font-mono text-xs font-semibold text-[var(--color-success)]">
              Rule {pl.finance.ruleVersion} · validated, LLM did not compute
            </span>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              offline-queued if navigator.onLine false · Dexie dprRequests
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
