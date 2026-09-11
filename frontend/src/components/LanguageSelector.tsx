import { LoaderCircle } from 'lucide-react';
import { BHASHINI_LANGUAGES } from '../lib/bhashini-languages';
import { useLanguage } from '../lib/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'landing' | 'wizard';
  className?: string;
}

/** Native selection supports keyboard navigation and mobile language pickers. */
export default function LanguageSelector({ variant = 'landing', className = '' }: LanguageSelectorProps) {
  const { lang, setLang, languages, status, retry } = useLanguage();
  return (
    <div className="language-control">
    <select
      aria-label="Language"
      value={lang}
      onChange={(event) => setLang(event.target.value)}
      className={`max-w-full rounded-full border border-outline-variant px-3 py-2 font-dm text-sm leading-relaxed text-primary ${variant === 'landing' ? 'bg-olive-50' : 'bg-white'} ${className}`}
    >
      {languages.map((code) => {
        const language = BHASHINI_LANGUAGES.find((item) => item.code === code);
        return <option key={code} value={code} lang={code}>{language?.nativeLabel ?? code}</option>;
      })}
    </select>
    <span role="status" className="language-status">
      {status === 'loading' && <LoaderCircle size={15} className="animate-spin text-secondary" aria-label="Loading languages" />}
      {(status === 'error' || status === 'unavailable') && <button type="button" onClick={retry} className="sr-only" aria-label="Language service unavailable. Retry">Language service unavailable. Retry</button>}
    </span>
    </div>
  );
}
