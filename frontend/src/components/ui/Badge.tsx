import * as React from "react";

type BadgeVariant = "default" | "success" | "warn" | "vermilion" | "ledger";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--color-ledger)] text-[var(--color-ink)] border border-[var(--color-ledger)]",
  success:
    "bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20",
  warn: "bg-[var(--color-warn)]/10 text-[var(--color-warn)] border border-[var(--color-warn)]/20",
  vermilion:
    "bg-[var(--color-vermilion)]/10 text-[var(--color-vermilion)] border border-[var(--color-vermilion)]/20",
  ledger:
    "bg-white text-[var(--color-muted)] border border-[var(--color-ledger)] font-mono text-xs",
};

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium leading-none border",
        variantStyles[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
