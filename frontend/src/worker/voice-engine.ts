/**
 * The only place a speech model is loaded.
 *
 * Whisper and Kokoro used to be built on the main thread, and building them is
 * seconds of solid, uninterruptible work: a measured 1.5 s long task on a warm
 * cache and far worse on a cold one, which is why the page stopped responding
 * and every spinner froze mid-turn. Moving both here means the page keeps
 * painting and the clicks keep landing while a few hundred megabytes arrive.
 *
 * Nothing here touches the microphone or the speakers: audio in and out stays
 * on the main thread. This worker only turns text into samples and samples into
 * text, in the browser, with no network call of its own.
 */
import type { RawProgressEvent } from '../lib/voice/download-progress';
import type { EngineRequest, EngineResponse, EngineTarget } from '../lib/voice/engine-protocol';
import {
  KOKORO_MODEL,
  MMS_HINDI_MODEL,
  TTS_WASM_FALLBACK,
  WHISPER_MODEL,
  downgradeTts,
  type SttOptions,
  type TtsEngine,
  type TtsOptions,
} from '../lib/voice/models';

/**
 * `self` is typed as a `Window` here, because the app compiles against the DOM
 * lib. This module only ever runs as a dedicated worker, so the two members it
 * uses are declared directly rather than pulling in the whole webworker lib.
 */
interface WorkerScope {
  postMessage(message: EngineResponse, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent<EngineRequest>) => void) | null;
}

const scope = self as unknown as WorkerScope;

type ProgressSink = (event: RawProgressEvent) => void;
type SpeechRecognition = (
  input: Float32Array,
  options: Record<string, unknown>,
) => Promise<{ text?: string } | Array<{ text?: string }>>;
type TextToSpeech = (
  text: string,
  options: Record<string, unknown>,
) => Promise<{ audio: Float32Array; sampling_rate: number }>;
type Synth = (text: string) => Promise<{ samples: Float32Array; sampleRate: number }>;

/**
 * One pipeline of each kind is kept alive for the life of the worker. The tab
 * holds a worker open across turns, so the second question does not pay for the
 * model again, and switching languages does not rebuild the one already there.
 */
let asr: SpeechRecognition | null = null;
let asrKey = '';
let synth: Synth | null = null;
let synthKey = '';
let ttsDowngraded = false;

const send = (message: EngineResponse, transfer?: Transferable[]) => scope.postMessage(message, transfer);

const progressChannel = (id: number, target: EngineTarget): ProgressSink =>
  (event) => send({ id, kind: 'progress', target, event });

async function warmStt(options: SttOptions, progress?: ProgressSink): Promise<void> {
  const key = JSON.stringify(options);
  if (asr && asrKey === key) return;
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  asr = (await pipeline('automatic-speech-recognition', WHISPER_MODEL, {
    ...options,
    ...(progress ? { progress_callback: progress } : {}),
  } as never)) as unknown as SpeechRecognition;
  asrKey = key;
}

async function warmTts(
  engine: TtsEngine,
  voice: string | undefined,
  requested: TtsOptions,
  progress?: ProgressSink,
): Promise<void> {
  const options = downgradeTts(requested, ttsDowngraded);
  const key = `${engine}:${voice ?? ''}:${JSON.stringify(options)}`;
  if (synth && synthKey === key) return;
  if (engine === 'mms') {
    const { pipeline, env } = await import('@huggingface/transformers');
    env.allowLocalModels = false;
    const model = (await pipeline('text-to-speech', MMS_HINDI_MODEL, {
      ...options,
      ...(progress ? { progress_callback: progress } : {}),
    } as never)) as unknown as TextToSpeech;
    synth = async (text) => {
      const output = await model(text, {});
      return { samples: output.audio, sampleRate: output.sampling_rate };
    };
  } else {
    const { KokoroTTS } = await import('kokoro-js');
    const model = await KokoroTTS.from_pretrained(KOKORO_MODEL, {
      ...options,
      ...(progress ? { progress_callback: progress } : {}),
    } as never);
    synth = async (text) => {
      // Kokoro phonemizes with an English-only eSpeak build; that is why the
      // Hindi voice is MMS and never reaches this branch.
      const audio = await model.generate(text, { voice: voice ?? 'af_heart' } as never);
      return { samples: audio.audio, sampleRate: audio.sampling_rate };
    };
  }
  synthKey = key;
}

/**
 * Run a TTS step, giving a failed WebGPU build one second chance on wasm.
 *
 * The downgrade is sticky: `ttsDowngraded` keeps every later request on the CPU
 * instead of paying for the same failed GPU build each turn, and the cached
 * synth is dropped so the retry really does rebuild the model. Only Kokoro ever
 * asks for the GPU, so the Hindi path never reaches the retry.
 */
async function withGpuFallback<T>(
  requested: TtsOptions,
  run: (options: TtsOptions) => Promise<T>,
): Promise<T> {
  try {
    return await run(downgradeTts(requested, ttsDowngraded));
  } catch (reason) {
    if (ttsDowngraded || requested.device !== 'webgpu') throw reason;
    ttsDowngraded = true;
    synth = null;
    synthKey = '';
    return run(TTS_WASM_FALLBACK);
  }
}

scope.onmessage = (event: MessageEvent<EngineRequest>) => {
  const request = event.data;
  void (async () => {
    try {
      switch (request.kind) {
        case 'warmup': {
          if (request.target === 'stt') {
            await warmStt(request.options as SttOptions, progressChannel(request.id, 'stt'));
          } else {
            await withGpuFallback(request.options as TtsOptions, (options) =>
              warmTts(
                request.engine ?? 'kokoro',
                request.voice,
                options,
                progressChannel(request.id, 'tts'),
              ));
          }
          send({ id: request.id, kind: 'ready' });
          break;
        }
        case 'transcribe': {
          await warmStt(request.options, progressChannel(request.id, 'stt'));
          const result = await asr!(request.audio, {
            language: request.lang,
            task: 'transcribe',
            chunk_length_s: 30,
            stride_length_s: 5,
          });
          const text = Array.isArray(result) ? result[0]?.text : result.text;
          send({ id: request.id, kind: 'text', text: (text ?? '').replace(/\s+/g, ' ').trim() });
          break;
        }
        case 'synthesize': {
          const { samples, sampleRate } = await withGpuFallback(request.options, async (options) => {
            await warmTts(request.engine, request.voice, options, progressChannel(request.id, 'tts'));
            return synth!(request.text);
          });
          // Hand the samples over rather than copying them: a reply is a dozen
          // clips, and a structured clone of each one is pure overhead.
          send({ id: request.id, kind: 'audio', samples, sampleRate }, [samples.buffer]);
          break;
        }
      }
    } catch (reason) {
      send({
        id: request.id,
        kind: 'error',
        message: reason instanceof Error ? reason.message : String(reason),
      });
    }
  })();
};
