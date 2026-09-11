/**
 * Guards that keep junk turns away from the speech models and the brain.
 *
 * Two different wastes, two checkpoints:
 * - a silent or near-silent recording never reaches Whisper at all, because
 *   Whisper hallucinates whole sentences ("Thank you") on room tone once the
 *   x6 normaliser has lifted it;
 * - a transcript that is empty, too short, or one token on loop (a laugh, a
 *   thump rendered as a word) never reaches the chat endpoint, because that
 *   call costs tokens and always answers noise with nonsense.
 *
 * Both checkpoints end the turn on the local NO_SPEECH line instead, so the
 * applicant gets guidance rather than silence.
 */

/** A question needs more than three words before it is worth a brain call. */
export const MIN_SPEECH_WORDS = 3;

/**
 * Minimum RMS for a peak-normalised recording to count as speech. Silence
 * through the normaliser still lands well under this; quiet speech held at
 * arm's length lands well over it.
 */
export const MIN_SPEECH_RMS = 0.02;

/** True when the recording holds enough energy to be worth transcribing. */
export function audioHasSpeech(samples: Float32Array, minRms = MIN_SPEECH_RMS): boolean {
  if (samples.length === 0) return false;
  let sum = 0;
  for (const value of samples) {
    if (!Number.isFinite(value)) return false;
    sum += value * value;
  }
  return Math.sqrt(sum / samples.length) >= minRms;
}

const bareToken = (token: string): string =>
  token.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/** Whitespace-separated words. Works for Devanagari the same as Latin. */
export function transcriptWords(text: string): string[] {
  return text.split(/\s+/).map((token) => token.trim()).filter((token) => token.length > 0);
}

/**
 * True for a question worth sending to the brain: more than MIN_SPEECH_WORDS
 * words, and not one token on loop. A laugh transcribes as "ha ha ha ha",
 * which is long enough to pass the count but is still noise.
 */
export function isSubstantiveTranscript(text: string): boolean {
  const words = transcriptWords(text);
  if (words.length <= MIN_SPEECH_WORDS) return false;
  const unique = new Set<string>();
  for (const word of words) {
    const bare = bareToken(word);
    if (bare) unique.add(bare);
    if (unique.size > 1) return true;
  }
  return false;
}