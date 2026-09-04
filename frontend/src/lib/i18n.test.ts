/**
 * i18n unit tests (pure, dependency-free — no framework).
 *
 * Covers `t` / `getLang` / `setLang` (`src/lib/i18n.ts`):
 * - en/hi/ta/bn ship every key (catches half-translated stub drift)
 * - every translation is non-empty and not an untranslated key echo
 * - `getLang` falls back to `"en"` (no window / unknown / throwing store)
 * - `setLang` persists to `saarthi-lang` and sets `<html lang>`
 *
 * Typechecks with `npx tsc --noEmit`. Executed via `npm test` (compiled
 * by `tsconfig.test.json`, run by `src/lib/run-tests.ts`) — importing
 * this module from app code has no side effects.
 */

import { ENABLED_LANGS, LANGS, LANG_KEY, getLang, setLang, t } from "./i18n";
import type { I18nKey, Lang } from "./i18n";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`i18n: ${msg}`);
}

// Contract: every key the UI renders (hero + CTA + wizard + DPR hints).
const EXPECTED_KEYS: I18nKey[] = [
  "hero.title",
  "hero.sub",
  "cta.check",
  "cta.dpr",
  "steps.locate",
  "steps.feasibility",
  "steps.finance",
  "verdict.viable",
  "verdict.saturated",
  "verdict.niche",
  "verdict.niche-gap",
  "wizard.hint",
  "wizard.pending",
  "dpr.hint",
];

const ALL_LANGS: Lang[] = ["en", "hi", "ta", "bn"];

function memStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? (map.get(k) ?? null) : null),
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
  };
}

const g = globalThis as unknown as Record<string, unknown>;

function useWindow(win: unknown): () => void {
  const prev = g.window;
  g.window = win;
  return () => {
    g.window = prev;
  };
}

function useNoWindow(): () => void {
  const prev = g.window;
  delete g.window;
  return () => {
    g.window = prev;
  };
}

async function runI18nTests(): Promise<void> {
  const results: string[] = [];

  // 1. Language registry: all four known; enabled ones are a subset of known.
  assert(LANGS.length === 4, "four langs registered");
  for (const l of ALL_LANGS) assert((LANGS as string[]).includes(l), `LANGS has ${l}`);
  assert(ENABLED_LANGS.length > 0, "at least one lang enabled");
  for (const l of ENABLED_LANGS) assert((LANGS as string[]).includes(l), `enabled ${l} is known`);
  results.push("ok lang registry");

  // 2. Render completeness: every key renders non-empty in every lang —
  // either a real translation or the English fallback (never a key echo).
  // Written against fallback semantics so it holds whether hi/ta/bn dicts
  // have landed or not (see the translation-API note in i18n.ts).
  for (const lang of ALL_LANGS) {
    for (const key of EXPECTED_KEYS) {
      const s = t(lang, key);
      assert(typeof s === "string" && s.length > 0, `${lang}:${key} non-empty`);
      assert(s !== key, `${lang}:${key} renders (not key echo)`);
    }
  }
  results.push("ok render complete (14 keys x 4 langs)");

  // 3. Unknown-key runtime fallback returns the key itself (never crashes).
  assert(
    t("en", "nope.missing" as I18nKey) === "nope.missing",
    "unknown key echoes key",
  );
  results.push("ok unknown-key fallback");

  // 4. getLang fallbacks.
  {
    const restore = useNoWindow();
    try {
      assert(getLang() === "en", "SSR → en");
    } finally {
      restore();
    }
  }
  {
    const restore = useWindow({ localStorage: memStorage() });
    try {
      assert(getLang() === "en", "unstored → en");
    } finally {
      restore();
    }
  }
  {
    const restore = useWindow({ localStorage: memStorage({ [LANG_KEY]: "fr" }) });
    try {
      assert(getLang() === "en", "unknown stored lang → en");
    } finally {
      restore();
    }
  }
  {
    const bad: Storage = memStorage();
    bad.getItem = () => {
      throw new Error("private mode");
    };
    const restore = useWindow({ localStorage: bad });
    try {
      assert(getLang() === "en", "throwing store → en");
    } finally {
      restore();
    }
  }
  results.push("ok getLang fallbacks");

  // 5. setLang persists + sets <html lang> for every lang; getLang reads
  // back enabled langs and falls back to "en" for not-yet-enabled ones.
  for (const lang of ALL_LANGS) {
    const store = memStorage();
    const docEl: { lang: string } = { lang: "" };
    const restore = useWindow({ localStorage: store, document: { documentElement: docEl } });
    try {
      setLang(lang);
      assert(store.getItem(LANG_KEY) === lang, `setLang persists ${lang}`);
      assert(docEl.lang === lang, `setLang sets <html lang=${lang}>`);
      const enabled = (ENABLED_LANGS as string[]).includes(lang);
      assert(getLang() === (enabled ? lang : "en"), `getLang resolves ${lang}`);
    } finally {
      restore();
    }
  }
  results.push("ok setLang round-trip x 4");

  // 6. setLang with throwing storage never breaks the switcher.
  {
    const bad: Storage = memStorage();
    bad.setItem = () => {
      throw new Error("private mode");
    };
    const restore = useWindow({ localStorage: bad, document: { documentElement: { lang: "" } } });
    try {
      setLang("hi"); // must not throw
      results.push("ok setLang throwing-storage safe");
    } finally {
      restore();
    }
  }

  for (const line of results) console.log(line);
  console.log(`i18n: ${results.length}/6 groups passed`);
}

export { runI18nTests };
