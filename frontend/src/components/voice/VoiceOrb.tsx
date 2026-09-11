import type { CSSProperties } from 'react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Languages, Square, X } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { resolveVoiceLanguage } from '../../lib/voice/languages';
import { VOICE_LANGUAGE_NAMES } from '../../lib/voice/context';
import { pendingPercent } from '../../lib/voice/download-progress';
import { parseInline } from '../../lib/voice/markdown';
import { replyBlocks } from '../../lib/voice/spoken';
import { useVoice, type VoiceStatus } from '../../lib/voice/VoiceContext';
import Strands from './Strands';

/** One row of the transcript: a paragraph, or a list item with its marker. */
interface PanelRow {
  marker: string | null;
  items: Array<{ text: string; index: number }>;
}

/**
 * The reply with its inline syntax turned into real formatting. The assistant
 * is asked not to write Markdown, and mostly it does not - but when a stray
 * `**` reaches the panel it should read as emphasis, not as asterisks.
 */
function Formatted({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((token, index) => {
        switch (token.kind) {
          case 'bold':
            return <strong key={index} className="font-semibold">{token.text}</strong>;
          case 'italic':
            return <em key={index}>{token.text}</em>;
          case 'strike':
            return <s key={index}>{token.text}</s>;
          case 'code':
            return (
              <code key={index} className="rounded bg-surface-container px-1 font-mono text-[0.85em]">
                {token.text}
              </code>
            );
          case 'link':
            return (
              <a key={index} href={token.href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                {token.text}
              </a>
            );
          default:
            return <Fragment key={index}>{token.text}</Fragment>;
        }
      })}
    </>
  );
}

const CAPTION: Record<VoiceStatus, string> = {
  idle: 'Tap to talk',
  preparing: 'Preparing voice',
  listening: 'Tap to send',
  thinking: 'Thinking…',
  speaking: 'Tap to interrupt',
  error: 'Tap to retry',
};

/**
 * Dark green filaments, over a dark glass pane. The sage at the top of the ramp
 * is what keeps a filament readable on its own; the rest sit between the two
 * pines so the orb stays the colour of the pills under it.
 */
const ORB_COLORS = ['#8E9C78', '#61733C', '#485C11', '#31400F'];
const ORB_COLORS_ERROR = ['#E9A79C', '#E06A5E', '#8E1F18'];

