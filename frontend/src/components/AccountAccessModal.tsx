import { LoaderCircle, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Text } from '../lib/LanguageContext';

interface Props { open: boolean; onClose: () => void; onSuccess: () => void; }

export default function AccountAccessModal({ open, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = useCallback(() => {
    setPassword('');
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = previousOverflow; };
  }, [open, close]);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') await api.registerApplicant({ email: normalizedEmail, password, fullName: normalizedName });
      else await api.login(normalizedEmail, password);
      setPassword('');
      onSuccess();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Account access is unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="account-title" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="relative w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-olive-50"><X size={20} /></button>
        <p className="text-sm font-bold uppercase tracking-widest text-olive-800"><Text>Your workspace</Text></p>
        <h2 id="account-title" className="mt-2 pr-10 font-crimson text-4xl leading-tight text-primary"><Text>{mode === 'signin' ? 'Sign in to continue' : 'Create your account'}</Text></h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant"><Text>Your assessment contains private business and location details.</Text></p>

        <form onSubmit={submit} className="mt-6 space-y-4" aria-busy={loading}>
          {mode === 'register' && <label className="block text-sm font-semibold text-primary"><Text>Full name</Text><input required minLength={2} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-outline-variant px-4 py-3 text-base font-normal outline-none focus:border-olive-800 focus:ring-2 focus:ring-olive-800/20" /></label>}
          <label className="block text-sm font-semibold text-primary"><Text>Email address</Text><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-outline-variant px-4 py-3 text-base font-normal outline-none focus:border-olive-800 focus:ring-2 focus:ring-olive-800/20" /></label>
          <label className="block text-sm font-semibold text-primary"><Text>Password</Text><input required minLength={8} type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-outline-variant px-4 py-3 text-base font-normal outline-none focus:border-olive-800 focus:ring-2 focus:ring-olive-800/20" /><span className="mt-1 block font-normal text-on-surface-variant"><Text>Use at least 8 characters with a letter and number.</Text></span></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-olive-800 px-6 py-3 font-semibold text-white">
            {loading && <LoaderCircle size={19} className="animate-spin" aria-hidden="true" />}<Text>{loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
          </button>
        </form>
        <button type="button" onClick={() => { setMode(mode === 'signin' ? 'register' : 'signin'); setPassword(''); setError(null); }} className="mt-4 w-full text-sm font-semibold text-olive-800 underline underline-offset-4">
          <Text>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</Text>
        </button>
      </div>
    </div>
  );
}
