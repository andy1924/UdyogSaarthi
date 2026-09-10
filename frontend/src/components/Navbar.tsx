import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import LanguageSelector from './LanguageSelector';

interface NavbarProps { onStart: () => void; }

export default function Navbar({ onStart }: NavbarProps) {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = [
    { label: t('navHowTo'), href: '#how-to' },
    { label: t('navBenefits'), href: '#benefits' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/90 px-4 backdrop-blur-xl sm:px-8 lg:px-14">
      <nav aria-label="Main navigation" className="mx-auto flex min-h-16 max-w-[1320px] items-center justify-between gap-4 py-2">
        <a href="#home" aria-label="UdyogSaarthi home" className="flex min-w-0 items-center gap-3 font-dm font-bold text-primary">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-olive-800 text-sm text-white">US</span>
          <span className="truncate text-base sm:text-lg">UdyogSaarthi</span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {items.map((item) => <a key={item.href} href={item.href} className="text-sm font-semibold text-primary transition-colors hover:text-olive-800">{item.label}</a>)}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block"><LanguageSelector /></div>
          <button type="button" onClick={onStart} className="hidden rounded-full bg-olive-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-olive-800/90 sm:block">{t('heroGetStarted')}</button>
          <button type="button" onClick={() => setMobileOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full md:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {mobileOpen && <div id="mobile-navigation" className="mx-auto max-w-[1320px] space-y-2 border-t border-black/10 py-3 md:hidden">
        {items.map((item) => <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-3 text-base font-semibold text-primary hover:bg-olive-50">{item.label}</a>)}
        <div className="px-3 py-2"><LanguageSelector /></div>
        <button type="button" onClick={() => { setMobileOpen(false); onStart(); }} className="w-full rounded-full bg-olive-800 px-5 py-3 font-semibold text-white">{t('heroGetStarted')}</button>
      </div>}
    </header>
  );
}
