/**
 * C19 i18n — English-only for now; the switcher stays visible with hi/ta/bn
 * stubbed (disabled) until the translation API lands. Then: add dicts here
 * (or fetch them), flip `ENABLED_LANGS`, and every `t()` call site lights up
 * with zero component changes.
 *
 * Keys: hero.title, hero.sub, cta.check, steps.*, verdict.*, wizard.*, dpr.*.
 *
 * Persistence: `localStorage 'saarthi-lang'`. `setLang()` also sets
 * `document.documentElement.lang`.
 */

export type Lang = "en" | "hi" | "ta" | "bn";

export const LANGS: Lang[] = ["en", "hi", "ta", "bn"];

/** Languages with a real dictionary. Everything else renders disabled. */
export const ENABLED_LANGS: Lang[] = ["en"];

export const LANG_KEY = "saarthi-lang";

const en = {
  "hero.title": "Will it work in my block?",
  "hero.sub": "Locate, feasibility, finance, compliance — three taps to an answer.",
  "cta.check": "Check feasibility",
  "cta.dpr": "Get bank paper",
  "steps.locate": "Locate",
  "steps.feasibility": "Feasibility",
  "steps.finance": "Finance",
  "verdict.viable": "Yes — go for it",
  "verdict.saturated": "Crowded — consider a niche",
  "verdict.niche": "Open space — a niche gap",
  "verdict.niche-gap": "Open space — a niche gap",
  "wizard.hint": "Run the check to see finance, compliance, peers and bank paper here.",
  "wizard.pending": "Feasibility check mounts here (wizard).",
  "dpr.hint": "Run the feasibility check first — bank paper unlocks after feasibility + finance succeed.",
} as const;

export type I18nKey = keyof typeof en;

type Dict = Record<I18nKey, string>;

/* NOTE: hi/ta/bn dictionaries were removed 2026-09-04. Translations
   arrive via a future translation API — re-add as const hi/ta/bn: Dict and
   register in dicts + ENABLED_LANGS when it lands. */


const dicts: Partial<Record<Lang, Dict>> = { en };

/** Read persisted language; `"en"` unless a real dictionary is enabled. */
export function getLang(): Lang {
  try {
    if (typeof window === "undefined") return "en";
    const raw = window.localStorage.getItem(LANG_KEY);
    return raw !== null && (ENABLED_LANGS as string[]).includes(raw)
      ? (raw as Lang)
      : "en";
  } catch {
    return "en";
  }
}

/** Persist language and set `<html lang>` (`en|hi|ta|bn`). */
export function setLang(lang: Lang): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_KEY, lang);
      window.document.documentElement.lang = lang;
    }
  } catch {
    // Private-mode storage must never break the language switch.
  }
}

/** Translate `key`; English-only until the translation API lands. */
export function t(_lang: Lang, key: I18nKey): string {
  return en[key] ?? key;
}
