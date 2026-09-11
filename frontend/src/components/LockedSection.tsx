import { Lock } from 'lucide-react';
import { Text } from '../lib/LanguageContext';

interface LockedSectionProps {
  title: string;
  message: string;
  onSignIn: () => void;
}

export default function LockedSection({ title, message, onSignIn }: LockedSectionProps) {
  return (
    <section aria-labelledby="locked-title" className="mx-auto max-w-xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center sm:p-8">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary-container text-secondary">
        <Lock size={22} aria-hidden="true" />
      </span>
      <h2 id="locked-title" className="mt-4 text-xl font-bold text-primary">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant"><Text>{message}</Text></p>
      <button
        type="button"
        onClick={onSignIn}
        className="mt-5 min-h-12 w-full rounded-full bg-primary px-6 font-semibold text-on-primary sm:w-auto"
      >
        <Text>Sign in to continue</Text>
      </button>
    </section>
  );
}
