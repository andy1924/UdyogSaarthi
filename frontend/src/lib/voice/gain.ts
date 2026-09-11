/**
 * Whisper wants a healthy signal, and a laptop mic held at arm's length is not
 * one. Lift a quiet recording towards full scale, but cap the gain so a silent
 * room is never amplified into a wall of noise.
 */
export function normalizePeak(samples: Float32Array, target = 0.9, maxGain = 6): Float32Array {
  let peak = 0;
  for (const value of samples) {
    const magnitude = Math.abs(value);
    if (magnitude > peak) peak = magnitude;
  }
  if (peak === 0 || peak >= target) return samples;
  const gain = Math.min(maxGain, target / peak);
  const lifted = new Float32Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) lifted[index] = samples[index] * gain;
  return lifted;
}
