/**
 * Shared analyser RMS sampling for the voice loop.
 *
 * recorder.ts (mic input) and tts.ts (speaker output) both pump an
 * AnalyserNode through requestAnimationFrame to drive the orb. The RMS math
 * and the pump were an 8-line clone; they live here once.
 */

/** Root-mean-square of time-domain samples, i.e. the current volume level. */
export function rmsOf(buffer: Float32Array): number {
  let sum = 0;
  for (const value of buffer) sum += value * value;
  return Math.sqrt(sum / buffer.length);
}

/**
 * Pump one analyser read into an RMS level, then schedule the next frame.
 *
 * Pass `onLevel` as a wrapper arrow (e.g. `(rms) => levelCallback(rms)`) when
 * the sink is a reassigned variable, so each frame reads the current sink
 * exactly as the inlined loop did before.
 */
export function startLevelLoop(
  analyser: AnalyserNode,
  onLevel: (rms: number) => void,
  onFrame: (id: number) => void,
): void {
  const buffer = new Float32Array(analyser.fftSize);
  const sample = () => {
    analyser.getFloatTimeDomainData(buffer);
    onLevel(rmsOf(buffer));
    onFrame(requestAnimationFrame(sample));
  };
  sample();
}
