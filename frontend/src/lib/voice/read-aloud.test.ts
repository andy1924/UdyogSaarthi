import { describe, expect, it } from 'vitest';
import { READ_ALOUD_CHUNK_CHARS, READ_ALOUD_MAX_MS, readAloudChunks } from './read-aloud';

describe('readAloudChunks', () => {
  it('groups whole sentences up to the budget', () => {
    const page = 'First sentence here. Second sentence here. Third sentence here.';
    expect(readAloudChunks(page, 44)).toEqual([
      'First sentence here. Second sentence here.',
      'Third sentence here.',
    ]);
  });

  it('keeps every word of the page, in order', () => {
    const page = 'The demand verdict is viable. Own contribution is 10 percent.';
    expect(readAloudChunks(page, 20).join(' ')).toBe(page);
  });

  it('cuts a single sentence that outruns the whole budget', () => {
    const page = 'alpha beta gamma delta epsilon zeta eta theta';
    const pieces = readAloudChunks(page, 16);
    expect(pieces.length).toBeGreaterThan(1);
    for (const piece of pieces) expect(piece.length).toBeLessThanOrEqual(16);
    expect(pieces.join(' ')).toBe(page);
  });

  it('splits a Hindi page on the danda', () => {
    expect(readAloudChunks('पहला वाक्य। दूसरा वाक्य।', 12)).toEqual(['पहला वाक्य।', 'दूसरा वाक्य।']);
  });

  it('reads a page that has no full stop at all', () => {
    expect(readAloudChunks('A page with one long line', 240)).toEqual(['A page with one long line']);
  });

  it('asks for nothing when the page is empty', () => {
    expect(readAloudChunks('')).toEqual([]);
    expect(readAloudChunks('   \n  ')).toEqual([]);
  });

  it('keeps one call to roughly one spoken breath', () => {
    expect(READ_ALOUD_CHUNK_CHARS).toBeGreaterThan(100);
    expect(READ_ALOUD_CHUNK_CHARS).toBeLessThan(400);
  });

  it('reads for ten minutes at most', () => {
    expect(READ_ALOUD_MAX_MS).toBe(10 * 60 * 1000);
  });
});
