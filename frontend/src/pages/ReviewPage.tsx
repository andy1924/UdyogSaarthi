import { useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { api, isAuthenticationError, type DprFullRecord, type DprHistory, type SessionUser } from '../lib/api';
import { listMyDprs } from '../lib/my-dprs';
import { Text } from '../lib/LanguageContext';
import LockedSection from '../components/LockedSection';
import { DprErrorAlert, DprHistoryList, StatusCard, TransitionActions, useDprTransition } from '../components/DprWorkflow';
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
  const [registry, setRegistry] = useState(() => listMyDprs());

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

  const { note, setNote, acting, runTransition } = useDprTransition(dprId, load, setError);

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
        <DprErrorAlert error={error} />
      </div>

      {record && (
        <section aria-label="Report summary" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
          <h2 className="break-words text-xl font-bold text-primary">{record.business_name}</h2>
          <p className="mt-1 break-all font-mono text-xs text-on-surface-variant">{record.dpr_id} · {record.applicant_name}</p>
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatusCard label="PDF status" mono>{record.status}</StatusCard>
            <StatusCard label="Workflow state" mono>{history?.current_state ?? '—'}</StatusCard>
            <StatusCard label="Verified">{record.verified ?? '—'}</StatusCard>
          </dl>

          <h3 className="mt-6 font-bold text-primary"><Text>History</Text></h3>
          <DprHistoryList history={history} layout="compact" emptyMessage="No transitions yet." />

          <h3 className="mt-6 font-bold text-primary"><Text>Next actions</Text></h3>
          <TransitionActions note={note} setNote={setNote} allowedTriggers={history?.allowed_triggers} acting={acting} onAction={runTransition} inputId="review-note" />
        </section>
      )}
    </div>
  );
}
