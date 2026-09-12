import { useCallback, useRef, useState } from 'react';
import { Languages, MapPin } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import OfficialBacking from '../components/OfficialBacking';
import Footer from '../components/Footer';
import WelcomeWalkthrough from '../components/WelcomeWalkthrough';
import { useLanguage } from '../lib/LanguageContext';
import { api } from '../lib/api';
import {
  languageForState,
  REGIONAL_LANGUAGE_PROMPT_STORAGE_KEY,
} from '../lib/regional-language';
import { SAARTHI_LANG_STORAGE_KEY } from '../lib/saarthi-languages';

interface OverviewPageProps {
  onApply: () => void;
}

export default function OverviewPage({ onApply }: OverviewPageProps) {
  const { lang, setLang } = useLanguage();
  const [regionalPrompt, setRegionalPrompt] = useState<'idle' | 'locating' | 'suggesting'>('idle');
  const startAfterSuggestion = useRef(false);
  const checkingLocation = useRef(false);

  const markHandled = useCallback(() => {
    try { localStorage.setItem(REGIONAL_LANGUAGE_PROMPT_STORAGE_KEY, 'true'); } catch { /* Optional local cache. */ }
  }, []);

  const finishTour = useCallback(() => {
    setRegionalPrompt('idle');
    checkingLocation.current = false;
    if (!startAfterSuggestion.current) return;
    startAfterSuggestion.current = false;
    onApply();
  }, [onApply]);

  /**
   * The browser asks for location consent only after the user has finished the
   * welcome tour. A coordinate is resolved by our existing same-origin API;
   * no IP-geolocation service or third-party tracking is used.
   */
  const completeWelcome = useCallback((startPlan: boolean) => {
    startAfterSuggestion.current = startPlan;
    if (checkingLocation.current) return;

    let alreadyHandled = false;
    let savedLanguage: string | null = null;
    try {
      alreadyHandled = localStorage.getItem(REGIONAL_LANGUAGE_PROMPT_STORAGE_KEY) === 'true';
      savedLanguage = localStorage.getItem(SAARTHI_LANG_STORAGE_KEY);
    } catch { /* Optional local cache. */ }

    // Do not interrupt an existing language preference, and do not repeat a
    // recommendation the visitor already accepted or dismissed.
    if (alreadyHandled || lang !== 'en' || (savedLanguage && savedLanguage !== 'en')) {
      finishTour();
      return;
    }
    if (typeof window === 'undefined' || !navigator.geolocation || !window.isSecureContext) {
      markHandled();
      finishTour();
      return;
    }

    checkingLocation.current = true;
    setRegionalPrompt('locating');
    const unavailable = () => {
      markHandled();
      finishTour();
    };
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const place = await api.reverseGeocode(position.coords.latitude, position.coords.longitude);
          if (languageForState(place.state) === 'mr') {
            setRegionalPrompt('suggesting');
            checkingLocation.current = false;
            return;
          }
        } catch {
          // A language preference is optional, so a reverse-geocode outage
          // must never block starting a plan.
        }
        unavailable();
      },
      unavailable,
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 86_400_000 },
    );
  }, [finishTour, lang, markHandled]);

  const resolveSuggestion = useCallback((useMarathi: boolean) => {
    if (useMarathi) setLang('mr');
    markHandled();
    finishTour();
  }, [finishTour, markHandled, setLang]);

  return (
    <div className="space-y-0">
      <WelcomeWalkthrough onComplete={completeWelcome} />
      {regionalPrompt === 'locating' && (
        <div className="fixed inset-0 z-[81] grid place-items-center bg-primary/30 p-4 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="w-full max-w-sm rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-2xl">
            <MapPin size={28} className="mx-auto text-secondary" aria-hidden="true" />
            <p className="mt-3 text-base font-semibold text-primary">Checking your local language preference…</p>
          </div>
        </div>
      )}
      {regionalPrompt === 'suggesting' && (
        <div className="fixed inset-0 z-[81] grid place-items-center bg-primary/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="regional-language-title">
          <section className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl sm:p-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary-container text-secondary">
              <Languages size={24} aria-hidden="true" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-secondary">Local language</p>
            <h2 id="regional-language-title" className="mt-2 text-2xl font-bold text-primary">You appear to be in Maharashtra.</h2>
            <p className="mt-3 text-base leading-7 text-on-surface-variant">Would you like to continue in Marathi? You can change this again any time from the language menu.</p>
            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => resolveSuggestion(false)} className="min-h-11 rounded-full px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container">Keep English</button>
              <button type="button" onClick={() => resolveSuggestion(true)} className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-on-primary shadow-sm hover:bg-primary-container">मराठी वापरा</button>
            </div>
          </section>
        </div>
      )}
      <HeroSection onOpenFeasibility={onApply} />
      <HowItWorks />
      <OfficialBacking />
      <Footer />
    </div>
  );
}
