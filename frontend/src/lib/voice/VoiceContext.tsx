import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { useLanguage } from '../LanguageContext';
import { NO_SPEECH } from './answers';
import { audioHasSpeech, isSubstantiveTranscript } from './speech-gate';
import { readChatConfig, requestReply } from './chat';
import { resolveVoiceLanguage, type ResolvedVoiceLanguage, type VoiceEngine } from './languages';
import { createProgressTracker, type ProgressSnapshot } from './download-progress';
import { createRecorder, type Recorder } from './recorder';
import { Endpointer } from './endpoint';
import { createSpeaker, type Speaker } from './tts';
import { createTranscriber, type Transcriber } from './stt';
import { toPlainText } from './markdown';
import { clipPage, pageText } from './context';
import { replyChunks } from './spoken';
import type { StepContext } from './context';

export type VoiceStatus = 'idle' | 'preparing' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface VoiceValue {
  status: VoiceStatus;
  modelProgress: ProgressSnapshot;
  /** True when the assembled answer comes from a remote model. Audio still does not. */
  brainRemote: boolean;
  messages: VoiceMessage[];
  error: string | null;
  context: StepContext;
  setContext: (context: StepContext) => void;
  /** Smoothed 0-1 level of whoever is talking, for the orb. 0 when idle. */
  getLevel: () => number;
  /** Whether the transcript panel is showing. */
  panelOpen: boolean;
  /** Sentence of the agent's reply being spoken, or -1 when nothing is. */
  spokenIndex: number;
  openPanel: () => void;
  closePanel: () => void;
  toggle: () => void;
  /** Stop the agent's voice without closing the assistant. */
  stopSpeaking: () => void;
  close: () => void;
}

const VoiceContext = createContext<VoiceValue | null>(null);

const VOICE_ENV = import.meta.env;
/**
 * True when the answer comes from a model over the network. Speech recognition
 * and speech synthesis are local only, so what leaves is the recognised text
 * and nothing else. The orb says exactly that, because "your audio never leaves
 * this device" is easy to misread as "nothing leaves this device".
 */
const BRAIN_REMOTE = Boolean(readChatConfig(VOICE_ENV).url);

const startFailed = 'Voice could not start. Your audio stays on this device; please try again.';

