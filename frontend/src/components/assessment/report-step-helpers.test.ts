import { describe, expect, it } from 'vitest';
import { getDprStatusLabel, isDprReady } from './report-step-helpers';

describe('isDprReady', () => {
  it('is true only for ready', () => {
    expect(isDprReady('ready')).toBe(true);
    expect(isDprReady('queued')).toBe(false);
    expect(isDprReady('error')).toBe(false);
    expect(isDprReady('idle')).toBe(false);
  });
});

describe('getDprStatusLabel', () => {
  it('labels every dpr status', () => {
    expect(getDprStatusLabel('queued')).toBe('Converting PDF');
    expect(getDprStatusLabel('ready')).toBe('PDF ready');
    expect(getDprStatusLabel('error')).toBe('PDF export failed');
    expect(getDprStatusLabel('idle')).toBe('Ready to export');
  });
});
