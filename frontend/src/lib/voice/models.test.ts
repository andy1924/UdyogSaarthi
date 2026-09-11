import { describe, expect, it } from 'vitest';
import { MMS_TTS_OPTIONS, TTS_WASM_FALLBACK, downgradeTts, pickTtsOptions } from './models';

describe('downgradeTts', () => {
  it('leaves the chosen backend alone until a GPU build has failed', () => {
    const gpu = pickTtsOptions(true);
    expect(downgradeTts(gpu, false)).toEqual(gpu);
  });

  it('moves a WebGPU request to the wasm fallback once one has failed', () => {
    expect(downgradeTts(pickTtsOptions(true), true)).toEqual(TTS_WASM_FALLBACK);
    expect(TTS_WASM_FALLBACK.device).toBe('wasm');
  });

  it('never touches a request that was already on the CPU', () => {
    expect(downgradeTts(MMS_TTS_OPTIONS, true)).toBe(MMS_TTS_OPTIONS);
  });

  it('is a no-op on a machine that never had WebGPU', () => {
    expect(downgradeTts(pickTtsOptions(false), false)).toEqual(TTS_WASM_FALLBACK);
  });
});
