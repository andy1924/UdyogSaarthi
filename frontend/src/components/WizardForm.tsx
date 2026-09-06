"use client";

/**
 * WizardForm — composes BusinessGrid + LocationStep + MarginStep + AuthCard,
 * the C08 CTA bar, and the C10 result state machine.
 *
 * Flow: `SaarthiApi.feasibilityScore` → `SaarthiApi.schemeCalculate`
 * (server values are rendered as-is; no client finance math). Error mapping:
 * - 502 → graceful retry UI row (Retry preserves form values)
 * - 401 → login nudge (values kept; AuthCard above handles login)
 * - 422 → inline form error (no error-box state switch)
 * - margin out-of-range → MARGIN_OUT_OF_RANGE inline, no fetch
 *
 * UI-value → API `business_category` map (no `bizToCategory` exists in
 * `api-client.ts`, so it lives here): dairy|retail|food|electronics pass
 * through, agro → agro-processing, tailoring → tailoring.
 *
 * ── Export contract ──────────────────────────────────────────────
 * ```tsx
 * import WizardForm, { type WizardResult } from "./WizardForm";
 *
 * <WizardForm
 *   onFeasibility={(feas, scheme) => { /* store lifted results *\/ }}
 *   canRequestDpr={feas !== null && scheme !== null}
 *   onRequestDpr={() => openDprDialog()}
 * >
 *   {(result) => result && <ResultCard feas={result.feas} scheme={result.scheme} />}
 * </WizardForm>
 * ```
 * Props:
 * - `onFeasibility?(feas: FeasibilityOut, scheme: SchemeCalculateOut): void`
 *   — called once both calls succeed.
 * - `children?: (result: WizardResult | null) => ReactNode` — render prop,
 *   rendered inside `#stPop` when populated (receives `{ feas, scheme }`).
 * - `canRequestDpr?: boolean` (default true) — ANDed with internal
 *   feasibility+scheme success to enable the "Get bank paper" button.
 * - `onRequestDpr?: () => void` — DPR button handler (Agent 5 wires the dialog).
 */

import { useEffect, useState, type ReactNode } from "react";
import {
  ApiError,
  SaarthiApi,
  type FeasibilityOut,
  type SchemeCalculateOut,
} from "../lib/api-client";
import AuthCard from "./AuthCard";
import BusinessGrid, { type BizValue } from "./BusinessGrid";
import LocationStep from "./LocationStep";
import MarginStep, { MARGIN_MAX, MARGIN_MIN } from "./MarginStep";
import ProgressBar from "./ProgressBar";

/** UI grid value → API `business_category`. */
export function bizToCategory(v: BizValue): string {
  return v === "agro" ? "agro-processing" : v;
}

export interface WizardResult {
  feas: FeasibilityOut;
  scheme: SchemeCalculateOut;
}

export interface WizardFormProps {
  onFeasibility?: (feas: FeasibilityOut, scheme: SchemeCalculateOut) => void;
  children?: (result: WizardResult | null) => ReactNode;
  canRequestDpr?: boolean;
  onRequestDpr?: () => void;
}

type Status = "empty" | "loading" | "error" | "populated";

