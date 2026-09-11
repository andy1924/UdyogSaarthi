/**
 * Where the speech models run: in the browser, always.
 *
 * Recognition and synthesis are local only. The recording is transcribed on the
 * device and the reply is synthesised on the device, so no audio ever crosses
 * the network. There is deliberately no environment variable that can point
 * either one at a server - see docs/frontend/voice-stack.md, "Hard constraints".
 *
 * The answer brain is separate and may be remote (see `chat.ts`); only the
 * recognised text leaves the device.
 */

/** The only speech var the app reads; `import.meta.env` satisfies it. */
export interface VoiceProviderEnv {
  VITE_VOICE_STT_DEVICE?: string;
}

export type SttDevice = 'wasm' | 'webgpu';

/**
 * Which backend the browser Whisper runs on. The
 * default is the CPU because it measured faster per turn and a quarter of the
 * download; `webgpu` is kept as an escape hatch for machines where that
 * changes (see docs/frontend/voice-stack.md for the measurements).
 */
export function readSttDevice(env: VoiceProviderEnv): SttDevice {
  return env.VITE_VOICE_STT_DEVICE?.trim().toLowerCase() === 'webgpu' ? 'webgpu' : 'wasm';
}
