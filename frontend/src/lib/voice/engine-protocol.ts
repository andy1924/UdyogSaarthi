import type { RawProgressEvent } from './download-progress';
import type { SttOptions, TtsEngine, TtsOptions } from './models';

/** The two models the voice layer owns, for progress and for errors. */
export type EngineTarget = 'stt' | 'tts';

/**
 * The main thread never loads a model: it sends one of these to the engine
 * worker and waits. That is what keeps the page responsive while a few hundred
 * megabytes arrive, and it is also what lets the next sentence be synthesised
 * while the current one is still playing.
 */
export type EngineRequest = EngineRequestPayload & { id: number };

export type EngineRequestPayload =
  | { kind: 'warmup'; target: EngineTarget; options: SttOptions | TtsOptions; engine?: TtsEngine; voice?: string }
  | { kind: 'transcribe'; audio: Float32Array; lang: string; options: SttOptions }
  | { kind: 'synthesize'; text: string; engine: TtsEngine; voice?: string; options: TtsOptions };

export type EngineResponse =
  | { id: number; kind: 'progress'; target: EngineTarget; event: RawProgressEvent }
  | { id: number; kind: 'ready' }
  | { id: number; kind: 'text'; text: string }
  | { id: number; kind: 'audio'; samples: Float32Array; sampleRate: number }
  | { id: number; kind: 'error'; message: string };
