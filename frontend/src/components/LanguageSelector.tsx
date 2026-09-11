import { Check, ChevronDown, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { BHASHINI_LANGUAGES } from '../lib/bhashini-languages';
import { useLanguage } from '../lib/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'landing' | 'wizard';
  className?: string;
}

/** Custom fluid language picker — replaces the OS-native select dropdown. */
export default function LanguageSelector({ variant = 'landing', className = '' }: LanguageSelectorProps) {
  const { lang, setLang, languages, status, retry } = useLanguage();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const labelFor = (code: string) => BHASHINI_LANGUAGES.find((item) => item.code === code)?.nativeLabel ?? code;
  const optionId = (code: string) => `language-option-${code}`;

  const openMenu = () => {
    setActiveIndex(Math.max(0, languages.indexOf(lang)));
    setOpen(true);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(languages.length - 1, index + 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(0, index - 1)); }
    else if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0); }
    else if (event.key === 'End') { event.preventDefault(); setActiveIndex(languages.length - 1); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setLang(languages[activeIndex]); setOpen(false); }
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Keep the highlighted option visible while arrowing through a long list.
  useEffect(() => {
    if (!open || !languages[activeIndex]) return;
    rootRef.current?.querySelector(`#${optionId(languages[activeIndex])}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, languages]);

  return (
    <div className="language-control" ref={rootRef}>
      <div className="language-dropdown">
        <button
          type="button"
          className={`language-trigger ${variant === 'landing' ? 'bg-olive-50' : 'bg-white'} ${className}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Language: ${labelFor(lang)}`}
          aria-activedescendant={open && languages[activeIndex] ? optionId(languages[activeIndex]) : undefined}
          onClick={() => { if (open) setOpen(false); else openMenu(); }}
          onKeyDown={onKeyDown}
        >
          <span lang={lang} className="truncate">{labelFor(lang)}</span>
          <ChevronDown size={15} aria-hidden="true" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div role="listbox" aria-label="Language" className="language-menu">
            {languages.map((code) => {
              const selected = code === lang;
              return (
                <button
                  key={code}
                  id={optionId(code)}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-active={languages[activeIndex] === code}
                  lang={code}
                  onClick={() => { setLang(code); setOpen(false); }}
                  className="language-option"
                >
                  <span className="truncate">{labelFor(code)}</span>
                  {selected && <Check size={15} aria-hidden="true" className="shrink-0 text-secondary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <span role="status" className="language-status">
        {status === 'loading' && <LoaderCircle size={15} className="animate-spin text-secondary" aria-label="Loading languages" />}
        {(status === 'error' || status === 'unavailable') && <button type="button" onClick={retry} className="sr-only" aria-label="Language service unavailable. Retry">Language service unavailable. Retry</button>}
      </span>
    </div>
  );
}
