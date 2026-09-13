export const VOICE_START_FAILED =
  'Voice could not start. Your audio stays on this device; please try again.';

/** Turns a microphone failure into something the user can act on. */
export function describeVoiceFailure(reason: unknown): string {
  const name = reason instanceof DOMException ? reason.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Microphone access is blocked for this site. Allow the microphone in your browser settings, then try again.';
  }
  if (name === 'NotFoundError') return 'No microphone was found on this device.';
  if (name === 'NotReadableError') return 'Another app is using the microphone. Close it and try again.';
  // Anything else is unexpected, so keep the code: it is the only clue left.
  return name ? `${VOICE_START_FAILED} (${name})` : VOICE_START_FAILED;
}

/**
 * Attack/release smoothing shared by the mic and the spoken reply, so the
 * orb swells with a voice and settles after it instead of twitching on every
 * analyser frame.
 */
export function smoothLevel(current: number, raw: number): number {
  return current * 0.72 + Math.min(1, raw / 0.12) * 0.28;
}
