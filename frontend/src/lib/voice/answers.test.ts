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

  it('explains the score from the numbers on screen instead of pointing at them', () => {
    const answer = offlineAnswer('why is my score 97', {
      step: 3,
      stepTitle: 'Demand',
      feasibilityScore: 97,
      competitionScore: 3,
      nearbyUnits: 2,
      radiusMeters: 5000,
      feasibilityVerdict: 'viable',
    }, 'en');
    expect(answer).toContain('97');
    expect(answer).toContain('100 minus the competition score of 3');
    expect(answer).toContain('2 registered units within 5 km');
    expect(answer).toContain('good potential');
  });

  it('still falls back to step guidance when no score has been computed', () => {
    expect(offlineAnswer('why is my score low', context, 'en')).toContain('Credit & subsidy');
  });

  it('explains what the page is about from the numbers on screen', () => {
    const answer = offlineAnswer('what is this page about', {
      step: 3,
      stepTitle: 'Feasibility & market verdict',
      district: 'Pune',
      nearbyUnits: 2,
      radiusMeters: 5000,
    }, 'en');
    expect(answer).toContain('demand and market step');
    expect(answer).toContain('Pune district');
    expect(answer).toContain('2 registered units nearby');
    expect(answer).toContain('Feasibility & market verdict');
  });

  it('explains the page in Hindi when Hindi is selected', () => {
    const answer = offlineAnswer('यह पेज किस बारे में है', {
      step: 3,
      stepTitle: 'माँग',
      nearbyUnits: 2,
    }, 'hi');
    expect(answer).toMatch(/[\u0900-\u097F]/);
    expect(answer).toContain('इस समय स्क्रीन पर');
  });
});
