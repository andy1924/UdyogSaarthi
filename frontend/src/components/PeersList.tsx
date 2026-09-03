"use client";

/**
 * C15 peers list (`#peers`).
 *
 * Up to 5 nearby directory rows (name / category / distance in km, 1 decimal)
 * via `SaarthiApi.directoryNearby` (`radius_m: 10000`). Skips the fetch when
 * `lat`/`lon` are absent. `ApiError` 503 (`DIRECTORY_UNAVAILABLE`) hides the
 * section and leaves a muted note — the parent keeps the verdict visible.
 *
 * Styling: `var(--…)` tokens only, no hexes.
 */

import { useEffect, useState } from "react";
import {
  ApiError,
  SaarthiApi,
  type DirectoryProfile,
} from "../lib/api-client";

export interface PeersListProps {
  lat?: number;
  lon?: number;
  category?: string;
}

type Status = "idle" | "loading" | "ready" | "unavailable" | "error";

export default function PeersList({ lat, lon, category }: PeersListProps) {
  const [peers, setPeers] = useState<DirectoryProfile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === undefined || lon === undefined) {
      setStatus("idle");
      setPeers([]);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    SaarthiApi.directoryNearby({ lat, lon, radius_m: 10000, category }).then(
      (out) => {
        if (cancelled) return;
        setPeers(out.profiles.slice(0, 5));
        setStatus("ready");
      },
      (err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 503) {
          setStatus("unavailable");
        } else {
          setError(
            err instanceof ApiError
              ? err.detail
              : err instanceof Error
                ? err.message
                : "Could not load nearby peers.",
          );
          setStatus("error");
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [lat, lon, category]);

  if (status === "idle") return null;

  if (status === "unavailable") {
    return (
      <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }} aria-live="polite">
        Peer directory is temporarily unavailable.
      </p>
    );
  }

  return (
    <section className="card" aria-label="Nearby peers">
      <h2 style={{ margin: "0 0 8px" }}>Nearby peers</h2>
      <div id="peers" aria-live="polite" aria-busy={status === "loading"}>
        {status === "loading" && <p className="muted">Finding nearby peers…</p>}

        {status === "error" && (
          <p role="alert" style={{ color: "var(--danger)", margin: 0 }}>
            {error ?? "Could not load nearby peers."}
          </p>
        )}

        {status === "ready" && peers.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>
            No registered peers in radius.
          </p>
        )}

        {status === "ready" && peers.length > 0 && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {peers.map((peer) => (
              <li
                key={peer.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                  minHeight: 44,
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <b style={{ overflowWrap: "break-word" }}>{peer.name}</b>
                  <span className="muted" style={{ display: "block", fontSize: "0.875rem" }}>
                    {peer.category}
                  </span>
                </span>
                <span className="num" style={{ flexShrink: 0 }}>
                  {(peer.distance_m / 1000).toFixed(1)} km
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
