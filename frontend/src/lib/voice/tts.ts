import { synthesizeSpeech, warmTts } from './engine';
import type { VoiceLanguage } from './languages';
import { hasWebGPU, MMS_TTS_OPTIONS, pickTtsOptions, type TtsOptions } from './models';
import { speechPlan } from './spoken';
import { encodeWav } from './wav';
import type { RawProgressEvent } from './download-progress';

export { KOKORO_MODEL, MMS_HINDI_MODEL, MMS_TTS_OPTIONS, pickTtsOptions } from './models';
export type { TtsOptions } from './models';

/**
 * Ten minutes of speech, after which the speaker stops.
 *
 * The engine itself has no limit once the text is cut into pieces the tokenizer
 * cannot truncate - see `SPEECH_CHUNK_CHARS` - so this is only a stop for a
 * reply that would otherwise keep talking after the reader has walked away.
 */
export const SPEAK_MAX_MS = 10 * 60 * 1000;

/**
 * Start the audio context, or give up on it quickly.
 *
 * `resume()` never settles while the browser is still waiting for a user
 * gesture, and awaiting that promise left the speaker stuck on its first clip
 * with the orb on "speaking" and nothing to hear. A short race puts playback
 * back on the plain element, which is the path that works without the analyser.
 */
const isRunning = (context: AudioContext) => context.state === 'running';

// Browsers only allow an AudioContext to be resumed while handling a user
// gesture. Model downloads and speech synthesis happen after that gesture, so
// keep one context that was created/resumed synchronously by the button press.
let sharedContext: AudioContext | null = null;

/** Prime playback while the click/tap activation is still alive. */
export function primeAudio(): void {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return;
  try {
    sharedContext ??= new AudioContext();
    if (!isRunning(sharedContext)) void sharedContext.resume().catch(() => {});
  } catch {
    // The normal HTMLAudioElement fallback will still be attempted later.
  }
}

async function resume(context: AudioContext): Promise<boolean> {
  if (isRunning(context)) return true;
  const started = await Promise.race([
    context.resume().then(() => true).catch(() => false),
    new Promise<boolean>((resolve) => { setTimeout(() => resolve(false), 400); }),
  ]);
  return started && isRunning(context);
}

export interface Speaker {
  /**
   * Speak the lines in order. `onSentence` fires with the index of the line
   * whose audio has just started, which is what keeps the panel and the voice
   * on the same sentence instead of guessing from a playback fraction.
   */
  speak(lines: string[]): Promise<void>;
  stop(): void;
  /** Live RMS of whatever is being spoken, so the orb can follow the voice. */
  onLevel(callback: (rms: number) => void): void;
  /** Index of the line now being spoken, in the array handed to `speak`. */
  onSentence(callback: (index: number) => void): void;
}

/**
 * MMS-TTS is a VITS model and VITS does not run on WebGPU. Its duration
 * predictor gathers with an int64 tensor and the backend rejects the kernel
 * outright:
 *
 *   [WebGPU] Kernel "[GatherND] /duration_predictor/flows.4/GatherND" failed.
 *   Error: Unsupported data type: 7
 *
 * English never noticed, because Kokoro is a different architecture and does run
 * on the GPU. Hindi failed on every WebGPU browser, which reads as "the Hindi
 * voice does not work". WASM is slower, but it is the one backend that speaks
 * Hindi at all, and the quantized checkpoint is a third of the fp32 download.
 */
function ttsOptions(language: VoiceLanguage): TtsOptions {
  return language.engine === 'mms' ? MMS_TTS_OPTIONS : pickTtsOptions(hasWebGPU());
}

/**
 * Turns text into playable audio with an on-device model.
 *
 * The model is loaded in the voice worker (see `engine.ts`), so a first run
 * downloads a few hundred megabytes without freezing the page, and every clip
 * after the first is synthesised off the main thread while the previous one is
 * still playing.
 */
