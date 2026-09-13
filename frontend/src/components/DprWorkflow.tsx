import { useState } from 'react';
import { api, type DprHistory } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { Text } from '../lib/LanguageContext';

export function useDprTransition(
  dprId: string,
  load: () => void,
  setError: (message: string | null) => void,
) {
  const [note, setNote] = useState('');
  const [acting, setActing] = useState<string | null>(null);

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

  return { note, setNote, acting, runTransition };
}

export function StatusCard({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <dt className="text-sm text-on-surface-variant"><Text>{label}</Text></dt>
      <dd className={`mt-1 font-semibold text-primary${mono ? ' font-mono' : ''}`}>{children}</dd>
    </div>
  );
}

export function DprErrorAlert({ error, onRetry }: { error: string | null; onRetry?: () => void }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-2xl border border-error/30 bg-error-container p-5 text-on-error-container">
      <p>{error}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 min-h-11 rounded-full border border-current px-5 font-semibold">
          <Text>Retry</Text>
        </button>
      )}
    </div>
  );
}

export function DprHistoryList({
  history,
  layout,
  emptyMessage,
}: {
  history: DprHistory | null;
  layout: 'compact' | 'spacious';
  emptyMessage: string;
}) {
  if ((history?.history?.length ?? 0) === 0) {
    return <p className={layout === 'spacious' ? 'mt-3 text-sm leading-6 text-on-surface-variant' : 'mt-2 text-sm text-on-surface-variant'}><Text>{emptyMessage}</Text></p>;
  }
  if (layout === 'spacious') {
    return (
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
    );
  }
  return (
    <ol className="mt-3 space-y-2">
      {history?.history.map((entry, index) => (
        <li key={`${entry.timestamp ?? index}-${entry.trigger ?? index}`} className="rounded-xl bg-surface-container-low p-3 text-sm">
          <span className="font-semibold text-primary">{entry.from ?? '?'} → {entry.to ?? '?'}</span>
          <span className="ml-2 font-mono text-xs text-on-surface-variant">{entry.trigger ?? ''} · {formatDateTime(entry.timestamp)}</span>
          {entry.note ? <p className="mt-1 text-on-surface-variant">{entry.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function TransitionActions({
  note,
  setNote,
  allowedTriggers,
  acting,
  onAction,
  inputId,
}: {
  note: string;
  setNote: (value: string) => void;
  allowedTriggers: string[] | undefined;
  acting: string | null;
  onAction: (trigger: string) => void;
  inputId: string;
}) {
  if ((allowedTriggers?.length ?? 0) === 0) {
    return <p className="mt-2 text-sm text-on-surface-variant"><Text>No actions available for this state and role.</Text></p>;
  }
  return (
    <>
      <label htmlFor={inputId} className="mt-3 block text-sm font-semibold text-primary"><Text>Note (optional)</Text></label>
      <input
        id={inputId}
        type="text"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Review note"
        className="mt-1.5 w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-base outline-none focus:border-primary"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {allowedTriggers?.map((trigger) => (
          <button
            key={trigger}
            type="button"
            onClick={() => onAction(trigger)}
            disabled={acting !== null}
            className="min-h-11 rounded-full bg-primary px-5 font-mono text-sm font-semibold text-on-primary disabled:opacity-50"
          >
            {acting === trigger ? <Text>Working…</Text> : trigger}
          </button>
        ))}
      </div>
    </>
  );
}
