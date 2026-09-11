import { describe, expect, it } from 'vitest';
import { parseInline, toPlainText } from './markdown';

describe('parseInline', () => {
  it('reads bold, italic, code, strike and links as formatting', () => {
    expect(parseInline('**Demand** is *high* for `kirana` ~~stores~~')).toEqual([
      { kind: 'bold', text: 'Demand' },
      { kind: 'text', text: ' is ' },
      { kind: 'italic', text: 'high' },
      { kind: 'text', text: ' for ' },
      { kind: 'code', text: 'kirana' },
      { kind: 'text', text: ' ' },
      { kind: 'strike', text: 'stores' },
    ]);
    expect(parseInline('see [the scheme](https://example.com/rules)')).toEqual([
      { kind: 'text', text: 'see ' },
      { kind: 'link', text: 'the scheme', href: 'https://example.com/rules' },
    ]);
  });

  it('leaves a lone asterisk alone instead of italicising across the line', () => {
    expect(parseInline('the radius is 2 * 3 kilometres')).toEqual([
      { kind: 'text', text: 'the radius is 2 * 3 kilometres' },
    ]);
  });

  it('returns one plain run when there is no syntax to read', () => {
    expect(parseInline('A plain sentence.')).toEqual([{ kind: 'text', text: 'A plain sentence.' }]);
    expect(parseInline('')).toEqual([]);
  });
});

describe('toPlainText', () => {
  it('takes the syntax out of everything the speaker would otherwise read', () => {
    const reply = [
      '## Your score',
      '',
      '- **Demand** is *strong* with `12` units nearby.',
      '2. Read the [scheme rules](https://example.com) next.',
    ].join('\n');
    expect(toPlainText(reply)).toBe(
      'Your score Demand is strong with 12 units nearby. Read the scheme rules next.',
    );
  });

  it('leaves Hindi untouched', () => {
    expect(toPlainText('**मांग** अच्छी है। अगला कदम देखें।')).toBe('मांग अच्छी है। अगला कदम देखें।');
  });

  it('keeps a sentence that merely starts with a year', () => {
    expect(toPlainText('2024. The scheme changed that year.')).toBe(
      '2024. The scheme changed that year.',
    );
  });
});
