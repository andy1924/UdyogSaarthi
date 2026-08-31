/**
 * DPR payload + supporting types — contract between preview and render API.
 * Mirrors feasibility + finance engines as pure imported shapes; no LLM math.
 */
import type { LGDCode } from "@/lib/feasibility/lgd";
import type { Verdict } from "@/lib/feasibility/scoring";
import type { QuarterlyObligation, SchemeTier } from "@/lib/scheme/rules";

export type VerifiedFlag = "self-reported" | "aa-verified";

/** Feasibility slice consumed by DPR — dereferenced from Dexie "current" */
export interface FeasibilityReport {
  lgd: LGDCode;
  lat: number;
  lon: number;
  businessType: string;
  poiCount: number;
  score: number;
  verdict: Verdict;
  /** Effective detection radius (m) — ST_DWithin value e.g. 5000 */
  radiusM?: number;
  /** Optional: when detection ran */
  resolvedAt?: string;
}

/** Finance slice — derived deterministically from math.ts (never recomputed in DPR) */
export interface FinanceState {
  marginAmount: number;
  tpc: number;
  tier: SchemeTier;
  loan: number;
  rate: number;
  tenureY: number;
  moratoriumM: number;
  schedule: QuarterlyObligation[];
  ruleVersion: string;
  effectiveFrom: string;
}

/** CAPEX/OPEX — free-form Q&A carried from finance CashflowQA into DPR */
export interface CapexOpex {
  equipment?: string;
  setup?: string;
  monthlyOpex?: string;
  monthlySales?: string;
  // allow raw strings from CashflowAnswers without transform
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
}

/** Top-level payload POSTed to /api/dpr/render (and queued to Dexie dprRequests when offline) */
export interface DPRPayload {
  feasibility: FeasibilityReport;
  finance: FinanceState;
  cashflow: CapexOpex;
  verified: VerifiedFlag;
}

/** Render response contract — polling mock resolves to ready with pdfUrl */
export interface DPRRenderResponse {
  pdfUrl: string;
  status?: "generating" | "ready" | "failed";
  jobId?: string;
}

/** Snapshot carried to DPRMeta footer/badge */
export interface DPRMetaInfo {
  verified: VerifiedFlag;
  ruleVersion: string;
  effectiveFrom: string;
  generatedAt: string;
  lgdCode: string;
}