export default function WizardForm({
  onFeasibility,
  children,
  canRequestDpr = true,
  onRequestDpr,
}: WizardFormProps) {
  const [category, setCategory] = useState<BizValue | null>(null);
  const [locationText, setLocationText] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [margin, setMargin] = useState(100000);

  const [status, setStatus] = useState<Status>("empty");
  const [result, setResult] = useState<WizardResult | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [errorCause, setErrorCause] = useState<string | null>(null);
  const [errorRecovery, setErrorRecovery] = useState<string | null>(null);
  // HTTP status of the last failed check: 401 → login nudge (no retry
  // button; AuthCard above handles login), anything else → retry row.
  // Form values are never cleared in either case.
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [lastTried, setLastTried] = useState<number | null>(null);
  const [slow, setSlow] = useState(false);

  // 15 s "taking longer" notice while loading (C10).
  useEffect(() => {
    if (status !== "loading") return;
    const t = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(t);
  }, [status]);

  const locValid = locationText.trim().length > 0;
  const marginValid =
    Number.isFinite(margin) && margin >= MARGIN_MIN && margin <= MARGIN_MAX;
  const canCheck = category !== null && locValid;
  const dprReady = result !== null && canRequestDpr;

  const progressStep: 1 | 2 | 3 | 4 =
    result !== null ? 4 : !category ? 1 : !locValid ? 2 : 3;

  async function runCheck() {
    if (!canCheck) return;
    if (!marginValid) {
      // Client pre-guard — no fetch.
      setInlineError(
        `MARGIN_OUT_OF_RANGE: margin must be between ₹${MARGIN_MIN.toLocaleString("en-IN")} and ₹${MARGIN_MAX.toLocaleString("en-IN")}.`,
      );
      return;
    }
    setInlineError(null);
    setErrorCause(null);
    setErrorRecovery(null);
    setErrorStatus(null);
    setSlow(false);
    setLastTried(Date.now());
    setStatus("loading");
    try {
      const business_category = bizToCategory(category as BizValue);
      const feas = await SaarthiApi.feasibilityScore({
        ...(locValid ? { location_text: locationText.trim() } : {}),
        ...(lat !== null && lon !== null ? { lat, lon } : {}),
        business_category,
      });
      const scheme = await SaarthiApi.schemeCalculate({
        margin,
        business_category,
      });
      const next = { feas, scheme };
      setResult(next);
      setStatus("populated");
      onFeasibility?.(feas, scheme);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        // Inline error — keep previous state, never wipe the form.
        setInlineError(err.detail);
        setStatus(result !== null ? "populated" : "empty");
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        setErrorStatus(401);
        setErrorCause("You need to log in to check feasibility.");
        setErrorRecovery(
          "Log in with the card above — your business, location and margin are kept.",
        );
      } else if (err instanceof ApiError && err.status === 502) {
        setErrorStatus(502);
        setErrorCause(
          `Location lookup failed (geo service error 502): ${err.detail}`,
        );
        setErrorRecovery(
          "Check the block spelling and retry — your entries are kept.",
        );
      } else if (err instanceof ApiError) {
        setErrorStatus(err.status);
        setErrorCause(
          err.status === 0
            ? `Network error: ${err.detail}`
            : `Request failed (${err.status}): ${err.detail}`,
        );
        setErrorRecovery("Check your connection and retry — your entries are kept.");
      } else {
        setErrorStatus(null);
        setErrorCause(err instanceof Error ? err.message : "Something went wrong.");
        setErrorRecovery("Retry — your entries are kept.");
      }
      setStatus("error");
    }
  }

  return (
    <div className="wizard-stack">
      <style>{`
        .skel {
          border-radius: 8px;
          background: linear-gradient(90deg, var(--border) 25%, var(--surface) 50%, var(--border) 75%);
          background-size: 200% 100%;
          animation: skel-shimmer 1.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) { .skel { animation: none; } }
        @keyframes skel-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <ProgressBar step={progressStep} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runCheck();
        }}
        style={{ display: "grid", gap: "20px", margin: 0 }}
      >
        <section aria-label="Business type">
          <h2 style={{ margin: "0 0 8px" }}>What business?</h2>
          <BusinessGrid value={category} onChange={setCategory} />
        </section>

        <section aria-label="Location">
          <h2 style={{ margin: "0 0 8px" }}>Where?</h2>
          <LocationStep
            locationText={locationText}
            onLocationText={setLocationText}
            lat={lat}
            lon={lon}
            onCoords={(la, lo) => {
              setLat(la);
              setLon(lo);
            }}
          />
        </section>

        <section aria-label="Margin">
          <MarginStep margin={margin} onMargin={setMargin} />
        </section>

        <AuthCard />

        {inlineError && (
          <p id="formErr" role="alert" style={{ color: "var(--danger)", margin: 0 }}>
            {inlineError}
          </p>
        )}

        <div id="ctaBar" className="cta-bar">
          <div
            style={{
              display: "grid",
              gap: "12px",
              maxWidth: "1120px",
              margin: "0 auto",
              padding: "12px 20px",
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              id="checkBtn"
              type="submit"
              disabled={!canCheck || status === "loading"}
              style={{
                minHeight: "52px",
                height: "52px",
                width: "100%",
                borderRadius: "12px",
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: canCheck && status !== "loading" ? "pointer" : "not-allowed",
                opacity: canCheck && status !== "loading" ? 1 : 0.55,
              }}
            >
              {status === "loading" ? "Checking…" : "Check feasibility"}
            </button>
            <button
              id="dprBtn"
              type="button"
              disabled={!dprReady}
              onClick={onRequestDpr}
              style={{
                minHeight: "44px",
                width: "100%",
                borderRadius: "12px",
                border: "1px solid var(--accent)",
                background: "transparent",
                color: "var(--accent)",
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: dprReady ? "pointer" : "not-allowed",
                opacity: dprReady ? 1 : 0.55,
              }}
            >
              Get bank paper
            </button>
          </div>
        </div>
      </form>

      <div aria-live="polite">
        {status === "empty" && (
          <div
            id="stEmpty"
            style={{
              border: "2px dashed var(--border)",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Pick a business and a block, then tap “Check feasibility” to see
            your result here.
          </div>
        )}

        {status === "loading" && (
          <div id="stLoad" aria-busy="true">
            <div className="skel" style={{ height: "96px", marginBottom: "12px" }} />
            <div className="skel" style={{ height: "20px", marginBottom: "8px" }} />
            <div className="skel" style={{ height: "20px", width: "70%" }} />
            <p role="status" className="num" style={{ color: "var(--muted)" }}>
              Checking feasibility…
            </p>
            {slow && (
              <p role="status" style={{ color: "var(--muted)" }}>
                Taking longer than usual — still working. You can wait or retry.
              </p>
            )}
          </div>
        )}

        {status === "error" && (
          <div
            id="stErr"
            role="alert"
            style={{
              border: "1px solid var(--danger)",
              borderRadius: "12px",
              padding: "16px",
              background: "var(--surface)",
            }}
          >
            <p style={{ color: "var(--danger)", fontWeight: 700, margin: "0 0 8px" }}>
              Couldn&apos;t check feasibility.
            </p>
            {errorCause && <p style={{ margin: "0 0 8px" }}>{errorCause}</p>}
            {errorRecovery && (
              <p style={{ color: "var(--muted)", margin: "0 0 12px" }}>
                {errorRecovery}
              </p>
            )}
            {/* 401 → login nudge only (AuthCard above handles login;
                retrying without a token would just 401 again). All other
                failures → graceful retry row. Values are kept either way. */}
            {errorStatus !== 401 && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => void runCheck()}
                style={{
                  minHeight: "44px",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
              {lastTried !== null && (
                <span id="retryMeta" className="num" style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>
                  Last tried {new Date(lastTried).toLocaleTimeString()}
                </span>
              )}
            </div>
            )}
          </div>
        )}

        {status === "populated" && result !== null && (
          <div id="stPop">{children?.(result)}</div>
        )}
      </div>
    </div>
  );
}
