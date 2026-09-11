import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api, isAuthenticationError, type AuditLogPage, type SessionUser } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { Text } from '../lib/LanguageContext';
import LockedSection from '../components/LockedSection';
import { isStaffRole } from '../lib/routes';

interface AuditPageProps {
  user: SessionUser | null;
  onSignIn: () => void;
}

const PAGE_SIZE = 20;

export default function AuditPage({ user, onSignIn }: AuditPageProps) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditLogPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback((pageNumber: number) => {
    setLoading(true);
    setError(null);
    api.getAuditLogs(pageNumber, PAGE_SIZE)
      .then((result) => { setData(result); setPage(pageNumber); })
      .catch((reason: unknown) => {
        if (isAuthenticationError(reason)) setError('Session expired. Sign in again.');
        else if (reason instanceof Error && reason.message.includes('(403)')) setError('Audit access is staff-only.');
        else setError('Audit logs are temporarily unavailable.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(1); }, [load]);

  if (!user) {
    return (
      <LockedSection
        title="Sign in to view audit"
        message="The audit ledger is staff-only. Sign in with a DIC officer or SCA auditor account."
        onSignIn={onSignIn}
      />
    );
  }

  if (!isStaffRole(user.role)) {
    return (
      <LockedSection
        title="Staff only"
        message="The audit ledger is staff-only. Your account does not have audit access."
        onSignIn={onSignIn}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section aria-labelledby="audit-title" className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Staff</Text></p>
          <h1 id="audit-title" className="mt-2 text-2xl font-bold text-primary sm:text-3xl"><Text>Audit ledger</Text></h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant"><Text>Hash-chained, read-only trail of every recorded action.</Text></p>
        </div>
        <button type="button" onClick={() => load(page)} disabled={loading} className="flex min-h-11 items-center gap-2 rounded-full border border-outline-variant px-4 text-sm font-semibold text-secondary hover:bg-surface-container disabled:opacity-50">
          <RefreshCw size={16} aria-hidden={loading} className={loading ? 'animate-spin' : ''} /><Text>Refresh</Text>
        </button>
      </section>

      <div aria-live="polite">
        {loading && !data && (
          <p role="status" className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 text-on-surface-variant">
            <RefreshCw size={18} className="animate-spin" aria-hidden="true" /><Text>Loading audit logs…</Text>
          </p>
        )}
        {error && (
          <div role="alert" className="rounded-2xl border border-error/30 bg-error-container p-5 text-on-error-container">
            <p>{error}</p>
            <button type="button" onClick={() => load(page)} className="mt-3 min-h-11 rounded-full border border-current px-5 font-semibold">
              <Text>Retry</Text>
            </button>
          </div>
        )}
        {data && (
          <>
            <ol className="space-y-3">
              {data.logs.map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-mono text-sm font-semibold text-primary">{entry.action}</p>
                    <p className="font-mono text-xs text-on-surface-variant">{formatDateTime(entry.timestamp)}</p>
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-on-surface-variant">
                    {entry.endpoint ?? '—'} · {entry.user_id ?? 'system'}
                  </p>
                </li>
              ))}
            </ol>
            {data.logs.length === 0 && (
              <p className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 text-sm text-on-surface-variant"><Text>No audit entries on this page.</Text></p>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => load(page - 1)}
                disabled={loading || page <= 1}
                className="min-h-11 rounded-full border border-secondary px-5 font-semibold text-secondary disabled:opacity-45"
              >
                <Text>Previous</Text>
              </button>
              <span role="status" className="font-mono text-sm text-on-surface-variant">Page {page}</span>
              <button
                type="button"
                onClick={() => load(page + 1)}
                disabled={loading || data.count < PAGE_SIZE}
                className="min-h-11 rounded-full border border-secondary px-5 font-semibold text-secondary disabled:opacity-45"
              >
                <Text>Next</Text>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
