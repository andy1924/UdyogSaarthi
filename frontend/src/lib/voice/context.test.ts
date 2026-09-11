import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, buildUserContext } from './context';

const context = {
  step: 3,
  stepTitle: 'Feasibility & market verdict',
  locationText: 'Shirur, Pune',
  enterprise: 'Dairy',
  feasibilityVerdict: 'viable',
};

describe('buildSystemPrompt', () => {
  it('names the reply language', () => {
    expect(buildSystemPrompt('hi')).toContain('Hindi');
    expect(buildSystemPrompt('en')).toContain('English');
  });

  it('forbids inventing money figures', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toMatch(/never calculate/i);
    expect(prompt).toContain('Scheme rules v2024-11');
  });

  it('keeps answers short because they are spoken aloud', () => {
    expect(buildSystemPrompt('en')).toMatch(/short/i);
  });
});

describe('buildUserContext', () => {
  it('includes the step, business and location', () => {
    const text = buildUserContext(context, 'Is dairy a good idea here?');
    expect(text).toContain('3');
    expect(text).toContain('Dairy');
    expect(text).toContain('Shirur, Pune');
    expect(text).toContain('Is dairy a good idea here?');
  });

  it('omits blank fields instead of printing undefined', () => {
    const text = buildUserContext({ step: 1, stepTitle: 'Location' }, 'Where am I?');
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
  });
});
