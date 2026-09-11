export const WHISPER_SAMPLE_RATE = 16_000;

/** Box-filter downsample to the 16 kHz mono stream Whisper expects. */
export function downsampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === WHISPER_SAMPLE_RATE || input.length === 0) return input;
  const ratio = inputRate / WHISPER_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let index = 0; index < outputLength; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.min(input.length, Math.floor((index + 1) * ratio));
    let sum = 0;
    for (let cursor = start; cursor < end; cursor += 1) sum += input[cursor];
    output[index] = end > start ? sum / (end - start) : input[start] ?? 0;
  }
  return output;
}
