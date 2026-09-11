import { describe, expect, it } from 'vitest';
import {
  INITIAL_MODEL_PROGRESS,
  createProgressTracker,
  pendingPercent,
  reduceProgress,
  type ProgressSnapshot,
} from './download-progress';

describe('reduceProgress', () => {
  it('normalises the 0-100 provider value to 0-1', () => {
    const next = reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'progress', progress: 40 });
    expect(next.value).toBeCloseTo(0.4);
  });

  it('weighs files by size, so a tiny companion file cannot pin the bar', () => {
    const config = reduceProgress(INITIAL_MODEL_PROGRESS, {
      status: 'progress', file: 'config.json', loaded: 44, total: 44,
    });
    expect(config.value).toBe(1);
    const model = reduceProgress(config, {
      status: 'progress', file: 'model.onnx', loaded: 10_000, total: 1_000_000,
    });
    expect(model.value).toBeLessThan(0.1);
  });

  it('adds up byte progress across files', () => {
    const first = reduceProgress(INITIAL_MODEL_PROGRESS, {
      status: 'progress', file: 'encoder.onnx', loaded: 50, total: 100,
    });
    const second = reduceProgress(first, {
      status: 'progress', file: 'decoder.onnx', loaded: 50, total: 100,
    });
    expect(second.value).toBeCloseTo(0.5);
  });

  it('marks the model done and full on ready', () => {
    const next = reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'ready' });
    expect(next).toMatchObject({ value: 1, done: true });
  });

  it('ignores events without usable progress', () => {
    expect(reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'initiate' })).toEqual(INITIAL_MODEL_PROGRESS);
  });

  it('reports unknown, not a stale number, when a file arrives without a size', () => {
    const config = reduceProgress(INITIAL_MODEL_PROGRESS, {
      status: 'progress', file: 'config.json', loaded: 44, total: 44,
    });
    const event = { status: 'progress', file: 'model.onnx', progress: 100, loaded: 10, total: 0 };
    expect(reduceProgress(config, event)).toMatchObject({ value: null });
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

describe('pendingPercent', () => {
  it('reports nothing when no number arrived, so the bar stays indeterminate', () => {
    expect(pendingPercent(null)).toBeNull();
  });

  it('never claims a download that has not finished is complete', () => {
    expect(pendingPercent(1)).toBe(99);
  });

  it('rounds the fraction to a whole percent', () => {
    expect(pendingPercent(0.423)).toBe(42);
  });
});
