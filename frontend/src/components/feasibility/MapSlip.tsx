"use client";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { LGDCode } from "@/lib/feasibility/lgd";

export interface MapSlipProps {
  lgd: LGDCode;
  lat: number;
  lon: number;
  pois: { lat: number; lon: number }[];
  radiusM: number;
}

export function MapSlip({ lgd, lat, lon, pois, radiusM }: MapSlipProps) {
  // project lat/lon deltas to SVG coords (simple equirectangular, mock)
  const W = 360;
  const H = 220;
  const cx = W / 2;
  const cy = H / 2;
  const radiusDeg = radiusM / 111000;
  // span: show radius*2.2 bounding box
  const spanDeg = radiusDeg * 2.2;
  const xScale = W / (spanDeg * 2);
  const yScale = H / (spanDeg * 2);
  const scale = Math.min(xScale, yScale);

  // toXY projection kept for future geo use — not in radial fallback
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toXY = React.useCallback(
    (pLat: number, pLon: number) => {
      const dx = (pLon - lon) * 111000 * Math.cos((lat * Math.PI) / 180);
      const dy = (pLat - lat) * 111000;
      // SVG y is down, so invert
      return {
        x: cx + (dx / 111000) * scale * (spanDeg / radiusDeg) * 0.45 * (W / 10),
        y: cy - (dy / 111000) * scale * (spanDeg / radiusDeg) * 0.45 * (H / 10),
      };
    },
    [lat, lon, cx, cy, scale, spanDeg, radiusDeg]
  );

  // fallback simple radial layout if projection too tight — distribute pois in circle
  const dots = React.useMemo(() => {
    // if too few pois, still show
    return pois.slice(0, 60).map((p, i) => {
      // use jitter-based pos within circle SVG space directly for visual consistency
      const angle = (i / Math.max(1, pois.length)) * Math.PI * 2 + (i * 0.37);
      const rNorm = 0.22 + (i % 5) * 0.13; // 0.22..0.74
      const rPx = (Math.min(W, H) / 2 - 18) * Math.min(1, rNorm);
      return {
        x: cx + rPx * Math.cos(angle),
        y: cy + rPx * Math.sin(angle),
        lat: p.lat,
        lon: p.lon,
      };
    });
  }, [pois, cx, cy]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            Map slip — 5km radius
          </span>
          <span className="rounded-full border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-2.5 py-1 font-mono text-xs font-semibold text-[var(--color-success)]">
            PostGIS ST_DWithin · mock
          </span>
        </div>
        <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
          {lgd.block} · center {lat.toFixed(4)}, {lon.toFixed(4)} · radius {(radiusM / 1000).toFixed(0)}km · {pois.length} shops
        </p>
      </CardHeader>
      <CardBody>
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-[var(--color-paper)]">
          {/* ledger grid bg */}
          <div
            className="relative"
            style={{
              backgroundColor: "var(--color-paper)",
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 23px, var(--color-ledger) 24px), repeating-linear-gradient(90deg, transparent, transparent 23px, var(--color-ledger) 24px)",
            }}
          >
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Map with ${pois.length} POIs within 5km of ${lgd.block}`}>
              {/* radius circle */}
              <circle cx={cx} cy={cy} r={Math.min(W, H) / 2 - 22} fill="none" stroke="var(--color-ink)" strokeWidth={1.2} strokeDasharray="6 6" opacity={0.45} />
              <circle cx={cx} cy={cy} r={Math.min(W, H) / 2 - 22} fill="var(--color-ink)" opacity={0.04} />
              {/* center */}
              <circle cx={cx} cy={cy} r={6} fill="var(--color-ink)" stroke="white" strokeWidth={2} />
              <circle cx={cx} cy={cy} r={10} fill="none" stroke="var(--color-vermilion)" strokeWidth={1.2} opacity={0.7} />
              <text x={cx} y={cy - 16} textAnchor="middle" fontSize={8} fontFamily="var(--font-fragment)" fill="var(--color-ink)" fontWeight={700}>
                {lgd.block}
              </text>
              {/* POI dots */}
              {dots.map((d, i) => (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={i % 7 === 0 ? 4 : 3}
                  fill={i % 3 === 0 ? "var(--color-vermilion)" : "var(--color-ink)"}
                  opacity={0.82}
                  stroke="white"
                  strokeWidth={0.8}
                />
              ))}
            </svg>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-ink)]" aria-hidden /> shop
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-vermilion)]" aria-hidden /> electronics
          </span>
          <span className="h-px w-6 bg-[var(--color-ledger)]" aria-hidden />
          <span>Overpass: node[&quot;shop&quot;=&quot;electronics&quot;](around:5000, lat, lon)</span>
        </div>
      </CardBody>
    </Card>
  );
}
