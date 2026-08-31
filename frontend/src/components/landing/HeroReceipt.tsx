"use client";

import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/** Mock semicircle gauge 0–100 */
function DensityGauge({ value = 62 }: { value?: number }) {
  // semicircle: 180deg, map value 0-100 -> angle -90 to +90
  const pct = Math.max(0, Math.min(100, value));
  const angle = -90 + (pct / 100) * 180;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  // needle line from center
  const cx = 80, cy = 70, r = 54;
  const nx = cx + r * Math.cos(rad(angle));
  const ny = cy + r * Math.sin(rad(angle));

  let verdict: string;
  let tone: string;
  if (pct >= 70) { verdict = "Saturated — pivot suggested"; tone = "text-[var(--color-vermilion)]"; }
  else if (pct >= 40) { verdict = "Viable — watch density"; tone = "text-[var(--color-warn)]"; }
  else { verdict = "Niche gap — opportunity"; tone = "text-[var(--color-success)]"; }

  return (
    <div className="flex flex-col items-center">
      <svg
        width={160}
        height={90}
        viewBox="0 0 160 90"
        role="img"
        aria-label={`Density gauge ${pct} out of 100, ${verdict}`}
        className="overflow-visible"
      >
        {/* track */}
        <path d="M 18 70 A 54 54 0 0 1 142 70" fill="none" stroke="var(--color-ledger)" strokeWidth={10} strokeLinecap="round" />
        {/* active arc */}
        <path
          d="M 18 70 A 54 54 0 0 1 142 70"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 169} 169`}
          style={{ transition: "stroke-dasharray 300ms ease" }}
        />
        {/* tick labels */}
        <text x={10} y={88} fontSize={9} fill="var(--color-muted)" fontFamily="var(--font-fragment)">0</text>
        <text x={74} y={16} fontSize={9} fill="var(--color-muted)" fontFamily="var(--font-fragment)">50</text>
        <text x={138} y={88} fontSize={9} fill="var(--color-muted)" fontFamily="var(--font-fragment)">100</text>
        {/* needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--color-vermilion)" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="var(--color-vermilion)" stroke="white" strokeWidth={1.5} />
      </svg>
      <p className="-mt-1 font-mono text-xs font-semibold text-[var(--color-ink)]">
        Density <span className="tabular-nums">{pct}</span> / 100
      </p>
      <p className={["mt-0.5 text-center text-xs font-medium", tone].join(" ")}>{verdict}</p>
    </div>
  );
}

function VoiceWave() {
  return (
    <div
      className="flex items-center gap-1.5"
      aria-hidden
    >
      <span className="h-3 w-1 rounded-full bg-[var(--color-vermilion)] motion-safe:animate-[wave_1s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
      <span className="h-5 w-1 rounded-full bg-[var(--color-vermilion)] motion-safe:animate-[wave_1s_ease-in-out_infinite]" style={{ animationDelay: "120ms" }} />
      <span className="h-8 w-1 rounded-full bg-[var(--color-vermilion)] motion-safe:animate-[wave_1s_ease-in-out_infinite]" style={{ animationDelay: "240ms" }} />
      <span className="h-5 w-1 rounded-full bg-[var(--color-vermilion)] motion-safe:animate-[wave_1s_ease-in-out_infinite]" style={{ animationDelay: "360ms" }} />
      <span className="h-3 w-1 rounded-full bg-[var(--color-vermilion)] motion-safe:animate-[wave_1s_ease-in-out_infinite]" style={{ animationDelay: "480ms" }} />
      <style>{`@keyframes wave{0%,100%{transform:scaleY(0.6)}50%{transform:scaleY(1)}} @media(prefers-reduced-motion:reduce){*{animation:none !important}}`}</style>
    </div>
  );
}

export function HeroReceipt() {
  return (
    <section aria-labelledby="hero-heading" className="mx-auto w-full max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        {/* Left: headline + trust line */}
        <div className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-3">
            <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-vermilion)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-vermilion)] motion-safe:animate-pulse" aria-hidden />
              Local-first · Offline-ready · Voice in your language
            </p>
            <h1
              id="hero-heading"
              className="font-serif text-3xl font-semibold leading-[1.1] tracking-tight text-[var(--color-ink)] sm:text-4xl lg:text-[2.6rem]"
            >
              Check if your block can still make money —{" "}
              <span className="text-[var(--color-vermilion)]">before you borrow.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[var(--color-muted)]">
              Hyper-local feasibility from your Gram Panchayat + deterministic scheme math. A
              stamped DPR you can take straight to the DIC — no middleman.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="ledger">Scheme rules v2024.11</Badge>
            <Badge variant="default">10% margin · 6.5% MF · 8% Term</Badge>
          </div>

          <p className="font-mono text-xs leading-relaxed text-[var(--color-muted)]">
            LGD: 784 districts · 7,323 blocks · 2.62L GPs &nbsp;·&nbsp; OSM Overpass 5–10 km &nbsp;·&nbsp; PostGIS ST_DWithin
          </p>
        </div>

        {/* Right: live feasibility receipt */}
        <Card className="relative overflow-hidden" aria-label="Feasibility receipt">
          {/* perforated stripe hint */}
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Feasibility receipt — live
              </span>
              <Badge variant="warn">Awaiting location</Badge>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-5">
            {/* location pill + voice */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ledger)] bg-[var(--color-ledger)]/60 px-3 py-1.5 font-mono text-xs font-medium text-[var(--color-ink)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-warn)]" aria-hidden />
                  No block selected
                </span>
                <span className="font-mono text-xs text-[var(--color-muted)]">Bihar &gt; Nalanda &gt; Hilsa &gt; — tap to locate</span>
              </div>

              <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-ledger)] bg-[var(--color-paper)]/60 px-3 py-2.5">
                <VoiceWave />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--color-ink)]">बोलें — say your village name</span>
                  <span className="font-mono text-xs text-[var(--color-muted)]">Voice ready · Bhashini mock · no data sent yet</span>
                </div>
                <span className="ml-auto hidden font-mono text-xs text-[var(--color-muted)] sm:inline">🎙️</span>
              </div>
            </div>

            {/* gauge mock */}
            <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white px-4 py-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Competitive density (mock)
              </p>
              <DensityGauge value={62} />
              <p className="max-w-[28ch] text-center font-mono text-xs leading-relaxed text-[var(--color-muted)]">
                Counts <em className="not-italic text-[var(--color-ink)]">shop=*</em> in 5 km via Overpass. Swap in real data at <span className="font-semibold">/app/feasibility</span>.
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/app"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-vermilion)] px-7 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vermilion)] focus-visible:ring-offset-2"
            >
              Check my block — बोलें
            </Link>
            <p className="text-center font-mono text-xs text-[var(--color-muted)]">
              Opens the Operate wizard · location permission next · no signup required
            </p>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
