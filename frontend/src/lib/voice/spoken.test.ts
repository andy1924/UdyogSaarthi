import { describe, expect, it } from 'vitest';
import { SPEECH_CHUNK_CHARS, replyBlocks, replyChunks, speechPieces, speechPlan, spokenChunks } from './spoken';

const textOf = (text: string) => spokenChunks(text).map((chunk) => chunk.text.trim());

describe('spokenChunks', () => {
  it('keeps the trailing space, so the chunks tile the reply exactly', () => {
    const reply = 'This is the first one. And here is the second!';
    const chunks = spokenChunks(reply);
    expect(chunks.map((chunk) => chunk.text).join('')).toBe(reply);
    expect(chunks.map((chunk) => chunk.start)).toEqual([0, 23]);
  });

  it('splits Hindi on the danda', () => {
    expect(textOf('पहला वाक्य। दूसरा वाक्य।')).toEqual(['पहला वाक्य।', 'दूसरा वाक्य।']);
  });

  it('does not split a decimal number', () => {
    expect(textOf('The score is 2.5 out of 10.')).toEqual(['The score is 2.5 out of 10.']);
  });

  it('does not split on the dots inside a link or a domain', () => {
    expect(textOf('Read the [scheme rules](https://example.com) first.')).toEqual([
      'Read the [scheme rules](https://example.com) first.',
    ]);
  });

  it('still ends the sentence after a closing quote', () => {
    expect(textOf('He said "no." Then he left.')).toEqual(['He said "no."', 'Then he left.']);
  });

  it('returns nothing when there is nothing to say', () => {
    expect(spokenChunks('')).toEqual([]);
    expect(spokenChunks('   ')).toEqual([]);
  });
});

describe('speechPieces', () => {
  it('keeps a sentence whole while it fits one call', () => {
    expect(speechPieces('First one. Second one.', 40)).toEqual(['First one.', 'Second one.']);
  });

  it('cuts a sentence that would overrun the engine limit', () => {
    const pieces = speechPieces('alpha beta gamma delta epsilon', 12);
    expect(pieces.length).toBeGreaterThan(1);
    for (const piece of pieces) expect(piece.length).toBeLessThanOrEqual(12);
    expect(pieces.join(' ')).toBe('alpha beta gamma delta epsilon');
  });

  it('never hands the engine enough text to be truncated away', () => {
    // The engine drops everything past ~509 phonemes without saying so, and
    // 509 phonemes is roughly 700 characters of English.
    expect(SPEECH_CHUNK_CHARS).toBeLessThanOrEqual(300);
    const long = 'This is a long sentence that keeps going and going, with a clause, and another clause, and one more after that. And a second sentence as well.';
    for (const piece of speechPieces(long)) expect(piece.length).toBeLessThanOrEqual(SPEECH_CHUNK_CHARS);
  });

  it('reads Hindi the same way', () => {
    expect(speechPieces('पहला वाक्य। दूसरा वाक्य।', 12)).toEqual(['पहला वाक्य।', 'दूसरा वाक्य।']);
  });
});

describe('speechPlan', () => {
  it('numbers every call by the line it came from', () => {
    expect(speechPlan(['One. Two.', 'Three.'])).toEqual([
      { text: 'One.', line: 0 },
      { text: 'Two.', line: 0 },
      { text: 'Three.', line: 1 },
    ]);
  });

  it('keeps a line that needs two calls on that same line', () => {
    const long = 'alpha beta gamma delta epsilon';
    const plan = speechPlan([long], 12);
    expect(plan.length).toBeGreaterThan(1);
    expect(plan.every((piece) => piece.line === 0)).toBe(true);
    expect(plan.map((piece) => piece.text).join(' ')).toBe(long);
  });

  it('skips a blank line instead of announcing it', () => {
    expect(speechPlan(['First.', '   ', 'Second.']).map((piece) => piece.line)).toEqual([0, 2]);
  });
});

describe('replyBlocks', () => {
  it('gives a list its own rows instead of one run-on paragraph', () => {
    const blocks = replyBlocks('Here is what to do.\n- Check the demand card.\n- Then set the radius.');
    expect(blocks.map((block) => block.kind)).toEqual(['paragraph', 'bullet', 'bullet']);
    expect(blocks.map((block) => block.marker)).toEqual([null, '\u2022', '\u2022']);
    expect(blocks[1].text).toBe('Check the demand card.');
  });

  it('keeps the original number on an ordered item', () => {
    const blocks = replyBlocks('1. Open the location step.\n2. Search your village.');
    expect(blocks.map((block) => block.marker)).toEqual(['1.', '2.']);
  });

  it('drops a heading marker and blank lines', () => {
    const blocks = replyBlocks('## Your score\n\nDemand is strong.');
    expect(blocks.map((block) => block.text)).toEqual(['Your score', 'Demand is strong.']);
  });

  it('flattens to the same reading order the panel renders', () => {
    expect(replyChunks('Score is 90.\nRead the card.').map((chunk) => chunk.text.trim())).toEqual([
      'Score is 90.',
      'Read the card.',
    ]);
    expect(replyBlocks('Score is 90.\nRead the card.').flatMap((block) => block.chunks)).toEqual(
      replyChunks('Score is 90.\nRead the card.'),
    );
  });
});
