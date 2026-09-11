# UdyogSaarthi Voice Stack (design record)

**Status:** Approved direction 2026-09-11. Scope for v1: **English + Hindi only.**
**Target device:** laptop, RTX 4050 6 GB + 16 GB RAM (WebGPU available).

This file is the spec the voice-assistant plan implements. It records *what* we
use and *why*, so the choice is not re-litigated later.

## Hard constraints

1. **Audio never leaves the device by default.** That is what the browser models
   buy, and it is still the shipped default. Setting `VITE_VOICE_STT_URL` sends
   the turn to that endpoint instead, and the orb's copy switches with it, so
   the user is never told something false. Do not repeat the claim elsewhere.
2. **No provider API keys.** `SARVAM_API_KEY` and `BHASHINI_*` are unset, so the
   existing `routers/translation.py` proxy cannot be reused for speech.
3. **Frontend-only.** The FastAPI backend moves to Supabase and the frontend to
   Vercel, so the voice feature must not add coupling to `backend/`.
4. **Language follows the app.** Whatever `LanguageContext.lang` is set to is
   the bot's listening *and* speaking language.

## Decisions

| Layer | Choice | Package / model | Approx. download | License |
|---|---|---|---|---|
| Speech to text | Whisper small (CPU) | `@huggingface/transformers` 3.8.x + `onnx-community/whisper-small` | ~238 MB q8 | MIT |
| Text to speech (English) | Kokoro-82M | `kokoro-js` 1.2.x + `onnx-community/Kokoro-82M-v1.0-ONNX` | ~88 MB q8 / ~311 MB fp32 | Apache-2.0 |
| Text to speech (Hindi) | MMS-TTS VITS | `@huggingface/transformers` 3.8.x + `Xenova/mms-tts-hin` | ~37 MB q8 / ~109 MB fp32 | **CC-BY-NC-4.0** |
| Turn detection | RMS energy endpointer | in-repo, no download | 0 | - |
| Chat brain | OpenAI-compatible HTTP endpoint, optional | in-repo client | 0 | - |

Every row above is the *default*, not a permanent choice. The chat URL and the
two speech URLs are read from the environment, so any layer can move to a GPU
box or a hosted API without touching the client - see "Production topology".

`@huggingface/transformers` is pinned to **3.8.x, not 4.x**. `kokoro-js` depends on
`^3.5.1`; pinning 4.x made npm install two copies of transformers and two copies
of `onnxruntime-web` (4.x pulls a `-dev` runtime build) into the same page. 3.8.x
satisfies both packages, so the app ships one runtime.

## Why Whisper small, not base

`onnx-community/whisper-base` cannot write Hindi. Transcribing Devanagari speech
with `language: 'hi'`, `task: 'transcribe'`, it returned an English translation
for a short phrase and Urdu (Arabic-script) text for longer ones, in **both**
fp32 and q8 - so the failure is model size, not quantization. The same audio
through `onnx-community/whisper-small` comes back in Devanagari with the meaning
intact. Small costs 238 MB q8 against 73 MB for base, which still fits the
"up to 280 MB" notice in the mic popover.

Quantized weights are used on **both** backends. q8 loads and infers on the
WebGPU execution provider in Chrome (verified), and fp32 small would be ~923 MB.
Latency for a 6 s clip is ~2.9 s on CPU, so WebGPU is kept for the speed-up.

## Why Hindi does not use Kokoro

The plan assumed one Kokoro model could speak both languages via the Hindi
voicepacks (`hf_alpha`, `hf_beta`, `hm_omega`, `hm_psi`) that do exist in
`hexgrad/Kokoro-82M` and in `voices/*.bin` on the ONNX repo. That is not
reachable from the browser today:

1. `kokoro-js@1.2.1` (latest) hardcodes an **English-only** `VOICES` map and
   `_validate_voice` throws `Voice "hf_alpha" not found` for any Hindi id.
2. `kokoro-js` phonemizes through the `phonemizer@1.2.1` package, whose eSpeak-NG
   build ships **English language data only** and rejects `hi`:
   `Invalid language identifier: "hi"`. The same package cannot phonemize
   Devanagari at all.
3. A full-language eSpeak-NG WASM exists (`espeak-ng@1.0.2`, 17.6 MB, GPL-3.0)
   but exposes a CLI-shaped API that re-instantiates the module per call, and its
   GPL licence is a problem for this product.

Kokoro is therefore used for English only, and Hindi is spoken by MMS-TTS, a
VITS model with a Devanagari vocabulary (`is_uroman: false`, `phonemize: false`)
that needs no grapheme-to-phoneme step at all.

