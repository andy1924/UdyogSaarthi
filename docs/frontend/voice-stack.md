# UdyogSaarthi Voice Stack (design record)

**Status:** Approved direction 2026-09-11. Scope for v1: **English + Hindi only.**
**Target device:** laptop, RTX 4050 6 GB + 16 GB RAM (WebGPU available).
**Speech rule:** recognition and synthesis are **local only** - the client
contains no speech URL at all.

This file is the spec the voice-assistant plan implements. It records *what* we
use and *why*, so the choice is not re-litigated later.

For how the feature actually works - the turn lifecycle, the file map, the state
machine, every environment variable, and how to extend it - see
[`voice-assistant.md`](./voice-assistant.md). That file is the reference; this
one is the record of the decisions and the measurements behind them.

## Hard constraints

1. **Audio never leaves the device.** Recognition and synthesis run in a Web
   Worker inside this browser, on downloaded models, and this is a rule rather
   than a default: the remote speech branches were **removed** from `stt.ts`
   and `tts.ts`, and `providers.ts` reads no speech URL. No environment
   variable or deploy can turn the applicant's recording into network traffic.
   Only the recognised text may leave, and only to the chat brain. Do not
   repeat the claim elsewhere.
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
| Text to speech (Hindi) | MMS-TTS VITS | `@huggingface/transformers` 3.8.x + `Xenova/mms-tts-hin` | ~37 MB q8, WASM only | **CC-BY-NC-4.0** |
| Turn detection | RMS energy endpointer | in-repo, no download | 0 | - |
| Chat brain | OpenAI-compatible HTTP endpoint, optional (local llama.cpp or hosted) | in-repo client | 0 | - |

The two speech rows run in the browser and nowhere else: the recording is
transcribed and the reply is synthesised on the device, and there is no speech
URL to set. The chat brain is the one swappable layer - local llama.cpp or a
hosted API - because its input is already-local text. See "The brain".

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
intact. Small costs 238 MB q8 against 73 MB for base, downloaded once on the
first mic press and cached by the browser after that.

Quantized weights are used on **both** backends. q8 loads and infers on the
WebGPU execution provider in Chrome (verified), and fp32 small would be ~923 MB.
Latency for a 6 s clip is ~2.9 s on CPU, and WebGPU is not the speed-up it
looks like (see *Backends and measured latency*), so Whisper is pinned to the
CPU and leaves the GPU to the answer voice.

### The language token is the only language control

Measured with `onnx-community/whisper-small` (q8, CPU) on a Hindi sentence
synthesised to audio, transcribed four ways:

| Options passed | Output |
|---|---|
| `language: 'hi'`, `task: 'transcribe'` | Devanagari, meaning intact |
| `language: 'hi'`, `task: 'translate'` | English translation |
| `language: 'en'`, `task: 'transcribe'` | English translation of the Hindi |
| no language at all | transformers.js warns, forces `en`, same English output |

Two consequences the code depends on:

1. `language: 'hi'` is reliable. The same clip transcribed correctly at 2
   seconds long and at 8% volume, so Hindi never depends on mic sensitivity.
2. There is **no auto-detect** in `transformers.js@3.8.1`:
   `_retrieve_init_tokens` hard-defaults to `en`, and `prompt_ids` (Whisper's
   usual biasing trick) is not wired up. Whatever the language token says wins,
   and `en` makes Whisper *translate* rather than transcribe.

So the app language is the mic's language, and the orb panel always says which
one is live. A Hindi speaker with English selected gets an English translation
of their own words, which reads as "the mic does not take Hindi" - switch the
language menu to हिन्दी and the same speech comes back in Devanagari.

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

**VITS cannot run on WebGPU.** Its duration predictor gathers with an int64
tensor and the backend rejects the kernel outright:

```
[WebGPU] Kernel "[GatherND] /duration_predictor/flows.4/GatherND" failed.
Error: Unsupported data type: 7
```

