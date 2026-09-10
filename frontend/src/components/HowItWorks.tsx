import { useLanguage } from '../lib/LanguageContext';
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
    <section id="how-to" className="relative isolate overflow-hidden px-4 pt-10 sm:px-8 sm:pt-14 lg:px-14 lg:pt-16">
      <BotanicalAccent variant="bloom" className="bottom-0 rotate-6 opacity-20" />
      <h2 className="relative z-10 mb-6 text-center font-crimson text-3xl leading-tight text-primary sm:mb-10 sm:text-left sm:text-4xl lg:text-[46px]">
        {t('howTitle')}
      </h2>

      <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {STEPS.map((step) => (
          <div key={step.number} className="bg-olive-50 rounded-4xl p-5 sm:p-6 flex flex-col h-full">
            <span className="font-crimson text-[31px] sm:text-[29px] lg:text-[46px] leading-[0.9] tracking-[-0.03em] text-black">
              {step.number}
            </span>

            <h3 className="font-dm text-lg font-bold leading-relaxed text-primary mt-5">
              {step.title}
            </h3>

            <p className="font-dm text-base leading-relaxed text-on-surface-variant mt-3">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
