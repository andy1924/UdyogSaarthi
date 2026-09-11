import { describe, expect, it } from 'vitest';
import { PAGE_SNAPSHOT_CHARS, buildSystemPrompt, buildUserContext, clipPage, summaryInstruction } from './context';

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

  it('asks for a full spoken explanation instead of a one-line answer', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toMatch(/four to six short spoken sentences/i);
    expect(prompt).toMatch(/no markdown/i);
  });

  it('tells the model to use the page text instead of pointing at the screen', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toMatch(/use it: quote the words and numbers/i);
    expect(prompt).toMatch(/instead of telling the applicant to go and look/i);
  });

  it('pins the reply language so a small model cannot drift into English', () => {
    expect(buildSystemPrompt('hi')).toMatch(/Never answer in English/i);
    expect(buildSystemPrompt('hi')).toContain('Hindi');
  });

  it('caps the reply at a length that can actually be spoken', () => {
    expect(buildSystemPrompt('en')).toMatch(/two hundred and fifty words/);
  });

  it('keeps the language pin last, even with an extra instruction', () => {
    const prompt = buildSystemPrompt('hi', summaryInstruction());
    expect(prompt).toContain(summaryInstruction());
    expect(prompt.trimEnd().endsWith('never mix two languages in one reply.')).toBe(true);
  });
});

describe('summaryInstruction', () => {
  it('asks for the shape of the page, not a word-for-word recital', () => {
    const instruction = summaryInstruction();
    expect(instruction).toMatch(/overview/i);
    expect(instruction).toMatch(/buttons they can press/i);
    expect(instruction).toMatch(/do not read the page out word for word/i);
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

  it('carries the numbers the assistant has to explain, not just the step name', () => {
    const text = buildUserContext({
      step: 3,
      stepTitle: 'Demand',
      feasibilityScore: 97,
      competitionScore: 3,
      nearbyUnits: 2,
      radiusMeters: 5000,
    }, 'why is my score 97');
    expect(text).toContain('Feasibility score on screen: 97 out of 100');
    expect(text).toContain('Competition score on screen: 3 out of 100');
    expect(text).toContain('Registered units nearby: 2');
    expect(text).toContain('Local market radius: 5 km');
  });

  it('carries the page text under a SITE SNAPSHOT the prompt refers to', () => {
    const text = buildUserContext(
      { step: 3, stepTitle: 'Demand', pageText: 'Feasibility score 97 out of 100.' },
      'why is my score 97',
    );
    expect(text).toContain('SITE SNAPSHOT:');
    expect(text.indexOf('SITE SNAPSHOT:')).toBeLessThan(text.indexOf('Feasibility score 97'));
    expect(text).toContain('Feasibility score 97 out of 100.');
  });

  it('leaves the snapshot out when the page had nothing to say', () => {
    const text = buildUserContext({ step: 1, stepTitle: 'Location', pageText: '' }, 'hello');
    expect(text).not.toContain('SITE SNAPSHOT');
  });
});

describe('clipPage', () => {
  it('keeps a short page whole', () => {
    expect(clipPage('  A short page.  ', 100)).toBe('A short page.');
  });

  it('collapses the whitespace of a scraped page', () => {
    expect(clipPage('Line one\n\n   Line two\tLine three', 100)).toBe('Line one Line two Line three');
  });

  it('cuts a long page and says it was cut', () => {
    const page = 'x'.repeat(300);
    const clipped = clipPage(page, 100);
    expect(clipped).toBe(`${'x'.repeat(100)} [page continues]`);
    expect(clipped.length).toBeLessThan(page.length + 20);
  });

  it('asks for about a thousand tokens, not the whole site', () => {
    expect(PAGE_SNAPSHOT_CHARS).toBeGreaterThan(2000);
    expect(PAGE_SNAPSHOT_CHARS).toBeLessThan(8000);
  });
});
