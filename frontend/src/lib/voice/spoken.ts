/**
 * Splitting a reply so the panel can follow the voice.
 *
 * The panel highlights a sentence while the voice reads it. Nothing in the
 * audio says where a sentence starts, so the honest way to place the highlight
 * is to speak one sentence at a time and move the highlight when that
 * sentence's playback starts - see `Speaker.speak`. That is also why the reply
 * is split here rather than in the panel: the panel and the speaker have to
 * agree on the same list, in the same order.
 */

export interface SpokenChunk {
  /** The sentence with its trailing whitespace, so the chunks tile the reply. */
  text: string;
  /** Offset of `text` in the reply these chunks came from. */
  start: number;
}

const ENDERS = '.!?।';
const CLOSERS = '"\'”’)]';

/**
 * One synthesis call's worth of text.
 *
 * Both engines drop everything past their own tokenizer limit without saying
 * so - `kokoro-js` hands the tokenizer `truncation: true` and then slices the
 * ids at 509 phonemes, and a VITS checkpoint has the same kind of ceiling - so
 * a reply spoken in one call comes back cut off mid-sentence while the panel
 * still shows the whole thing. Pieces stay well under that ceiling. 240
 * characters is also about one breath, which is where the prosody holds.
 */
export const SPEECH_CHUNK_CHARS = 240;

/** True for the dot in `2.5`, which does not end a sentence. */
function isDecimal(text: string, index: number): boolean {
  return (
    text[index] === '.'
    && /[0-9]/.test(text[index - 1] ?? '')
    && /[0-9]/.test(text[index + 1] ?? '')
  );
}

export function spokenChunks(text: string): SpokenChunk[] {
  const chunks: SpokenChunk[] = [];
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (!endsSentence(text, index)) continue;
    let end = index + 1;
    while (end < text.length && ENDERS.includes(text[end])) end += 1;
    if (CLOSERS.includes(text[end] ?? '')) end += 1;
    while (end < text.length && (text[end] === ' ' || text[end] === '\t')) end += 1;
    chunks.push({ text: text.slice(start, end), start });
    start = end;
    index = end - 1;
  }
  if (start < text.length) chunks.push({ text: text.slice(start), start });
  return chunks.filter((chunk) => chunk.text.trim().length > 0);
}

/**
 * A dot only ends a sentence when what follows it could start one. The letters
 * straight after the dot in `example.com` say it is part of a word, and
 * splitting there would tear a link or a filename in half. A closing quote or
 * bracket is allowed to sit between the ender and the space.
 */
function endsSentence(text: string, index: number): boolean {
  if (!ENDERS.includes(text[index]) || isDecimal(text, index)) return false;
  let probe = index + 1;
  while (probe < text.length && ENDERS.includes(text[probe])) probe += 1;
  if (CLOSERS.includes(text[probe] ?? '')) probe += 1;
  return probe >= text.length || /\s/.test(text[probe]);
}

/**
 * `text` as pieces small enough for one synthesis call: whole sentences where
 * they fit, and a sentence that outruns the budget cut again at a word
 * boundary, because an over-long call is what the engine silently truncates.
 */
export function speechPieces(text: string, maxChars = SPEECH_CHUNK_CHARS): string[] {
  const pieces: string[] = [];
  for (const chunk of spokenChunks(text)) {
    let rest = chunk.text.trim();
    while (rest.length > maxChars) {
      const space = rest.lastIndexOf(' ', maxChars);
      const end = space > 0 ? space : maxChars;
      pieces.push(rest.slice(0, end).trim());
      rest = rest.slice(end).trim();
    }
    if (rest) pieces.push(rest);
  }
  return pieces;
}

/** One synthesis call, and the line it belongs to. */
export interface SpeechPiece {
  text: string;
  /** Index into the array handed to `speechPlan`, so the panel follows the voice. */
  line: number;
}

/**
 * Several lines as one ordered list of synthesis calls.
 *
 * A line can need more than one call (see `speechPieces`), and when it does the
 * extra calls still belong to that same line: the highlight should sit on the
 * sentence while its second half is being spoken, not jump early.
 */
export function speechPlan(lines: string[], maxChars = SPEECH_CHUNK_CHARS): SpeechPiece[] {
  const plan: SpeechPiece[] = [];
  lines.forEach((line, index) => {
    for (const text of speechPieces(line, maxChars)) plan.push({ text, line: index });
  });
  return plan;
}

export type ReplyBlockKind = 'paragraph' | 'bullet' | 'ordered';

export interface ReplyBlock {
  kind: ReplyBlockKind;
  /** The bullet glyph or the original number, or null on a paragraph. */
  marker: string | null;
  /** The line with its leading list marker removed; inline syntax is still in. */
  text: string;
  chunks: SpokenChunk[];
}

const HEADING = /^\s{0,3}#{1,6}\s+/;
const BULLET = /^\s*[-*+]\s+/;
// Two digits at most, so a line opening with a year stays a sentence.
const ORDERED = /^\s*(\d{1,2})[.)]\s+/;

/**
 * The reply as lines the panel can lay out, each already split into the
 * sentences the voice follows. Splitting per line rather than across the whole
 * reply is what lets a list stay a list: two bullets are two rows, not one
 * run-on sentence.
 */
export function replyBlocks(reply: string): ReplyBlock[] {
  const blocks: ReplyBlock[] = [];
  for (const raw of reply.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    let kind: ReplyBlockKind = 'paragraph';
    let marker: string | null = null;
    let text = line.replace(HEADING, '');
    const ordered = ORDERED.exec(line);
    if (BULLET.test(line)) {
      kind = 'bullet';
      marker = '\u2022';
      text = line.replace(BULLET, '');
    } else if (ordered) {
      kind = 'ordered';
      marker = `${ordered[1]}.`;
      text = line.slice(ordered[0].length);
    }

    const chunks = spokenChunks(text);
    if (chunks.length) blocks.push({ kind, marker, text, chunks });
  }
  return blocks;
}

/** The same sentences in reading order, for the highlight index. */
export function replyChunks(reply: string): SpokenChunk[] {
  return replyBlocks(reply).flatMap((block) => block.chunks);
}
