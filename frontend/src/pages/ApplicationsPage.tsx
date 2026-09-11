import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Download, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { api, isAuthenticationError } from '../lib/api';
import { clearMyDprs, listMyDprs, removeMyDpr, type MyDprEntry } from '../lib/my-dprs';
import { formatDateTime } from '../lib/format';
import { Text } from '../lib/LanguageContext';
import LockedSection from '../components/LockedSection';
import type { SessionUser } from '../lib/api';

interface ApplicationsPageProps {
  user: SessionUser | null;
  onSignIn: () => void;
  onOpenDetail: (dprId: string) => void;
  onApply: () => void;
}

function RegistryRow({ entry, onOpenDetail, onRemoved }: { entry: MyDprEntry; onOpenDetail: (id: string) => void; onRemoved: () => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.getDpr(entry.id)
      .then((record) => setStatus(record.status))
      .catch((reason: unknown) => {
        if (isAuthenticationError(reason)) setError('Session expired. Sign in again.');
        else setError('Status unavailable.');
      })
      .finally(() => setLoading(false));
  }, [entry.id]);

  useEffect(() => { load(); }, [load]);

  const download = () => {
    setDownloading(true);
    api.downloadDprPdf(entry.id)
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${entry.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => setError('Download failed. Try again.'))
      .finally(() => setDownloading(false));
  };

  return (
    <li className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-primary">{entry.businessName}</p>
          <p className="mt-1 break-all font-mono text-xs text-on-surface-variant">{entry.id} · {formatDateTime(entry.createdAt)}</p>
        </div>
        <span role="status" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-sm font-semibold text-primary">
          {loading
            ? <RefreshCw size={15} className="animate-spin" aria-hidden="true" />
            : status === 'ready'
              ? <><CheckCircle2 size={16} aria-hidden="true" /><Text>Done</Text></>
              : (status ?? '—')}
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-error-container p-3 text-sm text-on-error-container">
          <span>{error}</span>
          <button type="button" onClick={load} className="min-h-11 rounded-full border border-current px-4 font-semibold"><Text>Retry</Text></button>
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => onOpenDetail(entry.id)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-secondary px-4 font-semibold text-secondary">
          <FileText size={17} aria-hidden="true" /><Text>Open details</Text>
        </button>
        <button type="button" onClick={download} disabled={downloading} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
          {downloading ? <RefreshCw size={17} className="animate-spin" aria-hidden="true" /> : <Download size={17} aria-hidden="true" />}<Text>Download PDF</Text>
        </button>
        <button
          type="button"
          onClick={() => { removeMyDpr(entry.id); onRemoved(); }}
          aria-label={`Remove ${entry.id} from this device`}
          className="grid min-h-11 w-11 place-items-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container"
        >
          <Trash2 size={17} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

export default function ApplicationsPage({ user, onSignIn, onOpenDetail, onApply }: ApplicationsPageProps) {
  const [entries, setEntries] = useState<MyDprEntry[]>(() => listMyDprs());

  const refresh = useCallback(() => setEntries(listMyDprs()), []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  if (!user) {
    return (
      <LockedSection
        title="Sign in to view applications"
        message="Your project reports are linked to your account. Sign in to see live status for each report on this device."
        onSignIn={onSignIn}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section aria-labelledby="applications-title" className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Reports</Text></p>
          <h1 id="applications-title" className="mt-2 text-2xl font-bold text-primary sm:text-3xl"><Text>My applications</Text></h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            <Text>This list lives on your device. Status is checked live with the server, which is always the truth.</Text>
          </p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => { clearMyDprs(); refresh(); }}
            className="min-h-11 rounded-full border border-outline-variant px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            <Text>Clear list</Text>
          </button>
        )}
      </section>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center sm:p-8">
          <p className="text-base font-semibold text-primary"><Text>No applications yet</Text></p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant"><Text>Finished reports appear here after you convert them to PDF.</Text></p>
          <button type="button" onClick={onApply} className="mt-5 min-h-12 rounded-full bg-primary px-6 font-semibold text-on-primary">
            <Text>Start application</Text>
          </button>
        </div>
      ) : (
        <ul aria-live="polite" className="space-y-4">
          {entries.map((entry) => (
            <RegistryRow key={entry.id} entry={entry} onOpenDetail={onOpenDetail} onRemoved={refresh} />
          ))}
        </ul>
      )}
    </div>
  );
}