English never noticed, because Kokoro is a different architecture and does run on
the GPU. Hindi failed on every WebGPU browser, which reads as "the Hindi voice is
broken". MMS is therefore pinned to `wasm` + `q8` (`MMS_TTS_OPTIONS` in `tts.ts`),
with a test that keeps it there. The quantized checkpoint is 37 MB rather than
109 MB, so the working path is also the smaller download.

**Licence caveat (must fix before production):** `facebook/mms-tts-hin` is
**CC-BY-NC-4.0 (non-commercial)**. Fine for a prototype or a hackathon, not
acceptable for a deployed government-facing service. Replace it with a licensed
Indic voice before launch - a local AI4Bharat Indic-TTS checkpoint under its own
terms, or Bhashini / Sarvam if the local-only rule is ever relaxed.

Both model downloads are fetched by the **browser** on first use and cached
locally. No server is involved at any point.

## Why these, and why not the alternatives

- **Sarvam / Bhashini ASR + TTS** - broad Indic coverage and good quality, but
  both are cloud services and the speech rule forbids sending audio off the
  device. Ruled out unless that rule changes.
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

Because the language token is also the mic's language (see above), that fallback
notice names the fix and not just the state: the orb panel says which language
is live and that हिन्दी in the language menu is what switches the mic.

The Kokoro English voice id is verified against `hexgrad/Kokoro-82M/VOICES.md`.
Only one speech engine is downloaded per session: the one the app language needs.

## Runtime behaviour

- Models load in the **voice worker** (see "The voice worker"), on the **first
  mic press**, never on page load. The apply screen therefore stays light *and*
  stays interactive while a few hundred megabytes arrive: nothing about a
  model runs on the main thread.
- The **microphone is asked for first**, before any model is fetched. A first run
  otherwise requested permission minutes after the click, behind a
  multi-hundred-megabyte download, where a late or dismissed prompt reads as
  "permission is needed" forever. The prompt now belongs to the click, and the
  stream is held until recording starts.
- While those models load, the mic button shows a **spinner and nothing else**.
  The percentage lives inside the orb, which is where the applicant is already
  looking; a separate download panel just covered the step they were reading.
  Downloads are one-time and cached.
- Progress is **bytes received over bytes expected, summed across files**. The
  largest single percentage cannot be used: a 44-byte `config.json` finishing
  first pins such an aggregate to 100% for the whole download. A file that
  arrives without a `Content-Length` reports *unknown* rather than a stale
  number, and the value is capped at 99% while loading, so an unfinished
  download can never claim to be finished.
- The endpointer is deliberately sensitive: `speechThreshold: 0.008` and 150 ms
  of voiced audio to open a turn. A laptop mic at arm's length sits well under
  the old `0.02`, so the turn never opened and every attempt ended as a blank
  recording.
- **A turn closes on its own.** 900 ms of trailing silence sends the message, so
  the user never has to press anything a second time to finish a sentence.
- Recorded audio is **peak-normalised** (up to x6) before transcription. A quiet
  recording is the most common reason Whisper returns nothing at all.
- An empty transcript is answered out loud with "I did not catch any speech",
  rather than returning to idle in silence, which reads as a freeze.
- The microphone is **released as soon as the turn is captured**, so nothing
  listens while the agent speaks. Interrupting is a deliberate tap on the orb or
  on the red stop button; a voice-activity trigger was tried and removed, because
  room noise kept cutting the reply off mid-sentence.
- Whisper runs `q8` on the `wasm` backend and always on the CPU; Kokoro keeps
  `fp32` on WebGPU and `q8` on WASM; MMS is pinned to `wasm` + `q8`, because
  VITS cannot run on WebGPU at all - see *Why Hindi does not use Kokoro*.
- onnxruntime-web's WASM binary is fetched from `cdn.jsdelivr.net` at first
  inference. The only network hosts the voice path touches are that CDN, the
  model files on `huggingface.co`, and the optional chat endpoint.
- The transcript is fed to the brain, the reply is spoken by the on-device
  voice, and the
  text is shown in the orb panel so a deaf or hard-of-hearing user gets parity.
