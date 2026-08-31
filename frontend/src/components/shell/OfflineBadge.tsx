"use client";

import { useEffect, useState } from "react";

type Status = "online" | "offline" | "queued";

export function OfflineBadge() {
  const [status, setStatus] = useState<Status>("online");
  const [queued, setQueued] = useState<number>(0);

  useEffect(() => {
    const compute = () => {
      const onLine = typeof navigator !== "undefined" ? navigator.onLine : true;
      // If custom event dispatched by sync layer, prefer it
      if (!onLine) return "offline" as const;
      if (queued > 0) return "queued" as const;
      return "online" as const;
    };

    const update = () => setStatus(compute());

    // Initial
    update();

    const onOnline = () => update();
    const onOffline = () => update();
    const onQueued = (e: Event) => {
      const detail = (e as CustomEvent).detail as { count?: number } | undefined;
      if (typeof detail?.count === "number") setQueued(detail.count);
      update();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("saarthi:queue", onQueued as EventListener);

    // Recompute when queued changes
    // queued is captured; re-derive on change
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("saarthi:queue", onQueued as EventListener);
    };
  }, [queued]);

  // Also watch navigator.onLine polling for queued state changes
  useEffect(() => {
    const onLine = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (!onLine) setStatus("offline");
    else if (queued > 0) setStatus("queued");
    else setStatus("online");
  }, [queued]);

  const label = status === "offline" ? "Offline" : status === "queued" ? "Queued" : "Online";

  const dotClass =
    status === "online"
      ? "bg-[var(--color-success)]"
      : status === "offline"
        ? "bg-[var(--color-vermilion)]"
        : "bg-[var(--color-warn)]";

  const wrapClass =
    status === "online"
      ? "border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]"
      : status === "offline"
        ? "border-[var(--color-vermilion)]/20 bg-[var(--color-vermilion)]/10 text-[var(--color-vermilion)]"
        : "border-[var(--color-warn)]/20 bg-[var(--color-warn)]/10 text-[var(--color-warn)]";

  return (
    <span
      aria-live="polite"
      aria-label={`Connection status: ${label}`}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-medium leading-none",
        wrapClass,
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", dotClass].join(" ")} aria-hidden />
      {label}
    </span>
  );
}