export async function createSpeaker(
  language: VoiceLanguage,
  progress?: (event: RawProgressEvent) => void,
): Promise<Speaker> {
  const options = ttsOptions(language);
  // `createSpeaker` is entered synchronously from a click handler, so prime
  // before the first await as a second line of defence for callers that do not
  // explicitly call primeAudio().
  primeAudio();
  await warmTts(language.engine, language.voice, options, progress);

  let context: AudioContext | null = sharedContext;
  let element: HTMLAudioElement | null = null;
  let source: MediaElementAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let frame = 0;
  let endPlayback: (() => void) | null = null;
  let objectUrl: string | null = null;
  let cancelled = false;
  // Bumped on every stop, so a clip that finishes late cannot restart the loop.
  let token = 0;
  let levelSink: (rms: number) => void = () => {};
  let sentenceSink: (index: number) => void = () => {};

  const releaseClip = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    levelSink(0);
    source?.disconnect();
    source = null;
    analyser?.disconnect();
    analyser = null;
    element = null;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    endPlayback = null;
  };

  /**
   * Route playback through an analyser so the orb can follow the spoken voice.
   * Returns false when that is unavailable for any reason, and the caller then
   * plays the element normally. The context is created on first playback, well
   * after the click that started the turn, so `resume` only ever confirms a
   * sticky user activation.
   */
  const playThroughAnalyser = async (audio: HTMLAudioElement): Promise<boolean> => {
    try {
      context ??= sharedContext ?? new AudioContext();
      sharedContext = context;
      if (!(await resume(context))) return false;
      analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.connect(context.destination);
      source = context.createMediaElementSource(audio);
      source.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      const sample = () => {
        analyser!.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (const value of buffer) sum += value * value;
        levelSink(Math.sqrt(sum / buffer.length));
        frame = requestAnimationFrame(sample);
      };
      sample();
      await audio.play();
      return true;
    } catch {
      return false;
    }
  };

  const play = (blob: Blob) => new Promise<void>((resolve) => {
    objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    element = audio;
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      audio.pause();
      releaseClip();
      resolve();
    };
    endPlayback = done;
    audio.onended = done;
    audio.onerror = done;
    void playThroughAnalyser(audio).then((played) => {
      if (!played) void audio.play().catch(() => done());
    });
  });

  return {
    async speak(lines) {
      const id = (token += 1);
      cancelled = false;
      const plan = speechPlan(lines);
      if (!plan.length) return;

      // At most two clips are alive: the one about to play and the next one.
      // One ahead is what hides synthesis behind playback, and one only keeps a
      // long reply from pinning a dozen clips in memory.
      const renders = new Map<number, Promise<Blob>>();
      const request = (index: number) => {
        if (index >= plan.length || renders.has(index)) return;
        const rendered = synthesizeSpeech(plan[index].text, language.engine, language.voice, options)
          .then(({ samples, sampleRate }) => encodeWav(samples, sampleRate));
        // A rejected prefetch nobody awaits must not surface as an unhandled
        // rejection; the loop still sees the same promise where it awaits it.
        rendered.catch(() => {});
        renders.set(index, rendered);
      };
      request(0);
      request(1);

      const startedAt = Date.now();
      let announced = -1;
      for (let index = 0; index < plan.length; index += 1) {
        const rendered = renders.get(index);
        let blob: Blob;
        try {
          blob = await rendered!;
        } catch (reason) {
          // stop() during synthesis is a cancel, not a failure.
          if (cancelled || token !== id) return;
          throw reason;
        }
        renders.delete(index);
        if (cancelled || token !== id) return;
        if (Date.now() - startedAt >= SPEAK_MAX_MS) return;
        if (plan[index].line !== announced) {
          announced = plan[index].line;
          sentenceSink(announced);
        }
        request(index + 2);
        await play(blob);
      }
    },
    stop() {
      token += 1;
      cancelled = true;
      element?.pause();
      endPlayback?.();
    },
    onLevel(callback) { levelSink = callback; },
    onSentence(callback) { sentenceSink = callback; },
  };
}
