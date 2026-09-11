import { describe, expect, it } from 'vitest';
import { offlineAnswer } from './answers';

const context = { step: 4, stepTitle: 'Credit & subsidy' };

describe('offlineAnswer', () => {
  it('explains the current step when nothing else matches', () => {
    expect(offlineAnswer('hello', context, 'en')).toContain('Credit & subsidy');
  });

  it('answers in Hindi when Hindi is selected', () => {
    expect(offlineAnswer('hello', context, 'hi')).toMatch(/[\u0900-\u097F]/);
  });

  it('refuses to quote money figures', () => {
    const answer = offlineAnswer('how much loan will I get', context, 'en');
    expect(answer).toMatch(/on screen|Scheme rules v2024-11/i);
  });

  it('explains the microphone when asked', () => {
    expect(offlineAnswer('how do I use the mic', context, 'en')).toMatch(/microphone|mic/i);
  });
});
