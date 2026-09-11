import { Languages, Mic, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { resolveVoiceLanguage } from '../../lib/voice/languages';
import { useVoice, type VoiceStatus } from '../../lib/voice/VoiceContext';

const ORB_STATE_CLASS: Record<VoiceStatus, string> = {
  idle: 'bg-primary/90',
  preparing: 'bg-secondary animate-pulse',
  listening: 'bg-primary ring-4 ring-primary/30 animate-pulse',
  thinking: 'bg-secondary animate-pulse',
  speaking: 'bg-secondary animate-pulse',
  error: 'bg-error',
};

export default function VoiceOrb() {
  const { status, messages, error, toggle, localOnly } = useVoice();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const voice = resolveVoiceLanguage(lang);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-3 px-4">
      {open && (
        <div
          role="dialog"
          aria-label="Voice assistant"
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-on-surface">Voice assistant</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close voice assistant"
              className="grid min-h-9 min-w-9 place-items-center rounded-full hover:bg-surface-container"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          {!voice.exact && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Languages size={13} aria-hidden="true" />
              Voice is available in English and Hindi, so this session uses English.
            </p>
          )}
          <div ref={listRef} className="mt-3 max-h-64 space-y-2 overflow-y-auto" aria-live="polite">
            {messages.length === 0 && (
              <p className="text-sm text-on-surface-variant">
                {localOnly
                  ? 'Press the mic and ask about this step. Your audio never leaves this device.'
                  : 'Press the mic and ask about this step. Your speech goes to the configured voice service.'}
              </p>
            )}
            {messages.map((message) => (
              <p
                key={message.id}
                className={`rounded-xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'ml-6 bg-secondary-container text-on-secondary-container'
                    : 'mr-6 bg-surface-container text-on-surface'
                }`}
              >
                {message.text}
              </p>
            ))}
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
        </div>
      )}
      <button
        type="button"
        onClick={() => { setOpen(true); void toggle(); }}
        aria-label={status === 'idle' ? 'Open voice assistant' : 'Voice assistant active'}
        className={`pointer-events-auto grid h-14 w-14 place-items-center rounded-full text-on-primary shadow-xl motion-reduce:animate-none ${ORB_STATE_CLASS[status]}`}
      >
        <Mic size={22} aria-hidden="true" />
      </button>
    </div>
  );
}
