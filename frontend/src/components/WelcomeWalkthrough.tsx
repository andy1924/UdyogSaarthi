import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, FileText, Leaf, MapPin, X } from 'lucide-react';
import { Text } from '../lib/LanguageContext';

const WELCOME_CACHE_KEY = 'udyogsaarthi-welcome-complete-v1';

const STEPS = [
  {
    icon: Leaf,
    eyebrow: 'Welcome to UdyogSaarthi',
    title: 'A clearer way to begin your business.',
    description: 'Tell us where you plan to start and what you have in mind. We will keep each step simple.',
  },
  {
    icon: MapPin,
    eyebrow: 'Local insight',
    title: 'See what demand looks like nearby.',
    description: 'We check the local market, show a practical SWOT analysis, and help you understand the opportunity.',
  },
  {
    icon: FileText,
    eyebrow: 'A plan you can use',
    title: 'Choose funding, verify, and generate your DPR.',
    description: 'Your information stays with your application while you move through a guided, reviewable plan.',
  },
] as const;

interface WelcomeWalkthroughProps {
  onStart: () => void;
}

export default function WelcomeWalkthrough({ onStart }: WelcomeWalkthroughProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const primaryAction = useRef<HTMLButtonElement>(null);
  const current = STEPS[step];
  const Icon = current.icon;

  const complete = () => {
    try { localStorage.setItem(WELCOME_CACHE_KEY, 'true'); } catch { /* Optional local cache. */ }
    setIsOpen(false);
  };

  useEffect(() => {
    try { setIsOpen(localStorage.getItem(WELCOME_CACHE_KEY) !== 'true'); } catch { setIsOpen(true); }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    primaryAction.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') complete();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const advance = () => {
    if (step < STEPS.length - 1) setStep((value) => value + 1);
    else {
      complete();
      onStart();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-primary/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <section className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-secondary-container/70 blur-2xl" aria-hidden="true" />
        <button type="button" onClick={complete} className="absolute right-4 top-4 grid min-h-11 min-w-11 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container" aria-label="Skip welcome walkthrough">
          <X size={20} aria-hidden="true" />
        </button>

        <div className="relative">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-on-secondary shadow-sm">
            <Icon size={24} aria-hidden="true" />
          </div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-secondary"><Text>{current.eyebrow}</Text></p>
          <h2 id="welcome-title" className="mt-2 max-w-md font-playfair text-3xl font-bold leading-tight text-primary sm:text-4xl"><Text>{current.title}</Text></h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-on-surface-variant"><Text>{current.description}</Text></p>

          <ol className="mt-8 flex gap-2" aria-label="Welcome walkthrough progress">
            {STEPS.map((item, index) => <li key={item.title} className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${index === step ? 'w-10 bg-secondary' : 'w-4 bg-outline-variant'}`} aria-current={index === step ? 'step' : undefined}><span className="sr-only">{index + 1}</span></li>)}
          </ol>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={complete} className="min-h-11 rounded-full px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"><Text>Skip for now</Text></button>
            <button ref={primaryAction} type="button" onClick={advance} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container">
              {step === STEPS.length - 1 ? <><Text>Start my plan</Text><Check size={18} aria-hidden="true" /></> : <><Text>Continue</Text><ArrowRight size={18} aria-hidden="true" /></>}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
