import { describe, expect, it } from 'vitest';
import { KOKORO_MODEL, MMS_HINDI_MODEL, MMS_TTS_OPTIONS, SPEAK_MAX_MS, pickTtsOptions } from './tts';

describe('pickTtsOptions', () => {
  it('uses fp32 on webgpu, as kokoro-js recommends', () => {
    expect(pickTtsOptions(true)).toEqual({ device: 'webgpu', dtype: 'fp32' });
  });

  it('uses quantized wasm without webgpu', () => {
    expect(pickTtsOptions(false)).toEqual({ device: 'wasm', dtype: 'q8' });
  });

  it('pins the multilingual kokoro checkpoint', () => {
    expect(KOKORO_MODEL).toBe('onnx-community/Kokoro-82M-v1.0-ONNX');
  });

  it('pins the Hindi MMS checkpoint for the non-English voice', () => {
    expect(MMS_HINDI_MODEL).toBe('Xenova/mms-tts-hin');
  });

  it('never puts the Hindi voice on webgpu, where the VITS kernels fail', () => {
    expect(MMS_TTS_OPTIONS.device).toBe('wasm');
    // The GPU path a WebGPU machine would otherwise take, for contrast.
    expect(pickTtsOptions(true).device).toBe('webgpu');
  });

  it('lets a long reply run for ten minutes before the speaker gives up', () => {
    expect(SPEAK_MAX_MS).toBe(10 * 60 * 1000);
  });
});
