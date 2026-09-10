/**
 * LanguageContext — provides the active language code and translation lookup
 * across the entire React tree.
 *
 * Usage:
 *   const { t, lang } = useLanguage();
 *   <span>{t('heroGetStarted')}</span>
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  BHASHINI_LANGUAGES,
  DEFAULT_LANGUAGE_CODE,
  SAARTHI_LANG_STORAGE_KEY,
} from './bhashini-languages';
import { getTranslations, type UiStrings } from './translations';

interface LanguageContextValue {
  lang: string;
  setLang: (code: string) => void;
  t: (key: keyof UiStrings) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANGUAGE_CODE,
  setLang: () => {},
  t: (key) => key as string,
});

function readStoredLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE_CODE;
  try {
    const stored = window.localStorage.getItem(SAARTHI_LANG_STORAGE_KEY);
    if (stored && BHASHINI_LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch {
    // localStorage unavailable — fall through
  }
  return DEFAULT_LANGUAGE_CODE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<string>(DEFAULT_LANGUAGE_CODE);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setLangState(readStoredLanguage());
  }, []);

  // Listen for changes made in other tabs / by the LanguageSelector
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SAARTHI_LANG_STORAGE_KEY && e.newValue) {
        setLangState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLang = (code: string) => {
    setLangState(code);
    try {
      window.localStorage.setItem(SAARTHI_LANG_STORAGE_KEY, code);
      // Dispatch a custom event so LanguageSelector can sync even within same tab
      window.dispatchEvent(new StorageEvent('storage', {
        key: SAARTHI_LANG_STORAGE_KEY,
        newValue: code,
      }));
    } catch {
      // ignore
    }
  };

  const strings = getTranslations(lang);
  const t = (key: keyof UiStrings): string => strings[key] as string;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