- A reply is spoken **one line at a time**, and a line longer than about 240
  characters (`SPEECH_CHUNK_CHARS`) is cut again at a word boundary. Both
  engines drop everything past their own tokenizer limit without saying so:
  `kokoro-js` hands its tokenizer `truncation: true` and then slices the style
  vector at 509 phonemes. Measured on a 984-character reply, one call produced
  **26 s** of audio where the text is **63 s** of speech - the answer was cut
  roughly in half, mid-sentence. In pieces it reads in full.
- The panel highlights the line whose audio has actually started
  (`Speaker.onSentence`), not a fraction of the clip. A fraction was wrong as
  soon as a reply became several clips: it ran a whole sentence ahead of the
  voice.
- The speaker stops after **ten minutes** (`SPEAK_MAX_MS`), as does the
  read-aloud button (`READ_ALOUD_MAX_MS`). Neither is a length limit any more -
  the chunking removed the real one - they are a stop for a voice that would
  otherwise keep talking to an empty room.
- The conversation lives in memory only and dies on reload.

## The voice worker

Whisper and Kokoro are built and run in a **module worker**,
`frontend/src/worker/voice-engine.ts`, not on the main thread.

Measured on the demo machine against the real dev server, loading the same
models the app loads:

| | Main thread (before) | Worker (now) |
|---|---|---|
| Longest blocking task | **1498 ms** | **none** |
| rAF frame gap, p95 | frozen for the length of the load | **6 ms** |
| rAF frame gap, worst | - | 311 ms, once |

The 1498 ms figure is a **warm cache**: that is what `KokoroTTS.from_pretrained`
costs on its own, on the main thread, with every file already in the HTTP cache.
Cold it is far worse. One task that long is why every spinner stopped rotating
and no click landed until it finished.

The split:

- `lib/voice/models.ts` - the checkpoint ids, the device/dtype choice, and the
  option builders. The one module both sides read: the worker loads the model,
  the client decides the options and hands them over. Keeping it separate is
  what stops the worker bundle from pulling in client code.
- `lib/voice/engine-protocol.ts` - the request and response types.
- `worker/voice-engine.ts` - loads and caches one Whisper pipeline and one TTS
  pipeline, and answers `warmup`, `transcribe` and `synthesize`. It forwards the
  provider's `progress_callback` events to the client as `progress` messages.
- `lib/voice/engine.ts` - the main-thread client: one lazily created worker, an
  id-keyed promise map, progress routed back to the caller that asked.

Recordings and synthesised samples cross the boundary as **transferred**
`ArrayBuffer`s, so neither is copied. Playback stays on the main thread: the
level that drives the orb comes from an `AnalyserNode`, and that has to be
attached to the audio element that is playing. Since the reply is now a run of
small clips rather than one large one, the speaker keeps at most **two** clips
alive - the one playing and the one after it - so a long answer does not pin a
dozen of them in memory.

`vite.config.ts` sets `worker.format: 'es'`. The default IIFE worker format
cannot code-split, and the dynamic `import()`s of `@huggingface/transformers`
and `kokoro-js` are exactly that.

## What the assistant knows

`frontend/src/components/FeasibilityCheck.tsx` pushes a **site snapshot** into
the voice context whenever the wizard state changes, and
`frontend/src/lib/voice/context.ts` renders it into the prompt:

- step number and title, business, location, district and market radius;
- the demand numbers exactly as the screen shows them: feasibility score,
  competition score, nearby registered units and the verdict;
- the SWOT sentences and the related opportunities;
- whether identity is verified and whether the report exists.

The structured snapshot is not the whole answer. It cannot see a radius option,
a banner or a sentence the wizard did not think to name, so `pageText()` in the
same module reads the words actually on the page and appends them to the request
as the `SITE SNAPSHOT` block the system prompt refers to. It is read from the
live DOM at ask time - not cached from when the step was set, which would go
stale the moment the applicant typed - from `main` only, with the shell footer
and the cookie banner hidden for the length of one synchronous read. It uses
`innerText` rather than `textContent`, because `textContent` runs blocks
together ("UdyogSaarthiStart your plan") and would be read out loud that way.
`clipPage()` caps it at `PAGE_SNAPSHOT_CHARS` (4000, about a thousand tokens)
and marks the cut, because a DPR page runs to tens of thousands of characters.

