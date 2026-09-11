import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { api, isAuthenticationError, type DprFullRecord, type DprHistory, type SessionUser } from '../lib/api';
import { formatDateTime, formatINR } from '../lib/format';
import { Text } from '../lib/LanguageContext';
import LockedSection from '../components/LockedSection';
import { isStaffRole } from '../lib/routes';

interface ApplicationDetailPageProps {
  dprId: string;
  user: SessionUser | null;
  onSignIn: () => void;
  onBack: () => void;
}

export default function ApplicationDetailPage({ dprId, user, onSignIn, onBack }: ApplicationDetailPageProps) {
  const [record, setRecord] = useState<DprFullRecord | null>(null);
  const [history, setHistory] = useState<DprHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.getDprFull(dprId), api.getDprHistory(dprId)])
      .then(([full, hist]) => { setRecord(full); setHistory(hist); })
      .catch((reason: unknown) => {
        if (isAuthenticationError(reason)) setError('Session expired. Sign in again.');
        else if (reason instanceof Error && reason.message.includes('(404)')) setError('Report not found on the server.');
        else setError('Report details are temporarily unavailable.');
      })
      .finally(() => setLoading(false));
  }, [dprId]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    return (
      <LockedSection
        title="Sign in to view this report"
        message="Project reports are private to your account. Sign in to continue."
        onSignIn={onSignIn}
      />
    );
  }

  const download = () => {
    setDownloading(true);
    api.downloadDprPdf(dprId)
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${dprId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => setError('Download failed. Try again.'))
      .finally(() => setDownloading(false));
  };

  const runTransition = (action: string) => {
    setActing(action);
    setError(null);
    api.transitionDpr(dprId, action, note)
      .then(() => { setNote(''); load(); })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Transition failed.');
      })
      .finally(() => setActing(null));
  };

  const staff = isStaffRole(user.role);
  const scheme = record?.data?.scheme;
  const feasibility = record?.data?.feasibility;
  const location = record?.data?.location;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button type="button" onClick={onBack} className="flex min-h-11 items-center gap-2 rounded-full px-2 font-semibold text-secondary">
        <ArrowLeft size={18} aria-hidden="true" /><Text>Back to applications</Text>
      </button>

      <div aria-live="polite">
        {loading && (
          <p role="status" className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 text-on-surface-variant">
            <RefreshCw size={18} className="animate-spin" aria-hidden="true" /><Text>Loading report…</Text>
          </p>
        )}
        {error && (
          <div role="alert" className="rounded-2xl border border-error/30 bg-error-container p-5 text-on-error-container">
            <p>{error}</p>
            <button type="button" onClick={load} className="mt-3 min-h-11 rounded-full border border-current px-5 font-semibold">
              <Text>Retry</Text>
            </button>
          </div>
        )}
      </div>

      {record && (
        <>
          <section aria-labelledby="detail-title" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Project report</Text></p>
            <h1 id="detail-title" className="mt-2 break-words text-2xl font-bold text-primary">{record.business_name}</h1>
            <p className="mt-1 break-all font-mono text-xs text-on-surface-variant">{record.dpr_id} · {formatDateTime(record.created_at)}</p>
            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-container-low p-4">
                <dt className="text-sm text-on-surface-variant"><Text>Applicant</Text></dt>
                <dd className="mt-1 font-semibold text-primary">{record.applicant_name}</dd>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <dt className="text-sm text-on-surface-variant"><Text>Location</Text></dt>
                <dd className="mt-1 font-semibold text-primary">
                  {location ? `${location.block ?? ''}, ${location.district ?? ''}, ${location.state ?? ''}` : '—'}
                </dd>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <dt className="text-sm text-on-surface-variant"><Text>PDF status</Text></dt>
                <dd className="mt-1 font-mono font-semibold text-primary">{record.status}</dd>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <dt className="text-sm text-on-surface-variant"><Text>Workflow state</Text></dt>
                <dd className="mt-1 font-mono font-semibold text-primary">{history?.current_state ?? '—'}</dd>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <dt className="text-sm text-on-surface-variant"><Text>Project budget</Text></dt>
                <dd className="mt-1 font-mono font-semibold text-primary">{formatINR(scheme?.tpc)}</dd>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <dt className="text-sm text-on-surface-variant"><Text>Demand verdict</Text></dt>
                <dd className="mt-1 font-semibold text-primary">{feasibility?.verdict ?? '—'}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-on-surface-variant"><Text>Scheme rules</Text> <span className="font-mono">{scheme?.rules?.version ?? 'v2024-11'}</span></p>
            <button type="button" onClick={download} disabled={downloading} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-on-primary disabled:opacity-50 sm:w-auto">
              {downloading ? <RefreshCw size={19} className="animate-spin" aria-hidden="true" /> : <Download size={19} aria-hidden="true" />}<Text>Download PDF</Text>
            </button>
          </section>

          <section aria-labelledby="history-title" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
            <h2 id="history-title" className="text-lg font-bold text-primary"><Text>Workflow history</Text></h2>
            {(history?.history?.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm leading-6 text-on-surface-variant"><Text>No transitions yet. New reports start as drafts.</Text></p>
            ) : (
              <ol className="mt-4 space-y-3">
                {history?.history.map((entry, index) => (
                  <li key={`${entry.timestamp ?? index}-${entry.trigger ?? index}`} className="rounded-xl bg-surface-container-low p-4 text-sm leading-6">
                    <p className="font-semibold text-primary">
                      {entry.from ?? '?'} → {entry.to ?? '?'}
                    </p>
                    <p className="font-mono text-xs text-on-surface-variant">
                      {entry.trigger ?? ''} · {formatDateTime(entry.timestamp)}
                    </p>
                    {entry.note ? <p className="mt-1 text-on-surface-variant">{entry.note}</p> : null}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {staff && (
            <section aria-labelledby="transition-title" className="rounded-2xl border-2 border-primary/20 bg-secondary-container/30 p-5 sm:p-6">
              <h2 id="transition-title" className="text-lg font-bold text-primary"><Text>Staff actions</Text></h2>
              {(history?.allowed_triggers?.length ?? 0) === 0 ? (
                <p className="mt-2 text-sm text-on-surface-variant"><Text>No actions available for this state and role.</Text></p>
              ) : (
                <>
                  <label htmlFor="transition-note" className="mt-3 block text-sm font-semibold text-primary"><Text>Note (optional)</Text></label>
                  <input
                    id="transition-note"
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
        </>
      )}
    </div>
  );
}
