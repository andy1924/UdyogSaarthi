"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { db } from "@/lib/offline/db";

export default function OfflinePage() {
  const [counts, setCounts] = React.useState<{
    feasibility: number;
    finance: number;
    dpr: number;
    directory: number;
    total: number;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [feasibility, finance, dpr, directory] = await Promise.all([
          db.feasibility.count(),
          db.finance.count(),
          db.dprRequests.count(),
          db.directory.count(),
        ]);
        if (!cancelled) {
          setCounts({
            feasibility,
            finance,
            dpr,
            directory,
            total: feasibility + finance + dpr + directory,
          });
        }
      } catch {
        if (!cancelled) setCounts({ feasibility: 0, finance: 0, dpr: 0, directory: 0, total: 0 });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <Badge variant="warn">Offline</Badge>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          You are offline — your work is queued
        </h1>
        <p className="max-w-prose font-mono text-sm leading-relaxed text-[var(--color-muted)]">
          UdyogSaarthi is local-first. Your feasibility, finance, and DPR inputs stay in this device
          (IndexedDB / Dexie) and will sync when you are back online. Nothing is lost.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">Queued on this device</h2>
          <p className="font-mono text-xs text-[var(--color-muted)]">Dexie · SaarthiDB · local-first</p>
        </CardHeader>
        <CardBody>
          {counts === null ? (
            <p className="font-mono text-sm text-[var(--color-muted)]" aria-live="polite">
              Counting queued records…
            </p>
          ) : (
            <div className="flex flex-col gap-3" aria-live="polite">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-[var(--color-paper)] px-3 py-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Feasibility</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[var(--color-ink)]">{counts.feasibility}</p>
                </div>
                <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-[var(--color-paper)] px-3 py-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Finance</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[var(--color-ink)]">{counts.finance}</p>
                </div>
                <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-[var(--color-paper)] px-3 py-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">DPR</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[var(--color-ink)]">{counts.dpr}</p>
                </div>
                <div className="rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-[var(--color-paper)] px-3 py-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Directory</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[var(--color-ink)]">{counts.directory}</p>
                </div>
              </div>
              <p className="font-mono text-sm text-[var(--color-ink)]">
                Total queued: <span className="font-semibold">{counts.total}</span> — will retry on reconnect.
              </p>
              <p className="font-mono text-xs text-[var(--color-muted)]">
                Tip: keep this tab open. Background sync will run when the network returns.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/app/feasibility">
          <Button>Back to Feasibility</Button>
        </Link>
        <Link href="/app">
          <Button variant="ghost">Go to App</Button>
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-ledger)] bg-white px-5 font-mono text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper)]"
        >
          Retry now
        </button>
      </div>

      <p className="font-mono text-xs text-[var(--color-muted)]">
        Offline fallback · PWA local-first · No data leaves the device until you reconnect.
      </p>
    </div>
  );
}
