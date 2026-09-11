import { LogOut } from 'lucide-react';
import type { SessionUser } from '../lib/api';
import { Text } from '../lib/LanguageContext';
import LockedSection from '../components/LockedSection';

interface AccountPageProps {
  user: SessionUser | null;
  onSignIn: () => void;
  onLogout: () => void;
}

export default function AccountPage({ user, onSignIn, onLogout }: AccountPageProps) {
  if (!user) {
    return (
      <LockedSection
        title="You are signed out"
        message="Sign in to manage your account, or create a new applicant account."
        onSignIn={onSignIn}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section aria-labelledby="account-title">
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Settings</Text></p>
        <h1 id="account-title" className="mt-2 text-2xl font-bold text-primary sm:text-3xl"><Text>Account</Text></h1>
      </section>

      <section aria-label="Account details" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-on-surface-variant"><Text>Email address</Text></dt>
            <dd className="mt-1 break-all font-semibold text-primary">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-on-surface-variant"><Text>Full name</Text></dt>
            <dd className="mt-1 font-semibold text-primary">{user.full_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-on-surface-variant"><Text>Role</Text></dt>
            <dd className="mt-1 font-mono font-semibold text-primary">{user.role}</dd>
          </div>
          <div>
            <dt className="text-sm text-on-surface-variant"><Text>Status</Text></dt>
            <dd className="mt-1 font-semibold text-primary">{user.is_active ? 'Active' : 'Inactive'}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={onLogout}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-on-primary sm:w-auto"
        >
          <LogOut size={18} aria-hidden="true" /><Text>Sign out</Text>
        </button>
      </section>
    </div>
  );
}
