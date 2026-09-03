/**
 * C18 offline demo (`#offBtn` + `/offline` fallback banner).
 *
 * "Offline demo" toggle switch shows the fallback banner (link to `/offline`).
 * Queue helpers live in `src/lib/offline-queue.ts` (raw IndexedDB wrapper,
 * store `saarthi-queue`): `queuePush` stores form JSON while offline,
 * `queueFlush` returns + clears it on `online`. The `#queueN` badge shows the
 * pending count.
 */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { queueCount } from "../lib/offline-queue";

export default function OfflineBar() {
  const [demo, setDemo] = useState(false);
  const [pending, setPending] = useState(0);

  const refresh = useCallback(() => {
    queueCount().then(setPending).catch(() => setPending(0));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("online", refresh);
    return () => window.removeEventListener("online", refresh);
  }, [refresh]);

  return (
    <section className="card" aria-label="Offline demo">
      <div className="offline-row">
        <button
          type="button"
          id="offBtn"
          role="switch"
          aria-checked={demo}
          className="dpr-ghost"
          style={{ padding: "10px 16px" }}
          onClick={() => setDemo((prev) => !prev)}
        >
          Offline demo: {demo ? "on" : "off"}
        </button>
        <span id="queueN" className="num muted" aria-label={`${pending} queued forms`}>
          {pending} queued
        </span>
      </div>
      {demo && (
        <p className="offline-banner" role="status">
          Offline — saved on phone. See the <Link href="/offline">offline fallback</Link> or
          reconnect to flush the queue.
        </p>
      )}
    </section>
  );
}
