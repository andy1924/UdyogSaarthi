import { describe, expect, it } from 'vitest';
import {
  INITIAL_MODEL_PROGRESS,
  createProgressTracker,
  reduceProgress,
  type ProgressSnapshot,
} from './download-progress';

describe('reduceProgress', () => {
  it('normalises the 0-100 provider value to 0-1', () => {
    const next = reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'progress', progress: 40 });
    expect(next.value).toBeCloseTo(0.4);
  });

  it('never moves backwards when a new file starts at zero', () => {
    const mid = reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'progress', progress: 90 });
    const next = reduceProgress(mid, { status: 'progress', file: 'model.onnx', progress: 5 });
    expect(next.value).toBeCloseTo(0.9);
  });

  it('marks the model done and full on ready', () => {
    const next = reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'ready' });
    expect(next).toEqual({ value: 1, done: true });
  });

  it('ignores events without usable progress', () => {
    expect(reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'initiate' })).toEqual(INITIAL_MODEL_PROGRESS);
  });
});

describe('createProgressTracker', () => {
  it('emits a snapshot containing both models', () => {
    const snapshots: ProgressSnapshot[] = [];
    const tracker = createProgressTracker((snapshot) => snapshots.push(snapshot));
    tracker.callbackFor('stt')({ status: 'progress', progress: 50 });
    tracker.callbackFor('tts')({ status: 'ready' });
    expect(tracker.snapshot()).toMatchObject({ stt: 0.5, tts: 1 });
    expect(snapshots).toHaveLength(2);
  });
});
