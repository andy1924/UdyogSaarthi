/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VOICE_CHAT_URL?: string;
  readonly VITE_VOICE_CHAT_KEY?: string;
  readonly VITE_VOICE_CHAT_MODEL?: string;
  /** Browser Whisper backend: `wasm` (default) or `webgpu`. There is no URL var. */
  readonly VITE_VOICE_STT_DEVICE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
