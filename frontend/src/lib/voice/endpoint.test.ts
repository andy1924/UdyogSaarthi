import { describe, expect, it } from 'vitest';
import { Endpointer, DEFAULT_ENDPOINTER } from './endpoint';

const speak = (endpointer: Endpointer, frames: number) => {
  let last: string | null = null;
  for (let i = 0; i < frames; i += 1) last = endpointer.push(0.5) ?? last;
  return last;
};
const silence = (endpointer: Endpointer, frames: number) => {
  let last: string | null = null;
  for (let i = 0; i < frames; i += 1) last = endpointer.push(0) ?? last;
  return last;
};

describe('Endpointer', () => {
  it('ignores a blip shorter than minSpeechMs', () => {
    const endpointer = new Endpointer();
    expect(speak(endpointer, 5)).toBeNull();
    expect(endpointer.isSpeaking).toBe(false);
  });

  it('emits speech-start once enough voiced frames accumulate', () => {
    const endpointer = new Endpointer();
    expect(speak(endpointer, 10)).toBe('speech-start');
    expect(endpointer.isSpeaking).toBe(true);
  });

  it('emits speech-end after the trailing silence window', () => {
    const endpointer = new Endpointer();
    speak(endpointer, 10);
    expect(silence(endpointer, 44)).toBeNull();
    expect(silence(endpointer, 1)).toBe('speech-end');
  });

  it('emits timeout at the hard turn limit', () => {
    const endpointer = new Endpointer({ ...DEFAULT_ENDPOINTER, maxTurnMs: 200, frameMs: 20 });
    speak(endpointer, 10);
    expect(silence(endpointer, 1)).toBe('timeout');
  });

  it('stops emitting after the turn ends', () => {
    const endpointer = new Endpointer();
    speak(endpointer, 10);
    silence(endpointer, 45);
    expect(speak(endpointer, 50)).toBeNull();
  });

  it('reset() makes the instance reusable', () => {
    const endpointer = new Endpointer();
    speak(endpointer, 10);
    silence(endpointer, 45);
    endpointer.reset();
    expect(speak(endpointer, 10)).toBe('speech-start');
  });
});