**Licence caveat (must fix before production):** `facebook/mms-tts-hin` is
**CC-BY-NC-4.0 (non-commercial)**. Fine for a prototype or a hackathon, not
acceptable for a deployed government-facing service. Replace it with a licensed
Indic voice (Bhashini / Sarvam, or AI4Bharat's Indic-TTS under its own terms)
before launch.

Both model downloads are fetched by the **browser** on first use and cached
locally. No server is involved at any point.

## Why these, and why not the alternatives

- **Sarvam / Bhashini ASR + TTS** - the right *product* answer (22 Indic
  languages, already half-wired for translation) but both need keys we do not
  have. Revisit when keys exist.
- **Nemotron-3.5-ASR-Streaming-Multilingual-0.6B** - verified 35 languages, but
  only **Hindi** from our set (no Tamil, Bengali, Telugu, Marathi, Gujarati,
  Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu). Its ONNX export is
  **ONNX Runtime GenAI** format (`genai_config.json` + `encoder/decoder/joint`
  RNNT); `onnxruntime-genai` has no web/npm build, so browser use needs a
  hand-written onnxruntime-web RNNT decoder. Not viable for v1.
- **Kitten TTS** - v0.8 is an 80 M StyleTTS2 model with English-only voices
  (`Bella`, `Jasper`, `Luna`, ...). It cannot speak Hindi. Rejected.
- **MMS-TTS / AI4Bharat Indic-TTS (VITS)** - the only *local* option that scales
  to all 22 languages. Quality is flatter than Kokoro and the checkpoints are
  CC-BY-NC-4.0, so it is used for **Hindi only** in v1, and the licence must be
  resolved before launch. This is also the documented upgrade path if the
  language scope widens.
- **IndicF5 / indic-parler-tts** - genuinely natural Indic speech, but they need
  a Python GPU server. Out of scope while the requirement is on-device.
- **`webkitSpeechRecognition`** - Chrome streams the audio to Google servers.
  Violates constraint 1. Rejected.

## Language mapping (v1)

`frontend/src/lib/voice/languages.ts` is the single source of truth.

| App language | Whisper token | Engine | Voice |
|---|---|---|---|
| `en` | `en` | `kokoro` | `af_heart` |
| `hi` | `hi` | `mms` | single built-in speaker |

Any other app language falls back to English, and the UI says so rather than
silently listening in the wrong language.

The Kokoro English voice id is verified against `hexgrad/Kokoro-82M/VOICES.md`.
Only one speech engine is downloaded per session: the one the app language needs.

## Runtime behaviour

- Models are imported with dynamic `import()` and loaded on the **first mic
  press**, never on page load, so the apply screen stays light.
- The first press opens a **download notice** showing what is being fetched, how
  large it is, and live progress, because a silent multi-hundred-megabyte fetch
  looks like a frozen button. Downloads are one-time and cached.
- Whisper runs `q8` on the `wasm` backend and always on the CPU; Kokoro and MMS
  keep `fp32` on WebGPU and `q8` on WASM.
- onnxruntime-web's WASM binary is fetched from `cdn.jsdelivr.net` at first
  inference. The only network hosts the voice path touches are that CDN, the
  model files on `huggingface.co`, and the optional chat endpoint.
- The transcript is fed to the brain, the reply is spoken by Kokoro, and the
  text is shown in the orb panel so a deaf or hard-of-hearing user gets parity.
- The conversation lives in memory only and dies on reload.

## Backends and measured latency

One 4 s clip through the real pipeline on the demo machine (RTX 4050 Laptop,
6 GB, sharing the desktop with a local llama.cpp server):

| Backend | Load | Transcribe | Text | Download |
|---|---|---|---|---|
| **Whisper `wasm` + q8** | 3.6 s | **5.4 s** | correct | 238 MB |
| Whisper `webgpu` + fp32 | 227 s | 8.2 s | correct | 923 MB |
| Whisper `webgpu` + q8 | 3.0 s | 129 s | hallucinated | 238 MB |

The quantized decoder is pathological on the WebGPU backend, so Whisper is pinned
to `wasm`. That 5.4 s depends on onnxruntime-web getting a **threaded** WASM
build, which needs cross-origin isolation:

- dev - `server.headers` in `frontend/vite.config.ts` (`COOP: same-origin`,
  `COEP: credentialless`).
- production - the same two headers on the Vercel project. Without them the
  runtime silently drops to one thread and the same clip takes ~12 s.

Kokoro is the opposite: WebGPU generates 3.2 s of speech in 0.6 s, where the
`wasm` + q8 path needs 7.9 s for the same clip. TTS stays on the GPU.

## Local brain (llama.cpp + Gemma 4)

`VITE_VOICE_CHAT_URL` may point at a local llama.cpp server instead of a hosted
API; no client code changes. The demo machine already has a CUDA build at
`D:\Apps\llama\bin-cuda` and `gemma-4-E4B-it-qat-UD-Q4_K_XL.gguf`:

```
D:\Apps\llama\bin-cuda\llama-server.exe ^
  -m "D:\Apps\llama\models\gemma-4-E4B-it-qat-UD-Q4_K_XL\gemma-4-E4B-it-qat-UD-Q4_K_XL.gguf" ^
  -c 4096 -ngl 999 -np 1 --flash-attn on ^
  --cache-type-k q8_0 --cache-type-v q8_0 ^
  --reasoning off --reasoning-format deepseek ^
  --host 127.0.0.1 --port 8080 --alias gemma-4-E4B
```

`--reasoning off` is not optional. Gemma 4 emits a "Thinking Process:" preamble
by default and it lands in `message.content`, so the orb would read the model's
reasoning aloud. Measured 33-52 tok/s, ~1 s for a 39-token reply.

`frontend/.env.local` (gitignored):

```
VITE_VOICE_CHAT_URL=http://127.0.0.1:8080/v1/chat/completions
VITE_VOICE_CHAT_MODEL=gemma-4-E4B
VITE_VOICE_CHAT_KEY=
```

The key stays empty locally. Setting it together with a hosted URL is the whole
switch to the production brain.

## Production topology (cloud GPU / hosted speech)

The pattern that makes the brain swappable makes the speech engines swappable
too. No URL means the browser downloads and runs the model itself; a URL means
the model runs wherever that URL points. The client only ever speaks the OpenAI
audio shapes, so a self-hosted GPU box and a hosted API are the same
integration:

| Var | Empty (demo) | Set (production) |
|---|---|---|
| `VITE_VOICE_CHAT_URL` | offline canned answers | `POST` chat completions |
| `VITE_VOICE_STT_URL` | browser Whisper small | `POST` multipart `file`, `model`, `language`, `response_format=json` |
| `VITE_VOICE_TTS_URL` | browser Kokoro (en) / MMS (hi) | `POST` JSON `model`, `input`, `voice`, `response_format=wav` |
| `VITE_VOICE_STT_DEVICE` | `wasm` (default) or `webgpu` | ignored |

Going fully cloud drops the ~550 MB first-run download and the 5.4 s CPU
transcription, and removes the CC-BY-NC Hindi MMS checkpoint from the stack.

### Verified

Two independent runs.

1. **Against a local mock** that speaks the OpenAI shapes, before a cloud key
   existed, to prove the client wiring. Recorded: `POST
   /v1/audio/transcriptions` with `Authorization: Bearer ...`,
   `content-type: multipart/form-data`, fields
   `file=turn.wav, model, language, response_format`, a 23.5 kB 16 kHz RIFF body
   and `language=en`; then `POST /v1/audio/speech` with body
   `{"model":...,"input":...,"voice":"af_heart","response_format":"wav"}`, whose
   WAV played to completion and returned the orb to idle.
2. **Against a live gateway** (aihubmix, 2026-09-11) to prove the vendor path.
   `coding-minimax-m3-free` returned a chat completion in 0.6 s from curl and
   from the running page origin, and the `OPTIONS` preflight answers **204** with
   `access-control-allow-origin` reflecting the caller - so the browser can call
   that host directly and no proxy is needed just to make it work.

### What the live gateway could not do

- `minimax-m3-free` (the plain alias) answers `no_available_channel` - "cannot be
  served at the moment" - on every attempt. `coding-minimax-m3-free` is the same
  model behind a working alias (the response body reports `"model":"MiniMax-M3"`),
  so that is the id to use.
- `/v1/audio/speech` and `/v1/audio/transcriptions` both exist - they answer
  `400`/`401` rather than `404` - but return **403 "account balance is
  insufficient"**. Free chat credit does not cover audio, so this account cannot
  drive cloud STT/TTS until it is funded. The browser models stay the working
  speech path until then.

### Key handling

`VITE_VOICE_CHAT_KEY` is inlined into the JavaScript bundle by Vite, so a
client-side key is **public**. Acceptable for the prototype, not for a deployed
government-facing service. Pointing `VITE_VOICE_CHAT_URL` at a Vercel function
(`/api/voice/chat`) that holds the key server-side is an environment-variable
change with no code change; do that before real deployment, and the same for the
two speech URLs once they are used.

### Cloud speech candidates (English + Hindi, v1)

| Layer | Candidate | Why |
|---|---|---|
| STT | Sarvam Saarika | Indic-first, Hindi + English, streaming, no licence caveats |
| STT | ElevenLabs Scribe, Deepgram Nova-3, Groq `whisper-large-v3-turbo` | fast hosted Whisper-class, Hindi supported |
| STT | faster-whisper `large-v3-turbo` behind speaches / whisper.cpp | self-hosted on GPU, same request shape, no per-minute cost |
| TTS | MiniMax `speech-2.6`-class | natural Hindi + English, and the account already reaches MiniMax |
| TTS | ElevenLabs Flash v2.5, Cartesia Sonic-3 | lowest latency, multilingual |
| TTS | Sarvam Bulbul | Indic-first, pairs with Saarika |

Confirm model ids against the funded account before wiring one in; a listing
that does not require a key is not proof that an audio model exists. Whichever
vendor wins, only the URL and model id change - the browser contract does not.

## Deferred (explicitly out of scope)

- 22-language voice (needs MMS-TTS/Indic-TTS, or Bhashini keys).
- Streaming word-by-word ASR (Whisper is chunked, not token-streaming).
- Voice-driven form filling or step navigation.
