import { describe, expect, it } from 'vitest';
import { MAX_IDENTITY_FILE_SIZE, validateApplicantName, validateIdentityFile } from './identity-documents';

function file(type: string, size: number): File {
  return { type, size } as File;
}

describe('applicant and identity validation', () => {
  it('accepts Indian-language names and rejects empty or malformed values', () => {
    expect(validateApplicantName('Asha Patil')).toBeNull();
    expect(validateApplicantName('आशा पाटील')).toBeNull();
    expect(validateApplicantName('')).toMatch(/required/i);
    expect(validateApplicantName('A')).toMatch(/2 characters/i);
    expect(validateApplicantName('Asha  Patil')).toMatch(/repeated/i);
    expect(validateApplicantName('Asha 123')).toMatch(/letters/i);
  });

  it('accepts supported documents within 5 MB', () => {
    expect(validateIdentityFile(file('application/pdf', 1024))).toBeNull();
    expect(validateIdentityFile(file('image/jpeg', 1024))).toBeNull();
    expect(validateIdentityFile(file('text/plain', 1024))).toMatch(/PDF, JPG, or PNG/i);
    expect(validateIdentityFile(file('application/pdf', MAX_IDENTITY_FILE_SIZE + 1))).toMatch(/5 MB/i);
    expect(validateIdentityFile(file('application/pdf', 0))).toMatch(/empty/i);
  });
});
