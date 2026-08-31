import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const rows = [
  {
    feature: "Knows your block before you borrow",
    us: "LGD + OSM POI density (5 km)",
    others: "Pincode only",
    tone: "good" as const,
  },
  {
    feature: "Tells you to NOT start",
    us: "Saturation shield + pivot",
    others: "Assumes you picked",
    tone: "good" as const,
  },
  {
    feature: "Scheme math",
    us: "Deterministic, versioned, auditable",
    others: "Manual / LLM-guessed",
    tone: "good" as const,
  },
  {
    feature: "DPR in your language",
    us: "Voice + vernacular, Bhashini",
    others: "English PDF only",
    tone: "good" as const,
  },
  {
    feature: "Works offline",
    us: "IndexedDB + background sync",
    others: "Online-only",
    tone: "good" as const,
  },
  {
    feature: "Asks for price",
    us: "Margin money only (10%)",
    others: "CA fees / subscription",
    tone: "good" as const,
  },
];

export function TrustLedger() {
  return (
    <section aria-labelledby="trust-heading" className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-vermilion)]">
          Trust ledger
        </p>
        <h2
          id="trust-heading"
          className="font-serif text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl"
        >
          Why officers stamp our DPR.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
          Compare what you get here against portals that only help you <em>apply</em>.
        </p>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardBody className="p-0">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Comparison of UdyogSaarthi versus JanSamarth, Haqdarshak, Finline</caption>
              <thead>
                <tr className="border-b border-[var(--color-ledger)] bg-[var(--color-paper)]/60">
                  <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                    Check
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-ink)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" aria-hidden />
                      UdyogSaarthi
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                    JanSamarth · Haqdarshak · Finline
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.feature} className="border-b border-[var(--color-ledger)]/60 last:border-0">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)]" scope="row">
                      {r.feature}
                    </th>
                    <td className="px-4 py-3 font-medium text-[var(--color-success)]">{r.us}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{r.others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked */}
          <div className="flex flex-col divide-y divide-[var(--color-ledger)]/60 sm:hidden">
            {rows.map((r) => (
              <div key={r.feature} className="px-4 py-3">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{r.feature}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[var(--color-success)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" aria-hidden />
                  {r.us}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">Others: {r.others}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-[var(--color-ledger)] bg-[var(--color-paper)]/40 px-4 py-3">
            <Badge variant="ledger">PostGIS · pgvector · LGD block partition</Badge>
            <Badge variant="ledger">Scheme rules v2024.11</Badge>
            <span className="font-mono text-xs text-[var(--color-muted)]">Numbers validated before LLM phrasing · no arithmetic in prose.</span>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white px-4 py-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">SCA ready</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">DPR with rule-version footnote + AA-verified flag</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white px-4 py-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Fee</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">Zero middleman · project pays 10% margin, not a consultancy bill</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white px-4 py-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Data stays local</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">Local-first PWA · queued sync when back online</p>
        </div>
      </div>
    </section>
  );
}
