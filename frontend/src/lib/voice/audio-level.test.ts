import { afterEach, describe, expect, it, vi } from 'vitest';
import { rmsOf, startLevelLoop } from './audio-level';

describe('rmsOf', () => {
  it('returns zero for silence', () => {
    expect(rmsOf(new Float32Array(4))).toBe(0);
  });

  it('returns the RMS of the samples', () => {
    expect(rmsOf(Float32Array.from([1, -1, 1, -1]))).toBeCloseTo(1, 5);
  });
});

describe('startLevelLoop', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('reads the analyser once per frame and resolves RMS via the current sink', () => {
    const frames: number[] = [];
    const levels: number[] = [];
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frames.push(1);
      if (frames.length < 3) callback(0);
      return frames.length;
    }));
    const analyser = {
      fftSize: 4,
      getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0.5),
    } as unknown as AnalyserNode;

    // Reassigned mid-loop, mirroring onLevel(sink) in recorder/tts.
    let sink = (rms: number) => { levels.push(rms); };
    startLevelLoop(analyser, (rms) => sink(rms), () => {});
    sink = () => { throw new Error('must not be called after swap'); };

    expect(levels).toEqual([0.5, 0.5, 0.5]);
    expect(frames).toHaveLength(3);
  });
});
