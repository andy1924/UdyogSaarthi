import {
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  Menu,
  ScrollText,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { isStaffRole, navigateTo, type ShellRouteName } from '../lib/routes';
import type { SessionUser } from '../lib/api';
import BrandLogo from './BrandLogo';
import LanguageSelector from './LanguageSelector';
import ReadAloudButton from './ReadAloudButton';

interface NavItem {
  name: ShellRouteName;
  label: string;
  icon: LucideIcon;
  staffOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'overview', label: 'Overview', icon: LayoutDashboard },
  { name: 'apply', label: 'Apply', icon: ClipboardList },
  { name: 'applications', label: 'My applications', icon: FolderOpen },
  { name: 'review', label: 'Review', icon: ClipboardCheck, staffOnly: true },
  { name: 'audit', label: 'Audit', icon: ScrollText, staffOnly: true },
  { name: 'account', label: 'Account', icon: User },
];

interface ShellProps {
  active: ShellRouteName;
  user: SessionUser | null;
  onSignIn: () => void;
  onLogout: () => void;
  children: ReactNode;
}

export default function Shell({ active, user, onSignIn, onLogout, children }: ShellProps) {
  const staff = isStaffRole(user?.role);
  const visibleItems = NAV_ITEMS.filter((item) => !item.staffOnly || staff);
  const isLanding = active === 'overview';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const go = (name: ShellRouteName) => { setMenuOpen(false); navigateTo({ name }); };

  // Landing navigation lives in a disclosure menu: close it on route change,
  // Escape, or an outside click.
  useEffect(() => { setMenuOpen(false); }, [active]);
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="app-shell min-h-screen bg-surface text-on-surface">
      <a href="#shell-content" className="skip-link">Skip to content</a>

      <header className="app-header sticky top-0 z-50 border-b border-outline-variant/50 bg-surface-container-lowest/90 backdrop-blur-xl">
        <div className="flex min-h-[4.5rem] w-full items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-1">
            {isLanding && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="grid min-h-11 min-w-11 place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  aria-controls="landing-menu"
                >
                  {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                </button>
                {menuOpen && (
                  <nav id="landing-menu" aria-label="Primary" className="absolute left-0 top-[calc(100%+8px)] z-[60] w-56 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-2 shadow-2xl">
                    {visibleItems.map((item) => {
                      const isActive = item.name === active;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => go(item.name)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'}`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => go('overview')}
              className="flex min-h-11 min-w-11 items-center gap-2 rounded-xl px-1 text-left"
              aria-label="UdyogSaarthi overview"
            >
              <BrandLogo mobileCompact />
            </button>
          </div>
          <div className="flex min-h-11 items-center gap-2">
            <ReadAloudButton />
            <LanguageSelector variant="wizard" />
            {user ? (
              <>
                <span className="hidden max-w-36 truncate text-sm font-semibold text-on-surface-variant xl:block" title={user.email}>
                  {user.full_name || user.email}
                </span>
                <button type="button" onClick={onLogout} className="min-h-11 rounded-full px-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container">
                  Sign out
                </button>
              </>
            ) : (
              <button type="button" onClick={onSignIn} className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary">
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex w-full items-stretch gap-0">
        {!isLanding && <nav aria-label="Primary" className="sticky top-[4.5rem] hidden h-[calc(100vh-4.5rem)] w-64 shrink-0 flex-col gap-1.5 overflow-y-auto border-r border-outline-variant/45 bg-surface-container-lowest/65 px-4 py-6 md:flex">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.name === active;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => go(item.name)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-primary text-on-primary shadow-[0_8px_24px_rgb(23_33_13_/_0.14)]' : 'text-on-surface-variant hover:translate-x-0.5 hover:bg-surface-container hover:text-primary'}`}
              >
                <Icon size={19} aria-hidden="true" className="shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>}

        <main id="shell-content" className={`min-w-0 flex-1 pb-28 md:pb-16 ${isLanding ? '' : 'px-4 pt-8 sm:px-6 lg:px-10 lg:pt-10'}`}>
          {children}
        </main>
      </div>

      {!isLanding && <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/60 bg-surface-container-lowest/98 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ol className="grid auto-cols-fr grid-flow-col gap-0.5 overflow-x-auto px-2 py-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.name === active;
            return (
              <li key={item.name} className="min-w-0">
                <button
                  type="button"
                  onClick={() => go(item.name)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors ${isActive ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}
                >
                  <Icon size={20} aria-hidden="true" className="shrink-0" />
                  <span className="max-w-full truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>}
    </div>
  );
}
