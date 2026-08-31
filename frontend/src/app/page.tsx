import Link from "next/link";
import { HeroReceipt } from "@/components/landing/HeroReceipt";
import { SaturationStory } from "@/components/landing/SaturationStory";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SchemeTiers } from "@/components/landing/SchemeTiers";
import { TrustLedger } from "@/components/landing/TrustLedger";
import { LanguageChips } from "@/components/landing/LanguageChips";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Ledger grid background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundColor: "var(--color-paper)",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 31px, var(--color-ledger) 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, var(--color-ledger) 32px)",
          opacity: 0.22,
        }}
      />

      {/* Header: ledger-rule top border + wordmark + chips */}
      <header className="sticky top-0 z-20 border-t-[3px] border-[var(--color-ink)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="border-b border-[var(--color-ledger)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vermilion)] focus-visible:ring-offset-2"
              aria-label="UdyogSaarthi home"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-vermilion)]"
                aria-hidden
              />
              <span className="font-serif text-lg font-semibold tracking-tight text-[var(--color-ink)]">
                UdyogSaarthi
              </span>
              <span className="hidden font-mono text-xs text-[var(--color-muted)] sm:inline">
                Sarkaar Ledger, Human Saarthi
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <LanguageChips />
              </div>
              <Link
                href="/app"
                className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-[var(--color-wheat)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vermilion)] focus-visible:ring-offset-2"
              >
                Open app
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-2 border-b border-dashed border-[var(--color-ledger)] py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs text-[var(--color-muted)]">
              Bihar &gt; Nalanda &gt; Hilsa &gt; — locate your block to begin{" "}
              <span className="hidden sm:inline">· LGD block / district partition key</span>
            </p>
            <div className="sm:hidden">
              <LanguageChips />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:gap-12 sm:px-6 sm:py-10">
        <HeroReceipt />

        <div className="h-px w-full bg-[var(--color-ledger)]/70" aria-hidden />

        <SaturationStory />

        <HowItWorks />

        <SchemeTiers />

        <TrustLedger />

        {/* Final CTA */}
        <section
          aria-labelledby="final-cta-heading"
          className="mx-auto w-full max-w-6xl"
        >
          <div className="rounded-[var(--radius-card)] border border-[var(--color-ink)] bg-[var(--color-ink)] px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3">
                <h2
                  id="final-cta-heading"
                  className="font-serif text-2xl font-semibold leading-tight text-white sm:text-3xl"
                >
                  Your block has an answer. Get it before the loan.
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-white/80">
                  Takes 2 minutes. Works offline. Speaks your language. DPR ready for the
                  SCA — NBCFDC · NSFDC · NSTFDC · NMDFC via State Channelizing Agencies.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-xs text-white/90">NBCFDC</span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-xs text-white/90">NSFDC</span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-xs text-white/90">NSTFDC</span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-xs text-white/90">NMDFC</span>
                  <span className="font-mono text-xs text-white/60">— via SCAs in every State/UT</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/app"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-vermilion)] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-ink)]"
                >
                  Check my block — बोलें
                </Link>
                <p className="text-center font-mono text-xs text-white/70">
                  No signup · Offline · Voice-first
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-ledger)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-vermilion)]" aria-hidden />
                <span className="font-serif text-sm font-semibold text-[var(--color-ink)]">UdyogSaarthi</span>
                <span className="font-mono text-xs text-[var(--color-muted)]">Sarkaar Ledger</span>
              </div>
              <p className="max-w-md font-mono text-xs leading-relaxed text-[var(--color-muted)]">
                Local-first PWA · Offline-ready · Voice in your language · DPR that SCAs trust. Scheme rules v2024.11 · Numbers validated before LLM phrasing.
              </p>
            </div>
            <div className="flex flex-col gap-1 text-xs text-[var(--color-muted)]">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-ink)]">
                Channelized via
              </p>
              <p className="font-mono leading-relaxed">
                NBCFDC · NSFDC · NSTFDC · NMDFC
                <br />
                Through State Channelizing Agencies (SCAs) · All States/UTs
              </p>
              <p className="font-mono text-xs leading-relaxed">
                © 2026 UdyogSaarthi · Built for DICs & DAY-NRLM kiosks
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
