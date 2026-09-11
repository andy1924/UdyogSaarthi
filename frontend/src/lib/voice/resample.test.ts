import { describe, expect, it } from 'vitest';
import { downsampleTo16k } from './resample';

describe('downsampleTo16k', () => {
  it('returns the input untouched at 16 kHz', () => {
    const input = new Float32Array([0, 0.5, -0.5, 1]);
    expect(Array.from(downsampleTo16k(input, 16_000))).toEqual([0, 0.5, -0.5, 1]);
  });

  it('halves the frame count from 32 kHz', () => {
    expect(downsampleTo16k(new Float32Array(3200), 32_000)).toHaveLength(1600);
  });

  it('resamples 48 kHz to a third of the length', () => {
    expect(downsampleTo16k(new Float32Array(4800), 48_000)).toHaveLength(1600);
  });

  it('preserves a constant signal', () => {
    const output = downsampleTo16k(new Float32Array(480).fill(0.25), 48_000);
    expect(output).toHaveLength(160);
    expect(output.every((value) => Math.abs(value - 0.25) < 1e-6)).toBe(true);
  });

  it('handles an empty buffer', () => {
    expect(downsampleTo16k(new Float32Array(0), 48_000)).toHaveLength(0);
  });
});
