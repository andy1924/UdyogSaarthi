/**
 * C03 language switcher (`#langs .lang[data-lang]`).
 *
 * EN|हिं|த|বাং buttons, 44px+ targets, `aria-pressed` single-select,
 * grid 4-up → 2×2 ≤480px (see i18n.css). Persists via `setLang()`
 * (`localStorage 'saarthi-lang'`) and sets `document.documentElement.lang`.
 * Optional controlled props { value, onChange } so page.tsx can re-render
 * texts via i18n; uncontrolled otherwise (initialises from `getLang()`).
 */

"use client";

import { useState } from "react";
import { ENABLED_LANGS, LANGS, getLang, setLang, type Lang } from "../lib/i18n";

const LABELS: Record<Lang, string> = {
  en: "EN",
  hi: "हिं",
  ta: "த",
  bn: "বাং",
};

const NAMES: Record<Lang, string> = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  bn: "Bengali",
};

export interface LangSwitcherProps {
  value?: Lang;
  onChange?: (lang: Lang) => void;
}

export default function LangSwitcher({ value, onChange }: LangSwitcherProps) {
  const [internal, setInternal] = useState<Lang>(() => getLang());
  const active: Lang = value ?? internal;

  function select(lang: Lang) {
    setLang(lang);
    if (onChange) {
      onChange(lang);
    } else {
      setInternal(lang);
    }
  }

  return (
    <div id="langs" role="group" aria-label="Language">
      {LANGS.map((lang) => {
        const enabled = (ENABLED_LANGS as Lang[]).includes(lang);
        return (
          <button
            key={lang}
            type="button"
            className="lang"
            data-lang={lang}
            aria-pressed={active === lang}
            aria-label={enabled ? NAMES[lang] : `${NAMES[lang]} (coming soon)`}
            title={enabled ? NAMES[lang] : `${NAMES[lang]} — coming soon`}
            disabled={!enabled}
            onClick={() => select(lang)}
          >
            {LABELS[lang]}
          </button>
        );
      })}
    </div>
  );
}
