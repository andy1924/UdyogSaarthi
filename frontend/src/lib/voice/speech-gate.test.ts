import { describe, expect, it } from 'vitest';
import {
  audioHasSpeech,
  isSubstantiveTranscript,
  MIN_SPEECH_RMS,
  MIN_SPEECH_WORDS,
  transcriptWords,
} from './speech-gate';

const zeros = (length: number) => new Float32Array(length);
const constant = (length: number, value: number) => {
  const samples = new Float32Array(length);
  samples.fill(value);
  return samples;
};
const tone = (length: number, amplitude: number) => {
  const samples = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    samples[index] = amplitude * Math.sin((index / length) * Math.PI * 2 * 8);
  }
  return samples;
};

describe('audioHasSpeech', () => {
  it('rejects an empty recording', () => {
    expect(audioHasSpeech(zeros(0))).toBe(false);
  });

  it('rejects digital silence', () => {
    expect(audioHasSpeech(zeros(16000))).toBe(false);
  });

  it('rejects room tone below the floor', () => {
    expect(audioHasSpeech(constant(16000, MIN_SPEECH_RMS / 4))).toBe(false);
  });

  it('accepts a speech-like signal', () => {
    expect(audioHasSpeech(tone(16000, 0.3))).toBe(true);
  });

  it('rejects a corrupt buffer', () => {
    const samples = constant(160, 0.3);
    samples[7] = NaN;
    expect(audioHasSpeech(samples)).toBe(false);
  });
});

describe('transcript gating', () => {
  it('needs more than three words', () => {
    expect(MIN_SPEECH_WORDS).toBe(3);
    expect(isSubstantiveTranscript('')).toBe(false);
    expect(isSubstantiveTranscript('hello')).toBe(false);
    expect(isSubstantiveTranscript('one two three')).toBe(false);
    expect(isSubstantiveTranscript('what loan can I get')).toBe(true);
  });

  it('rejects a laugh on loop', () => {
    expect(isSubstantiveTranscript('ha ha ha ha ha')).toBe(false);
    expect(isSubstantiveTranscript('Ha, ha! HA? ha')).toBe(false);
  });

  it('counts Hindi words the same way', () => {
    expect(transcriptWords('मुझे लोन चाहिए आज')).toHaveLength(4);
    expect(isSubstantiveTranscript('मुझे लोन चाहिए आज')).toBe(true);
    expect(isSubstantiveTranscript('हा हा हा हा')).toBe(false);
  });

  it('rejects punctuation-only noise', () => {
    expect(isSubstantiveTranscript('... ... ... ...')).toBe(false);
  });
});