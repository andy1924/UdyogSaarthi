/** Local speech engines. Kokoro speaks English; MMS-TTS VITS speaks Hindi. */
export type VoiceEngine = 'kokoro' | 'mms';

export interface VoiceLanguage {
  /** Whisper language token. */
  stt: string;
  /** Which on-device engine speaks this language. */
  engine: VoiceEngine;
  /** Kokoro voice id; undefined for engines with a single built-in speaker. */
  voice?: string;
}

export const VOICE_LANGUAGES: Record<string, VoiceLanguage> = {
  en: { stt: 'en', engine: 'kokoro', voice: 'af_heart' },
  hi: { stt: 'hi', engine: 'mms' },
};

export const VOICE_FALLBACK_LANG = 'en';

export interface ResolvedVoiceLanguage extends VoiceLanguage {
  lang: string;
  /** False when the app language is not voiced yet and we fell back to English. */
  exact: boolean;
}

export function resolveVoiceLanguage(appLang: string): ResolvedVoiceLanguage {
  const base = (appLang || '').split('-')[0].toLowerCase();
  const match = VOICE_LANGUAGES[base];
  if (match) return { ...match, lang: base, exact: true };
  return {
    ...VOICE_LANGUAGES[VOICE_FALLBACK_LANG],
    lang: VOICE_FALLBACK_LANG,
    exact: false,
  };
}
