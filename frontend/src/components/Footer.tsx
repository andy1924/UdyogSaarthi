import { useState } from 'react';
import LegalModal from './legal/LegalModal';
import PrivacyPolicy from './legal/PrivacyPolicy';
import TermsOfService from './legal/TermsOfService';
import CookiePolicy from './legal/CookiePolicy';
import CookieNotice from './legal/CookieNotice';
import { useLanguage } from '../lib/LanguageContext';

type LegalDoc = 'privacy' | 'terms' | 'cookies';

const columnTitle =
  'font-roboto-mono text-xs leading-[1.4] tracking-[0.08em] uppercase text-olive-800';
const columnLink =
  'font-dm font-bold text-base lg:text-lg leading-[1.5] tracking-[-0.025em] text-black/75 hover:text-olive-800 transition-colors text-left';

export default function Footer() {
  const { t } = useLanguage();
  const [activeDoc, setActiveDoc] = useState<LegalDoc | null>(null);

  const openDoc = (doc: LegalDoc) => setActiveDoc(doc);
  const closeDoc = () => setActiveDoc(null);

  const DOC_META: Record<LegalDoc, { title: string; subtitle: string }> = {
    privacy: {
      title: t('footerPrivacy'),
      subtitle: 'DPDP Act 2023-aligned · demo/sandbox notice',
    },
    terms: {
      title: t('footerTerms'),
      subtitle: 'Demo use · indicative outputs · grievance redressal',
    },
    cookies: {
      title: t('footerCookies'),
      subtitle: 'Minimal local storage · no trackers',
    },
  };

  return (
    <>
      <footer className="px-4 sm:px-8 lg:px-14 pt-7 sm:pt-9 lg:pt-11 pb-6 sm:pb-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <div className="flex-1">
            <h3 className="font-crimson text-[19px] sm:text-[24px] lg:text-[29px] leading-[0.9] tracking-[-0.03em] text-black">
              {t('footerBrand')}
            </h3>
            <p className="font-crimson text-[14px] sm:text-[16px] lg:text-[20px] leading-[0.9] tracking-[-0.03em] text-black/75 mt-3">
              {t('footerSubtitle')}
            </p>
            <p className="font-crimson text-base sm:text-lg lg:text-xl leading-[1] tracking-[-0.03em] text-black/95 mt-6 max-w-[420px]">
              {t('footerDesc')}
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 lg:gap-12 lg:pt-2">
            <div className="flex flex-col gap-2.5">
              <h4 className={columnTitle}>{t('footerResources')}</h4>
              <a href="#how-to" className={columnLink}>
                {t('footerHowItWorks')}
              </a>
              <a href="#contact-us" className={columnLink}>
                {t('footerContact')}
              </a>
              <button type="button" onClick={() => openDoc('terms')} className={columnLink}>
                {t('footerGrievance')}
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <h4 className={columnTitle}>{t('footerLegal')}</h4>
              <button type="button" onClick={() => openDoc('privacy')} className={columnLink}>
                {t('footerPrivacy')}
              </button>
              <button type="button" onClick={() => openDoc('terms')} className={columnLink}>
                {t('footerTerms')}
              </button>
              <button type="button" onClick={() => openDoc('cookies')} className={columnLink}>
                {t('footerCookies')}
              </button>
            </div>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-7 sm:mt-9 pt-6 border-t border-black/10 gap-3">
          <p className="font-roboto text-sm lg:text-base leading-[1.33] text-neutral-750">
            {t('footerCopyright')}
          </p>
          <p className="font-roboto-mono text-xs leading-[1.4] tracking-[-0.01em] text-olive-800">
            {t('footerBuiltAs')}
          </p>
        </div>
      </footer>

      <LegalModal
        open={activeDoc !== null}
        title={activeDoc ? DOC_META[activeDoc].title : ''}
        subtitle={activeDoc ? DOC_META[activeDoc].subtitle : undefined}
        onClose={closeDoc}
      >
        {activeDoc === 'privacy' ? <PrivacyPolicy /> : null}
        {activeDoc === 'terms' ? <TermsOfService /> : null}
        {activeDoc === 'cookies' ? <CookiePolicy /> : null}
      </LegalModal>

      <CookieNotice onOpenCookiePolicy={() => openDoc('cookies')} />
    </>
  );
}
