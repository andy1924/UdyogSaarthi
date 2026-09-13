export const FALLBACK_HOLDER = 'Asha Patil';

export type IncomeTier = 'low' | 'middle' | 'high';

export function getDisplayHolder(holderName: string): string {
  return holderName.trim() || FALLBACK_HOLDER;
}

export function isValidPan(value: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value);
}

export function getEligibleSchemes(incomeTier: IncomeTier): string[] {
  if (incomeTier === 'low') return ['PMEGP subsidy-linked loan', 'MUDRA Shishu'];
  if (incomeTier === 'middle') return ['MUDRA Kishor', 'Standard bank loan'];
  return ['Standard bank loan'];
}

export function toggleIdInList(previous: string[], id: string): string[] {
  return previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id];
}
