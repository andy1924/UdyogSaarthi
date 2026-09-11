/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VOICE_CHAT_URL?: string;
  readonly VITE_VOICE_CHAT_KEY?: string;
  readonly VITE_VOICE_CHAT_MODEL?: string;
  readonly VITE_VOICE_STT_URL?: string;
  readonly VITE_VOICE_STT_KEY?: string;
  readonly VITE_VOICE_STT_MODEL?: string;
  readonly VITE_VOICE_STT_DEVICE?: string;
  readonly VITE_VOICE_TTS_URL?: string;
  readonly VITE_VOICE_TTS_KEY?: string;
  readonly VITE_VOICE_TTS_MODEL?: string;
  readonly VITE_VOICE_TTS_VOICE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
