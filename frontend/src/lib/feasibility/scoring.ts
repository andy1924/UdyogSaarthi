/**
 * Feasibility scoring — pure, deterministic.
 * Zero LLM arithmetic. Tested via verdict thresholds.
 */

/**
 * Linear density score 0..100 clamped.
 * Formula: per-thousand density scaled to 0-100.
 * score = clamp( (poiCount / (population / 2000)) * 10 )
 * - population normalized to 2000-person units (typical shop catchment)
 * - *10 scales typical 0-10 per-thousand into 0-100
 * - fallback when population <=0 uses poiCount*2.2 clamp.
 */
export function densityScore(poiCount: number, population: number): number {
  if (!Number.isFinite(poiCount) || poiCount < 0) poiCount = 0;
  if (!Number.isFinite(population) || population <= 0) {
    // fallback: linear on count alone, 45 shops => ~99
    return Math.max(0, Math.min(100, Math.round(poiCount * 2.2)));
  }
  const perUnit = poiCount / (population / 2000);
  const raw = perUnit * 10;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export type Verdict = "saturated" | "viable" | "niche-gap";

/**
 * Verdict from density score:
 *  >70 saturated, <30 niche-gap, else viable
 */
export function verdict(score: number): Verdict {
  if (!Number.isFinite(score)) return "viable";
  if (score > 70) return "saturated";
  if (score < 30) return "niche-gap";
  return "viable";
}
