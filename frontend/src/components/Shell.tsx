import {
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  ScrollText,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
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

  const go = (name: ShellRouteName) => navigateTo({ name });

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <a href="#shell-content" className="skip-link">Skip to content</a>

      <header className="sticky top-0 z-50 border-b border-outline-variant/60 bg-surface-container-lowest/95 backdrop-blur-md">
        <div className={`flex min-h-16 w-full items-center gap-4 px-4 py-2 sm:px-6 lg:px-10 ${isLanding ? 'justify-between' : 'justify-between'}`}>
          <button
            type="button"
            onClick={() => go('overview')}
            className="flex min-h-11 min-w-11 items-center gap-2 rounded-xl px-1 text-left"
            aria-label="UdyogSaarthi overview"
          >
            <BrandLogo mobileCompact />
          </button>
          {isLanding && <nav aria-label="Primary" className="order-2 flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto">
            {visibleItems.map((item) => {
              const isActive = item.name === active;
              return <button key={item.name} type="button" onClick={() => go(item.name)} aria-current={isActive ? 'page' : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}><span>{item.label}</span></button>;
            })}
          </nav>}
          <div className="order-3 flex min-h-11 items-center gap-2">
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
        {!isLanding && <nav aria-label="Primary" className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col gap-1 overflow-y-auto px-4 py-6 md:flex">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.name === active;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => go(item.name)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${isActive ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                <Icon size={19} aria-hidden="true" className="shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>}

        <main id="shell-content" className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-16 lg:px-10">
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
