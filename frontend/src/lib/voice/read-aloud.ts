import { SPEECH_CHUNK_CHARS, speechPieces } from './spoken';

/**
 * Reading a page aloud is a different job from speaking a reply.
 *
 * A reply is a handful of sentences written for the ear; a page is hundreds of
 * lines written for the eye. The page is still cut into engine-sized pieces
 * (`speechPieces`), but grouped the other way round: several short sentences
 * per call, because a page has many one-line headings and one call each would
 * sound like a stutter.
 */
export const READ_ALOUD_CHUNK_CHARS = SPEECH_CHUNK_CHARS;

/**
 * Ten minutes of speech. The button exists so nobody has to read a long page
 * with their eyes, so the budget is generous; it is a stop for a page that
 * would otherwise keep talking after the reader has walked away.
 */
export const READ_ALOUD_MAX_MS = 10 * 60 * 1000;

/** The page split into speakable pieces, in reading order. */
export function readAloudChunks(text: string, maxChars = READ_ALOUD_CHUNK_CHARS): string[] {
  const pieces: string[] = [];
  let current = '';
  const flush = () => {
    if (!current) return;
    pieces.push(current);
    current = '';
  };
  for (const sentence of speechPieces(text, maxChars)) {
    if (current && current.length + sentence.length + 1 > maxChars) {
      flush();
    }
    current = current ? `${current} ${sentence}` : sentence;
  }
  flush();
  return pieces;
}
