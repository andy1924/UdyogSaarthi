import type { RawProgressEvent } from './download-progress';
import type { VoiceLanguage } from './languages';
import { hasWebGPU as detectWebGPU } from './stt';
import {
  authHeaders, readTtsConfig, type RemoteTtsConfig,
} from './providers';
import { encodeWav } from './wav';

export const KOKORO_MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
export const MMS_HINDI_MODEL = 'Xenova/mms-tts-hin';

export interface TtsOptions {
  device: 'webgpu' | 'wasm';
  dtype: 'fp32' | 'q8';
}

export function pickTtsOptions(hasWebGPU: boolean): TtsOptions {
  return hasWebGPU ? { device: 'webgpu', dtype: 'fp32' } : { device: 'wasm', dtype: 'q8' };
}

type Synth = (text: string) => Promise<{ samples: Float32Array; sampleRate: number }>;

/**
 * Kokoro speaks English. kokoro-js phonemizes with an English-only eSpeak
 * build, so this engine is never used for Hindi.
 */
async function createKokoroSynth(
  voice: string,
  progress?: (event: RawProgressEvent) => void,
): Promise<Synth> {
  const { KokoroTTS } = await import('kokoro-js');
  const tts = await KokoroTTS.from_pretrained(KOKORO_MODEL, {
    ...pickTtsOptions(detectWebGPU()),
    ...(progress ? { progress_callback: progress } : {}),
  } as never);
  return async (text) => {
    const audio = await tts.generate(text, { voice } as never);
    return { samples: audio.audio, sampleRate: audio.sampling_rate };
  };
}

/** MMS-TTS is a VITS model with a Devanagari vocabulary, so it needs no G2P. */
async function createMmsSynth(
  progress?: (event: RawProgressEvent) => void,
): Promise<Synth> {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  const tts = await pipeline('text-to-speech', MMS_HINDI_MODEL, {
    ...pickTtsOptions(detectWebGPU()),
    ...(progress ? { progress_callback: progress } : {}),
  } as never);
  return async (text) => {
    const output = await tts(text, {});
    return { samples: output.audio, sampleRate: output.sampling_rate };
  };
}

export interface Speaker {
  /** Speak `text` aloud; resolves when playback ends or is stopped. */
  speak(text: string): Promise<void>;
  stop(): void;
}

/** Turns text into playable audio: local synthesis or a remote endpoint. */
type Render = (text: string) => Promise<Blob>;

async function renderRemote(
  config: RemoteTtsConfig,
  language: VoiceLanguage,
  text: string,
  signal: AbortSignal,
): Promise<Blob> {
  const response = await fetch(config.url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', ...authHeaders(config.key) },
    body: JSON.stringify({
      model: config.model,
      input: text,
      voice: config.voice || language.voice || 'af_heart',
      response_format: 'wav',
    }),
  });
  if (!response.ok) throw new Error(`tts ${response.status}`);
  return response.blob();
}

export async function createSpeaker(
  language: VoiceLanguage,
  progress?: (event: RawProgressEvent) => void,
  config: RemoteTtsConfig | null = readTtsConfig(import.meta.env),
): Promise<Speaker> {
  let abort: AbortController | null = null;
  let render: Render;
  if (config) {
    render = (text) => {
      abort = new AbortController();
      return renderRemote(config, language, text, abort.signal);
    };
  } else {
    const synth = language.engine === 'mms'
      ? await createMmsSynth(progress)
      : await createKokoroSynth(language.voice ?? 'af_heart', progress);
    render = async (text) => {
      const { samples, sampleRate } = await synth(text);
      return encodeWav(samples, sampleRate);
    };
  }

  let element: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  let finish: (() => void) | null = null;
  let cancelled = false;

  const release = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    element = null;
    finish = null;
  };

  return {
    async speak(text) {
      cancelled = false;
      let blob: Blob;
      try {
        blob = await render(text);
      } catch (reason) {
        // stop() aborts an in-flight request; that is a cancel, not a failure.
        if (cancelled) return;
        throw reason;
      }
      objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      element = audio;
      await new Promise<void>((resolve) => {
        finish = () => { release(); resolve(); };
        audio.onended = () => finish?.();
        audio.onerror = () => finish?.();
        void audio.play().catch(() => finish?.());
      });
    },
    stop() {
      cancelled = true;
      abort?.abort();
      element?.pause();
      finish?.();
    },
  };
}
