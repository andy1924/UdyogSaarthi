import { useLanguage } from '../lib/LanguageContext';

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
    <section id="how-to" className="px-4 sm:px-8 lg:px-14 pt-7 sm:pt-9 lg:pt-11">
      <h2 className="font-crimson text-[19px] sm:text-[31px] md:text-[29px] lg:text-[46px] leading-[0.9] tracking-[-0.03em] text-black text-center sm:text-left mb-10 sm:mb-14">
        {t('howTitle')}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {STEPS.map((step) => (
          <div key={step.number} className="bg-olive-50 rounded-4xl p-5 sm:p-6 flex flex-col h-full">
            <span className="font-crimson text-[31px] sm:text-[29px] lg:text-[46px] leading-[0.9] tracking-[-0.03em] text-black">
              {step.number}
            </span>

            <div className="w-full h-px bg-black/80 mt-4 mb-4" />

            <h3 className="font-crimson text-[14px] sm:text-[16px] lg:text-[20px] leading-[1.05] tracking-[-0.04em] text-black">
              {step.title}
            </h3>

            <div className="w-full h-px bg-black/80 mt-4 mb-4" />

            <p className="font-crimson text-base sm:text-lg lg:text-xl leading-[1] tracking-[-0.03em] text-black">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
