import { useLanguage } from '../lib/LanguageContext';

export default function OfficialBacking() {
  const { t } = useLanguage();

  const STATS = [
    { valueKey: 'stat1Value' as const, labelKey: 'stat1Label' as const },
    { valueKey: 'stat2Value' as const, labelKey: 'stat2Label' as const },
    { valueKey: 'stat3Value' as const, labelKey: 'stat3Label' as const },
    { valueKey: 'stat4Value' as const, labelKey: 'stat4Label' as const },
  ];

  return (
    <section id="benefits" className="px-4 sm:px-8 lg:px-14 pt-7 sm:pt-9 lg:pt-11">
      <div className="text-center">
        <p className="font-crimson text-base sm:text-lg lg:text-xl leading-[1] tracking-[-0.03em] text-black mb-3">
          {t('officialTagline')}
        </p>
        <h2 className="font-crimson text-[24px] sm:text-[24px] lg:text-[31px] leading-[0.9] tracking-[-0.03em] text-black mb-4">
          {t('officialTitle')}
        </h2>
        <p className="font-crimson text-base sm:text-lg lg:text-[11px] leading-[1] tracking-[-0.03em] text-black max-w-3xl mx-auto">
          {t('officialDesc')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mt-8 sm:mt-10">
        {STATS.map(({ valueKey, labelKey }) => (
          <div
            key={valueKey}
            className="border-[3px] sm:border-[5px] border-olive-800 bg-olive-100 rounded-4xl px-5 sm:px-6 py-4 sm:py-5 flex flex-col justify-center"
          >
            <span className="font-crimson text-[14px] sm:text-[16px] lg:text-[20px] leading-[1.05] tracking-[-0.04em] text-black">
              {t(valueKey)}
            </span>
            <span className="font-crimson text-base sm:text-lg lg:text-xl leading-[1] tracking-[-0.03em] text-black mt-1">
              {t(labelKey)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
