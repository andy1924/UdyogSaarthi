# Voice Assistant (Voice Orb) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully on-device, English + Hindi voice assistant to the apply
section: a mic button in the header that starts recording immediately, and a
floating orb that transcribes speech locally, answers, and replies with natural
text to speech.

**Architecture:** Three local layers behind one React provider. Whisper (via
`@huggingface/transformers`) turns microphone audio into text; a small pluggable
chat client turns text into a reply; Kokoro-82M (via `kokoro-js`) speaks the
reply. Models download once, on the first mic press, behind a progress notice,
then are served from the browser cache. No audio and no transcript ever leave
the device.

**Tech Stack:** Vite 6 + React 19 + TypeScript (strict) + Tailwind 3,
`@huggingface/transformers` 4.x, `kokoro-js` 1.2.x, Vitest 5 (node environment).

**Spec:** `docs/frontend/voice-stack.md`

---

**Implementation status (2026-09-11):** Tasks 1-10 are implemented and verified:
`npm test` 50 passed, `npm run typecheck` clean, `npm run build` succeeds, and a
browser smoke test confirmed the header mic downloads Whisper and Kokoro to 100%
and the orb renders at the bottom of the apply section. Four deltas from the text
below, all recorded with evidence in `docs/frontend/voice-stack.md`:

1. **Hindi TTS is MMS-TTS, not Kokoro.** `kokoro-js@1.2.1` hardcodes English
   voices and rejects `hf_alpha`, and its bundled eSpeak build rejects `hi`
   outright, so Hindi is spoken by `Xenova/mms-tts-hin` through the same
   `@huggingface/transformers`. That checkpoint is CC-BY-NC-4.0 and must be
   replaced before any real deployment.
2. **`@huggingface/transformers` is pinned to `^3.8.1`, not `^4.2.0`.** 4.x made
   npm install a second transformers and a second `onnxruntime-web` for
   `kokoro-js`. 3.8.x satisfies both packages and ships a single runtime.
3. **`Speaker.speak(text)` takes no voice id.** `createSpeaker(language, progress)`
   is built per language, so only the engine the app language needs is downloaded.
4. **The download figures below were estimates.** Measured: Whisper base 73 MB
   q8 / 278 MB fp32, Kokoro 88 MB q8 / 311 MB fp32, MMS-TTS Hindi 37 MB q8 /
   109 MB fp32; the mic notice reads "up to 280 MB" and "up to 310 MB".
5. **Whisper is `whisper-small`, not `whisper-base`.** Base does not write Hindi:
   it returned an English translation for a short phrase and Urdu script for
   longer ones, in fp32 and q8 alike. Small returns Devanagari on the same audio
   at 238 MB q8 (~2.9 s for a 6 s clip), still inside the "up to 280 MB" notice.
   Quantized weights are now used on WebGPU too, since q8 was verified to run
   there and fp32 small would be ~923 MB.
6. **Whisper runs on the CPU (`wasm`), not WebGPU.** Measured on one 4 s clip
   through the real pipeline: `wasm`+q8 5.4 s and correct text, `webgpu`+fp32
   8.2 s but a 923 MB download, `webgpu`+q8 129 s and hallucinated. The 5.4 s
   needs cross-origin isolation so onnxruntime-web can use threads; without it
   the same clip takes ~12 s. Headers are set in `vite.config.ts` (dev) and
   `vercel.json` (production). Kokoro stays on WebGPU - 0.6 s versus 7.9 s for
   the same 3.2 s clip on wasm.
7. **A local llama.cpp brain stands in for the hosted API.** `frontend/.env.local`
   points `VITE_VOICE_CHAT_URL` at `http://127.0.0.1:8080/v1/chat/completions`
   with `gemma-4-E4B`. The server must run with `--reasoning off`, or Gemma 4's
   "Thinking Process:" preamble lands in `message.content` and gets spoken
   aloud. Verified end to end: mic -> transcript -> local Gemma -> spoken reply.

## Global Constraints

- **Languages:** `en` and `hi` only. Any other `LanguageContext.lang` value
  falls back to English and the UI says so.
- **No backend changes.** Nothing under `backend/` may be touched. The backend
  moves to Supabase and the frontend to Vercel; the voice path is frontend-only.
- **Audio never leaves the device.** No `webkitSpeechRecognition`, no audio
  upload, no transcript persistence. The conversation is in-memory only.
- **Never do scheme arithmetic in the voice path.** Prompts and canned answers
  must not compute or restate TPC / loan / EQI numbers; they point at the
  server-rendered values on screen. Scheme rules stay `Scheme rules v2024-11`.
- **Lazy loading:** model code and weights load on the first mic press, never on
  page load. Dynamic `import()` only.
- **First load is announced:** the mic shows a one-time download notice with
  per-model progress before recording starts.
- **Deployment:** `VITE_VOICE_CHAT_URL`, `VITE_VOICE_CHAT_KEY`,
  `VITE_VOICE_CHAT_MODEL` are the only new env vars. The client must keep
  working with an empty URL (offline canned answers) so no key is needed to demo.
- **Accessibility:** targets >= 44px, visible focus, `aria-pressed` on the mic,
  `aria-live="polite"` on voice status text, `prefers-reduced-motion` respected.
- **Tests:** `cd frontend && npm test` (Vitest, node environment). There is no
  jsdom or component-test library and **no test dependency may be added**; test
  pure modules only and verify UI by hand.
- **Known gap (accepted for v1):** the new mic, notice and orb strings are
  hardcoded English rather than routed through `<Text>` / `LanguageContext`.
  The *conversation* follows the app language; the surrounding chrome does not
  yet. Wrap them in `<Text>` in a follow-up if the product wants that.
- Every task ends with `npm run typecheck` and `npm run build` passing.

---

### Task 1: Dependencies, build config, and the voice language map

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/vite-env.d.ts`
- Modify: `frontend/.env.example`
- Create: `frontend/src/lib/voice/languages.ts`
- Test: `frontend/src/lib/voice/languages.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `resolveVoiceLanguage(appLang: string): ResolvedVoiceLanguage` and
  `VOICE_LANGUAGES: Record<string, VoiceLanguage>`, used by every later task.

- [x] **Step 1: Install dependencies**

`node_modules` does not exist in this worktree yet.

```bash
cd frontend
npm install
npm install kokoro-js@^1.2.1 @huggingface/transformers@^4.2.0
```

- [x] **Step 2: Write the failing test**

```ts
// frontend/src/lib/voice/languages.test.ts
import { describe, expect, it } from 'vitest';
import { resolveVoiceLanguage } from './languages';

describe('resolveVoiceLanguage', () => {
  it('maps English to the Kokoro English voice', () => {
    expect(resolveVoiceLanguage('en')).toMatchObject({
      lang: 'en', stt: 'en', voice: 'af_heart', exact: true,
    });
  });

  it('maps Hindi to the Kokoro Hindi voice', () => {
    expect(resolveVoiceLanguage('hi')).toMatchObject({
      lang: 'hi', stt: 'hi', voice: 'hf_alpha', exact: true,
    });
  });

  it('falls back to English for a language we do not voice yet', () => {
    expect(resolveVoiceLanguage('ta')).toMatchObject({ lang: 'en', exact: false });
  });

  it('normalises regional codes such as en-IN', () => {
    expect(resolveVoiceLanguage('en-IN')).toMatchObject({ lang: 'en', exact: true });
  });

  it('handles an empty language string', () => {
    expect(resolveVoiceLanguage('')).toMatchObject({ lang: 'en', exact: false });
  });
});
```

- [x] **Step 3: Run the test to verify it fails**

