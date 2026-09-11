import { describe, expect, it } from 'vitest';
import { KOKORO_MODEL, MMS_HINDI_MODEL, pickTtsOptions } from './tts';

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
});
