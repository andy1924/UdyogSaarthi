import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  perforated?: boolean;
}

export function Card({
  perforated = true,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "bg-white rounded-[var(--radius-card)]",
        "shadow-[var(--shadow-slip)]",
        "border border-[var(--color-ledger)]",
        perforated ? "perforated-top perforated-bottom" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["px-5 pt-5 pb-3 border-b border-[var(--color-ledger)]", className].join(
        " "
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["px-5 py-4", className].join(" ")} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "px-5 py-3 border-t border-[var(--color-ledger)] bg-[var(--color-paper)]/50 rounded-b-[var(--radius-card)]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
