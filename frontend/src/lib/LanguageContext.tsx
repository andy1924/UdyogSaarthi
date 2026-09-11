import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import { BHASHINI_LANGUAGES, SAARTHI_LANG_STORAGE_KEY } from './bhashini-languages';
import { getTranslations, type UiStrings } from './translations';

const english = getTranslations('en');
const supportedLanguageCodes = BHASHINI_LANGUAGES.map(({ code }) => code);
const chunkForTranslation = (values: string[], limit = 1900) => values.reduce<string[][]>((groups, value) => {
  const current = groups[groups.length - 1];
  if (!current || current.reduce((sum: number, item: string) => sum + item.length, 0) + value.length > limit) groups.push([value]);
  else current.push(value);
  return groups;
}, []);
const translateBatches = async (batches: string[][], lang: string, signal: AbortSignal) => {
  const results: Array<string[] | undefined> = new Array(batches.length);
  let next = 0;
  const worker = async () => {
    while (next < batches.length) {
      const index = next++;
      try {
        results[index] = await api.translateTexts(batches[index], lang, signal);
      } catch (error) {
        // A page can have several batches. Preserve translations from the batches
        // that succeeded instead of discarding the entire language switch.
        if (signal.aborted) throw error;
      }
    }
  };
  // A small pool improves perceived speed without overwhelming the provider.
  await Promise.all(Array.from({ length: Math.min(3, batches.length) }, worker));
  return results;
};
interface LanguageValue {
  lang: string;
  setLang: (value: string) => void;
  t: (key: keyof UiStrings) => string;
  translate: (source: string) => string;
  register: (source: string) => void;
  languages: string[];
  status: 'loading' | 'ready' | 'error' | 'unavailable';
  retry: () => void;
}
const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLanguage] = useState('en');
  // The selector must remain useful while the service is starting or briefly
  // unavailable. Provider discovery controls service status, not the menu.
  const [languages] = useState(supportedLanguageCodes);
  const [status, setStatus] = useState<LanguageValue['status']>('loading');
  const [sources, setSources] = useState(() => new Set(Object.values(english)));
  const [dictionary, setDictionary] = useState<Record<string, Record<string, string>>>({});
  const [attempt, setAttempt] = useState(0);
  const [discovery, setDiscovery] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.translationLanguages().then((result) => {
      if (cancelled) return;
      setStatus(result.available ? 'ready' : 'unavailable');
      try {
        const saved = localStorage.getItem(SAARTHI_LANG_STORAGE_KEY);
        if (saved && supportedLanguageCodes.includes(saved)) setLanguage(saved);
      } catch { /* Language choice remains available without browser storage. */ }
    }).catch(() => { if (!cancelled) setStatus('unavailable'); });
    return () => { cancelled = true; };
  }, [discovery]);

  const register = useCallback((source: string) => {
    setSources((previous) => previous.has(source) ? previous : new Set([...previous, source]));
  }, []);

  useEffect(() => {
    if (lang === 'en') return;
    const missing = [...sources].filter((source) => !dictionary[lang]?.[source]);
    if (!missing.length) { setStatus('ready'); return; }
    const controller = new AbortController();
    // Debounce registrations when a new step mounts; translate only UI copy.
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const translated: Record<string, string> = {};
        const batches = chunkForTranslation(missing);
        const batchResults = await translateBatches(batches, lang, controller.signal);
        let completedBatches = 0;
        batches.forEach((batch, batchIndex) => {
          const values = batchResults[batchIndex];
          if (!values) return;
          completedBatches += 1;
          batch.forEach((source, index) => { translated[source] = values[index]; });
        });
        if (!controller.signal.aborted) {
          setDictionary((previous) => ({ ...previous, [lang]: { ...previous[lang], ...translated } }));
          setStatus(completedBatches ? 'ready' : 'error');
        }
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    }, 80);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [lang, sources, attempt, dictionary]);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' || !dictionary[lang] ? 'en' : lang;
    document.documentElement.dir = ['ur', 'ks', 'sd'].includes(document.documentElement.lang) ? 'rtl' : 'ltr';
  }, [lang, dictionary]);

  const setLang = useCallback((next: string) => {
    if (!languages.includes(next)) return;
    setLanguage(next);
    setStatus(next === 'en' ? 'ready' : 'loading');
    try { localStorage.setItem(SAARTHI_LANG_STORAGE_KEY, next); } catch { /* Optional persistence. */ }
  }, [languages]);
  const translate = useCallback((source: string) => dictionary[lang]?.[source] ?? source, [dictionary, lang]);
  const value = useMemo(() => ({
    lang, setLang, translate, register, languages, status,
    t: (key: keyof UiStrings) => translate(english[key]),
    retry: () => status === 'unavailable' ? setDiscovery((v) => v + 1) : setAttempt((v) => v + 1),
  }), [lang, setLang, translate, register, languages, status]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is required');
  return context;
}

/** Translate explicit public UI text, never arbitrary DOM or user-entered data. */
export function Text({ children }: { children: string }) {
  const { translate, register, lang } = useLanguage();
  useEffect(() => register(children), [children, register]);
  const result = translate(children);
  return <span lang={result === children ? 'en' : lang}>{result}</span>;
}