This is the one thing that widened what leaves the device: the request now
carries the recognised question **and** a trimmed copy of the visible page,
where it used to carry only the question. It still only happens when
`VITE_VOICE_CHAT_URL` is set - the offline brain sends nothing at all - and the
orb panel says so in as many words.

The snapshot exists because "check the demand card and read it" is not an
answer. The system prompt now requires the reply to name the on-screen values,
say what they mean in plain words, and finish with the one action to take next.
For a score question it explains that the feasibility score is 100 minus the
competition score, and quotes the count and verdict behind it.

Replies run **four to six spoken sentences, not two**. A two-sentence cap is
what made "what is this page about?" useless. The prompt now demands three
things in order - what the thing on screen is, what it means for this applicant,
and the single next action - and, for a page question, the purpose of the step,
what has to be entered or decided, what the cards and numbers show, and what
comes next. `max_tokens` is 600 rather than 200 because Devanagari costs roughly
three tokens per word and the old cap cut Hindi replies off mid-sentence.

The reply language is stated at the **start and the end** of the prompt, with an
explicit "never answer in English unless the language is English". A small local
brain (Gemma 4 E4B) honours the trailing line and drifts back to English on the
leading one alone.

The prompt is a request, not a guarantee, so a Hindi turn whose reply contains no
Devanagari is **discarded and replaced with the canned Hindi answer**. That
catches the two ways a wrong-language reply arrives as HTTP 200: a small model
ignoring the instruction, and a gateway answering with an English top-up notice
instead of an answer.

Money is the one exception, and it is unchanged: the assistant never calculates,
restates or invents TPC, loan amount, EQI or subsidy figures. It points at the
on-screen value and `Scheme rules v2024-11`.

`frontend/src/lib/voice/answers.ts` mirrors the same rules for the offline path,
score explanation included, because with no chat endpoint configured that file
*is* the brain. It also explains the current step from the snapshot - purpose,
on-screen numbers, next action - so "what is this page about?" is answered
properly even with no brain at all.

## The orb

The app's voice entry point is a WebGL field of glowing strands in the
bottom-right corner, with no icon on it: the field is the state. It is mounted in
the app shell rather than in a page, so every route has it and the navbar mic
always has a panel to open. `data-state` on the wrapper carries the voice status,
so the stylesheet - and a browser check - can read the state without a second
reactive value.

- The animation is **Strands** from ReactBits (`reactbits.dev/animations/strands`),
  vendored as `components/voice/Strands.tsx` and drawn with OGL. It is the only
  WebGL in the app.
- One local change to the published component, marked in the file: it takes
  `level` (a getter for the live voice level) so the strands swell with whoever
  is talking.
- The speed is **half the component default** (`speed={0.25}` against `0.5`). The
  full speed reads as busy on an 84px disc, and the orb is ambient, not an alarm.
- The palette is the site's dark greens (`#8E9C78`, `#61733C`, `#485C11`,
  `#31400F`), with reds swapped in for the error state. One sage sits at the top
  of the ramp so a filament still has a lit edge; everything under it stays deep
  enough to read as dark green on a dark pane.
- That level is the live RMS of **whoever is talking**: the microphone while
  listening, and the spoken reply while speaking, because playback is routed
  through an `AnalyserNode` (falling back to plain playback if the audio context
  cannot start). It is smoothed with a fast attack and a slow release, so the
  field swells with a voice and settles after it.
- The orb never reads that level through React state. It is a getter, called by
  the shader's `requestAnimationFrame` loop once a frame, because sixty renders a
  second of the transcript panel would buy nothing.
- The pane is **dark liquid glass**: the app's pine (`#17210D`) over a backdrop
  blur, with a pale olive top edge and a deep inner shadow at the bottom, and the
  canvas is clipped to the disc. It is the same pine as the caption pill that
  sits under it, so the orb reads as part of that cluster rather than as a light
  chip pasted onto the corner. Dark filaments need a dark field, which is why the
  pane is nearly opaque rather than clear.
