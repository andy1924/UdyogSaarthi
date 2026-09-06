/**
 * C19 i18n — hero + CTA + wizard hints live for en/hi/ta/bn;
 * deeper result strings stay EN-stubbed (design-system §11.6).
 *
 * Keys: hero.title, hero.sub, cta.check, steps.*, verdict.*, wizard.*, dpr.*.
 *
 * Persistence: `localStorage 'saarthi-lang'`. `setLang()` also sets
 * `document.documentElement.lang`.
 */

export type Lang = "en" | "hi" | "ta" | "bn";

export const LANGS: Lang[] = ["en", "hi", "ta", "bn"];

/** Languages with a real dictionary. Everything else renders disabled. */
export const ENABLED_LANGS: Lang[] = ["en", "hi", "ta", "bn"];

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

const hi: Dict = {
  "hero.title": "क्या यह मेरे ब्लॉक में चलेगा?",
  "hero.sub": "स्थान, व्यवहार्यता, वित्त, अनुपालन — तीन टैप में जवाब।",
  "cta.check": "व्यवहार्यता जांचें",
  "cta.dpr": "बैंक दस्तावेज़ पाएं",
  "steps.locate": "स्थान",
  "steps.feasibility": "व्यवहार्यता",
  "steps.finance": "वित्त",
  "verdict.viable": "हाँ — आगे बढ़ें",
  "verdict.saturated": "भीड़ है — कोई खास क्षेत्र सोचें",
  "verdict.niche": "खुली जगह — एक खास अवसर",
  "verdict.niche-gap": "खुली जगह — एक खास अवसर",
  "wizard.hint": "वित्त, अनुपालन, साथी और बैंक दस्तावेज़ देखने के लिए जांच चलाएं।",
  "wizard.pending": "व्यवहार्यता जांच यहाँ दिखेगी (विज़ार्ड)।",
  "dpr.hint": "पहले व्यवहार्यता जांच चलाएं — व्यवहार्यता + वित्त सफल होने पर बैंक दस्तावेज़ खुलेगा।",
};

const ta: Dict = {
  "hero.title": "என் வட்டாரத்தில் இது வெற்றி பெறுமா?",
  "hero.sub": "இடம், சாத்தியம், நிதி, இணக்கம் — மூன்று தட்டல்களில் பதில்.",
  "cta.check": "சாத்தியத்தை சரிபார்",
  "cta.dpr": "வங்கி ஆவணம் பெறுக",
  "steps.locate": "இடம்",
  "steps.feasibility": "சாத்தியம்",
  "steps.finance": "நிதி",
  "verdict.viable": "ஆம் — தொடருங்கள்",
  "verdict.saturated": "நெரிசல் — ஒரு சிறப்பு இடத்தை யோசியுங்கள்",
  "verdict.niche": "திறந்த இடம் — ஒரு சிறப்பு வாய்ப்பு",
  "verdict.niche-gap": "திறந்த இடம் — ஒரு சிறப்பு வாய்ப்பு",
  "wizard.hint": "நிதி, இணக்கம், சகாக்கள், வங்கி ஆவணத்தைக் காண சரிபார்ப்பை இயக்கவும்.",
  "wizard.pending": "சாத்தியச் சரிபார்ப்பு இங்கே தோன்றும்.",
  "dpr.hint": "முதலில் சாத்தியச் சரிபார்ப்பை இயக்கவும் — சாத்தியம் + நிதி வெற்றிக்குப் பிறகு வங்கி ஆவணம் திறக்கும்.",
};

const bn: Dict = {
  "hero.title": "আমার ব্লকে কি এটা চলবে?",
  "hero.sub": "অবস্থান, সম্ভাব্যতা, অর্থ, সম্মতি — তিন ট্যাপে উত্তর।",
  "cta.check": "সম্ভাব্যতা যাচাই করুন",
  "cta.dpr": "ব্যাংক কাগজ নিন",
  "steps.locate": "অবস্থান",
  "steps.feasibility": "সম্ভাব্যতা",
  "steps.finance": "অর্থ",
  "verdict.viable": "হ্যাঁ — এগিয়ে যান",
  "verdict.saturated": "ভিড় আছে — একটি বিশেষ ক্ষেত্র ভাবুন",
  "verdict.niche": "খোলা জায়গা — একটি বিশেষ সুযোগ",
  "verdict.niche-gap": "খোলা জায়গা — একটি বিশেষ সুযোগ",
  "wizard.hint": "অর্থ, সম্মতি, সহকর্মী ও ব্যাংক কাগজ দেখতে যাচাই চালান।",
  "wizard.pending": "সম্ভাব্যতা যাচাই এখানে দেখা যাবে।",
  "dpr.hint": "আগে সম্ভাব্যতা যাচাই চালান — সম্ভাব্যতা + অর্থ সফল হলে ব্যাংক কাগজ খুলবে।",
};

const dicts: Partial<Record<Lang, Dict>> = { en, hi, ta, bn };

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

/** Translate `key`; falls back to English, then the key itself. */
export function t(lang: Lang, key: I18nKey): string {
  return dicts[lang]?.[key] ?? en[key] ?? key;
}
