import { Phone } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function PhoneGuidance() {
  const { t } = useLanguage();

  return (
    <section className="mt-9 sm:mt-11 lg:mt-12 mx-4 sm:mx-0">
      <div className="bg-olive-400 rounded-4xl sm:rounded-none w-full py-6 sm:py-7 lg:py-9 px-4 sm:px-8 lg:px-14">
        <h2 className="font-crimson text-[16px] sm:text-[22px] md:text-[29px] lg:text-[36px] leading-[0.9] tracking-[-0.03em] text-white text-center mb-8 sm:mb-10">
          {t('phoneHeading')}
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center max-w-3xl mx-auto">
          <div className="bg-olive-50 rounded-4xl flex flex-col sm:flex-row items-center w-full sm:w-auto">
            <div className="flex items-center gap-4 px-8 sm:px-10 py-6 sm:py-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                <Phone size={32} className="text-black" />
              </div>
              <span className="font-crimson text-[14px] sm:text-[16px] lg:text-[20px] leading-[1.05] tracking-[-0.04em] text-black whitespace-nowrap">
                +91 89831 72377
              </span>
            </div>

            <div className="w-full h-px sm:w-px sm:h-24 bg-black/20 mx-0 sm:mx-0" />

            <div className="flex flex-col items-center sm:items-start px-8 sm:px-10 py-6 sm:py-5">
              <span className="font-crimson text-[14px] sm:text-[16px] lg:text-[20px] leading-[1.05] tracking-[-0.04em] text-black">
                {t('phoneDays')}
              </span>
              <span className="font-crimson text-[14px] sm:text-[16px] lg:text-[20px] leading-[1.05] tracking-[-0.04em] text-black">
                {t('phoneHours')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
