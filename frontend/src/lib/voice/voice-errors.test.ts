import { describe, expect, it } from 'vitest';
import { describeVoiceFailure, smoothLevel, VOICE_START_FAILED } from './voice-errors';

describe('describeVoiceFailure', () => {
  it('maps microphone failures to actionable copy', () => {
    expect(describeVoiceFailure(new DOMException('', 'NotAllowedError'))).toContain('Microphone access is blocked');
    expect(describeVoiceFailure(new DOMException('', 'NotFoundError'))).toBe('No microphone was found on this device.');
    expect(describeVoiceFailure(new DOMException('', 'NotReadableError'))).toContain('Another app');
  });

  it('keeps the code for unexpected failures', () => {
    expect(describeVoiceFailure(new DOMException('', 'AbortError'))).toBe(`${VOICE_START_FAILED} (AbortError)`);
    expect(describeVoiceFailure(undefined)).toBe(VOICE_START_FAILED);
  });
});

describe('smoothLevel', () => {
  it('matches the attack/release blend', () => {
    expect(smoothLevel(0, 0)).toBe(0);
    expect(smoothLevel(0, 0.12)).toBeCloseTo(0.28, 10);
    expect(smoothLevel(1, 0)).toBeCloseTo(0.72, 10);
  });
});
