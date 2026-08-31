/**
 * next-intl placeholder config.
 * Locales mirror spec §3 + §9 — en default, hi + ta + bn at launch.
 * This file is the single source for locale routing; next.config.ts
 * imports it via the next-intl plugin.
 */

export const locales = ["en", "hi", "ta", "bn"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिंदी",
  ta: "தமிழ்",
  bn: "বাংলা",
};

// next-intl expects a request config; keep it minimal until real messages arrive.
export const i18nConfig = {
  locales: [...locales],
  defaultLocale,
} as const;
