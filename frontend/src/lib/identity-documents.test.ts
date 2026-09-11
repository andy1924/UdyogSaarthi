import { describe, expect, it } from 'vitest';
import { validateApplicantName } from './identity-documents';

describe('applicant and identity validation', () => {
  it('accepts Indian-language names and rejects empty or malformed values', () => {
    expect(validateApplicantName('Asha Patil')).toBeNull();
    expect(validateApplicantName('आशा पाटील')).toBeNull();
    expect(validateApplicantName('')).toMatch(/required/i);
    expect(validateApplicantName('A')).toMatch(/2 characters/i);
    expect(validateApplicantName('Asha  Patil')).toMatch(/repeated/i);
    expect(validateApplicantName('Asha 123')).toMatch(/letters/i);
  });
});
