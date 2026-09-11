import { useState } from 'react';
import LegalModal from './legal/LegalModal';
import PrivacyPolicy from './legal/PrivacyPolicy';
import TermsOfService from './legal/TermsOfService';
import CookiePolicy from './legal/CookiePolicy';
import CookieNotice from './legal/CookieNotice';
import { useLanguage } from '../lib/LanguageContext';
import BotanicalAccent from './BotanicalAccent';
import BrandLogo from './BrandLogo';

type LegalDoc = 'privacy' | 'terms' | 'cookies';

const columnTitle =
  'font-roboto-mono text-xs leading-[1.4] tracking-[0.08em] uppercase text-secondary';
const columnLink =
  'font-dm font-semibold text-base leading-[1.5] tracking-[-0.015em] text-on-surface-variant hover:text-primary transition-colors text-left';

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
      <footer className="relative isolate overflow-hidden border-t border-outline-variant/50 bg-white px-4 pb-8 pt-12 sm:px-8 sm:pb-10 sm:pt-16 lg:px-10">
        <BotanicalAccent side="left" className="bottom-8 rotate-6 opacity-20" />
        <div className="relative z-10 mx-auto flex max-w-[1320px] flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
          <div className="flex-1">
            <BrandLogo />
            <p className="mt-3 font-dm text-sm font-semibold text-secondary">
              {t('footerSubtitle')}
            </p>
            <p className="mt-5 max-w-[440px] font-crimson text-xl leading-snug text-primary sm:text-2xl">
              {t('footerDesc')}
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 lg:gap-12 lg:pt-2">
            <div className="flex flex-col gap-2.5">
              <h4 className={columnTitle}>{t('footerResources')}</h4>
              <a href="#how-to" className={columnLink}>
                {t('footerHowItWorks')}
              </a>
              <a href="#benefits" className={columnLink}>{t('navBenefits')}</a>
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

        <div className="relative z-10 mx-auto mt-10 flex max-w-[1320px] flex-col items-start justify-between gap-3 border-t border-outline-variant/60 pt-6 sm:flex-row sm:items-center">
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
