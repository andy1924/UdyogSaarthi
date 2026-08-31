"use client";

import * as React from "react";
import type { Verdict } from "@/lib/feasibility/scoring";

export interface DensityGaugeProps {
  score: number;
  verdict: Verdict;
  poiCount: number;
}

const colorForVerdict: Record<Verdict, string> = {
  saturated: "var(--color-vermilion)",
  viable: "var(--color-success)",
  "niche-gap": "var(--color-wheat)",
};

const labelForVerdict: Record<Verdict, string> = {
  saturated: "Saturated",
  viable: "Viable",
  "niche-gap": "Niche gap",
};

export function DensityGauge({ score, verdict, poiCount }: DensityGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = colorForVerdict[verdict];
  // semicircle: 180deg, radius 84, stroke 14
  const r = 84;
  const cx = 100;
  const cy = 100;
  const totalLen = Math.PI * r; // half circumference
  const filled = (clamped / 100) * totalLen;
  // SVG path for semicircle track from 180 to 0 degrees
  const trackD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  // needle angle: 180deg -> 0deg
  const angleDeg = 180 - (clamped / 100) * 180;
  const needleRad = (angleDeg * Math.PI) / 180;
  const needleLen = r - 10;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy - needleLen * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[260px]">
        <svg
          viewBox="0 0 200 120"
          role="img"
          aria-label={`Density ${clamped} out of 100 — ${labelForVerdict[verdict]} — ${poiCount} shops in 5km`}
          className="h-auto w-full"
        >
          {/* ledger grid faint bg */}
          <rect x="0" y="0" width="200" height="120" rx="14" fill="var(--color-paper)" />
          {/* track */}
          <path d={trackD} fill="none" stroke="var(--color-ledger)" strokeWidth={14} strokeLinecap="round" />
          {/* filled arc using strokeDasharray on same path */}
          <path
            d={trackD}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${totalLen}`}
            style={{ transition: "stroke-dasharray 600ms ease" }}
          />
          {/* needle */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="var(--color-ink)"
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ transition: "all 600ms ease" }}
          />
          <circle cx={cx} cy={cy} r={6} fill="var(--color-ink)" stroke="white" strokeWidth={2} />
          {/* ticks */}
          {[0, 25, 50, 75, 100].map((t) => {
            const a = (180 - (t / 100) * 180) * (Math.PI / 180);
            const x1 = cx + (r + 8) * Math.cos(a);
            const y1 = cy - (r + 8) * Math.sin(a);
            return (
              <text key={t} x={x1} y={y1} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="var(--color-muted)" fontFamily="var(--font-fragment)">
                {t}
              </text>
            );
          })}
        </svg>
        <div className="mt-1 flex flex-col items-center gap-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest" style={{ color }}>
            {labelForVerdict[verdict]} · {clamped}/100
          </p>
          <p className="font-mono text-xs text-[var(--color-muted)]">{poiCount} shops in 5km radius</p>
        </div>
      </div>

      {/* legend bar */}
      <div className="flex w-full max-w-[320px] items-center justify-between gap-1 font-mono text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: colorForVerdict["niche-gap"] }} aria-hidden /> &lt;30 gap
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: colorForVerdict["viable"] }} aria-hidden /> 30–70 viable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: colorForVerdict["saturated"] }} aria-hidden /> &gt;70 saturated
        </span>
      </div>
    </div>
  );
}
