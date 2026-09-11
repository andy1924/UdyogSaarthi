import { describe, expect, it } from 'vitest';
import { normalizePeak } from './gain';

const peakOf = (samples: Float32Array) => Math.max(...Array.from(samples, Math.abs));

describe('normalizePeak', () => {
  it('lifts a quiet recording towards full scale', () => {
    const quiet = Float32Array.from([0.1, -0.05, 0.02]);
    expect(peakOf(normalizePeak(quiet, 0.9, 20))).toBeCloseTo(0.9, 5);
  });

  it('leaves an already healthy recording untouched', () => {
    const loud = Float32Array.from([0.8, -0.95]);
    expect(normalizePeak(loud)).toBe(loud);
  });

  it('leaves silence alone rather than amplifying the noise floor', () => {
    const silent = new Float32Array(8);
    expect(normalizePeak(silent)).toBe(silent);
  });

  it('caps the gain', () => {
    const whisper = Float32Array.from([0.001, -0.001]);
    expect(peakOf(normalizePeak(whisper, 0.9, 6))).toBeCloseTo(0.006, 6);
  });
});
