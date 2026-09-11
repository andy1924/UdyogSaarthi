import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { useLanguage } from '../LanguageContext';
import { requestReply } from './chat';
import { resolveVoiceLanguage, type ResolvedVoiceLanguage, type VoiceEngine } from './languages';
import { createProgressTracker, type ProgressSnapshot } from './download-progress';
import { createRecorder, type Recorder } from './recorder';
import { Endpointer } from './endpoint';
import { createSpeaker, type Speaker } from './tts';
import { createTranscriber, type Transcriber } from './stt';
import type { StepContext } from './context';
import { readSttConfig, readTtsConfig } from './providers';

export type VoiceStatus = 'idle' | 'preparing' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface VoiceValue {
  status: VoiceStatus;
  modelProgress: ProgressSnapshot;
  /** True while both speech models run in this browser, so nothing is uploaded. */
  localOnly: boolean;
  messages: VoiceMessage[];
  error: string | null;
  context: StepContext;
  setContext: (context: StepContext) => void;
  toggle: () => void;
  close: () => void;
}

const VoiceContext = createContext<VoiceValue | null>(null);

const VOICE_ENV = import.meta.env;
/**
 * False once either speech model is served remotely. The orb's copy depends on
 * it: claiming "audio never leaves this device" would be a lie the moment
 * VITE_VOICE_STT_URL points anywhere, and a false privacy claim is worse than
 * no claim.
 */
const LOCAL_ONLY = !readSttConfig(VOICE_ENV) && !readTtsConfig(VOICE_ENV);

const startFailed = LOCAL_ONLY
  ? 'Voice could not start. Your audio stays on this device; please try again.'
  : 'Voice could not start. Please try again.';

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [modelProgress, setModelProgress] = useState<ProgressSnapshot>({ stt: null, tts: null });
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<StepContext>({ step: 1, stepTitle: 'Location' });

  const transcriber = useRef<Transcriber | null>(null);
  const speaker = useRef<{ engine: VoiceEngine; speaker: Speaker } | null>(null);
  const recorder = useRef<Recorder | null>(null);
  const endpointer = useRef(new Endpointer());
  const abort = useRef<AbortController | null>(null);
  const turning = useRef(false);
  // The turn keeps the language it started with, so a header switch mid-turn
  // cannot make the reply come out in the wrong voice.
  const turnVoice = useRef<ResolvedVoiceLanguage>(resolveVoiceLanguage(lang));

  const push = useCallback((message: Omit<VoiceMessage, 'id'>) => {
    setMessages((all) => [...all, { ...message, id: crypto.randomUUID() }]);
  }, []);

  const prepare = useCallback(async (
    voice: ResolvedVoiceLanguage,
    onProgress: (snapshot: ProgressSnapshot) => void,
  ) => {
    const tracker = createProgressTracker(onProgress);
    if (!transcriber.current) {
      transcriber.current = await createTranscriber(tracker.callbackFor('stt'));
    }
    if (speaker.current?.engine !== voice.engine) {
      speaker.current?.speaker.stop();
      speaker.current = {
        engine: voice.engine,
        speaker: await createSpeaker(voice, tracker.callbackFor('tts')),
      };
    }
  }, []);

  const runTurn = useCallback(async (audio: Float32Array) => {
    const voice = turnVoice.current;
    if (!transcriber.current) return;
    const text = await transcriber.current.transcribe(audio, voice.stt);
    if (!text) { setStatus('idle'); return; }
    push({ role: 'user', text });
    setStatus('thinking');
    abort.current = new AbortController();
    const reply = await requestReply({
      question: text, context, lang: voice.lang, signal: abort.current.signal,
    });
    push({ role: 'assistant', text: reply });
    if (!speaker.current) { setStatus('idle'); return; }
    setStatus('speaking');
    await speaker.current.speaker.speak(reply);
    setStatus('idle');
  }, [context, push]);

  const finishTurn = useCallback(async () => {
    if (turning.current || !recorder.current) return;
    turning.current = true;
    try {
      const audio = await recorder.current.stop();
      await runTurn(audio);
    } catch {
      setError('That turn could not be processed. Please try again.');
      setStatus('error');
    } finally {
      turning.current = false;
    }
  }, [runTurn]);

  const toggle = useCallback(async () => {
    if (status === 'speaking') { speaker.current?.speaker.stop(); setStatus('idle'); return; }
    if (status === 'listening') { await finishTurn(); return; }
    if (status === 'preparing' || status === 'thinking') return;

    const voice = resolveVoiceLanguage(lang);
    turnVoice.current = voice;
    setError(null);
    try {
      setStatus('preparing');
      await prepare(voice, setModelProgress);
      if (!recorder.current) recorder.current = createRecorder();
      endpointer.current.reset();
      recorder.current.onLevel((level) => {
        const event = endpointer.current.push(level);
        if (event === 'speech-end' || event === 'timeout') void finishTurn();
      });
      await recorder.current.start();
      setStatus('listening');
    } catch (reason) {
      recorder.current?.cancel();
      const denied = reason instanceof DOMException && reason.name === 'NotAllowedError';
      setError(denied ? 'Microphone permission is needed for voice questions.' : startFailed);
      setStatus('error');
    }
  }, [finishTurn, lang, prepare, status]);

  const close = useCallback(() => {
    recorder.current?.cancel();
    speaker.current?.speaker.stop();
    abort.current?.abort();
    setStatus('idle');
  }, []);

  useEffect(() => () => {
    recorder.current?.cancel();
    speaker.current?.speaker.stop();
    abort.current?.abort();
  }, []);

  const value = useMemo<VoiceValue>(() => ({
    status, modelProgress, localOnly: LOCAL_ONLY, messages, error, context, setContext, toggle, close,
  }), [status, modelProgress, messages, error, context, toggle, close]);

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceValue {
  const value = useContext(VoiceContext);
  if (!value) throw new Error('VoiceProvider is required');
  return value;
}
