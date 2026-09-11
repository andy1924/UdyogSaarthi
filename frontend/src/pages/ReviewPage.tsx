import { useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { api, isAuthenticationError, type DprFullRecord, type DprHistory, type SessionUser } from '../lib/api';
import { listMyDprs } from '../lib/my-dprs';
import { formatDateTime } from '../lib/format';
import { Text } from '../lib/LanguageContext';
import LockedSection from '../components/LockedSection';
import { isStaffRole } from '../lib/routes';

interface ReviewPageProps {
  user: SessionUser | null;
  onSignIn: () => void;
}

export default function ReviewPage({ user, onSignIn }: ReviewPageProps) {
  const [dprId, setDprId] = useState('');
  const [record, setRecord] = useState<DprFullRecord | null>(null);
  const [history, setHistory] = useState<DprHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [registry, setRegistry] = useState(() => listMyDprs());

  useEffect(() => { setRegistry(listMyDprs()); }, []);

  if (!user) {
    return (
      <LockedSection
        title="Sign in to review"
        message="Review tools are for DIC officers and SCA auditors. Sign in with a staff account."
        onSignIn={onSignIn}
      />
    );
  }

  if (!isStaffRole(user.role)) {
    return (
      <LockedSection
        title="Staff only"
        message="Review tools are for DIC officers and SCA auditors. Your account does not have review access."
        onSignIn={onSignIn}
      />
    );
  }

  const load = () => {
    const id = dprId.trim();
    if (!id) { setError('Enter a report reference, for example DPR-79FCA9EA.'); return; }
    setLoading(true);
    setError(null);
    Promise.all([api.getDprFull(id), api.getDprHistory(id)])
      .then(([full, hist]) => { setRecord(full); setHistory(hist); })
      .catch((reason: unknown) => {
        setRecord(null);
        setHistory(null);
        if (isAuthenticationError(reason)) setError('Session expired. Sign in again.');
        else if (reason instanceof Error && reason.message.includes('(404)')) setError(`No report found for ${id}.`);
        else setError('Review data is temporarily unavailable.');
      })
      .finally(() => setLoading(false));
  };

  const runTransition = (action: string) => {
    setActing(action);
    setError(null);
    api.transitionDpr(dprId.trim(), action, note)
      .then(() => { setNote(''); load(); })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Transition failed.');
      })
      .finally(() => setActing(null));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section aria-labelledby="review-title">
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Staff</Text></p>
        <h1 id="review-title" className="mt-2 text-2xl font-bold text-primary sm:text-3xl"><Text>Officer review</Text></h1>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant"><Text>Look up any report by reference, inspect its workflow history, and apply the next allowed action.</Text></p>
      </section>

      <form
        onSubmit={(event) => { event.preventDefault(); load(); }}
        className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5"
      >
        <label htmlFor="review-dpr-id" className="block text-sm font-semibold text-primary"><Text>Report reference</Text></label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="review-dpr-id"
            type="text"
            value={dprId}
            onChange={(event) => setDprId(event.target.value)}
            placeholder="DPR-XXXXXXXX"
            autoComplete="off"
            className="min-h-12 flex-1 rounded-xl border border-outline-variant bg-white px-4 font-mono text-sm outline-none focus:border-primary"
          />
          <button type="submit" disabled={loading} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-on-primary disabled:opacity-50">
            {loading ? <RefreshCw size={18} className="animate-spin" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}<Text>Load report</Text>
          </button>
        </div>
        {registry.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {registry.slice(0, 5).map((entry) => (
              <button key={entry.id} type="button" onClick={() => setDprId(entry.id)} className="min-h-11 rounded-full border border-outline-variant px-3 font-mono text-xs text-secondary hover:bg-surface-container">
                {entry.id}
              </button>
            ))}
          </div>
        )}
      </form>

      <div aria-live="polite">
        {error && (
          <div role="alert" className="rounded-2xl border border-error/30 bg-error-container p-5 text-on-error-container">
            <p>{error}</p>
          </div>
        )}
      </div>

      {record && (
        <section aria-label="Report summary" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
          <h2 className="break-words text-xl font-bold text-primary">{record.business_name}</h2>
          <p className="mt-1 break-all font-mono text-xs text-on-surface-variant">{record.dpr_id} · {record.applicant_name}</p>
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-container-low p-4">
              <dt className="text-sm text-on-surface-variant"><Text>PDF status</Text></dt>
              <dd className="mt-1 font-mono font-semibold text-primary">{record.status}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <dt className="text-sm text-on-surface-variant"><Text>Workflow state</Text></dt>
              <dd className="mt-1 font-mono font-semibold text-primary">{history?.current_state ?? '—'}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <dt className="text-sm text-on-surface-variant"><Text>Verified</Text></dt>
              <dd className="mt-1 font-semibold text-primary">{record.verified ?? '—'}</dd>
            </div>
          </dl>

          <h3 className="mt-6 font-bold text-primary"><Text>History</Text></h3>
          {(history?.history?.length ?? 0) === 0 ? (
            <p className="mt-2 text-sm text-on-surface-variant"><Text>No transitions yet.</Text></p>
          ) : (
            <ol className="mt-3 space-y-2">
              {history?.history.map((entry, index) => (
                <li key={`${entry.timestamp ?? index}-${entry.trigger ?? index}`} className="rounded-xl bg-surface-container-low p-3 text-sm">
                  <span className="font-semibold text-primary">{entry.from ?? '?'} → {entry.to ?? '?'}</span>
                  <span className="ml-2 font-mono text-xs text-on-surface-variant">{entry.trigger ?? ''} · {formatDateTime(entry.timestamp)}</span>
                  {entry.note ? <p className="mt-1 text-on-surface-variant">{entry.note}</p> : null}
                </li>
              ))}
            </ol>
          )}

          <h3 className="mt-6 font-bold text-primary"><Text>Next actions</Text></h3>
          {(history?.allowed_triggers?.length ?? 0) === 0 ? (
            <p className="mt-2 text-sm text-on-surface-variant"><Text>No actions available for this state and role.</Text></p>
          ) : (
            <>
              <label htmlFor="review-note" className="mt-3 block text-sm font-semibold text-primary"><Text>Note (optional)</Text></label>
              <input
                id="review-note"
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Review note"
                className="mt-1.5 w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-base outline-none focus:border-primary"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {history?.allowed_triggers.map((trigger) => (
                  <button
                    key={trigger}
                    type="button"
                    onClick={() => runTransition(trigger)}
                    disabled={acting !== null}
                    className="min-h-11 rounded-full bg-primary px-5 font-mono text-sm font-semibold text-on-primary disabled:opacity-50"
                  >
                    {acting === trigger ? <Text>Working…</Text> : trigger}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
