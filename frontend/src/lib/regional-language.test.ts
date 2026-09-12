import { describe, expect, it } from 'vitest';
import { languageForState } from './regional-language';

describe('languageForState', () => {
  it('recommends Marathi for Maharashtra regardless of casing or surrounding space', () => {
    expect(languageForState(' Maharashtra ')).toBe('mr');
  });

  it('does not make a language recommendation for other or absent states', () => {
    expect(languageForState('Karnataka')).toBeNull();
    expect(languageForState()).toBeNull();
  });
});
