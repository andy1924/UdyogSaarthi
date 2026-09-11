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

const percent = (value: number | null) => (value === null ? 0 : Math.round(value * 100));

export default function MicButton() {
  const { status, toggle, modelProgress } = useVoice();
  const busy = status === 'preparing' || status === 'thinking';
  const active = status === 'listening' || status === 'speaking';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={status === 'listening'}
        aria-label={LABEL[status]}
        title={LABEL[status]}
        className={`inline-flex h-[35px] min-h-[35px] items-center gap-2 rounded-full border px-3 text-sm font-semibold disabled:opacity-70 ${
          active
            ? 'border-primary bg-primary text-on-primary'
            : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
        }`}
      >
        {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
        {status === 'listening' && <Square size={16} aria-hidden="true" />}
        {!active && !busy && <Mic size={16} aria-hidden="true" />}
        <span className="hidden sm:inline">{LABEL[status]}</span>
      </button>

      {status === 'preparing' && (
        <div
          role="status"
          aria-live="polite"
          className="absolute right-0 top-[calc(100%+8px)] z-[70] w-72 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-sm shadow-2xl"
        >
          <p className="font-semibold text-on-surface">Downloading the voice models once</p>
          <p className="mt-1 text-on-surface-variant">
            Listening needs up to 280 MB and the voice model up to 310 MB. They are
            cached on this device, so this happens only once.
          </p>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-xs text-on-surface-variant">Listening model - {percent(modelProgress.stt)}%</p>
              <progress className="h-1.5 w-full" max={100} value={percent(modelProgress.stt)} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Voice model - {percent(modelProgress.tts)}%</p>
              <progress className="h-1.5 w-full" max={100} value={percent(modelProgress.tts)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
