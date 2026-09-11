import { readSttDevice, type SttDevice } from './providers';

/**
 * The checkpoints, and which backend each one runs on. This module is the one
 * place both sides of the worker boundary read: the worker loads them, the
 * client decides the options and hands them over. Keeping it separate is what
 * stops the worker bundle from pulling in the client code.
 */

/**
 * whisper-base cannot write Hindi: given Devanagari speech it emits Urdu script
 * or an English translation. whisper-small returns the same audio in Devanagari,
 * so it is the smallest checkpoint that works for both languages the app speaks.
 */
export const WHISPER_MODEL = 'onnx-community/whisper-small';
export const KOKORO_MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
export const MMS_HINDI_MODEL = 'Xenova/mms-tts-hin';

/** Which on-device engine speaks a language. Kokoro speaks English; MMS Hindi. */
export type TtsEngine = 'kokoro' | 'mms';

export interface SttOptions {
  device: 'webgpu' | 'wasm';
  dtype: { encoder_model: 'fp32' | 'q8'; decoder_model_merged: 'fp32' | 'q8' };
}

export interface TtsOptions {
  device: 'webgpu' | 'wasm';
  dtype: 'fp32' | 'q8';
}

/**
 * The engine to run a TTS request on once a WebGPU build has already failed in
 * this tab: the same Kokoro checkpoint on the CPU, just slower.
 */
export const TTS_WASM_FALLBACK: TtsOptions = { device: 'wasm', dtype: 'q8' };

export function pickTtsOptions(hasWebGPU: boolean): TtsOptions {
  return hasWebGPU ? { device: 'webgpu', dtype: 'fp32' } : TTS_WASM_FALLBACK;
}

/**
 * A browser can advertise WebGPU and still refuse to build the session -
 * Safari, and any blocklisted driver, do exactly that - and Kokoro is the only
 * engine that asks for the GPU. Without this the English voice would simply be
 * dead there, with no way back; the first failure downgrades every later
 * request in the tab to wasm.
 */
export function downgradeTts(options: TtsOptions, downgraded: boolean): TtsOptions {
  return downgraded && options.device === 'webgpu' ? TTS_WASM_FALLBACK : options;
}

export function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
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
export const MMS_TTS_OPTIONS: TtsOptions = { device: 'wasm', dtype: 'q8' };

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

export { readSttDevice };
export type { SttDevice };
