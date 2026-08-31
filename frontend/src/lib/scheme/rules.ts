/**
 * Scheme rules — versioned deterministic source of truth.
 * Never use LLM for arithmetic; import from here + math.ts exclusively.
 * Spec §2 / systemDesign §0 semantics.
 */
export type SchemeTier = "micro" | "term";

export interface TierRule {
  /** Max loan cap for the tier (₹) — applied as min(TPC*0.90, cap) */
  cap: number;
  /** Annual interest rate (decimal) */
  rate: number;
  /** Tenure in years */
  tenureY: number;
  /** Moratorium in months */
  moratoriumM: number;
  /** Human-readable label for UI */
  label: string;
}

export interface QuarterlyObligation {
  /** 1-indexed quarter number (1..tenureY*4) */
  quarter: number;
  /** Principal component for this quarter (₹, 2dp) */
  principal: number;
  /** Interest component for this quarter (₹, 2dp) */
  interest: number;
  /** Remaining balance after this quarter (₹, 2dp) */
  balance: number;
  /** ISO date string for due date (YYYY-MM-DD) */
  dueDate: string;
  /** Total instalment for this quarter (principal + interest) */
  total: number;
  /** True if this quarter is within moratorium */
  isMoratorium: boolean;
}

export const schemeRules = {
  micro: {
    cap: 125000,
    rate: 0.065,
    tenureY: 3,
    moratoriumM: 3,
    label: "Micro (≤₹1.40L)",
  } as TierRule,
  term: {
    cap: 4500000,
    rate: 0.08,
    tenureY: 7,
    moratoriumM: 6,
    label: "Term (₹1.40L–₹50L)",
  } as TierRule,
  /** Threshold TPC that separates micro vs term (₹) */
  tpcThreshold: 140000,
  /** Margin share (10%) — TPC = margin / 0.10 */
  marginShare: 0.10,
  /** Loan share (90%) before cap */
  loanShare: 0.90,
  /** Version stamp — shown in provenance footer */
  effectiveFrom: "2024-11-01",
  /** Display version */
  version: "v2024-11",
} as const;

export type SchemeRules = typeof schemeRules;
