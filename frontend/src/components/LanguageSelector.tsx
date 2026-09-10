import { BHASHINI_LANGUAGES } from '../lib/bhashini-languages';
import { useLanguage } from '../lib/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'landing' | 'wizard';
  className?: string;
}

/** Native selection supports keyboard navigation and mobile language pickers. */
export default function LanguageSelector({ variant = 'landing', className = '' }: LanguageSelectorProps) {
  const { lang, setLang } = useLanguage();
  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={(event) => setLang(event.target.value)}
      className={`max-w-full rounded-full border border-outline-variant px-3 py-2 font-dm text-sm leading-relaxed text-primary ${variant === 'landing' ? 'bg-olive-50' : 'bg-white'} ${className}`}
    >
      {BHASHINI_LANGUAGES.map(({ code, label, nativeLabel }) => (
        <option key={code} value={code} lang={code}>{nativeLabel} · {label}</option>
      ))}
    </select>
  );
}