Run: `cd frontend && npm test -- languages`
Expected: FAIL - cannot resolve `./languages`.

- [x] **Step 4: Write the implementation**

```ts
// frontend/src/lib/voice/languages.ts
export interface VoiceLanguage {
  /** Whisper language token. */
  stt: string;
  /** Kokoro voice id, verified against hexgrad/Kokoro-82M VOICES.md. */
  voice: string;
}

export const VOICE_LANGUAGES: Record<string, VoiceLanguage> = {
  en: { stt: 'en', voice: 'af_heart' },
  hi: { stt: 'hi', voice: 'hf_alpha' },
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
```

- [x] **Step 5: Run the test to verify it passes**

Run: `cd frontend && npm test -- languages`
Expected: PASS (5 tests).

- [x] **Step 6: Configure Vite for the ONNX runtimes**

`frontend/vite.config.ts` - keep the existing `server.proxy` block untouched and
add `build`, `esbuild`, and extend `optimizeDeps`:

```ts
export default defineConfig({
  plugins: [react()],
  // onnxruntime-web ships top-level await; the default target cannot parse it.
  build: { target: 'esnext' },
  esbuild: { target: 'esnext' },
  server: {
    // ...existing proxy block unchanged...
  },
  optimizeDeps: {
    exclude: ['lucide-react', '@huggingface/transformers', 'kokoro-js', 'onnxruntime-web'],
  },
});
```

- [x] **Step 7: Declare the new env vars**

```ts
// frontend/src/vite-env.d.ts - keep the existing reference comment at the top
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VOICE_CHAT_URL?: string;
  readonly VITE_VOICE_CHAT_KEY?: string;
  readonly VITE_VOICE_CHAT_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Append to `frontend/.env.example`:

```bash
# Voice assistant brain (optional). Leave empty to use offline canned answers.
# In production this must be a Vercel function so the key is not in the bundle.
VITE_VOICE_CHAT_URL=
VITE_VOICE_CHAT_KEY=
VITE_VOICE_CHAT_MODEL=
```

- [x] **Step 8: Verify the whole project still builds**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: both succeed.

- [x] **Step 9: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/src/vite-env.d.ts frontend/.env.example frontend/src/lib/voice/languages.ts frontend/src/lib/voice/languages.test.ts
git commit -m "feat(voice): add voice language map and onnx build config"
```

---

### Task 2: Silence endpointer

Turns a stream of audio levels into `speech-start` / `speech-end` so the turn
ends when the speaker stops, instead of on a fixed timer.

**Files:**
- Create: `frontend/src/lib/voice/endpoint.ts`
- Test: `frontend/src/lib/voice/endpoint.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `class Endpointer` with `push(rms: number): EndpointerEvent`,
  `reset(): void`, `readonly isSpeaking: boolean`, and
  `DEFAULT_ENDPOINTER: EndpointerOptions`. Task 9 feeds it live RMS values.

- [x] **Step 1: Write the failing test**

```ts
// frontend/src/lib/voice/endpoint.test.ts
import { describe, expect, it } from 'vitest';
import { Endpointer, DEFAULT_ENDPOINTER } from './endpoint';

const speak = (endpointer: Endpointer, frames: number) => {
  let last: string | null = null;
  for (let i = 0; i < frames; i += 1) last = endpointer.push(0.5) ?? last;
  return last;
};
const silence = (endpointer: Endpointer, frames: number) => {
  let last: string | null = null;
  for (let i = 0; i < frames; i += 1) last = endpointer.push(0) ?? last;
  return last;
};

