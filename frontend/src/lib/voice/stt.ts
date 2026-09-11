import type { RawProgressEvent } from './download-progress';
import { transcribeAudio, warmStt } from './engine';
import { pickSttOptions, readSttDevice, type SttDevice } from './models';

export { WHISPER_MODEL, hasWebGPU, pickSttOptions } from './models';
export type { SttDevice, SttOptions } from './models';

export interface Transcriber {
  transcribe(audio: Float32Array, lang: string): Promise<string>;
}

/**
 * Whisper, loaded in the voice worker rather than on the page.
 *
 * Recognition is local and stays local: the recording goes to the worker as a
 * buffer, comes back as text, and never crosses the network. The worker is what
 * keeps the model's few hundred megabytes off the main thread, so the page is
 * still clickable while the first turn downloads.
 */
export async function createTranscriber(
  progress?: (event: RawProgressEvent) => void,
  device: SttDevice = readSttDevice(import.meta.env),
): Promise<Transcriber> {
  const options = pickSttOptions(device);
  await warmStt(options, progress);
  return { transcribe: (audio, lang) => transcribeAudio(audio, lang, options) };
}
