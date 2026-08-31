import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header ledger rule */}
      <header className="border-b border-[var(--color-ledger)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-vermilion)]" aria-hidden />
            <span className="font-serif text-lg font-semibold tracking-tight text-[var(--color-ink)]">
              UdyogSaarthi
            </span>
            <Badge variant="ledger">Scheme rules v2024.11</Badge>
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="rounded-full border border-[var(--color-ledger)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]">
              हिंदी
            </span>
            <span className="rounded-full border border-[var(--color-ledger)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
              தமிழ்
            </span>
            <span className="rounded-full border border-[var(--color-ledger)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
              বাংলা
            </span>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="border-t border-dashed border-[var(--color-ledger)] py-2 font-mono text-xs text-[var(--color-muted)]">
            Bihar &gt; Nalanda &gt; Hilsa &gt; — locate your block to begin
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl font-semibold leading-tight text-[var(--color-ink)] sm:text-4xl">
            Sarkaar Ledger, Human Saarthi
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-muted)]">
            Hyper-local feasibility + deterministic scheme math. Paper that kills middlemen —
            check saturation in your block before you borrow.
          </p>
        </div>

        {/* Feasibility receipt — hero */}
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Feasibility Receipt
              </span>
              <Badge variant="warn">Awaiting location</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--color-ledger)]/60 px-3 py-1 font-mono text-xs text-[var(--color-ink)]">
                  No block selected
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-vermilion)] motion-safe:animate-pulse" aria-hidden />
                <span className="font-mono text-xs text-[var(--color-muted)]">voice ready — बोलें</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg">Check my block — बोलें</Button>
                <Button variant="ghost">How it works</Button>
              </div>
              <p className="font-mono text-xs text-[var(--color-muted)]">
                Scheme rules v2024.11 · 6.5% MF · 8% Term · 10% margin
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardBody>
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Step 1</p>
              <p className="mt-1 font-semibold text-[var(--color-ink)]">Locate</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">LGD block + OSM POI density (5km radius)</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Step 2</p>
              <p className="mt-1 font-semibold text-[var(--color-ink)]">Feasibility</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Saturation score → pivot or proceed</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Step 3</p>
              <p className="mt-1 font-semibold text-[var(--color-ink)]">Finance</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Margin → TPC · EQI (deterministic)</p>
            </CardBody>
          </Card>
        </div>
      </main>

      <footer className="border-t border-[var(--color-ledger)] bg-white py-4">
        <p className="mx-auto max-w-6xl px-4 text-center font-mono text-xs text-[var(--color-muted)] sm:px-6">
          UdyogSaarthi · Local-first PWA · Offline-ready · Voice in your language · DPR that SCAs trust
        </p>
      </footer>
    </div>
  );
}
