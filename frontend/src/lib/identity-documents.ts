const DATABASE_NAME = 'udyogsaarthi-workflow';

export function validateApplicantName(value: string): string | null {
  const name = value.trim();
  if (!name) return 'Applicant name is required.';
  if (name.length < 2) return 'Enter at least 2 characters.';
  if (name.length > 80) return 'Applicant name must be 80 characters or fewer.';
  if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(name)) return 'Use letters, spaces, apostrophes, full stops, or hyphens only.';
  if (/\s{2,}|[-.'’]{2,}/u.test(name)) return 'Remove repeated spaces or punctuation.';
  return null;
}

/** Remove documents stored by releases that predated DigiLocker-only verification. */
export function clearLegacyIdentityFiles(): Promise<void> {
  if (typeof indexedDB === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}
