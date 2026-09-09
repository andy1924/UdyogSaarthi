import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  BHASHINI_LANGUAGES,
  DEFAULT_LANGUAGE_CODE,
  SAARTHI_LANG_STORAGE_KEY,
} from '../lib/bhashini-languages';

interface LanguageSelectorProps {
  /** 'landing' matches the Navbar olive-50 pill; 'wizard' matches the FeasibilityCheck header tokens. */
  variant?: 'landing' | 'wizard';
  className?: string;
}

function readStoredLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE_CODE;
  try {
    const stored = window.localStorage.getItem(SAARTHI_LANG_STORAGE_KEY);
    if (stored && BHASHINI_LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch {
    // localStorage unavailable (private mode) — fall through to default.
  }
  return DEFAULT_LANGUAGE_CODE;
}

/** Short pill tag: EN for English, first two chars of the autonym otherwise (e.g. हिं-style). */
function shortTag(code: string, nativeLabel: string): string {
  if (code === 'en') return 'EN';
  return nativeLabel.slice(0, 2);
}

const BUTTON_STYLES: Record<NonNullable<LanguageSelectorProps['variant']>, string> = {
  landing:
    'flex items-center gap-1 bg-olive-50 rounded-full px-4 lg:px-5 py-2.5 font-dm font-bold text-sm text-black tracking-tight hover:bg-olive-50/80 transition-colors',
  wizard:
    'flex items-center gap-1 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 font-label-ui text-label-ui text-on-surface hover:bg-surface-container transition-colors',
};

export default function LanguageSelector({ variant = 'landing', className = '' }: LanguageSelectorProps) {
  const [code, setCode] = useState<string>(DEFAULT_LANGUAGE_CODE);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCode(readStoredLanguage());
  }, []);

  // Keep selectors on different pages in sync (same tab via event, other tabs via storage).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SAARTHI_LANG_STORAGE_KEY && e.newValue) setCode(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Backdrop-click / Escape to close.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open ]);

  const current = BHASHINI_LANGUAGES.find((l) => l.code === code) ?? BHASHINI_LANGUAGES[0];

  const select = (next: string) => {
    setCode(next);
    try {
      window.localStorage.setItem(SAARTHI_LANG_STORAGE_KEY, next);
    } catch {
      // Ignore persistence failures — selection still applies for this session.
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Select language, current: ${current.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`${current.label} (${current.nativeLabel})`}
        className={BUTTON_STYLES[variant]}
      >
        <span aria-hidden="true">{shortTag(current.code, current.nativeLabel)}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Languages"
          className="absolute right-0 top-full z-50 mt-2 max-h-64 min-w-44 overflow-y-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg"
        >
          {BHASHINI_LANGUAGES.map((lang) => {
            const selected = lang.code === code;
            return (
              <li key={lang.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => select(lang.code)}
                  aria-label={`Use ${lang.label}`}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-olive-50/60 ${
                    selected ? 'font-bold text-black' : 'text-black/80'
                  }`}
                >
                  <span>
                    {lang.label} <span className="text-black/60">· {lang.nativeLabel}</span>
                  </span>
                  {selected && <Check size={16} aria-hidden="true" className="shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
