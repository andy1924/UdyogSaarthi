"use client";

import * as React from "react";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
  error?: string;
  displayValue?: string;
}

export function Slider({
  label,
  hint,
  error,
  displayValue,
  className = "",
  id: idProp,
  min,
  max,
  value,
  ...props
}: SliderProps) {
  const generatedId = React.useId();
  const inputId = idProp ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      {(label || displayValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm font-medium text-[var(--color-ink)]"
            >
              {label}
            </label>
          )}
          {displayValue && (
            <span
              aria-live="polite"
              className="font-mono text-sm font-semibold text-[var(--color-ink)] bg-[var(--color-ledger)]/50 px-2 py-0.5 rounded-[var(--radius-pill)] border border-[var(--color-ledger)]"
            >
              {displayValue}
            </span>
          )}
        </div>
      )}
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={[
          "w-full h-2 appearance-none cursor-pointer rounded-full",
          "bg-[var(--color-ledger)]",
          "accent-[var(--color-vermilion)]",
          // Ensure touch target is 44px via wrapper padding, slider itself stays visible
          "min-h-[44px] flex items-center",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-vermilion)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow",
          "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-vermilion)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vermilion)] focus-visible:ring-offset-2",
          className,
        ].join(" ")}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--color-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-vermilion)]">
          {error}
        </p>
      )}
    </div>
  );
}