export default function VoiceOrb() {
  const {
    status, messages, error, toggle, close, modelProgress, getLevel,
    brainRemote, spokenIndex, stopSpeaking, panelOpen: open, openPanel, closePanel,
  } = useVoice();
  const { lang } = useLanguage();
  const [hidden, setHidden] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const voice = resolveVoiceLanguage(lang);
  const spokenLanguage = VOICE_LANGUAGE_NAMES[voice.lang] ?? voice.lang;

  // The panel is the conversation and nothing else: the applicant's last line,
  // and the agent's reply laid out as text with no bubble behind it.
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  const lastAgent = [...messages].reverse().find((message) => message.role === 'assistant');
  // Each sentence keeps the index the voice counts in, so the row carrying the
  // spoken sentence is the one that highlights.
  const rows = useMemo<PanelRow[]>(() => {
    if (!lastAgent) return [];
    let index = 0;
    return replyBlocks(lastAgent.text).map((block) => ({
      marker: block.marker,
      items: block.chunks.map((chunk) => ({ text: chunk.text, index: index++ })),
    }));
  }, [lastAgent]);

  // Two states, two true sentences. "Your audio never leaves this device" is
  // accurate but reads like "nothing leaves", and a remote brain receives both
  // the recognised question and the page text that goes with it.
  const privacyLine = brainRemote
    ? 'Tap to talk and ask about this page. Your recording stays on this device; the recognised question and the page text are sent for an answer.'
    : 'Tap to talk and ask about this page. Nothing you say leaves this device.';

  const preparing = status === 'preparing';
  // Both models have to finish, so the slower download is the honest number.
  const progress = preparing ? Math.min(modelProgress.stt ?? 0, modelProgress.tts ?? 0) : null;
  const progressPercent = progress === null ? null : pendingPercent(progress);

  // Hiding puts the orb away, and asking from the navbar brings it back: the
  // mic opens the panel, and a panel with no orb under it is a dead control.
  useEffect(() => {
    if (open || status !== 'idle') setHidden(false);
  }, [open, status]);

  /**
   * Keep the sentence being spoken in view. Scrolling the panel container
   * rather than calling `scrollIntoView` keeps the page behind it still.
   */
  useEffect(() => {
    const container = textRef.current;
    const active = container?.querySelector<HTMLElement>('[data-spoken="true"]');
    if (!container || !active) return;
    const centre = active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, centre), behavior: 'smooth' });
  }, [spokenIndex]);

  if (hidden) return null;

  return (
    /* Bottom-right: the shell's rail is on the left, so this is the corner with
       nothing under it, and the mobile bottom nav is cleared. */
    <div className="pointer-events-none fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-end gap-3 md:right-8 md:bottom-8">
      {open && (
        <div
          role="dialog"
          aria-label="Voice assistant"
          className="pointer-events-auto w-[min(23rem,calc(100vw-2rem))] rounded-2xl border border-outline-variant bg-surface-container-lowest/95 p-4 shadow-2xl backdrop-blur"
        >
          {!voice.exact && (
            <p className="mb-2 flex items-start gap-1.5 text-xs text-on-surface-variant">
              <Languages size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              {`Only English and Hindi are spoken so far, so the mic and the voice use ${spokenLanguage}. Pick हिन्दी in the language menu to speak Hindi.`}
            </p>
          )}
          {lastUser && (
            <p className="mb-2 text-xs text-on-surface-variant">{lastUser.text}</p>
          )}
          {lastAgent ? (
            /* Five lines at this leading, then it scrolls with the voice. */
            <div
              ref={textRef}
              aria-live="polite"
              className="relative max-h-[7.5rem] overflow-y-auto text-[0.9375rem] leading-6 text-on-surface"
            >
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1.5 py-0.5 first:pt-0 last:pb-0">
                  {row.marker && (
                    <span aria-hidden="true" className="shrink-0 tabular-nums text-on-surface-variant">
                      {row.marker}
                    </span>
                  )}
                  <span className="min-w-0">
                    {row.items.map((item) => (
                      <span
                        key={item.index}
                        data-spoken={item.index === spokenIndex}
                        className={spokenIndex >= 0 && item.index !== spokenIndex ? 'text-on-surface-variant/60' : undefined}
                      >
                        <Formatted text={item.text} />
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">{privacyLine}</p>
          )}
          {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
        </div>
      )}

      <div data-state={status} className="voice-orb-wrap pointer-events-none relative">
        <button
          type="button"
          onClick={() => { openPanel(); void toggle(); }}
          aria-label={status === 'idle' ? 'Talk to the assistant' : 'Voice assistant active'}
          className="voice-orb pointer-events-auto relative block rounded-full"
        >
          <span className="voice-orb__field" aria-hidden="true">
            <Strands
              colors={status === 'error' ? ORB_COLORS_ERROR : ORB_COLORS}
              count={5}
              /* Half the component's default 0.5: the full speed reads as busy
                 on an 84px disc, and the orb is ambient, not an alarm. */
              speed={0.25}
              amplitude={0.9}
              waviness={1}
              thickness={0.8}
              glow={1.15}
              taper={2.6}
              spread={1}
              intensity={0.45}
              saturation={1.35}
              scale={1.25}
              glass
              glassSize={1}
              level={getLevel}
            />
          </span>
          {progress !== null && (
            <span
              className={`voice-orb__ring ${progressPercent ? '' : 'voice-orb__ring--waiting'}`}
              style={progressPercent
                ? ({ '--orb-progress': `${progressPercent}%` } as CSSProperties)
                : undefined}
              aria-hidden="true"
            />
          )}
          {progressPercent !== null && progressPercent > 0 && (
            <span className="voice-orb__percent" aria-hidden="true">{progressPercent}%</span>
          )}
        </button>
      </div>

      <div className="pointer-events-none flex items-center gap-1.5">
        {status === 'speaking' && (
          <button
            type="button"
            onClick={stopSpeaking}
            aria-label="Stop speaking"
            title="Stop speaking"
            className="pointer-events-auto grid h-7 min-h-7 w-7 place-items-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700"
          >
            <Square size={12} fill="currentColor" aria-hidden="true" />
          </button>
        )}
        <p
          aria-live="polite"
          className="inline-flex h-7 items-center rounded-full bg-primary/85 px-3 text-xs font-semibold text-on-primary shadow-lg"
        >
          {CAPTION[status]}
        </p>
        <button
          type="button"
          onClick={() => { closePanel(); close(); setHidden(true); }}
          aria-label="Hide voice assistant"
          title="Hide voice assistant"
          className="pointer-events-auto grid h-7 min-h-7 w-7 place-items-center rounded-full bg-primary/85 text-on-primary shadow-lg hover:bg-primary"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
