import type { RawProgressEvent } from './download-progress';
import {
  authHeaders, readSttConfig, readSttDevice,
  type RemoteSttConfig, type SttDevice,
} from './providers';
import { WHISPER_SAMPLE_RATE } from './resample';
import { encodeWav } from './wav';

// whisper-base cannot write Hindi: given Devanagari speech it emits Urdu script
// or an English translation. whisper-small returns the same audio in Devanagari,
// so it is the smallest checkpoint that works for both languages the app speaks.
export const WHISPER_MODEL = 'onnx-community/whisper-small';

export interface SttOptions {
  device: 'webgpu' | 'wasm';
  dtype: { encoder_model: 'fp32' | 'q8'; decoder_model_merged: 'fp32' | 'q8' };
}

export function pickSttOptions(device: SttDevice = 'wasm'): SttOptions {
  // Whisper runs on the CPU even when WebGPU exists. Measured on this machine
  // with a 4 s clip through the real pipeline:
  //   wasm  + q8   3.6 s load,  5.4 s transcribe, correct text, 238 MB
  //   webgpu+ fp32 227 s load,  8.2 s transcribe, correct text, 923 MB
  //   webgpu+ q8   3.0 s load, 129 s transcribe, hallucinated  <- quantized
  //                decoder is pathological on the WebGPU backend
  // So the CPU is both faster per turn and a quarter of the download, and it
  // leaves the GPU to the LLM and to Kokoro. Threading (and therefore the 5.4 s)
  // depends on the cross-origin isolation headers in vite.config.ts.
  // VITE_VOICE_STT_DEVICE=webgpu overrides this; it must stay fp32 to avoid
  // the hallucinating quantized decoder.
  return device === 'webgpu'
    ? { device: 'webgpu', dtype: { encoder_model: 'fp32', decoder_model_merged: 'fp32' } }
    : { device: 'wasm', dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' } };
}

export interface Transcriber {
  transcribe(audio: Float32Array, lang: string): Promise<string>;
}

export function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/** The pipeline generics are far wider than the shape we actually call. */
type SpeechRecognition = (
  input: Float32Array,
  options: Record<string, unknown>,
) => Promise<{ text?: string } | Array<{ text?: string }>>;

export async function createTranscriber(
  progress?: (event: RawProgressEvent) => void,
  config: RemoteSttConfig | null = readSttConfig(import.meta.env),
  device: SttDevice = readSttDevice(import.meta.env),
): Promise<Transcriber> {
  if (config) return createRemoteTranscriber(config);
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  const asr = (await pipeline('automatic-speech-recognition', WHISPER_MODEL, {
    ...pickSttOptions(device),
    ...(progress ? { progress_callback: progress } : {}),
  } as never)) as unknown as SpeechRecognition;

  return {
    async transcribe(audio, lang) {
      const result = await asr(audio, {
        language: lang,
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      const text = Array.isArray(result) ? result[0]?.text : result.text;
      return (text ?? '').replace(/\s+/g, ' ').trim();
    },
  };
}

/**
 * Uploads the turn as a 16 kHz mono WAV. The browser only reaches this when
 * VITE_VOICE_STT_URL is set, so the privacy copy in the orb switches with it.
 */
function createRemoteTranscriber(config: RemoteSttConfig): Transcriber {
  return {
    async transcribe(audio, lang) {
      const form = new FormData();
      form.append('file', encodeWav(audio, WHISPER_SAMPLE_RATE), 'turn.wav');
      form.append('model', config.model);
      form.append('language', lang);
      form.append('response_format', 'json');
      const response = await fetch(config.url, {
        method: 'POST',
        headers: authHeaders(config.key),
        body: form,
      });
      if (!response.ok) throw new Error(`stt ${response.status}`);
      const data = (await response.json()) as { text?: string };
      return (data.text ?? '').replace(/\s+/g, ' ').trim();
    },
  };
}
