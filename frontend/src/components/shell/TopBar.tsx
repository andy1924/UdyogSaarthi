"use client";

import Link from "next/link";
import { useState } from "react";
import { OfflineBadge } from "./OfflineBadge";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";

export function TopBar() {
  const [locale, setLocale] = useState<Locale>("en");

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-ledger)] bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-vermilion)]" aria-hidden />
          <Link href="/app" className="shrink-0 font-serif text-base font-semibold tracking-tight text-[var(--color-ink)]">
            UdyogSaarthi
          </Link>
          <span className="hidden h-4 w-px bg-[var(--color-ledger)] sm:block" aria-hidden />
          {/* LGD breadcrumb mock */}
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-1 overflow-hidden font-mono text-xs text-[var(--color-muted)]">
              <li className="truncate">Bihar</li>
              <li aria-hidden className="text-[var(--color-ledger)]">›</li>
              <li className="truncate">Nalanda</li>
              <li aria-hidden className="text-[var(--color-ledger)]">›</li>
              <li className="truncate font-semibold text-[var(--color-ink)]">Hilsa</li>
            </ol>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <OfflineBadge />
          {/* Language switcher placeholder */}
          <div className="hidden items-center gap-1 sm:flex" role="group" aria-label="Language">
            {locales.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                aria-pressed={l === locale}
                aria-label={`Switch to ${localeNames[l]}`}
                className={[
                  "min-h-[32px] rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  l === locale
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-wheat)]"
                    : "border-[var(--color-ledger)] bg-white text-[var(--color-muted)] hover:bg-[var(--color-paper)]",
                ].join(" ")}
              >
                {localeNames[l]}
              </button>
            ))}
          </div>
          {/* Mobile: single current locale + dropdown hint */}
          <div className="sm:hidden">
            <span className="rounded-full border border-[var(--color-ledger)] bg-white px-2.5 py-1 font-mono text-xs text-[var(--color-ink)]">
              {localeNames[locale]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
