"use client";

import * as React from "react";

const MIN = 5000;
const MAX = 500000;

function toLogPosition(value: number): number {
  const minLog = Math.log10(MIN);
  const maxLog = Math.log10(MAX);
  const vLog = Math.log10(Math.max(MIN, Math.min(MAX, value)));
  return ((vLog - minLog) / (maxLog - minLog)) * 100;
}

function fromLogPosition(pos: number): number {
  const minLog = Math.log10(MIN);
  const maxLog = Math.log10(MAX);
  const vLog = minLog + (pos / 100) * (maxLog - minLog);
  const raw = Math.pow(10, vLog);
  // Snap to nearest 500 for UX (paise handled downstream)
  return Math.round(raw / 500) * 500;
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export interface MarginSliderProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
}

export function MarginSlider({ value, onChange, id }: MarginSliderProps) {
  const sliderId = id ?? "margin-slider";
  const pos = toLogPosition(value);

  const ticks = [5000, 10000, 25000, 50000, 100000, 250000, 500000];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <label
          htmlFor={sliderId}
          className="text-sm font-semibold text-[var(--color-ink)]"
        >
          Margin money (your contribution — 10%)
        </label>
        <span
          aria-live="polite"
          className="shrink-0 rounded-full border border-[var(--color-ledger)] bg-white px-3 py-1 font-mono text-sm font-semibold text-[var(--color-ink)]"
        >
          {formatINR(value)}
        </span>
      </div>

      <div className="relative flex items-center py-2">
        {/* Track */}
        <input
          id={sliderId}
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={pos}
          onChange={(e) => onChange(fromLogPosition(Number(e.target.value)))}
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={value}
          aria-valuetext={formatINR(value)}
          className={[
            "w-full appearance-none bg-transparent",
            "h-11 cursor-pointer",
            // Track
            "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[var(--color-ledger)]",
            "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[var(--color-ledger)]",
            // Thumb — 44px hit target via extra transparent border trick; visible 22px but hit 44
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-vermilion)] [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_1px_6px_rgba(0,0,0,0.18)]",
            "[&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:w-[22px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-vermilion)] [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-[0_1px_6px_rgba(0,0,0,0.18)]",
            // Fill via accent fallback for WebKit — we use background on track + thumb accent
            "accent-[var(--color-vermilion)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vermilion)] focus-visible:ring-offset-2 rounded-full",
          ].join(" ")}
          style={{ touchAction: "pan-x" }}
        />
      </div>

      {/* Tick row */}
      <div className="flex justify-between font-mono text-xs text-[var(--color-muted)]">
        {ticks.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            aria-label={`Set margin to ${formatINR(t)}`}
            className={[
              "min-h-[32px] rounded-full px-1.5 py-1 leading-none transition-colors",
              value === t
                ? "bg-[var(--color-ink)] text-[var(--color-wheat)]"
                : "hover:bg-[var(--color-ledger)]/50 text-[var(--color-muted)]",
            ].join(" ")}
          >
            {t >= 100000 ? `₹${t / 100000}L` : `₹${t / 1000}k`}
          </button>
        ))}
      </div>

      <p className="font-mono text-xs leading-relaxed text-[var(--color-muted)]">
        Log scale · ₹5k — ₹5L · Margin is exactly 10% of TPC (Total Project Cost)
      </p>
    </div>
  );
}

export const MARGIN_MIN = MIN;
export const MARGIN_MAX = MAX;
