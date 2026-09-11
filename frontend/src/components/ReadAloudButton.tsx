import { LoaderCircle, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { requestPageSummary } from '../lib/voice/chat';
import { clipPage, pageText } from '../lib/voice/context';
import { resolveVoiceLanguage } from '../lib/voice/languages';
import { READ_ALOUD_MAX_MS, readAloudChunks } from '../lib/voice/read-aloud';
import { toPlainText } from '../lib/voice/markdown';
import { createSpeaker, type Speaker } from '../lib/voice/tts';

type ReadState = 'idle' | 'preparing' | 'reading';

/**
 * Read aloud is an overview, not a recital.
 *
 * The applicant presses this to find out what is on the page, so the brain is
 * asked for a short spoken summary: what the page is for, the buttons and
 * fields it offers, and the next action. The voice is the same on-device one the
 * orb uses - nothing is sent to a cloud speech service - and when no brain is
 * configured the page itself is read instead, which is still better than a
 * button that does nothing.
 *
 * The page text is cut into sentence-sized pieces because one synthesis call
 * over a whole page is silently truncated by the engine; see `SPEECH_CHUNK_CHARS`.
 */
export default function ReadAloudButton() {
  const { lang } = useLanguage();
  const [state, setState] = useState<ReadState>('idle');
  // Bumped to abandon the run in flight, so a stopped read cannot set the state
  // on its way out - the same trick the orb's turns use.
  const run = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const cached = useRef<{ lang: string; speaker: Speaker } | null>(null);

  const stop = useCallback(() => {
    run.current += 1;
    abort.current?.abort();
    cached.current?.speaker.stop();
    setState('idle');
  }, []);

  useEffect(() => () => {
    run.current += 1;
    abort.current?.abort();
    cached.current?.speaker.stop();
  }, []);

  /** The voice for this language, built once and kept for the next press. */
  const speakerFor = useCallback(async (): Promise<Speaker> => {
    if (cached.current?.lang === lang) return cached.current.speaker;
    const speaker = await createSpeaker(resolveVoiceLanguage(lang));
    cached.current?.speaker.stop();
    cached.current = { lang, speaker };
    return speaker;
  }, [lang]);

  const start = useCallback(async () => {
    const id = (run.current += 1);
    setState('preparing');
    // Read the page before anything is awaited: it is a synchronous snapshot of
    // the DOM as it is now, and awaiting first would snapshot whatever the next
    // route had already painted.
    const page = clipPage(pageText());
    const controller = new AbortController();
    abort.current = controller;
    try {
      // Warm the voice while the brain is reading the page, so the applicant
      // waits for the slower of the two instead of for both in turn.
      const [speaker, summary] = await Promise.all([
        speakerFor(),
        requestPageSummary({
          lang: resolveVoiceLanguage(lang).lang,
          pageText: page,
          signal: controller.signal,
        }),
      ]);
      if (run.current !== id) return;
      // A page is not markdown, but a model's answer sometimes is, and this one
      // is spoken rather than shown, so its syntax is stripped the same way a
      // reply's is before the voice ever sees it.
      const lines = readAloudChunks(summary ? toPlainText(summary) : page);
      if (!lines.length) return;
      setState('reading');
      const startedAt = Date.now();
      for (const line of lines) {
        if (run.current !== id || Date.now() - startedAt > READ_ALOUD_MAX_MS) break;
        await speaker.speak([line]);
      }
    } catch {
      // A voice that cannot load leaves the button idle instead of spinning.
      controller.abort();
    }
    if (run.current === id) setState('idle');
  }, [lang, speakerFor]);

  const busy = state === 'preparing';
  const reading = state === 'reading';
  const label = reading ? 'Stop reading aloud' : 'Read aloud';
  return (
    <button
      type="button"
      onClick={reading || busy ? stop : () => void start()}
      title={label}
      className="inline-flex h-[35px] min-h-[35px] w-[35px] min-w-[35px] items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container"
      aria-pressed={reading}
      aria-label={label}
    >
      {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
      {reading && <VolumeX size={16} aria-hidden="true" />}
      {state === 'idle' && <Volume2 size={16} aria-hidden="true" />}
    </button>
  );
}