/** Turns a microphone failure into something the user can act on. */
function describeVoiceFailure(reason: unknown): string {
  const name = reason instanceof DOMException ? reason.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Microphone access is blocked for this site. Allow the microphone in your browser settings, then try again.';
  }
  if (name === 'NotFoundError') return 'No microphone was found on this device.';
  if (name === 'NotReadableError') return 'Another app is using the microphone. Close it and try again.';
  // Anything else is unexpected, so keep the code: it is the only clue left.
  return name ? `${startFailed} (${name})` : startFailed;
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [modelProgress, setModelProgress] = useState<ProgressSnapshot>({ stt: null, tts: null });
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Which sentence of the reply the voice is on, so the panel can follow it.
  const [spokenIndex, setSpokenIndex] = useState(-1);
  // Lives here rather than in the orb so the navbar mic opens the same panel:
  // pressing that mic otherwise gave no sign of what it was listening for.
  const [panelOpen, setPanelOpen] = useState(false);
  const [context, setContext] = useState<StepContext>({ step: 1, stepTitle: 'Location' });

  const transcriber = useRef<Transcriber | null>(null);
  const speaker = useRef<{ engine: VoiceEngine; speaker: Speaker } | null>(null);
  const recorder = useRef<Recorder | null>(null);
  const endpointer = useRef(new Endpointer());
  const abort = useRef<AbortController | null>(null);
  const turning = useRef(false);
  // A tap storm must not arm the microphone twice: two overlapping startTurn
  // calls would each begin a MediaRecorder on the same stream and orphan one.
  const starting = useRef(false);
  const level = useRef(0);
  const statusRef = useRef<VoiceStatus>('idle');
  // Bumped whenever a turn is interrupted, so the turn being replaced cannot
  // reset the status on its way out.
  const turnId = useRef(0);
  // The turn keeps the language it started with, so a header switch mid-turn
  // cannot make the reply come out in the wrong voice.
  const turnVoice = useRef<ResolvedVoiceLanguage>(resolveVoiceLanguage(lang));

  const push = useCallback((message: Omit<VoiceMessage, 'id'>) => {
    setMessages((all) => [...all, { ...message, id: crypto.randomUUID() }]);
  }, []);

  const getLevel = useCallback(() => level.current, []);
  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  // The level callback and the barge-in check both run outside React's render
  // pass, where they would otherwise read a stale status.
  useEffect(() => { statusRef.current = status; }, [status]);

  /**
   * Attack/release smoothing shared by the mic and the spoken reply, so the
   * orb swells with a voice and settles after it instead of twitching on every
   * analyser frame.
   */
  const trackLevel = useCallback((raw: number) => {
    level.current = level.current * 0.72 + Math.min(1, raw / 0.12) * 0.28;
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
      const built = await createSpeaker(voice, tracker.callbackFor('tts'));
      built.onLevel(trackLevel);
      speaker.current = { engine: voice.engine, speaker: built };
    }
  }, [trackLevel]);

  const runTurn = useCallback(async (audio: Float32Array) => {
    const voice = turnVoice.current;
    if (!transcriber.current) return;
    const id = ++turnId.current;
    // Blank recordings never reach Whisper: it hallucinates whole sentences
    // ("Thank you") on room tone once normalised, and the hallucination would
    // then burn a brain call on top of the wasted transcription.
    if (!audioHasSpeech(audio)) {
      push({ role: 'assistant', text: NO_SPEECH[voice.lang === 'hi' ? 'hi' : 'en'] });
      setStatus('idle');
      return;
    }
    const text = await transcriber.current.transcribe(audio, voice.stt);
    // Interrupted while transcribing: the replacement turn owns the orb now.
    if (turnId.current !== id) return;
    // Thumps, laughs and fragments never reach the brain. A chat call costs
    // tokens and always answers noise with nonsense, so the turn ends on the
    // local guidance line instead. Going quiet with no explanation reads as a
    // freeze, so say something rather than nothing.
    if (!isSubstantiveTranscript(text)) {
      push({ role: 'assistant', text: NO_SPEECH[voice.lang === 'hi' ? 'hi' : 'en'] });
      setStatus('idle');
      return;
    }
    push({ role: 'user', text });
    setStatus('thinking');
    abort.current = new AbortController();
    // Read the page at ask time rather than keeping a copy in state: the
    // applicant asks about what is on screen now, and a snapshot taken when the
    // step was set goes stale as soon as they type into a field.
    const snapshot = clipPage(pageText());
    const reply = await requestReply({
      question: text,
      context: { ...context, pageText: snapshot },
      lang: voice.lang,
      signal: abort.current.signal,
    });
    // Interrupted while thinking: the replacement turn owns the orb now.
    if (turnId.current !== id) return;
    push({ role: 'assistant', text: reply });
    if (!speaker.current) { setStatus('idle'); return; }
    // The panel and the voice are driven by the same list, in the same order: the
    // highlight moves when a line's audio actually starts. A fraction of the
    // clip cannot say which sentence is being spoken once the reply is several
    // clips long, and it used to run a whole sentence ahead of the voice.
    const chunks = replyChunks(reply);
    setSpokenIndex(-1);
    speaker.current.speaker.onSentence((index) => {
      if (turnId.current !== id) return;
      setSpokenIndex((current) => (current === index ? current : index));
    });
    setStatus('speaking');
    // The panel shows the formatting; the voice gets the sentence under it.
    await speaker.current.speaker.speak(chunks.map((chunk) => toPlainText(chunk.text)));
    if (turnId.current !== id) return;
    setSpokenIndex(-1);
    setStatus('idle');
  }, [context, push]);

  const finishTurn = useCallback(async () => {
    if (turning.current || !recorder.current) return;
    turning.current = true;
    const id = turnId.current;
    try {
      const audio = await recorder.current.stop();
      // The reply no longer needs the microphone, so the device goes back to
      // the browser as soon as the turn is captured.
      recorder.current.release();
      level.current = 0;
      // The microphone is closed, so the lock can go: a barge-in from the next
      // turn must be able to finish while this turn is still thinking.
      turning.current = false;
      // Superseded while the recording was closing (interrupted or hidden):
      // drop the audio rather than answering a turn nobody owns.
      if (turnId.current !== id) return;
      // Honest caption through the slow part: Whisper and the brain take
      // seconds, and "Tap to send" until the reply appears reads as hung.
      setStatus('thinking');
      await runTurn(audio);
    } catch {
      recorder.current?.release();
      setError('That turn could not be processed. Please try again.');
      setStatus('error');
    } finally {
      turning.current = false;
    }
  }, [runTurn]);

  /**
   * Cut the current turn loose without naming the next status: the caller
   * decides whether the orb goes idle or straight back to listening. Bumping
   * the turn id makes the abandoned turn's late promises no-ops.
   */
  const interrupt = useCallback(() => {
    turnId.current += 1;
    speaker.current?.speaker.stop();
    abort.current?.abort();
    abort.current = null;
    level.current = 0;
    setSpokenIndex(-1);
  }, []);

  /**
   * Stop the agent mid-sentence. A tap on the red stop button lands here; the
   * turn keeps its id, so the interrupted `speak()` cannot set the status on
   * its way out.
   */
  const stopSpeaking = useCallback(() => {
    interrupt();
    setStatus('idle');
  }, [interrupt]);

  /**
   * Live level from the microphone. It drives the endpointer, which is what
   * closes the turn on its own once the user stops talking. It is deliberately
   * not used to detect speech over the reply: a room is loud enough that the
   * agent kept cutting itself off, so interrupting is the stop button or a tap
   * on the orb.
   */
  const handleLevel = useCallback((raw: number) => {
    if (statusRef.current !== 'listening') return;
    // The orb gets a normalised, smoothed level; the endpointer keeps the raw
    // RMS so its threshold stays in real units.
    trackLevel(raw);
    const event = endpointer.current.push(raw);
    if (event === 'speech-end' || event === 'timeout') void finishTurn();
  }, [finishTurn, trackLevel]);

  const startTurn = useCallback(async () => {
    if (starting.current) return;
    starting.current = true;
    const voice = resolveVoiceLanguage(lang);
    turnVoice.current = voice;
    setError(null);
    if (!recorder.current) recorder.current = createRecorder();
    try {
      // Ask for the microphone before the models. The prompt then belongs to
      // this click, and a first run does not stash a granted permission behind
      // a multi-minute download where it reads as still being requested.
      await recorder.current.arm();
      setStatus('preparing');
      await prepare(voice, setModelProgress);
      endpointer.current.reset();
      level.current = 0;
      recorder.current.onLevel(handleLevel);
      await recorder.current.begin();
      setStatus('listening');
    } catch (reason) {
      recorder.current?.release();
      setError(describeVoiceFailure(reason));
      setStatus('error');
    } finally {
      starting.current = false;
    }
  }, [handleLevel, lang, prepare]);

  const toggle = useCallback(async () => {
    // The orb always means "listen to me": cutting the agent off drops
    // straight back into a fresh turn instead of parking on idle.
    if (status === 'speaking' || status === 'thinking') {
      interrupt();
      await startTurn();
      return;
    }
    if (status === 'listening') { await finishTurn(); return; }
    if (status === 'preparing') return;
    await startTurn();
  }, [finishTurn, interrupt, startTurn, status]);

  const close = useCallback(() => {
    turnId.current += 1;
    recorder.current?.release();
    level.current = 0;
    speaker.current?.speaker.stop();
    abort.current?.abort();
    setSpokenIndex(-1);
    setStatus('idle');
  }, []);

  useEffect(() => () => {
    recorder.current?.release();
    speaker.current?.speaker.stop();
    abort.current?.abort();
  }, []);

  const value = useMemo<VoiceValue>(() => ({
    status, modelProgress, brainRemote: BRAIN_REMOTE,
    messages, error, context, setContext,
    getLevel, panelOpen, openPanel, closePanel, toggle, stopSpeaking, close, spokenIndex,
  }), [status, modelProgress, messages, error, context, getLevel, panelOpen, openPanel, closePanel, toggle, stopSpeaking, close, spokenIndex]);

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceValue {
  const value = useContext(VoiceContext);
  if (!value) throw new Error('VoiceProvider is required');
  return value;
}
