/**
 * Deterministic scheme math — shared pure functions.
 * Versioned via scheme_rules semantics; never use LLM for arithmetic.
 * Minimal surface for Task 2; full EQI/moratorium logic expanded in Task 5.
 * Rules verbatim: margin 10%; Micro ≤₹1.40L 6.5% 3y 3mo; Term ₹1.40L–₹50L 8% 7y 6mo.
 */

export type SchemeTier = "micro" | "term";

export interface SchemeRoute {
  tier: SchemeTier;
  label: string;
  rate: number; // annual % (beneficiary rate)
  tenureYears: number;
  moratoriumMonths: number;
  maxLoanCap: number; // cap on loan amount
  maxTpcCap: number; // cap on TPC for tier
}

/** Caps per research §1 / systemDesign §5.2 */
export const MICRO_TPC_CAP = 140_000;
export const MICRO_LOAN_CAP = 125_000;
export const TERM_TPC_CAP = 5_000_000;
export const TERM_LOAN_CAP = 4_500_000;

export const MICRO_RULE: SchemeRoute = {
  tier: "micro",
  label: "Micro Finance",
  rate: 6.5,
  tenureYears: 3,
  moratoriumMonths: 3,
  maxLoanCap: MICRO_LOAN_CAP,
  maxTpcCap: MICRO_TPC_CAP,
};

export const TERM_RULE: SchemeRoute = {
  tier: "term",
  label: "Term Loan",
  rate: 8.0,
  tenureYears: 7,
  moratoriumMonths: 6,
  maxLoanCap: TERM_LOAN_CAP,
  maxTpcCap: TERM_TPC_CAP,
};

// Keep margin at 10% leverage
export const MARGIN_RATIO = 0.10;
export const LOAN_RATIO = 0.90;

/**
 * Pure: TPC = margin / 0.10
 * No rounding tricks — returns rupee value; caller formats.
 */
export function computeTPC(margin: number): number {
  if (!Number.isFinite(margin) || margin <= 0) return 0;
  return Math.round(margin / MARGIN_RATIO);
}

/**
 * Pure: Max loan eligibility = TPC * 0.90, capped per tier.
 * Caps at tier level + hard caps (1.25L / 45L).
 */
export function maxLoanForTPC(tpc: number): number {
  if (!Number.isFinite(tpc) || tpc <= 0) return 0;
  const raw = Math.round(tpc * LOAN_RATIO);
  const route = routeScheme(tpc);
  return Math.min(raw, route.maxLoanCap);
}

/**
 * Route tier by TPC. Micro ≤ 1.40L, otherwise Term.
 * Also clamps: if TPC > 50L, still routes to Term (cap enforced elsewhere).
 */
export function routeScheme(tpc: number): SchemeRoute {
  if (!Number.isFinite(tpc) || tpc <= MICRO_TPC_CAP) return MICRO_RULE;
  return TERM_RULE;
}

/** Convenience: from margin directly */
export function routeSchemeForMargin(margin: number): SchemeRoute {
  return routeScheme(computeTPC(margin));
}

export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatRate(rate: number): string {
  return `${rate.toFixed(1)}% p.a.`;
}
