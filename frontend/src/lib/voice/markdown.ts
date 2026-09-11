/**
 * The assistant is told to write plain sentences, and mostly it does - but a
 * model swap or a hiccup puts asterisks and backticks back on screen, where
 * they read as noise. Two jobs, kept apart on purpose:
 *
 * - `parseInline` gives the panel real formatting instead of raw syntax.
 * - `toPlainText` gives the voice a sentence with the syntax taken out, so the
 *   speaker never reads "asterisk asterisk" aloud.
 *
 * Deliberately not a Markdown implementation: it covers what shows up in a
 * five-sentence spoken reply and ignores the rest.
 */

export type InlineKind = 'text' | 'bold' | 'italic' | 'code' | 'strike' | 'link';

export interface InlineToken {
  kind: InlineKind;
  text: string;
  /** Only set on a link token. */
  href?: string;
}

/** Longest markers first, so `**` is not read as two italic runs. */
const MARKERS: ReadonlyArray<{ open: string; kind: InlineKind }> = [
  { open: '**', kind: 'bold' },
  { open: '~~', kind: 'strike' },
  { open: '`', kind: 'code' },
  { open: '*', kind: 'italic' },
];

const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)/;

/**
 * A run of `*` only counts as emphasis when it wraps actual words: that is what
 * keeps `2 * 3` an asterisk instead of the start of a runaway italic span.
 */
function emphasis(source: string, index: number, marker: string): number {
  const inner = index + marker.length;
  if (/\s/.test(source[inner] ?? '')) return -1;
  const close = source.indexOf(marker, inner);
  if (close === -1) return -1;
  if (/\s/.test(source[close - 1] ?? '')) return -1;
  return close;
}

export function parseInline(source: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let plain = '';
  const flush = () => {
    if (plain) tokens.push({ kind: 'text', text: plain });
    plain = '';
  };

  let index = 0;
  while (index < source.length) {
    const rest = source.slice(index);
    const link = LINK.exec(rest);
    if (link) {
      flush();
      tokens.push({ kind: 'link', text: link[1], href: link[2] });
      index += link[0].length;
      continue;
    }
    const marker = MARKERS.find((candidate) => rest.startsWith(candidate.open));
    if (marker) {
      const close = emphasis(source, index, marker.open);
      if (close !== -1) {
        flush();
        tokens.push({ kind: marker.kind, text: source.slice(index + marker.open.length, close) });
        index = close + marker.open.length;
        continue;
      }
    }
    plain += source[index];
    index += 1;
  }
  flush();
  return tokens;
}

/** One line, with the leading block marker and any inline syntax removed. */
function plainLine(line: string): string {
  return line
    .replace(/^\s{0,3}#{1,6}\s+/, '')
    .replace(/^\s{0,3}>\s?/, '')
    // Two digits at most: a line that opens with a year is a sentence, not a list.
    .replace(/^\s*(?:[-*+]|\d{1,2}[.)])\s+/, '')
    .replace(/`{1,3}/g, '')
    .replace(/\*\*|~~/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*/g, '')
    .trim();
}

/** What the speaker reads: the reply with every trace of syntax taken out. */
export function toPlainText(markdown: string): string {
  return markdown
    .split('\n')
    .map(plainLine)
    .filter(Boolean)
    .join(' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
