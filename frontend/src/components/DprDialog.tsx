/**
 * C16 DPR dialog (`#dprDlg`).
 *
 * Props: { feasibility, scheme, open, onClose }.
 * Collects applicant_name + business_name (+ verified self-reported|aa-verified
 * select, capex_opex optional notes), calls `SaarthiApi.dprRender()`.
 * `status: queued` → determinate progress bar polling `SaarthiApi.dprGet(id)`
 * every 3 s, max 10 attempts. `pdf_failed` → actionable retry message.
 * blob (object-URL anchor). Errors: 401 login nudge, 422 missing-data message,
 * 404 unknown id. Announces progress via `pushToast` (see Toasts.tsx).
 *
 * Never computes finance — feasibility/scheme objects pass through untouched.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  SaarthiApi,
  type FeasibilityOut,
  type SchemeCalculateOut,
} from "../lib/api-client";
import { pushToast } from "./Toasts";

export interface DprDialogProps {
  feasibility: FeasibilityOut | null;
  scheme: SchemeCalculateOut | null;
  open: boolean;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 3_000;
const POLL_MAX_ATTEMPTS = 10;

type Phase = "form" | "queued" | "ready";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401)
      return "Please log in first — bank paper needs your account (use the login card).";
    if (err.status === 422)
      return "Missing data — run the feasibility check and finance step first, then retry.";
    if (err.status === 404)
      return "Unknown DPR id — it may have expired. Render again.";
    if (err.status === 0) return err.detail;
    return `Bank paper failed (${err.status}): ${err.detail}`;
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}

export default function DprDialog({ feasibility, scheme, open, onClose }: DprDialogProps) {
  const dlgRef = useRef<HTMLDialogElement | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);
  const objectUrl = useRef<string | null>(null);

  const [applicant, setApplicant] = useState("");
  const [business, setBusiness] = useState("");
  const [verified, setVerified] = useState<"self-reported" | "aa-verified">("self-reported");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [attempt, setAttempt] = useState(0);
  const [dprId, setDprId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Native <dialog> open/close driven by the `open` prop.
  useEffect(() => {
    const dlg = dlgRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      setError(null);
      cancelled.current = false;
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open ]);

  // Cleanup: stop polling + revoke blob URL on unmount.
  useEffect(() => {
    return () => {
      cancelled.current = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
      revokeUrl();
    };
  }, []);

  function stopPolling() {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }

  function revokeUrl() {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }

  function handleNativeClose() {
    cancelled.current = true;
    stopPolling();
    revokeUrl();
    onClose();
  }

  function pollStatus(id: string, count: number) {
    if (cancelled.current) return;
    if (count >= POLL_MAX_ATTEMPTS) {
      setError("Bank paper is taking too long — try the download again in a minute.");
      pushToast("DPR still queued after 10 checks — retry later.");
      return;
    }
    pollTimer.current = setTimeout(async () => {
      if (cancelled.current) return;
      try {
        const rec = await SaarthiApi.dprGet(id);
        if (cancelled.current) return;
        const status = typeof rec.status === "string" ? rec.status : "queued";
        const next = count + 1;
        setAttempt(next);
        // GET /api/dpr/{id} returns the DB record status
        // (generated|verified|archived|pdf_failed), never the render-response
        // "queued"/"ready". generated|verified mean the PDF exists — the
        // download 404 path below keeps polling if the worker is still writing.
        if (status === "ready" || status === "generated" || status === "verified") {
          setPhase("ready");
          pushToast("Bank paper is ready — download it.");
        } else {
          pollStatus(id, next);
        }
      } catch (err) {
        if (cancelled.current) return;
        setError(errorMessage(err));
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleRender() {
    if (!applicant.trim()) {
      setError("Enter the applicant name as it should appear on the paper.");
      return;
    }
    if (!feasibility || !scheme) {
      setError("Missing data — run the feasibility check and finance step first, then retry.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const out = await SaarthiApi.dprRender({
        feasibility,
        scheme,
        applicant_name: applicant.trim(),
        ...(business.trim() ? { business_name: business.trim() } : {}),
        verified,
        ...(notes.trim() ? { capex_opex: { notes: notes.trim() } } : {}),
      });
      if (cancelled.current) return;
      setDprId(out.dpr_id);
      if (out.status === "pdf_failed") {
        setError("Bank paper could not be queued. Please try again shortly.");
        pushToast("Bank paper could not be queued — please retry.");
      } else {
        setPhase("queued");
        setAttempt(0);
        pushToast(`Bank paper queued (${out.dpr_id}) — checking status…`);
        pollStatus(out.dpr_id, 0);
      }
    } catch (err) {
      if (!cancelled.current) setError(errorMessage(err));
    } finally {
      if (!cancelled.current) setBusy(false);
    }
  }

  async function handleDownload() {
    if (!dprId) return;
    setError(null);
    try {
      const blob = await SaarthiApi.dprDownload(dprId);
      revokeUrl();
      objectUrl.current = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl.current;
      a.download = `${dprId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      pushToast("Bank paper download started.");
    } catch (err) {
      if (cancelled.current) return;
      // 404 on download while queued is normal (worker hasn't written the
      // PDF yet) — keep polling instead of surfacing "unknown id".
      if (err instanceof ApiError && err.status === 404) {
        setError("Bank paper still rendering — PDF not ready yet, keep polling.");
        pushToast("Bank paper still rendering — retry download shortly.");
        if (attempt < POLL_MAX_ATTEMPTS) {
          setPhase("queued");
          pollStatus(dprId, attempt);
        }
        return;
      }
      setError(errorMessage(err));
    }
  }

  return (
    <dialog ref={dlgRef} id="dprDlg" aria-labelledby="dprTitle" onClose={handleNativeClose}>
      <h2 id="dprTitle">Bank paper (DPR)</h2>

      {phase === "form" && (
        <>
          <label htmlFor="dprApplicant">Applicant name</label>
          <input
            id="dprApplicant"
            type="text"
            autoComplete="name"
            placeholder="Name on the paper"
            value={applicant}
            onChange={(e) => setApplicant(e.target.value)}
            aria-describedby={error ? "dprErr" : undefined}
          />
          <label htmlFor="dprBusiness">Business name (optional)</label>
          <input
            id="dprBusiness"
            type="text"
            autoComplete="organization"
            placeholder="e.g. Lakshmi Dairy Unit"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
          />
          <label htmlFor="dprVerified">Verification</label>
          <select
            id="dprVerified"
            value={verified}
            onChange={(e) =>
              setVerified(e.target.value === "aa-verified" ? "aa-verified" : "self-reported")
            }
          >
            <option value="self-reported">self-reported</option>
            <option value="aa-verified">aa-verified</option>
          </select>
          <label htmlFor="dprNotes">Capex / opex notes (optional)</label>
          <input
            id="dprNotes"
            type="text"
            placeholder="Draft estimate notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </>
      )}

      {phase === "queued" && (
        <div aria-live="polite">
          <p className="muted">
            Rendering bank paper… check <span className="num">{attempt}</span> of{" "}
            <span className="num">{POLL_MAX_ATTEMPTS}</span>
          </p>
          <progress
            className="dpr-progress"
            value={attempt}
            max={POLL_MAX_ATTEMPTS}
            aria-label="DPR render progress"
          />
          {dprId && (
            <p className="muted">
              DPR id <span className="num">{dprId}</span>
            </p>
          )}
        </div>
      )}

      {phase === "ready" && (
        <div aria-live="polite">
          <p>Your bank paper is ready{dprId ? ` (${dprId})` : ""}.</p>
          <button type="button" className="dpr-primary" onClick={handleDownload}>
            Download PDF
          </button>
        </div>
      )}

      {error && (
        <p id="dprErr" role="alert" className="dpr-error">
          {error}
        </p>
      )}

      <div className="dpr-actions">
        {phase === "form" && (
          <button
            type="button"
            className="dpr-primary"
            onClick={handleRender}
            disabled={busy || !feasibility || !scheme}
          >
            {busy ? "Rendering…" : "Render bank paper"}
          </button>
        )}
        <button type="button" className="dpr-ghost" onClick={() => dlgRef.current?.close()}>
          Close
        </button>
      </div>
    </dialog>
  );
}