- The cluster sits in the bottom-right corner, clear of the shell's 240px rail
  and of the mobile bottom nav.
- During the one-time model download the percentage sits inside the disc, so a
  multi-minute first run is not a dead dot.
  - The panel is opened by the navbar mic as well as by the orb. It carries the
    last exchange - the applicant's line, then the agent's reply with no bubble -
    and the sentence being spoken is highlighted and kept in view from the
    playback clock. The reply is laid out as lines, with headings, bullets and
    inline emphasis, code and links shown as formatting rather than as Markdown
    syntax, and the voice is handed the same sentence with that syntax removed.
    It also names the fallback language when the app language is not voiced yet,
    because "it does not take Hindi" is otherwise invisible.
- The field animates **continuously, including under `prefers-reduced-motion`**.
  That is a deliberate exception: this orb is the only continuous readout of the
  voice state, and a frozen one is indistinguishable from a stalled assistant.

## Reading a page aloud

The speaker button in the navbar gives a **spoken overview of the page**, not a
recital of it. The applicant presses it to find out what is on the page, so the
brain is asked for the shape of it - what the page is for, the buttons and
fields it offers, the numbers that matter - and that answer is what gets spoken.
Reading the whole page out was the first version, and it read a page written for
the eye at somebody who wanted the gist.

- The page is `main`'s text, taken by the same `pageText()` the brain uses - the
  shell's content landmark, with the footer, the nav and the cookie banner taken
  out, so the furniture is not summarised as if it were the page.
- `requestPageSummary()` sends that text with the read-aloud instruction
  (`summaryInstruction()`), and the answer is spoken with the same on-device
  voice the orb answers with. It was `window.speechSynthesis` before that, which
  is not a local voice: in Chrome those voices are the ones the browser already
  has or fetches from its own service, and a page in a language the machine has
  no voice for is read in English or not at all.
- **With no chat endpoint, or if the call fails, the page itself is read**,
  sentence by sentence. `requestPageSummary` returns `null` rather than a canned
  wizard answer, because one of those read out over an unrelated page would be a
  confident answer to a question nobody asked.
- Either way the text is cut on sentence boundaries into pieces of about 240
  characters (`READ_ALOUD_CHUNK_CHARS`), and any stray Markdown in the summary
  is stripped (`toPlainText`) before the voice sees it.
- The budget is **ten minutes** (`READ_ALOUD_MAX_MS`), a stop for a page that
  would otherwise keep talking after the reader has walked away.
- The voice follows the app language exactly as the orb does, and a second press
  stops it wherever it is.

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

## The brain: local llama.cpp or a hosted API

The brain is text, so it is the one layer that may be remote.
`VITE_VOICE_CHAT_URL` selects it and no client code changes between the options.

**Offline option - llama.cpp.** Set `LLAMA_DIR` to wherever llama.cpp and the
GGUF are unpacked - the demo machine keeps a CUDA build under `bin-cuda/` with
`gemma-4-E4B-it-qat-UD-Q4_K_XL.gguf`. Forward slashes work on every platform;
add `.exe` to the binary name on Windows:

```sh
"$LLAMA_DIR/bin-cuda/llama-server" \
  -m "$LLAMA_DIR/models/gemma-4-E4B-it-qat-UD-Q4_K_XL/gemma-4-E4B-it-qat-UD-Q4_K_XL.gguf" \
  -c 4096 -ngl 999 -np 1 --flash-attn on \
  --cache-type-k q8_0 --cache-type-v q8_0 \
  --reasoning off --reasoning-format deepseek \
  --host 127.0.0.1 --port 8080 --alias gemma-4-E4B
```

`--reasoning off` is not optional. Gemma 4 emits a "Thinking Process:" preamble
by default and it lands in `message.content`, so the orb would read the model's
reasoning aloud. Measured 33-52 tok/s, ~1 s for a 39-token reply.

