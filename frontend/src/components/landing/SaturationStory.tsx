import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function SaturationStory() {
  return (
    <section aria-labelledby="saturation-heading" className="mx-auto w-full max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        {/* Big stat slip */}
        <Card className="overflow-hidden">
          <CardBody className="p-6 sm:p-8">
            <Badge variant="vermilion" className="mb-4">
              Research · NABARD MEDP
            </Badge>
            <p className="font-serif text-5xl font-semibold leading-none tracking-tight text-[var(--color-ink)] sm:text-6xl">
              20<span className="text-[var(--color-vermilion)]">%</span>
            </p>
            <h2
              id="saturation-heading"
              className="mt-3 font-serif text-xl font-semibold leading-tight text-[var(--color-ink)] sm:text-2xl"
            >
              Only 20% survive to become viable enterprises.
            </h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-muted)]">
              Evaluations of the Micro Enterprise Development Programme (MEDP) show four
              out of five newly-funded rural micro-enterprises stagnate or shut within the
              first cycle — not for lack of capital, but lack of local market signal.
            </p>
            <p className="mt-3 font-mono text-xs text-[var(--color-muted)]">
              Source: research §2 · systemDesign §0
            </p>
          </CardBody>
        </Card>

        {/* Herd mentality copy */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardBody className="p-5 sm:p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-vermilion)]">
                Herd mentality
              </p>
              <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-[var(--color-ink)]">
                Neighbour started it, so I will too
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                First-time borrowers choose trades by prestige or anecdote — a neighbour’s
                kirana, a cousin’s dairy — without counting how many shops already crowd
                their 5 km circle. Hyper-local replication kills margin before the first
                EMI is due.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-5 sm:p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-vermilion)]">
                What we prove before you borrow
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--color-muted)]">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-vermilion)]" aria-hidden />
                  <span>POI density in your block (Overpass + LGD) — saturated, viable, or niche-gap.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-vermilion)]" aria-hidden />
                  <span>Fix the <em className="font-semibold not-italic text-[var(--color-ink)]">what</em> before the <em className="font-semibold not-italic text-[var(--color-ink)]">how</em> — pivot before capital is sunk.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-vermilion)]" aria-hidden />
                  <span>Deterministic finance — zero LLM arithmetic, versioned scheme rules the SCA can audit.</span>
                </li>
              </ul>
              <p className="mt-4 font-mono text-xs font-semibold text-[var(--color-ink)]">
                Shield before compass → <span className="text-[var(--color-muted)]">dissuade from saturated bets first.</span>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
}
