/**
 * BhashiniAdapter — pluggable voice contract.
 * Real provider (Bhashini / Azure) implements this; UI uses mockBhashini in dev/offline.
 */

export interface BhashiniAdapter {
  /** Live streaming ASR — chunk from MediaRecorder */
  asrLive(chunk: Blob): Promise<string>;
  /** Batch ASR — upload URL or blob URL */
  asrBatch(url: string): Promise<string>;
  /** Neural MT — translate text to target locale */
  nmt(text: string, target: string): Promise<string>;
  /** TTS — returns object URL or base64/data URI for <audio> */
  tts(text: string, lang: string): Promise<string>;
}

/** Demo transcripts keyed by language hint */
const DEMO_TRANSCRIPTS: Record<string, string> = {
  hi: "Hilsa block, Nalanda",
  en: "Hilsa block, Nalanda",
  ta: "Hilsa block, Nalanda",
  bn: "Hilsa block, Nalanda",
};

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const mockBhashini: BhashiniAdapter = {
  async asrLive(_chunk: Blob): Promise<string> {
    await delay(320);
    return DEMO_TRANSCRIPTS.en;
  },
  async asrBatch(_url: string): Promise<string> {
    await delay(420);
    return DEMO_TRANSCRIPTS.en;
  },
  async nmt(text: string, target: string): Promise<string> {
    await delay(180);
    // Mock: append locale marker so callers can assert plumbing
    if (target === "en") return text;
    if (target === "hi") return text === "Hilsa block, Nalanda" ? "हिलसा ब्लॉक, नालंदा" : `${text} [hi]`;
    if (target === "ta") return `${text} [ta]`;
    if (target === "bn") return `${text} [bn]`;
    return `${text} [${target}]`;
  },
  async tts(text: string, lang: string): Promise<string> {
    await delay(200);
    // Return a no-op data URI; real impl would return audio URL
    // Encode text+lang so tests can assert it was called
    const payload = encodeURIComponent(`${lang}:${text.slice(0, 32)}`);
    return `data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQigAAAAC::${payload}`;
  },
};
