import { LoaderCircle, Mic, Square } from 'lucide-react';
import { useVoice, type VoiceStatus } from '../../lib/voice/VoiceContext';

const LABEL: Record<VoiceStatus, string> = {
  idle: 'Ask by voice',
  preparing: 'Preparing voice',
  listening: 'Stop listening',
  thinking: 'Thinking',
  speaking: 'Stop speaking',
  error: 'Retry voice',
};

export default function MicButton() {
  const { status, toggle, openPanel } = useVoice();
  const busy = status === 'preparing' || status === 'thinking';
  const active = status === 'listening' || status === 'speaking';

  return (
    <button
      type="button"
      onClick={() => { openPanel(); void toggle(); }}
      // aria-disabled rather than disabled: a disabled button drops its hover
      // tooltip, and the label is the only thing explaining a slow first run.
      aria-disabled={busy}
      aria-pressed={status === 'listening'}
      aria-label={LABEL[status]}
      title={LABEL[status]}
      className={`inline-flex h-[35px] min-h-[35px] items-center gap-2 rounded-full border px-3 text-sm font-semibold ${
        busy ? 'cursor-default opacity-70' : ''
      } ${
        active
          ? 'border-primary bg-primary text-on-primary'
          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
      }`}
    >
      {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
      {active && <Square size={16} aria-hidden="true" />}
      {!active && !busy && <Mic size={16} aria-hidden="true" />}
      <span className="hidden sm:inline">{LABEL[status]}</span>
    </button>
  );
}
