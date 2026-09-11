/**
 * The main thread's half of the speech engine: ask the worker, wait for one
 * answer. The worker is created once, lazily, on the first model call.
 *
 * `new URL(..., import.meta.url)` is written inline on purpose - that is the
 * literal shape Vite's worker plugin understands, and computing the URL
 * anywhere else would leave the worker unbundled in a production build.
 */
import type { RawProgressEvent } from './download-progress';
import type { EngineRequest, EngineRequestPayload, EngineResponse, EngineTarget } from './engine-protocol';
import type { SttOptions, TtsEngine, TtsOptions } from './models';

type ProgressSink = (event: RawProgressEvent, target: EngineTarget) => void;

interface Pending {
  resolve: (message: EngineResponse) => void;
  reject: (error: Error) => void;
  onProgress?: ProgressSink;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function failAll(error: Error): void {
  for (const entry of pending.values()) entry.reject(error);
  pending.clear();
}

function engine(): Worker {
  if (worker) return worker;
  const created = new Worker(new URL('../../worker/voice-engine.ts', import.meta.url), { type: 'module' });
  created.onmessage = (event: MessageEvent<EngineResponse>) => {
    const message = event.data;
    const entry = pending.get(message.id);
    if (!entry) return;
    if (message.kind === 'progress') {
      entry.onProgress?.(message.event, message.target);
      return;
    }
    pending.delete(message.id);
    if (message.kind === 'error') entry.reject(new Error(message.message));
    else entry.resolve(message);
  };
  created.onerror = (event) => {
    // The worker itself failed to start (a bad bundle, a blocked blob URL), so
    // every request in flight goes with it; the next call builds a fresh one.
    failAll(new Error(event.message || 'The voice engine could not start.'));
    created.terminate();
    worker = null;
  };
  worker = created;
  return created;
}

function send(
  payload: EngineRequestPayload,
  transfer: Transferable[] = [],
  onProgress?: ProgressSink,
): Promise<EngineResponse> {
  const id = nextId += 1;
  return new Promise<EngineResponse>((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    try {
      engine().postMessage({ ...payload, id } satisfies EngineRequest, transfer);
    } catch (reason) {
      pending.delete(id);
      reject(reason instanceof Error ? reason : new Error(String(reason)));
    }
  });
}

export async function warmStt(
  options: SttOptions,
  onProgress?: (event: RawProgressEvent) => void,
): Promise<void> {
  await send({ kind: 'warmup', target: 'stt', options }, [], onProgress
    ? (event, target) => { if (target === 'stt') onProgress(event); }
    : undefined);
}

export async function warmTts(
  engineName: TtsEngine,
  voice: string | undefined,
  options: TtsOptions,
  onProgress?: (event: RawProgressEvent) => void,
): Promise<void> {
  await send(
    { kind: 'warmup', target: 'tts', options, engine: engineName, voice },
    [],
    onProgress ? (event, target) => { if (target === 'tts') onProgress(event); } : undefined,
  );
}

export async function transcribeAudio(
  audio: Float32Array,
  lang: string,
  options: SttOptions,
): Promise<string> {
  // The recording is transferred, not copied: it is the one large buffer on
  // this path and the main thread has already finished with it.
  const message = await send({ kind: 'transcribe', audio, lang, options }, [audio.buffer]);
  return message.kind === 'text' ? message.text : '';
}

export async function synthesizeSpeech(
  text: string,
  engineName: TtsEngine,
  voice: string | undefined,
  options: TtsOptions,
): Promise<{ samples: Float32Array; sampleRate: number }> {
  const message = await send({ kind: 'synthesize', text, engine: engineName, voice, options });
  if (message.kind !== 'audio') throw new Error('The voice engine returned no audio.');
  return { samples: message.samples, sampleRate: message.sampleRate };
}
