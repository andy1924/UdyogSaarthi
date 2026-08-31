import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function AppWelcomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          Operate — 4 steps
        </p>
        <h1 className="font-serif text-2xl font-semibold leading-tight text-[var(--color-ink)] sm:text-3xl">
          Start with Feasibility
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
          Check saturation in your block before you borrow. Locate your block, see the density gauge,
          then pick finance — all offline-ready.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              Next step
            </span>
            <Badge variant="ledger">LGD: Bihar › Nalanda › Hilsa</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col gap-4">
            <p className="font-mono text-xs text-[var(--color-muted)]">
              Your progress is saved locally (IndexedDB) and resumes offline.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/app/feasibility">
                <Button size="lg">Start with Feasibility →</Button>
              </Link>
              <Link
                href="/app/finance"
                className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-ledger)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper)]"
              >
                Skip to Finance
              </Link>
            </div>
            <div className="flex gap-2">
              <Link href="/app/dpr" className="font-mono text-xs text-[var(--color-muted)] underline underline-offset-4">
                View DPR
              </Link>
              <span className="font-mono text-xs text-[var(--color-ledger)]" aria-hidden>
                ·
              </span>
              <Link
                href="/app/feasibility"
                className="font-mono text-xs text-[var(--color-muted)] underline underline-offset-4"
              >
                Locate block
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">① Locate</p>
            <p className="mt-1 font-semibold text-[var(--color-ink)]">Bihar › Nalanda › Hilsa</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">LGD block + OSM 5km radius</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">② Feasibility</p>
            <p className="mt-1 font-semibold text-[var(--color-ink)]">Saturation gauge</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Viable / Saturated / Niche gap</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">③ Finance → ④ DPR</p>
            <p className="mt-1 font-semibold text-[var(--color-ink)]">EQI + PDF</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Deterministic math, versioned rules</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
