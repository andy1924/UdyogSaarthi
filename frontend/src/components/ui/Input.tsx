import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  className = "",
  id: idProp,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = idProp ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-ink)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={[
          "min-h-[44px] w-full rounded-[var(--radius-card)]",
          "border border-[var(--color-ledger)] bg-white px-3 py-2.5",
          "text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-vermilion)]/30 focus:border-[var(--color-vermilion)]",
          "disabled:opacity-50 disabled:bg-[var(--color-ledger)]/30",
          error ? "border-[var(--color-vermilion)] focus:ring-[var(--color-vermilion)]/30" : "",
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
        <p
          id={errorId}
          role="alert"
          className="text-xs text-[var(--color-vermilion)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  error,
  hint,
  className = "",
  id: idProp,
  ...props
}: TextareaProps) {
  const generatedId = React.useId();
  const inputId = idProp ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-ink)]"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={[
          "min-h-[88px] w-full rounded-[var(--radius-card)]",
          "border border-[var(--color-ledger)] bg-white px-3 py-2.5",
          "text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-vermilion)]/30 focus:border-[var(--color-vermilion)]",
          "disabled:opacity-50",
          error ? "border-[var(--color-vermilion)]" : "",
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
