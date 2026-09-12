/** Language suggestions offered after the welcome tour, by resolved state. */
const STATE_LANGUAGE: Record<string, string> = {
  maharashtra: 'mr',
};

export const REGIONAL_LANGUAGE_PROMPT_STORAGE_KEY = 'udyogsaarthi-regional-language-prompt-v1';

export function languageForState(state?: string): string | null {
  const normalized = state?.trim().toLocaleLowerCase('en-IN');
  return normalized ? STATE_LANGUAGE[normalized] ?? null : null;
}
