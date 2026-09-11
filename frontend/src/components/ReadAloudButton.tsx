import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';

/** Small, optional accessibility control for the current page content. */
export default function ReadAloudButton() {
  const { lang } = useLanguage();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const toggle = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const main = document.querySelector('main');
    if (!main) return;
    const utterance = new SpeechSynthesisUtterance(main.textContent?.replace(/\s+/g, ' ').trim());
    utterance.lang = lang === 'en' ? 'en-IN' : lang;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };
  return <button type="button" onClick={toggle} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-outline-variant px-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container" aria-pressed={speaking} aria-label={speaking ? 'Stop reading aloud' : 'Read this page aloud'}>
    {speaking ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}{speaking ? 'Stop reading' : 'Read aloud'}
  </button>;
}
