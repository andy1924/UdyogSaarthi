import { Card, CardBody } from "@/components/ui/Card";

const steps = [
  {
    n: "01",
    title: "Locate",
    desc: "Drop a pin or speak your village. LGD block resolves — 784 districts, 7,323 blocks, 2.6L GPs.",
    mono: "LGD + voice · offline-ready",
  },
  {
    n: "02",
    title: "Feasibility",
    desc: "OSM Overpass counts shops in 5–10 km. Density score 0–100 + SWOT → saturated or niche-gap pivot.",
    mono: "ST_DWithin · POI density",
  },
  {
    n: "03",
    title: "Finance",
    desc: "Margin → TPC (÷0.10) → scheme router. Provisional EQI with moratorium, auditable rule version.",
    mono: "6.5% MF · 8% Term · 10% margin",
  },
  {
    n: "04",
    title: "DPR",
    desc: "One stamped PDF: feasibility + EQI + CAPEX/OPEX + license checklist. Take it to DIC or file online.",
    mono: "WeasyPrint · SCA-ready",
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-vermilion)]">
          How it works
        </p>
        <h2
          id="how-heading"
          className="font-serif text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl"
        >
          Four slips. One stamped DPR.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
          No middleman, no recycled business plan. Every slip is offline-ready and rule-versioned.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <Card key={s.n} className="flex flex-col">
            <CardBody className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold tracking-widest text-[var(--color-muted)]">
                  Slip {s.n}
                </span>
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-ledger)] bg-[var(--color-paper)] font-mono text-xs font-semibold text-[var(--color-ink)]"
                >
                  {s.n}
                </span>
              </div>
              <h3 className="mt-3 font-serif text-lg font-semibold leading-tight text-[var(--color-ink)]">
                {s.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">{s.desc}</p>
              <p className="mt-4 border-t border-dashed border-[var(--color-ledger)] pt-3 font-mono text-xs text-[var(--color-muted)]">
                {s.mono}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
