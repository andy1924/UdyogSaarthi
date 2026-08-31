import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { NearbyProfile } from "@/lib/directory/client";

function fmtDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export interface NearbyListProps {
  profiles: NearbyProfile[];
  loading?: boolean;
}

export function NearbyList({ profiles, loading }: NearbyListProps) {
  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[72px] animate-pulse rounded-[var(--radius-card)] bg-[var(--color-ledger)]/60"
                aria-hidden
              />
            ))}
          </div>
          <p className="mt-3 font-mono text-xs text-[var(--color-muted)]" aria-live="polite">
            Searching nearby…
          </p>
        </CardBody>
      </Card>
    );
  }

  if (profiles.length === 0) {
    return (
      <Card className="border-dashed">
        <CardBody>
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 py-6 text-center">
            <p className="font-serif text-base font-semibold text-[var(--color-ink)]">
              No one nearby — niche gap!
            </p>
            <p className="max-w-sm font-mono text-xs leading-relaxed text-[var(--color-muted)]">
              No profiles matched this radius + category. Widen the radius or clear the filter — could be your
              opening.
            </p>
            <span className="mt-1 inline-flex rounded-full border border-[var(--color-wheat)] bg-[var(--color-wheat)]/30 px-3 py-1 font-mono text-xs font-semibold text-[var(--color-ink)]">
              Opportunity hint — low density
            </span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Nearby profiles">
      {profiles.map((p) => (
        <li key={p.id}>
          <Card className="overflow-hidden">
            <CardBody>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--color-ink)]">{p.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="ledger" className="capitalize">
                      {p.category}
                    </Badge>
                    <span className="font-mono text-xs text-[var(--color-muted)]">{fmtDistance(p.distanceM)}</span>
                  </div>
                </div>
                <Link
                  href="#"
                  aria-label={`View ${p.name}`}
                  className="inline-flex min-h-[44px] min-w-[72px] shrink-0 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-ledger)] bg-white px-4 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vermilion)] focus-visible:ring-offset-2"
                >
                  View
                </Link>
              </div>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}
