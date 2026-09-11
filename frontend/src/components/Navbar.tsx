import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import LanguageSelector from './LanguageSelector';
import BrandLogo from './BrandLogo';
import type { SessionUser } from '../lib/api';

interface NavbarProps {
  onStart: () => void;
  onSignIn: () => void;
  onLogout: () => void;
  user: SessionUser | null;
}

export default function Navbar({ onStart, onSignIn, onLogout, user }: NavbarProps) {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = [
    { label: t('navHowTo'), href: '#how-to' },
    { label: t('navBenefits'), href: '#benefits' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/90 px-4 backdrop-blur-xl sm:px-8 lg:px-14">
      <nav aria-label="Main navigation" className="mx-auto flex min-h-16 max-w-[1320px] items-center justify-between gap-4 py-2">
        <a href="#home" aria-label="UdyogSaarthi home" className="min-w-0 font-dm"><BrandLogo /></a>

        <div className="hidden items-center gap-6 md:flex">
          {items.map((item) => <a key={item.href} href={item.href} className="text-sm font-semibold text-primary transition-colors hover:text-olive-800">{item.label}</a>)}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block"><LanguageSelector /></div>
          {user ? (
            <>
              <span className="hidden max-w-44 truncate text-sm font-semibold text-on-surface-variant xl:block" title={user.email}>{user.full_name || user.email}</span>
              <button type="button" onClick={onLogout} className="hidden rounded-full px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-olive-100 sm:block">Sign out</button>
            </>
          ) : <button type="button" onClick={onSignIn} className="hidden rounded-full px-4 py-2 text-sm font-semibold text-primary hover:bg-olive-100 sm:block">Sign in</button>}
          <button type="button" onClick={onStart} className="hidden rounded-full bg-olive-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-olive-800/90 sm:block">{t('heroGetStarted')}</button>
          <button type="button" onClick={() => setMobileOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full md:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {mobileOpen && <div id="mobile-navigation" className="mx-auto max-w-[1320px] space-y-2 border-t border-black/10 py-3 md:hidden">
        {items.map((item) => <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-3 text-base font-semibold text-primary hover:bg-olive-50">{item.label}</a>)}
        <div className="px-3 py-2"><LanguageSelector /></div>
        {user ? <button type="button" onClick={() => { setMobileOpen(false); onLogout(); }} className="w-full rounded-xl px-3 py-3 text-left font-semibold text-on-surface-variant hover:bg-olive-50">Sign out · {user.full_name || user.email}</button>
          : <button type="button" onClick={() => { setMobileOpen(false); onSignIn(); }} className="w-full rounded-xl px-3 py-3 text-left font-semibold text-primary hover:bg-olive-50">Sign in</button>}
        <button type="button" onClick={() => { setMobileOpen(false); onStart(); }} className="w-full rounded-full bg-olive-800 px-5 py-3 font-semibold text-white">{t('heroGetStarted')}</button>
      </div>}
    </header>
  );
}
