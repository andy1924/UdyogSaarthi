import { Text, useLanguage } from '../lib/LanguageContext';
import BotanicalAccent from './BotanicalAccent';

export default function HowItWorks() {
  const { t } = useLanguage();

  const STEPS = [
    {
      number: t('step01Number'),
      title: t('step01Title'),
      description: t('step01Desc'),
    },
    {
      number: t('step02Number'),
      title: t('step02Title'),
      description: t('step02Desc'),
    },
    {
      number: t('step03Number'),
      title: t('step03Title'),
      description: t('step03Desc'),
    },
  ];

  return (
    <section id="how-to" className="relative isolate overflow-hidden px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
      <BotanicalAccent variant="bloom" className="bottom-0 rotate-6 opacity-20" />
      <div className="relative z-10 mx-auto max-w-[1320px]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"><Text>A simple path forward</Text></p>
      <h2 className="mb-8 mt-3 max-w-xl font-crimson text-4xl font-semibold leading-tight text-primary sm:mb-12 sm:text-5xl">
        {t('howTitle')}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {STEPS.map((step) => (
          <article key={step.number} className="group flex h-full flex-col rounded-3xl border border-outline-variant/60 bg-white p-6 shadow-[0_10px_35px_rgb(23_33_13_/_0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgb(23_33_13_/_0.10)] sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary-container font-roboto-mono text-sm font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              {step.number}
            </span>

            <h3 className="mt-8 font-dm text-xl font-bold leading-snug text-primary">
              {step.title}
            </h3>

            <p className="mt-3 font-dm text-base leading-7 text-on-surface-variant">
              {step.description}
            </p>
          </article>
        ))}
      </div>
      </div>
    </section>
  );
}
