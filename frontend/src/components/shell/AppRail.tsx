"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Step = {
  label: string;
  href: string;
  k: string;
};

const STEPS: Step[] = [
  { label: "Locate", href: "/app", k: "1" },
  { label: "Feasibility", href: "/app/feasibility", k: "2" },
  { label: "Finance", href: "/app/finance", k: "3" },
  { label: "DPR", href: "/app/dpr", k: "4" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppRail() {
  const pathname = usePathname() ?? "";

  const activeIndex = STEPS.findIndex((s) => isActive(pathname, s.href));
  const progressPct = activeIndex >= 0 ? ((activeIndex + 1) / STEPS.length) * 100 : 0;

  return (
    <nav
      aria-label="Operate steps"
      className={[
        // Mobile: bottom fixed, horizontal
        "fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--color-ledger)] bg-white px-2 py-2",
        // Desktop: left sidebar 240px, vertical — override fixed bottom
        "lg:static lg:z-auto lg:h-auto lg:w-[240px] lg:shrink-0 lg:flex-col lg:items-stretch lg:justify-start lg:border-t-0 lg:border-r lg:px-3 lg:py-6",
      ].join(" ")}
    >
      {/* Progress thin bar */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[var(--color-ledger)] lg:hidden"
        aria-hidden
      >
        <div
          className="h-full bg-[var(--color-vermilion)] transition-[width] duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="hidden w-full lg:block" aria-hidden>
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          Operate
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-ledger)]">
          <div
            className="h-full rounded-full bg-[var(--color-ink)] transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-1.5 font-mono text-xs text-[var(--color-muted)]">
          {activeIndex >= 0 ? `Step ${activeIndex + 1} of ${STEPS.length}` : "Start with Feasibility"}
        </p>
      </div>

      <div className="flex w-full justify-around gap-1 lg:mt-6 lg:flex-col lg:justify-start lg:gap-1">
        {STEPS.map((s) => {
          const active = isActive(pathname, s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={active ? "step" : undefined}
              className={[
                "flex min-h-[44px] min-w-[64px] flex-col items-center justify-center rounded-[var(--radius-card)] px-2 py-1 text-center transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-2.5 lg:text-left",
                active
                  ? "bg-[var(--color-ink)] text-[var(--color-wheat)] lg:bg-[var(--color-ink)]"
                  : "text-[var(--color-ink)] hover:bg-[var(--color-paper)] lg:hover:bg-[var(--color-ledger)]/40",
              ].join(" ")}
            >
              {/* Step circle */}
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold leading-none lg:h-8 lg:w-8 lg:text-sm",
                  active
                    ? "border-[var(--color-wheat)] bg-[var(--color-wheat)] text-[var(--color-ink)]"
                    : "border-[var(--color-ledger)] bg-white text-[var(--color-ink)]",
                ].join(" ")}
                aria-hidden
              >
                {s.k}
              </span>
              <span
                className={[
                  "mt-1 text-xs font-medium leading-none lg:mt-0 lg:text-sm",
                  active ? "text-[var(--color-wheat)]" : "text-[var(--color-ink)]",
                ].join(" ")}
              >
                {s.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Desktop ledger footnote */}
      <div className="hidden lg:mt-auto lg:block lg:pt-8">
        <p className="font-mono text-xs leading-relaxed text-[var(--color-muted)]">
          Scheme rules v2024.11
          <br />
          Micro ≤₹1.40L 6.5%
          <br />
          Term ≤₹50L 8%
        </p>
      </div>
    </nav>
  );
}
