import { describe, expect, it } from 'vitest';
import { FALLBACK_HOLDER, getDisplayHolder, getEligibleSchemes, isValidPan, toggleIdInList } from './identity-step-helpers';

describe('getDisplayHolder', () => {
  it('falls back for blank names', () => {
    expect(getDisplayHolder('   ')).toBe(FALLBACK_HOLDER);
  });

  it('keeps the trimmed holder name', () => {
    expect(getDisplayHolder('  Ravi Kumar ')).toBe('Ravi Kumar');
  });
});

describe('isValidPan', () => {
  it('accepts the mock PAN format', () => {
    expect(isValidPan('ABCDE1234F')).toBe(true);
    expect(isValidPan('abcde1234f')).toBe(false);
    expect(isValidPan('ABCD1234F')).toBe(false);
    expect(isValidPan('')).toBe(false);
  });
});

describe('getEligibleSchemes', () => {
  it('matches the tier tables', () => {
    expect(getEligibleSchemes('low')).toEqual(['PMEGP subsidy-linked loan', 'MUDRA Shishu']);
    expect(getEligibleSchemes('middle')).toEqual(['MUDRA Kishor', 'Standard bank loan']);
    expect(getEligibleSchemes('high')).toEqual(['Standard bank loan']);
  });
});

describe('toggleIdInList', () => {
  it('adds and removes ids without mutating', () => {
    expect(toggleIdInList(['pan'], 'aadhaar')).toEqual(['pan', 'aadhaar']);
    expect(toggleIdInList(['pan', 'aadhaar'], 'pan')).toEqual(['aadhaar']);
  });
});
