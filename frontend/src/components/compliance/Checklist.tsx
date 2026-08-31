"use client";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { License, ChecklistStatus } from "@/lib/compliance/rules";

export interface ChecklistProps {
  licenses: License[];
}

export function Checklist({ licenses }: ChecklistProps) {
  const [statusMap, setStatusMap] = React.useState<Record<string, ChecklistStatus>>(() => {
    const init: Record<string, ChecklistStatus> = {};
    licenses.forEach((l) => {
      init[l.id] = "pending";
    });
    return init;
  });
  const [pulling, setPulling] = React.useState(false);

  // Sync when licenses prop changes (category switch)
  React.useEffect(() => {
    setStatusMap((prev) => {
      const next: Record<string, ChecklistStatus> = {};
      licenses.forEach((l) => {
        next[l.id] = prev[l.id] ?? "pending";
      });
      return next;
    });
  }, [licenses]);

  const doneCount = licenses.filter((l) => statusMap[l.id] === "done").length;
  const total = licenses.length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const toggle = (id: string) => {
    setStatusMap((m) => ({ ...m, [id]: m[id] === "done" ? "pending" : "done" }));
  };

  const pull = async () => {
    if (pulling) return;
    setPulling(true);
    await new Promise((r) => setTimeout(r, 750));
    setStatusMap((m) => {
      const n = { ...m };
      licenses.forEach((l) => {
        n[l.id] = "done";
      });
      return n;
    });
    setPulling(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
              Compliance checklist
            </h2>
            <p className="mt-0.5 font-mono text-xs text-[var(--color-muted)]">
              {doneCount}/{total} done · {pct}% — tracker only
            </p>
          </div>
          <Badge variant={pct === 100 ? "success" : "ledger"}>{pct === 100 ? "All done" : "Pending"}</Badge>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-ledger)]">
          <div
            className="h-full rounded-full bg-[var(--color-success)] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Compliance progress"
          />
        </div>
      </CardHeader>

      <CardBody>
        <ul className="flex flex-col divide-y divide-[var(--color-ledger)]">
          {licenses.map((lic) => {
            const status = statusMap[lic.id] ?? "pending";
            const isDone = status === "done";
            return (
              <li key={lic.id} className="flex items-start gap-3 py-3">
                <input
                  id={`chk-${lic.id}`}
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(lic.id)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-success)]"
                  aria-label={`${lic.label} — ${status}`}
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`chk-${lic.id}`}
                    className={[
                      "cursor-pointer text-sm font-semibold leading-tight",
                      isDone ? "text-[var(--color-success)] line-through" : "text-[var(--color-ink)]",
                    ].join(" ")}
                  >
                    {lic.label}
                  </label>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">{lic.desc}</p>
                </div>
                <span
                  className={[
                    "inline-flex shrink-0 items-center rounded-[var(--radius-pill)] border px-2 py-1 font-mono text-xs font-semibold leading-none",
                    isDone
                      ? "border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                      : "border-[var(--color-ledger)] bg-white text-[var(--color-muted)]",
                  ].join(" ")}
                >
                  {status}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-[var(--color-ledger)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs leading-relaxed text-[var(--color-muted)]">
            Pull verifiable docs from DigiLocker — mock. No issuance, tracker only.
          </p>
          <Button
            onClick={pull}
            disabled={pulling || pct === 100}
            variant="ghost"
            className="min-h-[44px] shrink-0"
            aria-label="Pull from DigiLocker"
          >
            {pulling ? "Pulling…" : "Pull from DigiLocker"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