**Hosted option - Mistral.** `ministral-8b-latest` on
`https://api.mistral.ai/v1/chat/completions` measured 2.3-3.5 s for a 7-8
sentence reply, with correct Devanagari Hindi. `mistral-small-latest` and
`mistral-medium-latest` answered `429 Rate limit exceeded` on the free tier at
the time of writing, so the small model is the one wired in.

`frontend/.env.local` (gitignored) holds whichever brain is live:

```
# local
VITE_VOICE_CHAT_URL=http://127.0.0.1:8080/v1/chat/completions
VITE_VOICE_CHAT_MODEL=gemma-4-E4B
VITE_VOICE_CHAT_KEY=

# hosted
VITE_VOICE_CHAT_URL=https://api.mistral.ai/v1/chat/completions
VITE_VOICE_CHAT_MODEL=ministral-8b-latest
VITE_VOICE_CHAT_KEY=<key>
```

The key is empty for the local server. A hosted key is inlined into the bundle,
so it is public; move it behind a Vercel function before deployment (see "Key
handling"). Mistral also exposes audio endpoints, but they are unused - speech
is local only.

## Speech is local only (what was removed, and why)

The applicant's voice is the most sensitive thing the assistant touches, and
"the model happens to run in the browser" is not a guarantee anyone can check.
So the remote speech branches were deleted from the client rather than left
behind an empty variable:

- `stt.ts` no longer builds a `FormData` or posts a WAV anywhere.
- `tts.ts` no longer fetches a rendered clip.
- `providers.ts` reads no speech URL; its only setting is the Whisper backend
  (`VITE_VOICE_STT_DEVICE`).

Nothing is left to configure, so no deploy, typo or stray `.env` can send audio
off the device. Restoring remote speech is a deliberate code change with a
privacy review - which is the point.

The **brain stays swappable** because its input is text that is already local -
the recognised question and a trimmed copy of the visible page - and text, not
audio, is what this product is willing to send. The orb panel states which of
the two is happening; see `VoiceOrb.tsx` and "Configuration" in
`voice-assistant.md`.

The cost of the rule is the first-run download (~550 MB with fp32 Kokoro
weights) and the ~5 s CPU transcription, both measured above.

### Verified in the running page

Measured 2026-09-11 against the real dev server, microphone-first order
included: `getUserMedia` resolved about 150 ms after the click and the first
`huggingface.co` request followed it. Importing `download-progress.ts` from the
dev server and replaying a real event sequence produced
`null -> 99 -> 10 -> 17 -> null -> 99` - a 44-byte config file finishing, two
weighted model files, one file that arrived with no size, then ready.

Measured again 2026-09-12, after the models moved into the worker, by driving the
real modules from the page:

- **No freeze.** Loading Whisper q8, then Kokoro `webgpu`+fp32, then synthesising
  seven clips produced **zero** `longtask` entries; the rAF frame gap was 6 ms at
  p50 and p95 across 14 187 frames. The previous build's single warm-cache task
  was 1498 ms.
- **No truncation.** A 984-character reply synthesised in one call gave 26 s of
  audio; the same text as 6 pieces gave 63 s. The 26 s is the old bug: the text
  past roughly 400 characters was dropped silently.
- **The highlight follows the voice.** `speak(['First...', 'Second...',
  'Third...'])` fired `onSentence` as `[0, 1, 2]` - one event per line, in order.

### Key handling

`VITE_VOICE_CHAT_KEY` is inlined into the JavaScript bundle by Vite, so a
client-side key is **public**. Acceptable for the prototype, not for a deployed
government-facing service. Pointing `VITE_VOICE_CHAT_URL` at a Vercel function
(`/api/voice/chat`) that holds the key server-side is an environment-variable
change with no code change; do that before real deployment. The speech models
need no key of any kind.

## Deferred (explicitly out of scope)

- 22-language voice (needs MMS-TTS/Indic-TTS, or Bhashini keys).
- Streaming word-by-word ASR (Whisper is chunked, not token-streaming).
- Voice-driven form filling or step navigation.
