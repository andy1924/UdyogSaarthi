/**
 * Deterministic scheme math — pure, Decimal-safe (number + paise rounding).
 * Zero LLM arithmetic: import and use exclusively from this module.
 */
import { schemeRules, type SchemeTier, type QuarterlyObligation } from "./rules";

/** Round to paise (2dp) */
function toPaise(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Add months to a date and format as YYYY-MM-DD (local date, no TZ drift) */
function addMonthsISO(base: Date, monthsToAdd: number): string {
  const d = new Date(base.getFullYear(), base.getMonth() + monthsToAdd, 1);
  // Preserve day as 1st to avoid month-length drift; EQI is quarter-boundary
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Total Project Cost from margin money.
 * TPC = margin / 0.10  (margin is 10%)
 */
export function computeTPC(margin: number): number {
  if (!Number.isFinite(margin) || margin < 0) return 0;
  return toPaise(margin / schemeRules.marginShare);
}

/**
 * Route to scheme tier by TPC.
 * micro when TPC ≤ 140000, else term.
 */
export function routeScheme(tpc: number): SchemeTier {
  return tpc <= schemeRules.tpcThreshold ? "micro" : "term";
}

/**
 * Max loan for a given TPC — capped to tier cap.
 * Formula: min(TPC * 0.90, capForTier)
 */
export function maxLoan(tpc: number): number {
  if (!Number.isFinite(tpc) || tpc <= 0) return 0;
  const tier = routeScheme(tpc);
  const cap =
    tier === "micro" ? schemeRules.micro.cap : schemeRules.term.cap;
  const raw = tpc * schemeRules.loanShare;
  return toPaise(Math.min(raw, cap));
}

/**
 * Tier-aware max loan (explicit tier, useful for display).
 */
export function maxLoanForTier(tpc: number, tier: SchemeTier): number {
  if (!Number.isFinite(tpc) || tpc <= 0) return 0;
  const cap =
    tier === "micro" ? schemeRules.micro.cap : schemeRules.term.cap;
  return toPaise(Math.min(tpc * schemeRules.loanShare, cap));
}

/**
 * Working capital buffer = 25% of loan.
 * Callout displays 20–30% range; this is the deterministic midpoint.
 */
export function workingCapitalBuffer(loan: number): number {
  if (!Number.isFinite(loan) || loan <= 0) return 0;
  return toPaise(loan * 0.25);
}

/** Range for callout (20% / 30%) */
export function workingCapitalRange(loan: number): { low: number; high: number; mid: number } {
  if (!Number.isFinite(loan) || loan <= 0) return { low: 0, high: 0, mid: 0 };
  return {
    low: toPaise(loan * 0.2),
    high: toPaise(loan * 0.3),
    mid: toPaise(loan * 0.25),
  };
}

/**
 * Generate quarterly obligations (EQI) for a loan.
 *
 * Tenure quarters = tenureY * 4
 * Moratorium quarters = ceil(moratoriumM / 3)
 * Repayment quarters = tenureQ - moratoriumQ
 *
 * Moratorium quarters: interest-only (principal 0), balance unchanged,
 * interest = balance * (annualRate/4). Included as rows so the table
 * is auditable quarter-by-quarter with sticky header.
 *
 * After moratorium: equal quarterly instalments (EMI) using
 * EMI = P*r*(1+r)^n / ((1+r)^n - 1),  r = annual/4, n = repaymentQuarters.
 * Last instalment adjusted so balance goes to 0 exactly (paise handling).
 *
 * @param loan principal sanctioned (₹) — already capped
 * @param rate annual rate decimal (e.g. 0.065)
 * @param tenureY years
 * @param moratoriumM months
 * @param startDate optional base date for dueDate calc; defaults to effectiveFrom
 */
export function generateEQI(
  loan: number,
  rate: number,
  tenureY: number,
  moratoriumM: number,
  startDate?: Date
): QuarterlyObligation[] {
  if (!Number.isFinite(loan) || loan <= 0) return [];
  if (!Number.isFinite(rate) || rate < 0) return [];
  if (!Number.isFinite(tenureY) || tenureY <= 0) return [];
  if (!Number.isFinite(moratoriumM) || moratoriumM < 0) moratoriumM = 0;

  const tenureQ = Math.round(tenureY * 4);
  const moratoriumQ = Math.min(tenureQ, Math.ceil(moratoriumM / 3));
  const n = tenureQ - moratoriumQ;
  if (n <= 0) return [];

  const r = rate / 4;
  const baseDate = startDate ?? new Date(schemeRules.effectiveFrom + "T00:00:00");

  // EMI for repayment phase
  let emi: number;
  if (r === 0) {
    emi = toPaise(loan / n);
  } else {
    const pow = Math.pow(1 + r, n);
    emi = toPaise((loan * r * pow) / (pow - 1));
  }

  const out: QuarterlyObligation[] = [];
  let balance = toPaise(loan);

  for (let q = 1; q <= tenureQ; q++) {
    const isMoratorium = q <= moratoriumQ;
    const dueDate = addMonthsISO(baseDate, q * 3);

    if (isMoratorium) {
      const interest = toPaise(balance * r);
      out.push({
        quarter: q,
        principal: 0,
        interest,
        balance,
        dueDate,
        total: interest,
        isMoratorium: true,
      });
    } else {
      // For last repayment quarter, force balance to 0
      const isLast = q === tenureQ;
      let interest = toPaise(balance * r);
      let principal: number;
      let total: number;

      if (isLast) {
        // Pay off remainder exactly
        principal = toPaise(balance);
        // Recompute interest against opening balance for this quarter
        // total = principal + interest, then balance 0
        total = toPaise(principal + interest);
        balance = 0;
      } else {
        // EMI split
        principal = toPaise(emi - interest);
        // Guard: if EMI < interest (possible at high rate + rounding), floor principal 0
        if (principal < 0) principal = 0;
        // Avoid overpaying balance before last
        if (principal > balance) principal = toPaise(balance);
        total = toPaise(principal + interest);
        balance = toPaise(balance - principal);
        // Prevent negative due to rounding
        if (balance < 0.005) balance = 0;
      }

      out.push({
        quarter: q,
        principal,
        interest,
        balance,
        dueDate,
        total,
        isMoratorium: false,
      });
    }
  }

  return out;
}

/** Convenience: generate EQI directly from TPC margin (uses routing + capped loan). */
export function generateEQIFromMargin(margin: number): {
  tpc: number;
  tier: SchemeTier;
  loan: number;
  rate: number;
  tenureY: number;
  moratoriumM: number;
  schedule: QuarterlyObligation[];
} {
  const tpc = computeTPC(margin);
  const tier = routeScheme(tpc);
  const loan = maxLoan(tpc);
  const rule = tier === "micro" ? schemeRules.micro : schemeRules.term;
  const schedule = generateEQI(loan, rule.rate, rule.tenureY, rule.moratoriumM);
  return { tpc, tier, loan, rate: rule.rate, tenureY: rule.tenureY, moratoriumM: rule.moratoriumM, schedule };
}

// --- Compatibility aliases for Task 2 spec ---
export const maxLoanForTPC = maxLoan;
export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
