"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Checklist } from "@/components/compliance/Checklist";
import { licensesFor } from "@/lib/compliance/rules";

function ComplianceInner() {
  const sp = useSearchParams();
  const queryCat = sp.get("category")?.trim() ?? "";
  const [resolved, setResolved] = React.useState<string>(() => queryCat || "default");

  React.useEffect(() => {
    if (queryCat) {
      setResolved(queryCat);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("@/lib/offline/db");
        const all = await mod.db.feasibility.toArray();
        if (cancelled || all.length === 0) return;
        all.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        const rec = all[0] as unknown as Record<string, unknown>;
        const cat =
          (rec.businessType as string) ||
          (rec.businessCategory as string) ||
          (rec.category as string) ||
          "";
        if (cat && typeof cat === "string") setResolved(cat);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryCat]);

  React.useEffect(() => {
    if (queryCat) setResolved(queryCat);
  }, [queryCat]);

  const category = resolved;
  const licences = React.useMemo(() => licensesFor(category), [category]);

  const normalizedLabel = (() => {
    const c = category.trim().toLowerCase();
    if (c === "dairy") return "Dairy";
    if (c === "retail") return "Retail";
    if (c === "default" || !c) return "Default";
    return category;
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          Compliance · Tracker only
        </p>
        <h1 className="font-serif text-2xl font-semibold leading-tight text-[var(--color-ink)] sm:text-3xl">
          Licences for your venture
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
          Check what you need before you apply. This is a tracker — we don&apos;t issue licences.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="ledger">Category: {normalizedLabel}</Badge>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            ?category=dairy or feasibility → businessType
          </span>
        </div>
      </div>

      <Checklist licenses={licences} />

      <Card>
        <CardHeader>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Note</p>
        </CardHeader>
        <CardBody>
          <p className="font-mono text-xs leading-relaxed text-[var(--color-muted)]">
            No issuance — tracker only. Verify on official portals (Udyam, FSSAI, local municipality, GST portal).
            DigiLocker pull is a mock — it marks items done locally; no data leaves your device.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/app/dpr">
              <Button size="lg">Continue to DPR →</Button>
            </Link>
            <Link
              href="/app/directory"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-ledger)] bg-white px-5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper)]"
            >
              Check nearby directory
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-ledger)]/50" />
          <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-ledger)]/30" />
        </div>
      }
    >
      <ComplianceInner />
    </React.Suspense>
  );
}
