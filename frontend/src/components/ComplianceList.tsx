"use client";

/**
 * C14 compliance checklist (`#licList`).
 *
 * Checkbox list fetched via `SaarthiApi.complianceLicenses`
 * (server has a static RAG fallback, so errors are rare — handled anyway).
 * Each item shows a "Required" badge when `required`; the muted caption
 * lists `sources` + `ai_generated` and never blocks the flow.
 *
 * Styling: `var(--…)` tokens only, no hexes.
 */

import { useEffect, useState } from "react";
import {
  ApiError,
  SaarthiApi,
  type ComplianceOut,
} from "../lib/api-client";

export interface ComplianceListProps {
  businessCategory: string;
  state?: string;
  district?: string;
}

type Status = "loading" | "ready" | "error";

export default function ComplianceList({ businessCategory, state, district }: ComplianceListProps) {
  const [data, setData] = useState<ComplianceOut | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    setData(null);
    setChecked({});
    SaarthiApi.complianceLicenses(businessCategory, state, district).then(
      (out) => {
        if (cancelled) return;
        setData(out);
        setStatus("ready");
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Could not load compliance requirements.",
        );
        setStatus("error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [businessCategory, state, district]);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <section className="card" aria-label="Compliance checklist">
      <h2 style={{ margin: "0 0 8px" }}>Compliance</h2>
      <div id="licList" aria-live="polite" aria-busy={status === "loading"}>
        {status === "loading" && <p className="muted">Loading licences…</p>}

        {status === "error" && (
          <p role="alert" style={{ color: "var(--danger)", margin: 0 }}>
            {error ?? "Could not load compliance requirements."} You can continue without it.
          </p>
        )}

        {status === "ready" && data && data.licenses.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>
            No licences listed for this business.
          </p>
        )}

        {status === "ready" && data && data.licenses.length > 0 && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {data.licenses.map((lic) => (
              <li
                key={lic.id}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <label
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    minHeight: 44,
                    padding: "10px 0",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked[lic.id] ?? false}
                    onChange={() => toggle(lic.id)}
                    style={{ width: 22, height: 22, marginTop: 2, accentColor: "var(--accent)" }}
                  />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <b>{lic.label}</b>
                      {lic.required && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: "var(--caution)",
                            border: "1px solid var(--border)",
                            borderRadius: 999,
                            padding: "2px 8px",
                          }}
                        >
                          Required
                        </span>
                      )}
                    </span>
                    {lic.desc && (
                      <span className="muted" style={{ display: "block", fontSize: "0.875rem" }}>
                        {lic.desc}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {status === "ready" && data && (
          <p className="muted" style={{ margin: "8px 0 0", fontSize: "0.8125rem" }}>
            Sources: {data.sources.length > 0 ? data.sources.join(", ") : "static fallback rules"}
            {" · "}
            {data.ai_generated ? "AI-assisted" : "Official rules"}
          </p>
        )}
      </div>
    </section>
  );
}
