import * as React from "react";

type ButtonVariant = "primary" | "vermillion" | "ghost";
type ButtonSize = "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-ink)] text-[var(--color-wheat)] hover:opacity-90 active:opacity-80 border border-transparent",
  vermillion:
    "bg-[var(--color-vermilion)] text-white hover:opacity-90 active:opacity-80 border border-transparent",
  ghost:
    "bg-transparent text-[var(--color-ink)] border border-[var(--color-ledger)] hover:bg-[var(--color-ledger)]/40 active:bg-[var(--color-ledger)]/60",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "min-h-[44px] px-5 py-2.5 text-sm font-medium",
  lg: "min-h-[44px] px-7 py-3 text-base font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-[var(--radius-pill)]",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vermilion)] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
