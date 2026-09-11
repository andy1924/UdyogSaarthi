/**
 * Where the speech models run.
 *
 * Every layer of the voice stack is optional. Leave the URLs empty and the
 * browser does the work with its own downloaded models (no server, no key,
 * audio never leaves the device). Set a URL and that layer is handled
 * elsewhere - a GPU box, or a hosted API behind it.
 *
 * The remote contract is OpenAI-compatible (`/v1/audio/transcriptions`,
 * `/v1/audio/speech`) because that is what self-hosted GPU servers
 * (whisper.cpp, speaches, Kokoro-FastAPI) and most hosted APIs already speak.
 * A vendor that does not speak it is adapted by the serverless function in
 * front of it, so this client stays vendor-agnostic and never learns new
 * request shapes.
 */

export interface RemoteSttConfig {
  url: string;
  key: string;
  model: string;
}

export interface RemoteTtsConfig extends RemoteSttConfig {
  /** Voice id sent to the endpoint; falls back to the language's local voice. */
  voice: string;
}

/** The optional vars the speech providers read; `import.meta.env` satisfies it. */
export interface VoiceProviderEnv {
  VITE_VOICE_STT_URL?: string;
  VITE_VOICE_STT_KEY?: string;
  VITE_VOICE_STT_MODEL?: string;
  VITE_VOICE_STT_DEVICE?: string;
  VITE_VOICE_TTS_URL?: string;
  VITE_VOICE_TTS_KEY?: string;
  VITE_VOICE_TTS_MODEL?: string;
  VITE_VOICE_TTS_VOICE?: string;
}

export type SttDevice = 'wasm' | 'webgpu';

/** Null means "no remote endpoint configured, transcribe in the browser". */
export function readSttConfig(env: VoiceProviderEnv): RemoteSttConfig | null {
  return readEndpoint(env.VITE_VOICE_STT_URL, env.VITE_VOICE_STT_KEY, env.VITE_VOICE_STT_MODEL, 'whisper-1');
}

/** Null means "no remote endpoint configured, synthesize in the browser". */
export function readTtsConfig(env: VoiceProviderEnv): RemoteTtsConfig | null {
  const base = readEndpoint(env.VITE_VOICE_TTS_URL, env.VITE_VOICE_TTS_KEY, env.VITE_VOICE_TTS_MODEL, 'tts-1');
  return base ? { ...base, voice: env.VITE_VOICE_TTS_VOICE?.trim() ?? '' } : null;
}

/**
 * Which backend the browser Whisper runs on when it is used at all. The
 * default is the CPU because it measured faster per turn and a quarter of the
 * download; `webgpu` is kept as an escape hatch for machines where that
 * changes (see docs/frontend/voice-stack.md for the measurements).
 */
export function readSttDevice(env: VoiceProviderEnv): SttDevice {
  return env.VITE_VOICE_STT_DEVICE?.trim().toLowerCase() === 'webgpu' ? 'webgpu' : 'wasm';
}

export function authHeaders(key: string): Record<string, string> {
  return key ? { Authorization: `Bearer ${key}` } : {};
}

function readEndpoint(
  url: string | undefined,
  key: string | undefined,
  model: string | undefined,
  fallbackModel: string,
): RemoteSttConfig | null {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return null;
  return { url: trimmed, key: key?.trim() ?? '', model: model?.trim() || fallbackModel };
}
