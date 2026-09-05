"use client";

/**
 * Scheme rules card (versioned micro/term tiers).
 *
 * Fetches `GET /api/scheme/rules` via `SaarthiApi.schemeRules` and renders
 * each tier verbatim (cap, rate, tenure, moratorium) — display only, never
 * computed. Footnote always shows the rule version (`v2024-11`).
 * Sits alongside FinanceCard in the result column without duplicating it:
 * FinanceCard shows the calculated loan/EQI; this card shows the rules.
 *
 * Styling: `var(--…)` tokens only, no hexes.
 */

import { useEffect, useState } from "react";
import { SaarthiApi, type SchemeRule } from "../lib/api-client";

type Status = "loading" | "ready" | "error";

function fmtINR(value: number): string {
  return `\u20B9${value.toLocaleString("en-IN")}`;
}

function fmtRate(rate: number): string {
  return `${(rate * 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
}

export default function SchemeRulesCard() {
  const [rules, setRules] = useState<SchemeRule[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    SaarthiApi.schemeRules().then(
      (out) => {
        if (cancelled) return;
        setRules(out);
        setStatus("ready");
      },
      (err: unknown) => {
        if (cancelled) return;
        void err;
        setStatus("error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const version = rules.length > 0 ? rules[0].version : "v2024-11";

  return (
    <section className="card" aria-label="Scheme rules">
      <h2 style={{ margin: "0 0 8px" }}>Scheme rules</h2>
      <div aria-live="polite" aria-busy={status === "loading"}>
        {status === "loading" && <p className="muted">Loading scheme rules…</p>}

        {status === "error" && (
          <p className="muted" style={{ margin: 0 }}>
            Scheme rules are temporarily unavailable. Finance figures above are still from the
            server.
          </p>
        )}

        {status === "ready" && rules.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>
            No scheme rules published.
          </p>
        )}

        {status === "ready" && rules.length > 0 && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {rules.map((rule) => (
              <li
                key={rule.tier}
                style={{ borderBottom: "1px solid var(--border)", padding: "8px 0" }}
              >
                <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <b style={{ textTransform: "capitalize" }}>{rule.tier}</b>
                  <span className="muted num" style={{ fontSize: "0.8125rem" }}>
                    {rule.version} · from {rule.effective_from}
                  </span>
                </span>
                <span className="muted" style={{ display: "block", fontSize: "0.875rem" }}>
                  Cap <span className="num">{fmtINR(rule.cap)}</span>
                  {" · "}Rate <span className="num">{fmtRate(rule.rate)}</span>
                  {" · "}Tenure <span className="num">{rule.tenure_years}y</span>
                  {" · "}Moratorium <span className="num">{rule.moratorium_months}mo</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {status !== "loading" && (
          <p className="muted" style={{ margin: "8px 0 0", fontSize: "0.8125rem" }}>
            Scheme rules {version}
          </p>
        )}
      </div>
    </section>
  );
}
