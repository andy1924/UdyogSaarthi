"use client";

import { useEffect, useState } from "react";
import { SaarthiApi } from "../lib/api-client";

type HealthState = "ok" | "degraded" | "unknown";

/**
 * Dedicated API health indicator.
 *
 * Complements the inline `#apiDot` in Header.tsx (left untouched): same
 * `api-dot` styling, same semantics (`SaarthiApi.health`, ok/degraded,
 * 60 s repoll). Used in the audit page header area. Own `id` so the
 * document never contains two `#apiDot` nodes.
 */
export default function HealthDot({ id = "auditApiDot" }: { id?: string }) {
  const [health, setHealth] = useState<HealthState>("unknown");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await SaarthiApi.health();
        if (!cancelled) setHealth(res.status === "ok" ? "ok" : "degraded");
      } catch {
        if (!cancelled) setHealth("degraded");
      }
    }
    check();
    const timer = window.setInterval(check, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const label =
    health === "ok"
      ? "API status ok"
      : health === "degraded"
        ? "API status degraded"
        : "API status unknown";

  return (
    <span
      className={`api-dot${health !== "unknown" ? ` ${health}` : ""}`}
      id={id}
      role="status"
      aria-label={label}
      title={label}
    />
  );
}