describe('Endpointer', () => {
  it('ignores a blip shorter than minSpeechMs', () => {
    const endpointer = new Endpointer();
    expect(speak(endpointer, 5)).toBeNull();
    expect(endpointer.isSpeaking).toBe(false);
  });

  it('emits speech-start once enough voiced frames accumulate', () => {
    const endpointer = new Endpointer();
    expect(speak(endpointer, 10)).toBe('speech-start');
    expect(endpointer.isSpeaking).toBe(true);
  });

  it('emits speech-end after the trailing silence window', () => {
    const endpointer = new Endpointer();
    speak(endpointer, 10);
    expect(silence(endpointer, 44)).toBeNull();
    expect(silence(endpointer, 1)).toBe('speech-end');
  });

  it('emits timeout at the hard turn limit', () => {
    const endpointer = new Endpointer({ ...DEFAULT_ENDPOINTER, maxTurnMs: 200, frameMs: 20 });
    speak(endpointer, 10);
    expect(silence(endpointer, 1)).toBe('timeout');
  });

  it('stops emitting after the turn ends', () => {
    const endpointer = new Endpointer();
    speak(endpointer, 10);
    silence(endpointer, 45);
    expect(speak(endpointer, 50)).toBeNull();
  });

  it('reset() makes the instance reusable', () => {
    const endpointer = new Endpointer();
    speak(endpointer, 10);
    silence(endpointer, 45);
    endpointer.reset();
    expect(speak(endpointer, 10)).toBe('speech-start');
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npm test -- endpoint`
Expected: FAIL - cannot resolve `./endpoint`.

- [x] **Step 3: Write the implementation**

```ts
// frontend/src/lib/voice/endpoint.ts
export interface EndpointerOptions {
  /** RMS level at or above which a frame counts as speech. */
  speechThreshold: number;
  /** Voiced time required before the turn is considered started. */
  minSpeechMs: number;
  /** Trailing silence that closes the turn. */
  silenceMs: number;
  /** Hard stop so a noisy room cannot hold the mic open forever. */
  maxTurnMs: number;
  /** Duration of one pushed frame. */
  frameMs: number;
}

export type EndpointerEvent = 'speech-start' | 'speech-end' | 'timeout' | null;

export const DEFAULT_ENDPOINTER: EndpointerOptions = {
  speechThreshold: 0.02,
  minSpeechMs: 200,
  silenceMs: 900,
  maxTurnMs: 20_000,
  frameMs: 20,
};

export class Endpointer {
  private speechMs = 0;
  private silenceMs = 0;
  private elapsedMs = 0;
  private started = false;
  private ended = false;

  constructor(private readonly options: EndpointerOptions = DEFAULT_ENDPOINTER) {}

  get isSpeaking(): boolean {
    return this.started && !this.ended;
  }

  reset(): void {
    this.speechMs = 0;
    this.silenceMs = 0;
    this.elapsedMs = 0;
    this.started = false;
    this.ended = false;
  }

  push(rms: number): EndpointerEvent {
    if (this.ended) return null;
    const { frameMs, speechThreshold, minSpeechMs, silenceMs, maxTurnMs } = this.options;
    const voiced = Number.isFinite(rms) && rms >= speechThreshold;

    this.elapsedMs += frameMs;
    if (voiced) {
      this.speechMs += frameMs;
      this.silenceMs = 0;
    } else if (this.started) {
      this.silenceMs += frameMs;
    }

    if (!this.started) {
      if (this.speechMs >= minSpeechMs) {
        this.started = true;
        return 'speech-start';
      }
      return null;
    }
    if (this.elapsedMs >= maxTurnMs) {
      this.ended = true;
      return 'timeout';
    }
    if (this.silenceMs >= silenceMs) {
      this.ended = true;
      return 'speech-end';
    }
    return null;
  }
}
```

- [x] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npm test -- endpoint`
Expected: PASS (6 tests).

- [x] **Step 5: Typecheck and commit**

```bash
cd frontend && npm run typecheck
git add frontend/src/lib/voice/endpoint.ts frontend/src/lib/voice/endpoint.test.ts
git commit -m "feat(voice): add silence endpointer for natural turn taking"
```

---

### Task 3: Prompt and step-context builder

**Files:**
- Create: `frontend/src/lib/voice/context.ts`
- Test: `frontend/src/lib/voice/context.test.ts`

**Interfaces:**
- Consumes: `ResolvedVoiceLanguage` from Task 1.
- Produces: `StepContext`, `buildSystemPrompt(language)`, and
  `buildUserContext(context, question)` for Task 4.

`StepContext` is what the orb knows about the wizard right now:

```ts
export interface StepContext {
  step: number;
  stepTitle: string;
  locationText?: string;
  enterprise?: string;
  feasibilityVerdict?: string;
  marginPercent?: number;
}
```

- [x] **Step 1: Write the failing test**

```ts
// frontend/src/lib/voice/context.test.ts
import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, buildUserContext } from './context';

const context = {
  step: 3,
  stepTitle: 'Feasibility & market verdict',
  locationText: 'Shirur, Pune',
  enterprise: 'Dairy',
  feasibilityVerdict: 'viable',
};

describe('buildSystemPrompt', () => {
  it('names the reply language', () => {
    expect(buildSystemPrompt('hi')).toContain('Hindi');
    expect(buildSystemPrompt('en')).toContain('English');
  });

  it('forbids inventing money figures', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toMatch(/never calculate/i);
    expect(prompt).toContain('Scheme rules v2024-11');
  });

  it('keeps answers short because they are spoken aloud', () => {
    expect(buildSystemPrompt('en')).toMatch(/short/i);
  });
});

describe('buildUserContext', () => {
  it('includes the step, business and location', () => {
    const text = buildUserContext(context, 'Is dairy a good idea here?');
    expect(text).toContain('3');
    expect(text).toContain('Dairy');
    expect(text).toContain('Shirur, Pune');
    expect(text).toContain('Is dairy a good idea here?');
  });

  it('omits blank fields instead of printing undefined', () => {
    const text = buildUserContext({ step: 1, stepTitle: 'Location' }, 'Where am I?');
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npm test -- context`
Expected: FAIL - cannot resolve `./context`.

- [x] **Step 3: Write the implementation**

```ts
// frontend/src/lib/voice/context.ts
import { VOICE_LANGUAGES } from './languages';

export interface StepContext {
  step: number;
  stepTitle: string;
  locationText?: string;
  enterprise?: string;
  feasibilityVerdict?: string;
  marginPercent?: number;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
};

export function buildSystemPrompt(lang: string): string {
  const language = LANGUAGE_NAMES[lang] ?? LANGUAGE_NAMES.en;
  return [
    'You are UdyogSaarthi, a calm helper inside a rural business-plan wizard in India.',
    `Always reply in ${language}.`,
    'Keep replies short: two or three spoken sentences at most, plain words, no markdown or lists.',
    'Only explain the current step and what the user should do next.',
    'You never calculate, compute, restate or invent money figures such as TPC, loan amount, EQI or subsidy.',
    'If asked about money, tell the user the exact figure is already shown on screen and refer to Scheme rules v2024-11.',
    'You are not a government officer and you do not promise approval.',
  ].join(' ');
}

export function buildUserContext(context: StepContext, question: string): string {
  const lines = [`Current step: ${context.step} - ${context.stepTitle}`];
  if (context.enterprise) lines.push(`Business: ${context.enterprise}`);
  if (context.locationText) lines.push(`Location: ${context.locationText}`);
  if (context.feasibilityVerdict) lines.push(`Demand verdict: ${context.feasibilityVerdict}`);
  if (typeof context.marginPercent === 'number') lines.push(`Own contribution: ${context.marginPercent} percent`);
  lines.push(`User question: ${question}`);
  return lines.join('\n');
}

/** Display names for the languages the voice layer can speak. */
export const VOICE_LANGUAGE_NAMES = LANGUAGE_NAMES;
export const VOICE_LANGUAGE_CODES = Object.keys(VOICE_LANGUAGES);
```

- [x] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npm test -- context`
Expected: PASS (5 tests).

- [x] **Step 5: Typecheck and commit**

```bash
cd frontend && npm run typecheck
git add frontend/src/lib/voice/context.ts frontend/src/lib/voice/context.test.ts
git commit -m "feat(voice): build grounded prompts for the voice assistant"
```

---

### Task 4: Offline answers and the chat client

The assistant must work with **no API key at all**, and upgrade silently to a
configured endpoint. An unrecognised question returns step guidance, not an
error.

**Files:**
- Create: `frontend/src/lib/voice/answers.ts`
- Test: `frontend/src/lib/voice/answers.test.ts`
- Create: `frontend/src/lib/voice/chat.ts`
- Test: `frontend/src/lib/voice/chat.test.ts`

**Interfaces:**
- Consumes: `StepContext` from Task 3.
- Produces: `offlineAnswer(question, context, lang): string`,
  `readChatConfig(env): ChatConfig`, and
  `requestReply({ question, context, lang, signal }): Promise<string>`.

- [x] **Step 1: Write the failing test for the canned answers**

```ts
// frontend/src/lib/voice/answers.test.ts
import { describe, expect, it } from 'vitest';
import { offlineAnswer } from './answers';

const context = { step: 4, stepTitle: 'Credit & subsidy' };

describe('offlineAnswer', () => {
  it('explains the current step when nothing else matches', () => {
    expect(offlineAnswer('hello', context, 'en')).toContain('Credit & subsidy');
  });

  it('answers in Hindi when Hindi is selected', () => {
    expect(offlineAnswer('hello', context, 'hi')).toMatch(/[\u0900-\u097F]/);
  });

  it('refuses to quote money figures', () => {
    const answer = offlineAnswer('how much loan will I get', context, 'en');
    expect(answer).toMatch(/on screen|Scheme rules v2024-11/i);
  });

  it('explains the microphone when asked', () => {
    expect(offlineAnswer('how do I use the mic', context, 'en')).toMatch(/microphone|mic/i);
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `cd frontend && npm test -- answers`
Expected: FAIL - cannot resolve `./answers`.

- [x] **Step 3: Write the answers**

```ts
// frontend/src/lib/voice/answers.ts
import type { StepContext } from './context';

const STEP_GUIDANCE: Record<string, { en: string; hi: string }> = {
  location: {
    en: 'Set your business location first. Use the GPS button, or type your block, district and state, then continue.',
    hi: 'पहले अपना स्थान चुनें। जीपीएस बटन दबाएँ, या ब्लॉक, जिला और राज्य लिखें, फिर आगे बढ़ें।',
  },
  business: {
    en: 'Pick the business you want to start, then set how much money you can put in yourself.',
    hi: 'जो व्यवसाय शुरू करना है उसे चुनें, फिर बताएँ कि आप स्वयं कितना पैसा लगा सकते हैं।',
  },
  demand: {
    en: 'This step checks whether there is enough demand near you. Read the verdict, then see the suggested opportunities.',
    hi: 'यह चरण देखता है कि आपके आसपास पर्याप्त माँग है या नहीं। नतीजा पढ़ें, फिर सुझाए अवसर देखें।',
  },
  funding: {
    en: 'This step shows the scheme-linked credit and your own contribution. The exact figures are already on screen.',
    hi: 'यह चरण योजना से जुड़ा ऋण और आपका योगदान दिखाता है। सटीक आँकड़े स्क्रीन पर मौजूद हैं।',
  },
  identity: {
    en: 'Verify your identity with DigiLocker so the project report carries your name.',
    hi: 'दिगिलॉकर से अपनी पहचान सत्यापित करें ताकि परियोजना रिपोर्ट में आपका नाम आए।',
  },
  report: {
    en: 'Your project report is ready to generate and download. You can share the PDF with your bank.',
    hi: 'आपकी परियोजना रिपोर्ट बनकर तैयार है। आप इस पीडीएफ को अपने बैंक के साथ साझा कर सकते हैं।',
  },
};

const STEP_KEYS = ['location', 'business', 'demand', 'funding', 'identity', 'report'] as const;

const MONEY_HINT = /loan|amount|money|subsidy|emi|tpc|eqi|पैसा|ऋण|राशि|सब्सिडी/i;
const MIC_HINT = /mic|microphone|voice|speak|सुन|माइक|बोल/i;

function pick(lang: string): 'en' | 'hi' {
  return lang === 'hi' ? 'hi' : 'en';
}

export function offlineAnswer(question: string, context: StepContext, lang: string): string {
  const key = pick(lang);
  if (MONEY_HINT.test(question)) {
    return key === 'hi'
      ? 'सटीक राशि स्क्रीन पर दिखाई गई है। मैं स्वयं कोई गणना नहीं करता - Scheme rules v2024-11 देखें।'
      : 'The exact amount is already shown on screen. I do not calculate it myself - see Scheme rules v2024-11.';
  }
  if (MIC_HINT.test(question)) {
    return key === 'hi'
      ? 'माइक बटन दबाएँ, बोलें, और रुक जाएँ। आपकी आवाज़ इस डिवाइस से बाहर नहीं जाती।'
      : 'Press the mic button, speak, then pause. Your audio never leaves this device.';
  }
  const byStep = STEP_GUIDANCE[STEP_KEYS[context.step - 1] ?? 'location'];
  const base = byStep[key];
  return key === 'hi' ? `${base} (चरण ${context.step})` : `${base} (Step ${context.step})`;
}

export { STEP_KEYS };
```

- [x] **Step 4: Run it and watch it pass**

Run: `cd frontend && npm test -- answers`
Expected: PASS (4 tests).

- [x] **Step 5: Write the failing chat-client test**

```ts
// frontend/src/lib/voice/chat.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readChatConfig, requestReply } from './chat';

const context = { step: 4, stepTitle: 'Credit & subsidy' };

afterEach(() => vi.unstubAllGlobals());

describe('readChatConfig', () => {
  it('treats a missing URL as unconfigured', () => {
    expect(readChatConfig({}).url).toBe('');
  });

  it('reads the three env values', () => {
    const config = readChatConfig({
      VITE_VOICE_CHAT_URL: 'https://x.test/chat',
      VITE_VOICE_CHAT_KEY: 'secret',
      VITE_VOICE_CHAT_MODEL: 'fast',
    });
    expect(config).toMatchObject({ url: 'https://x.test/chat', key: 'secret', model: 'fast' });
  });
});

describe('requestReply', () => {
  it('falls back to a canned answer when unconfigured', async () => {
    const reply = await requestReply({
      question: 'hello', context, lang: 'en', signal: new AbortController().signal,
    });
    expect(reply).toContain('Credit & subsidy');
  });

  it('returns trimmed model text when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '  Add your location first.  ' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const reply = await requestReply({
      question: 'help', context, lang: 'en', signal: new AbortController().signal,
      config: { url: 'https://x.test/chat', key: 'k', model: 'm' },
    });
    expect(reply).toBe('Add your location first.');
  });

  it('falls back instead of throwing when the endpoint fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const reply = await requestReply({
      question: 'hello', context, lang: 'en', signal: new AbortController().signal,
      config: { url: 'https://x.test/chat', key: 'k', model: 'm' },
    });
    expect(reply).toContain('Credit & subsidy');
  });
});
```

- [x] **Step 6: Run it and watch it fail**

Run: `cd frontend && npm test -- chat`
Expected: FAIL - cannot resolve `./chat`.

- [x] **Step 7: Write the chat client**

```ts
// frontend/src/lib/voice/chat.ts
import { offlineAnswer } from './answers';
import { buildSystemPrompt, buildUserContext, type StepContext } from './context';

export interface ChatConfig {
  url: string;
  key: string;
  model: string;
}

export function readChatConfig(env: ImportMetaEnv): ChatConfig {
  return {
    url: env.VITE_VOICE_CHAT_URL?.trim() ?? '',
    key: env.VITE_VOICE_CHAT_KEY?.trim() ?? '',
    model: env.VITE_VOICE_CHAT_MODEL?.trim() || 'gpt-4o-mini',
  };
}

export interface ReplyRequest {
  question: string;
  context: StepContext;
  lang: string;
  signal: AbortSignal;
  config?: ChatConfig;
}

export async function requestReply({
  question,
  context,
  lang,
  signal,
  config = readChatConfig(import.meta.env),
}: ReplyRequest): Promise<string> {
  if (!config.url) return offlineAnswer(question, context, lang);
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(config.key ? { Authorization: `Bearer ${config.key}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.4,
        max_tokens: 200,
        messages: [
          { role: 'system', content: buildSystemPrompt(lang) },
          { role: 'user', content: buildUserContext(context, question) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`chat ${response.status}`);
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || offlineAnswer(question, context, lang);
  } catch {
    return offlineAnswer(question, context, lang);
  }
}
```

- [x] **Step 8: Run the tests, typecheck, commit**

```bash
cd frontend && npm test -- answers chat && npm run typecheck
git add frontend/src/lib/voice/answers.ts frontend/src/lib/voice/answers.test.ts frontend/src/lib/voice/chat.ts frontend/src/lib/voice/chat.test.ts
git commit -m "feat(voice): add offline answers and pluggable chat client"
```

---

### Task 5: Microphone recorder and 16 kHz resampler

**Files:**
- Create: `frontend/src/lib/voice/resample.ts`
- Test: `frontend/src/lib/voice/resample.test.ts`
- Create: `frontend/src/lib/voice/recorder.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `downsampleTo16k(input: Float32Array, inputRate: number): Float32Array`
  and `createRecorder(): Recorder` where
  `Recorder = { start(): Promise<void>; stop(): Promise<Float32Array>; cancel(): void; onLevel(cb: (rms: number) => void): void }`.

- [x] **Step 1: Write the failing resampler test**

```ts
// frontend/src/lib/voice/resample.test.ts
import { describe, expect, it } from 'vitest';
import { downsampleTo16k } from './resample';

describe('downsampleTo16k', () => {
  it('returns the input untouched at 16 kHz', () => {
    const input = new Float32Array([0, 0.5, -0.5, 1]);
    expect(Array.from(downsampleTo16k(input, 16_000))).toEqual([0, 0.5, -0.5, 1]);
  });

  it('halves the frame count from 32 kHz', () => {
    expect(downsampleTo16k(new Float32Array(3200), 32_000)).toHaveLength(1600);
  });

  it('resamples 48 kHz to a third of the length', () => {
    expect(downsampleTo16k(new Float32Array(4800), 48_000)).toHaveLength(1600);
  });

  it('preserves a constant signal', () => {
    const output = downsampleTo16k(new Float32Array(480).fill(0.25), 48_000);
    expect(output).toHaveLength(160);
    expect(output.every((value) => Math.abs(value - 0.25) < 1e-6)).toBe(true);
  });

  it('handles an empty buffer', () => {
    expect(downsampleTo16k(new Float32Array(0), 48_000)).toHaveLength(0);
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `cd frontend && npm test -- resample`
Expected: FAIL - cannot resolve `./resample`.

- [x] **Step 3: Write the resampler**

```ts
// frontend/src/lib/voice/resample.ts
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
    for (let source = start; source < end; source += 1) sum += input[source];
    output[index] = end > start ? sum / (end - start) : input[start] ?? 0;
  }
  return output;
}
```

- [x] **Step 4: Run it and watch it pass**

Run: `cd frontend && npm test -- resample`
Expected: PASS (5 tests).

- [x] **Step 5: Write the recorder**

`MediaRecorder` captures the audio; an `AnalyserNode` reports live level for the
orb and the endpointer. No custom AudioWorklet file is needed.

```ts
// frontend/src/lib/voice/recorder.ts
import { downsampleTo16k } from './resample';

export interface Recorder {
  start(): Promise<void>;
  stop(): Promise<Float32Array>;
  cancel(): void;
  onLevel(callback: (rms: number) => void): void;
}

export function createRecorder(): Recorder {
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let context: AudioContext | null = null;
  let frame = 0;
  let levelCallback: (rms: number) => void = () => {};
  const chunks: Blob[] = [];

  const teardown = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    recorder?.stream.getTracks().forEach((track) => track.stop());
    stream?.getTracks().forEach((track) => track.stop());
    void context?.close();
    stream = null;
    recorder = null;
    context = null;
  };

  return {
    onLevel(callback) { levelCallback = callback; },
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);

      const sample = () => {
        analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (const value of buffer) sum += value * value;
        levelCallback(Math.sqrt(sum / buffer.length));
        frame = requestAnimationFrame(sample);
      };
      sample();

      chunks.length = 0;
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.start();
    },
    async stop() {
      const active = recorder;
      if (!active) return new Float32Array(0);
      const finished = new Promise<Blob>((resolve) => {
        active.onstop = () => resolve(new Blob(chunks, { type: active.mimeType }));
      });
      active.stop();
      const blob = await finished;
      const decoded = await new AudioContext().decodeAudioData(await blob.arrayBuffer());
      teardown();
      return downsampleTo16k(decoded.getChannelData(0), decoded.sampleRate);
    },
    cancel() { teardown(); },
  };
}
```

- [x] **Step 6: Typecheck and commit**

```bash
cd frontend && npm run typecheck
git add frontend/src/lib/voice/resample.ts frontend/src/lib/voice/resample.test.ts frontend/src/lib/voice/recorder.ts
git commit -m "feat(voice): capture microphone audio and resample for whisper"
```

---

### Task 6: Model download progress

The first mic press can download a few hundred megabytes (Whisper is ~75 MB;
Kokoro is ~90 MB quantized or ~330 MB fp32, which is what WebGPU picks). The
user must see that; this task is the pure progress reducer plus the aggregator
that both model loaders feed.

**Files:**
- Create: `frontend/src/lib/voice/download-progress.ts`
- Test: `frontend/src/lib/voice/download-progress.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `VoiceModelId`, `ModelProgressState`, `reduceProgress(state, event)`,
  `INITIAL_MODEL_PROGRESS`, and
  `createProgressTracker(emit): { callbackFor(model); snapshot() }`.

- [x] **Step 1: Write the failing test**

```ts
// frontend/src/lib/voice/download-progress.test.ts
import { describe, expect, it } from 'vitest';
import {
  INITIAL_MODEL_PROGRESS,
  createProgressTracker,
  reduceProgress,
} from './download-progress';

describe('reduceProgress', () => {
  it('normalises the 0-100 provider value to 0-1', () => {
    const next = reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'progress', progress: 40 });
    expect(next.value).toBeCloseTo(0.4);
  });

  it('never moves backwards when a new file starts at zero', () => {
    const mid = reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'progress', progress: 90 });
    const next = reduceProgress(mid, { status: 'progress', file: 'model.onnx', progress: 5 });
    expect(next.value).toBeCloseTo(0.9);
  });

  it('marks the model done and full on ready', () => {
    const next = reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'ready' });
    expect(next).toEqual({ value: 1, done: true });
  });

  it('ignores events without usable progress', () => {
    expect(reduceProgress(INITIAL_MODEL_PROGRESS, { status: 'initiate' })).toEqual(INITIAL_MODEL_PROGRESS);
  });
});

describe('createProgressTracker', () => {
  it('emits a snapshot containing both models', () => {
    const snapshots: Array<Record<string, number | null>> = [];
    const tracker = createProgressTracker((snapshot) => snapshots.push(snapshot));
    tracker.callbackFor('stt')({ status: 'progress', progress: 50 });
    tracker.callbackFor('tts')({ status: 'ready' });
    expect(tracker.snapshot()).toMatchObject({ stt: 0.5, tts: 1 });
    expect(snapshots).toHaveLength(2);
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `cd frontend && npm test -- download-progress`
Expected: FAIL - cannot resolve `./download-progress`.

- [x] **Step 3: Write the implementation**

```ts
// frontend/src/lib/voice/download-progress.ts
export type VoiceModelId = 'stt' | 'tts';

export interface RawProgressEvent {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

export interface ModelProgressState {
  /** Aggregate 0-1, or null before anything is known. */
  value: number | null;
  done: boolean;
}

export const INITIAL_MODEL_PROGRESS: ModelProgressState = { value: null, done: false };

export function reduceProgress(
  state: ModelProgressState,
  event: RawProgressEvent,
): ModelProgressState {
  if (event.status === 'ready' || event.status === 'done') return { value: 1, done: true };
  if (typeof event.progress !== 'number' || !Number.isFinite(event.progress)) return state;
  const clamped = Math.min(1, Math.max(0, event.progress / 100));
  return { value: Math.max(state.value ?? 0, clamped), done: state.done };
}

export interface ProgressSnapshot {
  stt: number | null;
  tts: number | null;
}

export function createProgressTracker(emit: (snapshot: ProgressSnapshot) => void) {
  const states: Record<VoiceModelId, ModelProgressState> = {
    stt: { ...INITIAL_MODEL_PROGRESS },
    tts: { ...INITIAL_MODEL_PROGRESS },
  };
  const snapshot = (): ProgressSnapshot => ({
    stt: states.stt.done ? 1 : states.stt.value,
    tts: states.tts.done ? 1 : states.tts.value,
  });
  return {
    snapshot,
    callbackFor(model: VoiceModelId) {
      return (event: RawProgressEvent) => {
        states[model] = reduceProgress(states[model], event);
        emit(snapshot());
      };
    },
  };
}
```

- [x] **Step 4: Run it and watch it pass**

Run: `cd frontend && npm test -- download-progress`
Expected: PASS (5 tests).

- [x] **Step 5: Typecheck and commit**

```bash
cd frontend && npm run typecheck
git add frontend/src/lib/voice/download-progress.ts frontend/src/lib/voice/download-progress.test.ts
git commit -m "feat(voice): track one-time model download progress"
```

---

### Task 7: Whisper speech-to-text adapter

**Files:**
- Create: `frontend/src/lib/voice/stt.ts`
- Test: `frontend/src/lib/voice/stt.test.ts`

**Interfaces:**
- Consumes: `RawProgressEvent` from Task 6.
- Produces: `pickSttOptions(hasWebGPU)`, `WHISPER_MODEL`, `hasWebGPU()`, and
  `createTranscriber(progress?): Promise<Transcriber>` where
  `Transcriber = { transcribe(audio: Float32Array, lang: string): Promise<string> }`.

- [x] **Step 1: Write the failing test**

```ts
// frontend/src/lib/voice/stt.test.ts
import { describe, expect, it } from 'vitest';
import { WHISPER_MODEL, pickSttOptions } from './stt';

describe('pickSttOptions', () => {
  it('uses fp32 on webgpu for accuracy', () => {
    expect(pickSttOptions(true)).toEqual({
      device: 'webgpu',
      dtype: { encoder_model: 'fp32', decoder_model_merged: 'fp32' },
    });
  });

  it('falls back to quantized wasm', () => {
    expect(pickSttOptions(false)).toEqual({
      device: 'wasm',
      dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' },
    });
  });

  it('pins the multilingual base checkpoint', () => {
    expect(WHISPER_MODEL).toBe('onnx-community/whisper-base');
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `cd frontend && npm test -- stt`
Expected: FAIL - cannot resolve `./stt`.

- [x] **Step 3: Write the adapter**

```ts
// frontend/src/lib/voice/stt.ts
import type { RawProgressEvent } from './download-progress';

export const WHISPER_MODEL = 'onnx-community/whisper-base';

export interface SttOptions {
  device: 'webgpu' | 'wasm';
  dtype: { encoder_model: 'fp32' | 'q8'; decoder_model_merged: 'fp32' | 'q8' };
}

export function pickSttOptions(hasWebGPU: boolean): SttOptions {
  return hasWebGPU
    ? { device: 'webgpu', dtype: { encoder_model: 'fp32', decoder_model_merged: 'fp32' } }
    : { device: 'wasm', dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' } };
}

export interface Transcriber {
  transcribe(audio: Float32Array, lang: string): Promise<string>;
}

export function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export async function createTranscriber(
  progress?: (event: RawProgressEvent) => void,
): Promise<Transcriber> {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  const asr = await pipeline('automatic-speech-recognition', WHISPER_MODEL, {
    ...pickSttOptions(hasWebGPU()),
    ...(progress ? { progress_callback: progress } : {}),
  } as never);
  return {
    async transcribe(audio, lang) {
      const result = await asr(audio, {
        language: lang,
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      const text = Array.isArray(result)
        ? result[0]?.text
        : (result as { text?: string }).text;
      return (text ?? '').replace(/\s+/g, ' ').trim();
    },
  };
}
```

- [x] **Step 4: Verify, then smoke-test the real model by hand**

Run: `cd frontend && npm test -- stt && npm run typecheck`
Expected: PASS.

Optional spike (recommended once, on the target laptop): in a scratch page,
import `createTranscriber` and confirm the model downloads and transcribes a
known 3-second clip in under ~3 seconds on WebGPU. Delete the scratch page
afterwards.

- [x] **Step 5: Commit**

```bash
git add frontend/src/lib/voice/stt.ts frontend/src/lib/voice/stt.test.ts
git commit -m "feat(voice): add local whisper speech-to-text adapter"
```

---

### Task 8: Kokoro text-to-speech adapter

**Files:**
- Create: `frontend/src/lib/voice/tts.ts`
- Test: `frontend/src/lib/voice/tts.test.ts`

**Interfaces:**
- Consumes: `RawProgressEvent` from Task 6, `voice` id from Task 1.
- Produces: `KOKORO_MODEL`, `pickTtsOptions(hasWebGPU)`, and
  `createSpeaker(progress?): Promise<Speaker>` where
  `Speaker = { speak(text: string, voice: string): Promise<void>; stop(): void }`.

- [x] **Step 1: Write the failing test**

```ts
// frontend/src/lib/voice/tts.test.ts
import { describe, expect, it } from 'vitest';
import { KOKORO_MODEL, pickTtsOptions } from './tts';

describe('pickTtsOptions', () => {
  it('uses fp32 on webgpu, as kokoro-js recommends', () => {
    expect(pickTtsOptions(true)).toEqual({ device: 'webgpu', dtype: 'fp32' });
  });

  it('uses quantized wasm without webgpu', () => {
    expect(pickTtsOptions(false)).toEqual({ device: 'wasm', dtype: 'q8' });
  });

  it('pins the multilingual kokoro checkpoint', () => {
    expect(KOKORO_MODEL).toBe('onnx-community/Kokoro-82M-v1.0-ONNX');
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `cd frontend && npm test -- tts`
Expected: FAIL - cannot resolve `./tts`.

- [x] **Step 3: Write the adapter**

```ts
// frontend/src/lib/voice/tts.ts
import type { RawProgressEvent } from './download-progress';

export const KOKORO_MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';

export interface TtsOptions {
  device: 'webgpu' | 'wasm';
  dtype: 'fp32' | 'q8';
}

export function pickTtsOptions(hasWebGPU: boolean): TtsOptions {
  return hasWebGPU ? { device: 'webgpu', dtype: 'fp32' } : { device: 'wasm', dtype: 'q8' };
}

export interface Speaker {
  speak(text: string, voice: string): Promise<void>;
  stop(): void;
}

export async function createSpeaker(
  progress?: (event: RawProgressEvent) => void,
): Promise<Speaker> {
  const { KokoroTTS } = await import('kokoro-js');
  const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
  const tts = await KokoroTTS.from_pretrained(KOKORO_MODEL, {
    ...pickTtsOptions(hasWebGPU),
    ...(progress ? { progress_callback: progress } : {}),
  } as never);

  let current: HTMLAudioElement | null = null;
  return {
    async speak(text, voice) {
      const audio = await tts.generate(text, { voice } as never);
      const url = URL.createObjectURL(audio.toBlob());
      const element = new Audio(url);
      current = element;
      await new Promise<void>((resolve) => {
        const done = () => { URL.revokeObjectURL(url); current = null; resolve(); };
        element.onended = done;
        element.onerror = done;
        void element.play().catch(done);
      });
    },
    stop() {
      if (!current) return;
      current.pause();
      current = null;
    },
  };
}
```

- [x] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npm test -- tts && npm run typecheck`
Expected: PASS.

If `audio.toBlob()` is not present in the installed `kokoro-js` typings, check
`frontend/node_modules/kokoro-js/dist/*.d.ts` and use the exposed
`toWav()`/`toAudioBuffer()` equivalent instead. Do not change the test.

- [x] **Step 5: Commit**

```bash
git add frontend/src/lib/voice/tts.ts frontend/src/lib/voice/tts.test.ts
git commit -m "feat(voice): add local kokoro text-to-speech adapter"
```

---

### Task 9: Voice provider, mic button, and download notice

**Files:**
- Create: `frontend/src/lib/voice/VoiceContext.tsx`
- Create: `frontend/src/components/voice/MicButton.tsx`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/components/Shell.tsx`

**Interfaces:**
- Consumes: everything above.
- Produces: `VoiceProvider`, `useVoice()` returning
  `{ status, modelProgress, messages, error, context, setContext, toggle, close }`,
  and the `<MicButton />` element rendered in the header.

- [x] **Step 1: Write the provider**

`status` is one of
`'idle' | 'preparing' | 'listening' | 'thinking' | 'speaking' | 'error'`;
`modelProgress` is `{ stt: number | null; tts: number | null }`.

```tsx
// frontend/src/lib/voice/VoiceContext.tsx
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { useLanguage } from '../LanguageContext';
import { requestReply } from './chat';
import { resolveVoiceLanguage } from './languages';
import { createProgressTracker, type ProgressSnapshot } from './download-progress';
import { createRecorder, type Recorder } from './recorder';
import { Endpointer } from './endpoint';
import { createSpeaker, type Speaker } from './tts';
import { createTranscriber, type Transcriber } from './stt';
import type { StepContext } from './context';

export type VoiceStatus = 'idle' | 'preparing' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface VoiceValue {
  status: VoiceStatus;
  modelProgress: ProgressSnapshot;
  messages: VoiceMessage[];
  error: string | null;
  context: StepContext;
  setContext: (context: StepContext) => void;
  toggle: () => void;
  close: () => void;
}

const VoiceContext = createContext<VoiceValue | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [modelProgress, setModelProgress] = useState<ProgressSnapshot>({ stt: null, tts: null });
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<StepContext>({ step: 1, stepTitle: 'Location' });

  const transcriber = useRef<Transcriber | null>(null);
  const speaker = useRef<Speaker | null>(null);
  const recorder = useRef<Recorder | null>(null);
  const endpointer = useRef(new Endpointer());
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => { recorder.current?.cancel(); abort.current?.abort(); }, []);

  const prepare = useCallback(async (onProgress: (snapshot: ProgressSnapshot) => void) => {
    const tracker = createProgressTracker(onProgress);
    if (!transcriber.current) transcriber.current = await createTranscriber(tracker.callbackFor('stt'));
    if (!speaker.current) speaker.current = await createSpeaker(tracker.callbackFor('tts'));
  }, []);

  const runTurn = useCallback(async (audio: Float32Array) => {
    const voice = resolveVoiceLanguage(lang);
    const text = await transcriber.current!.transcribe(audio, voice.stt);
    if (!text) { setStatus('idle'); return; }
    setMessages((all) => [...all, { id: crypto.randomUUID(), role: 'user', text }]);
    setStatus('thinking');
    abort.current = new AbortController();
    const reply = await requestReply({
      question: text, context, lang: voice.lang, signal: abort.current.signal,
    });
    setMessages((all) => [...all, { id: crypto.randomUUID(), role: 'assistant', text: reply }]);
    setStatus('speaking');
    await speaker.current!.speak(reply, voice.voice);
    setStatus('idle');
  }, [context, lang]);

  const finishTurn = useCallback(async () => {
    if (!recorder.current) return;
    const audio = await recorder.current.stop();
    await runTurn(audio);
  }, [runTurn]);

  const toggle = useCallback(async () => {
    if (status === 'speaking') { speaker.current?.stop(); setStatus('idle'); return; }
    if (status === 'listening') { await finishTurn(); return; }
    if (status === 'preparing' || status === 'thinking') return;
    setError(null);
    try {
      setStatus('preparing');
      await prepare(setModelProgress);
      if (!recorder.current) recorder.current = createRecorder();
      endpointer.current.reset();
      let listening = false;
      recorder.current.onLevel((level) => {
        const event = endpointer.current.push(level);
        if (event === 'speech-end' || event === 'timeout') void finishTurn();
        else if (event === 'speech-start' && !listening) { listening = true; setStatus('listening'); }
      });
      await recorder.current.start();
      setStatus('listening');
    } catch (reason) {
      recorder.current?.cancel();
      const denied = reason instanceof DOMException && reason.name === 'NotAllowedError';
      setError(denied
        ? 'Microphone permission is needed for voice questions.'
        : 'Voice could not start. Your audio stays on this device; please try again.');
      setStatus('error');
    }
  }, [finishTurn, prepare, status]);

  const close = useCallback(() => {
    recorder.current?.cancel();
    speaker.current?.stop();
    abort.current?.abort();
    setStatus('idle');
  }, []);

  const value = useMemo<VoiceValue>(() => ({
    status, modelProgress, messages, error, context, setContext, toggle, close,
  }), [status, modelProgress, messages, error, context, toggle, close]);
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceValue {
  const value = useContext(VoiceContext);
  if (!value) throw new Error('VoiceProvider is required');
  return value;
}
```

- [x] **Step 2: Write the mic button and download notice**

```tsx
// frontend/src/components/voice/MicButton.tsx
import { LoaderCircle, Mic, Square } from 'lucide-react';
import { useVoice } from '../../lib/voice/VoiceContext';

const LABEL: Record<string, string> = {
  idle: 'Ask by voice',
  preparing: 'Preparing voice',
  listening: 'Stop listening',
  thinking: 'Thinking',
  speaking: 'Stop speaking',
  error: 'Retry voice',
};

const percent = (value: number | null) => (value === null ? 0 : Math.round(value * 100));

export default function MicButton() {
  const { status, toggle, modelProgress } = useVoice();
  const busy = status === 'preparing' || status === 'thinking';
  const active = status === 'listening' || status === 'speaking';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={status === 'listening'}
        aria-label={LABEL[status]}
        title={LABEL[status]}
        className={`inline-flex h-[35px] min-h-[35px] items-center gap-2 rounded-full border px-3 text-sm font-semibold ${
          active
            ? 'border-primary bg-primary text-on-primary'
            : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
        }`}
      >
        {busy ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : null}
        {status === 'listening' ? <Square size={16} aria-hidden="true" /> : null}
        {status !== 'listening' && !busy ? <Mic size={16} aria-hidden="true" /> : null}
        <span className="hidden sm:inline">{LABEL[status]}</span>
      </button>

      {status === 'preparing' && (
        <div
          role="status"
          aria-live="polite"
          className="absolute right-0 top-[calc(100%+8px)] z-[70] w-72 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-sm shadow-2xl"
        >
          <p className="font-semibold text-on-surface">Downloading the voice models once</p>
          <p className="mt-1 text-on-surface-variant">
            Listening needs up to 280 MB and the voice model up to 310 MB. They are
            cached on this device, so this happens only once.
          </p>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-xs text-on-surface-variant">Listening model - {percent(modelProgress.stt)}%</p>
              <progress className="h-1.5 w-full" max={100} value={percent(modelProgress.stt)} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Voice model - {percent(modelProgress.tts)}%</p>
              <progress className="h-1.5 w-full" max={100} value={percent(modelProgress.tts)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 3: Mount the provider and place the button**

`frontend/src/main.tsx` - wrap `App` inside the existing `LanguageProvider`:

```tsx
import { VoiceProvider } from './lib/voice/VoiceContext';
// ...
<StrictMode>
  <LanguageProvider>
    <VoiceProvider>
      <App />
    </VoiceProvider>
  </LanguageProvider>
</StrictMode>
```

`frontend/src/components/Shell.tsx` - import `MicButton` and render it
**immediately before** `<ReadAloudButton />` in the header actions:

```tsx
<div className="flex min-h-11 items-center gap-2">
  <MicButton />
  <ReadAloudButton />
  <LanguageSelector variant="wizard" />
```

- [x] **Step 4: Verify by hand**

Run: `cd frontend && npm run typecheck && npm run dev`
Then in the browser at `http://localhost:5173/#/apply`:
1. The mic sits left of the speaker button in the header.
2. First click shows the download notice with both progress bars moving.
3. After the download, the button turns active and the browser asks for mic permission.
4. Deny permission: an inline error appears, no crash, and the button resets.

- [x] **Step 5: Commit**

```bash
git add frontend/src/lib/voice/VoiceContext.tsx frontend/src/components/voice/MicButton.tsx frontend/src/main.tsx frontend/src/components/Shell.tsx
git commit -m "feat(voice): add voice provider and header mic button"
```

---

### Task 10: The voice orb in the apply section

**Files:**
- Create: `frontend/src/components/voice/VoiceOrb.tsx`
- Modify: `frontend/src/components/FeasibilityCheck.tsx`

**Interfaces:**
- Consumes: `useVoice()` from Task 9.
- Produces: `<VoiceOrb />`, rendered inside the apply section only.

- [x] **Step 1: Write the orb**

The orb is horizontally centred and floats near the bottom of the apply section
so it never covers the form. It expands into a transcript panel.

```tsx
// frontend/src/components/voice/VoiceOrb.tsx
import { Languages, Mic, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { resolveVoiceLanguage } from '../../lib/voice/languages';
import { useVoice } from '../../lib/voice/VoiceContext';

const ORB_STATE_CLASS: Record<string, string> = {
  idle: 'bg-primary/90',
  preparing: 'bg-secondary animate-pulse',
  listening: 'bg-primary ring-4 ring-primary/30 animate-pulse',
  thinking: 'bg-secondary animate-pulse',
  speaking: 'bg-secondary animate-pulse',
  error: 'bg-error',
};

export default function VoiceOrb() {
  const { status, messages, error, toggle } = useVoice();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const voice = resolveVoiceLanguage(lang);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-3 px-4">
      {open && (
        <div
          role="dialog"
          aria-label="Voice assistant"
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-on-surface">Voice assistant</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close voice assistant"
              className="grid min-h-9 min-w-9 place-items-center rounded-full hover:bg-surface-container"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          {!voice.exact && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Languages size={13} aria-hidden="true" />
              Voice is available in English and Hindi, so this session uses English.
            </p>
          )}
          <div ref={listRef} className="mt-3 max-h-64 space-y-2 overflow-y-auto" aria-live="polite">
            {messages.length === 0 && (
              <p className="text-sm text-on-surface-variant">
                Press the mic and ask about this step. Your audio never leaves this device.
              </p>
            )}
            {messages.map((message) => (
              <p
                key={message.id}
                className={`rounded-xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'ml-6 bg-secondary-container text-on-secondary-container'
                    : 'mr-6 bg-surface-container text-on-surface'
                }`}
              >
                {message.text}
              </p>
            ))}
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
        </div>
      )}
      <button
        type="button"
        onClick={() => { setOpen(true); void toggle(); }}
        aria-label={status === 'idle' ? 'Open voice assistant' : 'Voice assistant active'}
        className={`pointer-events-auto grid h-14 w-14 place-items-center rounded-full text-on-primary shadow-xl motion-reduce:animate-none ${ORB_STATE_CLASS[status]}`}
      >
        <Mic size={22} aria-hidden="true" />
      </button>
    </div>
  );
}
```

- [x] **Step 2: Render it in the apply section only**

`frontend/src/components/FeasibilityCheck.tsx` - add the import and render it
once, as the last child inside the outer `div.assessment`, so it appears for
every wizard step but nowhere else:

```tsx
import VoiceOrb from './voice/VoiceOrb';
// ...inside the returned tree, just before the closing </div> of .assessment:
<VoiceOrb />
```

- [x] **Step 3: Feed the wizard step into the orb**

`useAssessment()` already exposes `currentStep`. Map it to a `StepContext` with
the existing state and push it with `setContext`, so the assistant knows which
step the user is on. Add to `FeasibilityCheck`:

```tsx
import { useVoice } from '../lib/voice/VoiceContext';
// inside the component. NOTE: `useEffect` is already imported at the top of
// FeasibilityCheck.tsx - do not add a second import for it.
const { setContext } = useVoice();
const STEP_TITLES = ['Location', 'Business', 'Demand', 'Credit & subsidy', 'Identity', 'Report'];
useEffect(() => {
  setContext({
    step: assessment.currentStep,
    stepTitle: STEP_TITLES[assessment.currentStep - 1] ?? 'Location',
    locationText: assessment.locationText || undefined,
    enterprise: assessment.selectedEnterprise || undefined,
    feasibilityVerdict: assessment.feasibilityResult?.verdict,
    marginPercent: assessment.marginPercent,
  });
}, [assessment.currentStep, assessment.locationText, assessment.selectedEnterprise,
    assessment.feasibilityResult, assessment.marginPercent, setContext]);
```

- [x] **Step 4: Verify by hand**

Run: `cd frontend && npm run typecheck && npm run dev`
At `http://localhost:5173/#/apply`:
1. The orb is centred near the bottom and does not cover the form fields.
2. Clicking it opens the panel and starts listening; speaking shows your words
   as a user bubble and then an assistant reply.
3. The reply is spoken aloud in the app language.
4. Switching the header language to Hindi makes the reply Hindi.
5. The orb is absent on `/`, `/officer`, and `/audit`.

- [x] **Step 5: Run the full suite and build**

Run: `cd frontend && npm test && npm run typecheck && npm run build`
Expected: all tests pass, typecheck clean, build succeeds.

- [x] **Step 6: Commit**

```bash
git add frontend/src/components/voice/VoiceOrb.tsx frontend/src/components/FeasibilityCheck.tsx
git commit -m "feat(voice): add floating voice orb to the apply section"
```

---

## Manual acceptance checklist (run before calling this done)

- [ ] `cd frontend && npm test` passes.
- [ ] `cd frontend && npm run typecheck` passes.
- [ ] `cd frontend && npm run build` passes.
- [ ] `git status` shows no changes under `backend/`.
- [ ] Mic button renders immediately left of Read aloud in the header.
- [ ] First mic press shows the download notice; later presses do not.
- [ ] Microphone denied -> inline error, no crash.
- [ ] English question -> English transcript, English spoken reply.
- [ ] Hindi selected -> Hindi transcript, Hindi spoken reply.
- [ ] Tamil selected -> English reply plus the "English and Hindi" note.
- [ ] Asking "how much loan will I get" never produces a computed figure.
- [ ] No request to any host other than the model CDN and the configured chat URL.
- [ ] Orb appears only in the apply section.

---

## Addendum 2026-09-11: switchable speech providers (cloud GPU / hosted)

Asked for after the v1 build: "tts and stt will be on gpu, model from the cloud".
Speech-to-text and text-to-speech are now selected the same way the chat brain
already was - by environment variable - so the browser models stay the default
and any layer can move to a GPU box or a hosted API with no client change.
`docs/frontend/voice-stack.md` ("Production topology") holds the design record
and the live-gateway findings.

### What changed

- `src/lib/voice/providers.ts` reads `VITE_VOICE_STT_URL`/`_KEY`/`_MODEL`,
  `VITE_VOICE_TTS_URL`/`_KEY`/`_MODEL`/`_VOICE` and `VITE_VOICE_STT_DEVICE`. An
  empty URL still means "run it in the browser", exactly as before.
- `createTranscriber` posts a 16 kHz mono WAV to the STT URL as multipart
  (`file`, `model`, `language`, `response_format=json`) when one is set.
- `createSpeaker` posts `{model, input, voice, response_format:'wav'}` to the TTS
  URL when one is set, and plays the returned audio through the same player the
  local engines use.
- `src/lib/voice/wav.ts` holds the single WAV encoder, shared by playback and
  upload.
- The orb's privacy line and the start-failure message follow the configuration,
  so "your audio never leaves this device" is only said while it is true.
- `VITE_VOICE_STT_DEVICE=webgpu` overrides the browser Whisper backend for
  machines where the measurements above do not hold; it stays fp32 there because
  the quantized decoder hallucinated on WebGPU.

### Verification

- [x] Remote path against a local mock: correct multipart fields, 16 kHz RIFF
      body, `language=en`, bearer header; correct TTS JSON body; returned WAV
      played to completion and the orb returned to idle.
- [x] Local path still initialises and downloads as before after the refactor.
- [x] Live gateway (aihubmix): `coding-minimax-m3-free` answered 200 from the
      running page origin with a 204 preflight reflecting the origin, and the
      app's own `POST /v1/chat/completions` returned 200 in the network log.
- [x] `npm test` 62 passing, `npm run typecheck` clean, `npm run build` passes.
- [ ] Funded account: cloud STT/TTS through the gateway - both audio routes
      answer 403 "account balance is insufficient" on the current key, so free
      credit covers chat only.
- [ ] Real microphone, both languages, against a funded speech endpoint.
