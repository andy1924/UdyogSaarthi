import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { api, isAuthenticationError, type DprFullRecord, type DprHistory, type SessionUser } from '../lib/api';
import { formatDateTime, formatINR } from '../lib/format';
import { Text } from '../lib/LanguageContext';
import LockedSection from '../components/LockedSection';
import { DprErrorAlert, DprHistoryList, StatusCard, TransitionActions, useDprTransition } from '../components/DprWorkflow';
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

  const { note, setNote, acting, runTransition } = useDprTransition(dprId, load, setError);

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
        <DprErrorAlert error={error} onRetry={load} />
      </div>

      {record && (
        <>
          <section aria-labelledby="detail-title" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Project report</Text></p>
            <h1 id="detail-title" className="mt-2 break-words text-2xl font-bold text-primary">{record.business_name}</h1>
            <p className="mt-1 break-all font-mono text-xs text-on-surface-variant">{record.dpr_id} · {formatDateTime(record.created_at)}</p>
            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatusCard label="Applicant">{record.applicant_name}</StatusCard>
              <StatusCard label="Location">
                {location ? `${location.block ?? ''}, ${location.district ?? ''}, ${location.state ?? ''}` : '—'}
              </StatusCard>
              <StatusCard label="PDF status" mono>{record.status}</StatusCard>
              <StatusCard label="Workflow state" mono>{history?.current_state ?? '—'}</StatusCard>
              <StatusCard label="Project budget" mono>{formatINR(scheme?.tpc)}</StatusCard>
              <StatusCard label="Demand verdict">{feasibility?.verdict ?? '—'}</StatusCard>
            </dl>
            <p className="mt-4 text-sm text-on-surface-variant"><Text>Scheme rules</Text> <span className="font-mono">{scheme?.rules?.version ?? 'v2024-11'}</span></p>
            <button type="button" onClick={download} disabled={downloading} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-on-primary disabled:opacity-50 sm:w-auto">
              {downloading ? <RefreshCw size={19} className="animate-spin" aria-hidden="true" /> : <Download size={19} aria-hidden="true" />}<Text>Download PDF</Text>
            </button>
          </section>

          <section aria-labelledby="history-title" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
            <h2 id="history-title" className="text-lg font-bold text-primary"><Text>Workflow history</Text></h2>
            <DprHistoryList history={history} layout="spacious" emptyMessage="No transitions yet. New reports start as drafts." />
          </section>

          {staff && (
            <section aria-labelledby="transition-title" className="rounded-2xl border-2 border-primary/20 bg-secondary-container/30 p-5 sm:p-6">
              <h2 id="transition-title" className="text-lg font-bold text-primary"><Text>Staff actions</Text></h2>
              <TransitionActions note={note} setNote={setNote} allowedTriggers={history?.allowed_triggers} acting={acting} onAction={runTransition} inputId="transition-note" />
            </section>
          )}
        </>
      )}
    </div>
  );
}
