# UdyogSaarthi Voice Assistant (reference)

**Status:** shipped 2026-09-11. Spoken languages: **English and Hindi only.**

**Companion:** [`voice-stack.md`](./voice-stack.md) is the *design record* -
which models were chosen, why, and the measurements behind those choices. This
file is the *reference* - what the feature does, where the code is, and how to
run, test and extend it. If the two ever disagree about behaviour, this file is
the stale one: read the code, then fix this file.

## What it is

A voice assistant that lives in the app shell, so it is on every screen. The
applicant taps a mic, asks a question about what is on screen in plain speech,
and hears the answer read back in the same language, with the text also shown in
a panel. The same on-device voices read the whole visible page aloud from the
navbar. Both speech models run in the browser, so there is no speech server and
no key.

Three properties are load-bearing. Breaking one of them is a bug, not a tweak:

1. **Audio never leaves the device.** The recording is recognised and the reply
   is spoken by models running in the browser, and no environment variable can
   point either one at a server - the remote speech branches were removed, not
   disabled, so this is a property of the build and not of a deploy. What a
   remote *brain* receives is text: the recognised question and a trimmed copy of
   the visible page, and only when `VITE_VOICE_CHAT_URL` is set. The orb's copy
   says exactly that rather than leaving it to be inferred.
2. **The voice follows the app language.** `LanguageContext.lang` decides both
   what the mic listens for and which voice replies. There is no separate voice
   language setting.
3. **The wizard is the source of truth.** The assistant explains what is on
   screen; it never computes a money figure. Scheme maths stays on the server
   under `Scheme rules v2024-11`.

## What the applicant sees

| Element | Behaviour |
|---|---|
| Navbar mic | Sits immediately left of *Read aloud*. Starts listening **and** opens the panel. Shows a spinner while models load. |
| Read aloud | The speaker button. Asks the brain for a short spoken overview of the visible page (`main`) and plays it with the same local voice the orb uses, in ~240-character pieces, for a ten-minute budget. With no brain configured it reads the page itself. Turns into a stop button while it is reading, and a spinner while the models load. |
| The orb | Fixed in the bottom-right corner of every screen. No icon: a WebGL field of glowing strands is the state. Dark green strands on dark pine glass, matching the caption pill under it. |
| Caption pill | `Tap to talk`, `Preparing voice`, `Tap to send`, `Thinking...`, `Tap to stop`, `Tap to retry`. |
| Panel | The conversation and nothing else: the applicant's last line in small type, then the agent's reply with no bubble behind it. The reply is laid out line by line, with headings, bullet lists and inline emphasis, code and links rendered as formatting instead of showing their Markdown syntax. It also names the fallback language when the app language is not voiced yet. |
| Stop button | A red square beside the caption while the agent is speaking. Stops the voice. |
| Panel close | Closes the panel only. Listening continues. |
| Caption close | Hides the assistant entirely until the next ask. |

A turn ends by itself after roughly 0.9 s of silence, so the applicant never has
to press a second button to send. Tapping the orb while the agent speaks stops
it.

Interrupting is deliberate rather than voice-activated. The microphone used to
watch for speech over the reply and hand the turn back, but a room is loud enough
that the agent kept cutting itself off mid-sentence, so that trigger is gone.

The field swells with whoever is talking. The level is the live RMS of the
microphone while listening and of the spoken reply while speaking; the strand
shader reads it once a frame and lifts its wave and thickens its glow.

## File map

Everything is frontend-only. Nothing under `backend/` is involved, and nothing
may become involved: the API moves to Supabase and the frontend to Vercel.

| File | Owns |
|---|---|
| `components/voice/VoiceOrb.tsx` | The orb, the caption, the panel, the hide button, and the state the strand field is drawn in. |
| `components/voice/Strands.tsx` | The ReactBits strand animation (OGL), adapted: it takes the live voice level. It animates continuously, deliberately including under `prefers-reduced-motion`. |
| `components/voice/MicButton.tsx` | The navbar button. Opens the panel, then toggles. |
| `components/ReadAloudButton.tsx` | The navbar speaker button. Asks the brain for a short spoken overview of the page and plays it with the local voice; falls back to reading `main` itself. Owns the ten-minute budget and stopping. |
| `lib/voice/VoiceContext.tsx` | The turn lifecycle, the state machine, interrupting the agent, and the public `useVoice()` API. |
| `lib/voice/languages.ts` | Which Whisper token, speech engine and voice id each app language maps to. |
| `lib/voice/recorder.ts` | `getUserMedia`, level metering, decode, resample, gain. Released as soon as the turn is captured. |
| `lib/voice/spoken.ts` | Splits a reply into sentences, groups them into engine-sized speech pieces (`speechPlan`), and lays the reply out as panel blocks. Pure, unit-tested. |
| `lib/voice/read-aloud.ts` | Groups a page or a summary into speakable pieces for the speaker button, with the ten-minute budget. Pure, unit-tested. |
| `lib/voice/models.ts` | The checkpoint ids and the device/dtype choice. The one module both the worker and the client read. |
| `lib/voice/engine-protocol.ts` | The worker's request and response types. |
| `lib/voice/engine.ts` | The main-thread worker client: creates the worker, routes progress, resolves one promise per request. |
| `src/worker/voice-engine.ts` | The only place a speech model is loaded. Caches one Whisper pipeline and one TTS pipeline and answers `warmup`, `transcribe`, `synthesize`. |
| `lib/voice/markdown.ts` | Parses the little Markdown that reaches the panel, and gives the speaker the same text with the syntax taken out. Pure, unit-tested. |
| `lib/voice/endpoint.ts` | RMS endpointer: when speech started, when the turn ended. Pure, unit-tested. |
| `lib/voice/gain.ts` | `normalizePeak` - lifts a quiet recording towards full scale. Pure. |
| `lib/voice/resample.ts` | Box-filter downsample to the 16 kHz mono Whisper expects. Pure. |
| `lib/voice/wav.ts` | RIFF/WAV encoder for the synthesised reply. Pure. |
| `lib/voice/stt.ts` | Whisper, as a thin client of the worker. Local only. |
| `lib/voice/tts.ts` | The `Speaker`: chunked synthesis through the worker, one clip prefetched ahead, analyser-routed playback. Local only. |
| `lib/voice/providers.ts` | Reads the one speech env var (Whisper backend). Speech is local only. |
| `lib/voice/download-progress.ts` | Byte-weighted progress across model files. Pure, unit-tested. |
| `lib/voice/context.ts` | The system prompt, the live-DOM page reader (`pageText`, `clipPage`) and the site-snapshot renderer. |
| `lib/voice/chat.ts` | The chat request and the read-aloud overview request, plus the fallback to the offline brain. |
| `lib/voice/answers.ts` | The offline brain: what the assistant says with no endpoint. |
| `components/FeasibilityCheck.tsx` | Pushes the site snapshot into the voice context. |
| `App.tsx` | Names the current page for the voice context on every route that is not the wizard. |

`index.css` holds the orb styling from `.voice-orb-wrap` down. The live audio
level never enters React state: it is a getter the strand field reads once a
frame.

`App.tsx` sets `{ page }` for the routes that are not the wizard, and
`FeasibilityCheck.tsx` sets the wizard's step snapshot. The assistant answers
from whichever one is current, so "what is this page?" has an answer everywhere
instead of only in the wizard.

## One turn, end to end

1. **Press.** `startTurn` resolves the app language to a `VoiceLanguage` and pins
   it on `turnVoice`, so a language switch mid-turn cannot change the voice.
2. **Microphone first.** `recorder.arm()` calls `getUserMedia` *before* any model
   download, so the permission prompt belongs to the click. Asking later makes a
   granted permission look like it is still being requested.
3. **`preparing`.** `createTranscriber` and `createSpeaker` ask the **voice
   worker** to load the models - once, then from the browser cache. Nothing
   about a model touches the page's own thread, so the orb keeps animating and
   the rest of the page keeps taking clicks while it happens. Progress is bytes
   received over bytes expected, summed across files.
4. **`listening`.** `recorder.onLevel` feeds `handleLevel`. The endpointer
   consumes the raw RMS: speech starts after 150 ms above `0.008`, the turn ends
   after 900 ms below it, and a hard 10 minute timeout stops a noisy room or a
   long explanation holding the mic open.
5. **Close the turn.** `recorder.stop()` decodes the blob, downsamples to 16 kHz
   mono, and peak-normalises (up to x6). The microphone is released here: nothing
   listens while the agent speaks.
6. **`thinking`.** `transcriber.transcribe(audio, voice.stt)` runs Whisper. An
   empty transcript is answered out loud with "I did not catch any speech"
   rather than returning to idle in silence.
7. **Ask.** `requestReply` sends the site snapshot, the trimmed page text and the
   question. With no `VITE_VOICE_CHAT_URL`, `offlineAnswer` produces the reply
   instead and nothing leaves the device.
8. **`speaking`.** `speaker.speak(chunks.map((chunk) => toPlainText(chunk.text)))`
   speaks the reply one line at a time, synthesising the next line while the
   current one plays and playing each through an `AnalyserNode`, which is what
   makes the field follow the spoken voice. The panel keeps the Markdown so it
   can show formatting; the voice gets the plain sentence underneath it, so it
   never reads "asterisk asterisk". The highlight comes from
   `Speaker.onSentence`, which fires when a line's audio actually starts, so it
   cannot drift ahead of the voice the way a playback fraction did.
9. **`idle`.** The turn ends on its own, or the applicant taps the orb or the
   red stop button to cut the voice short.

### Interrupting

Tapping the orb, or the red stop button beside the caption, while the agent
speaks calls `stopSpeaking`: it bumps `turnId`, stops the speaker, aborts the
in-flight chat request, clears the spoken highlight and returns to `idle`. The
microphone was already released, so an interruption is instant and silent.

`turnId` is the guard that makes interruption safe: every turn captures its id
and bails out before touching state if a newer turn has started, so the
interrupted turn cannot reset the status on its way out.

## Voice state machine

| Status | Entered by | Exits to | The orb |
|---|---|---|---|
| `idle` | start, end of turn, close, stop | `preparing` on toggle | strands drift at rest |
| `preparing` | model load after the mic is armed | `listening`, or `error` | percentage inside the field |
| `listening` | `begin()` resolved | `thinking` (auto-send), `idle` (tap to send early), `error` | strands swell with the applicant |
| `thinking` | transcript non-empty | `speaking`, `idle` if there is no speaker | strands settle |
| `speaking` | reply ready | `idle` on a tap or the stop button | strands swell with the reply |
| `error` | mic or model failure | `preparing` on retry | red strands, `Tap to retry` |

`toggle()` is the only entry point: from `speaking` it stops the voice, from
`listening` it finishes the turn early, from `preparing`/`thinking` it does
nothing, and from `idle`/`error` it starts.

## The public API

`useVoice()` is the only way components talk to the assistant. It throws outside
`VoiceProvider`, which wraps `App` inside `LanguageProvider` in `main.tsx`.

| Field | Meaning |
|---|---|
| `status` | The `VoiceStatus` above. |
| `messages` | The whole transcript, oldest first. The panel shows the last exchange; the rest is kept for context and dies on reload. |
| `error` | A message written for the applicant, not a stack trace. |
| `context` / `setContext` | The site snapshot the brain answers from. |
| `modelProgress` | `{ stt, tts }`, each `0-1` or `null` when unknown. |
| `brainRemote` | True when the answer comes from a model over the network. The audio never does. |
| `getLevel` | Reads the smoothed level **outside** React, for the rAF loop. |
| `spokenIndex` | Sentence of the reply the voice is on, or `-1` when nothing is being spoken. |
| `panelOpen`, `openPanel`, `closePanel` | Panel visibility, shared so the navbar mic can open it. |
| `toggle` / `stopSpeaking` / `close` | Start-or-stop, cut the voice short, and hide. |

## Configuration

Read from `import.meta.env`, so a Vite build inlines whatever is present. The
chat variables are the only ones that can send anything off the device.

| Variable | Default | Effect |
|---|---|---|
| `VITE_VOICE_CHAT_URL` | empty | Empty means the offline brain. Set means `POST` an OpenAI-shaped chat completion. |
| `VITE_VOICE_CHAT_KEY` | empty | Bearer token. **Inlined into the bundle.** |
| `VITE_VOICE_CHAT_MODEL` | `gpt-4o-mini` | Model id sent to the chat endpoint. |
| `VITE_VOICE_STT_DEVICE` | `wasm` | `webgpu` opts into the GPU backend. It must stay `fp32`; the quantized decoder is pathological there. |

There is **no speech URL variable**. Recognition and synthesis are local only by
construction: the remote branches are gone from `stt.ts` and `tts.ts`, so a
stray `VITE_VOICE_STT_URL` or `VITE_VOICE_TTS_URL` is inert. What can leave the
device is text - the recognised question plus `clipPage(pageText())`, the
visible page trimmed to 4000 characters - and only when `VITE_VOICE_CHAT_URL` is
set.

**Keys in the bundle are public.** A `VITE_`-prefixed key is compiled into the
JavaScript, so a client-side key is readable by anyone. That is fine for a
prototype and not fine for a government-facing deployment: point
`VITE_VOICE_CHAT_URL` at a serverless function that holds the key server-side
before shipping.

## Running it locally

```
cd frontend
npm install
npm run dev          # http://localhost:5173 - use localhost, not 127.0.0.1
```

Two things have to be true for the voice to be usable:

- **Cross-origin isolation.** `vite.config.ts` sets `Cross-Origin-Opener-Policy:
  same-origin` and `Cross-Origin-Embedder-Policy: credentialless`. Without them
  onnxruntime-web silently drops to a single WASM thread and a 4 s clip takes
  about 12 s instead of about 3 s. The same two headers are needed on the Vercel
  project in production.
- **A brain.** With `VITE_VOICE_CHAT_URL` empty the assistant still works, using
  `answers.ts`. To use a model, point the URL at any OpenAI-compatible chat
  endpoint, including a local llama.cpp server - see `voice-stack.md`, "The
  brain", for the working command line.

The first press downloads the models and caches them in the browser. The spinner
on the mic, the spinner on the read-aloud button and the percentage inside the
orb are the only progress UI.

## Tests

```
cd frontend
npm test        # vitest
npm run typecheck
npm run lint
```

The pure modules carry the assertions, because they hold the logic that is hard
to eyeball: `endpoint` (turn boundaries), `gain`, `resample`, `wav`,
`download-progress`, `languages`, `providers`, `answers`, `context`, `chat`
(the reply and the read-aloud overview, including the Hindi guard), `spoken`
(sentence splitting, the engine-sized speech pieces, and the panel blocks) and
`read-aloud` (the page grouping, including the run-on line that has no full stop
anywhere in it).

Two limits worth stating plainly:

- **The microphone path is not covered.** `recorder`, `stt`, `tts`, `engine`,
  the voice worker and `VoiceContext` need a real `getUserMedia`, a real model
  download and a real voice, so they are verified by hand in a browser.
- **A green suite is not evidence of accuracy.** The unit tests prove the
  boundary arithmetic, not that a sentence comes back correctly in Hindi.

## Extending it

**A new spoken language** needs one entry in `VOICE_LANGUAGES`
(`lib/voice/languages.ts`) naming the Whisper token, the engine and the voice id
- plus an engine that can actually speak it. Kokoro is English-only, so a new
language usually means a new MMS-TTS checkpoint in `tts.ts`. Run the Whisper
checkpoint against real speech in that language before trusting it: model size,
not quantization, is what decides whether Hindi comes back as Devanagari or as
an English translation.

**Moving speech off the device is deliberately not possible.** Recognition and
synthesis are local only; the remote branches were removed from `stt.ts` and
`tts.ts`, and `providers.ts` reads no speech URL. Restoring remote speech is a
code change with a privacy review, not a config change, so no deploy can turn
the applicant's audio into network traffic by accident. The *brain* still moves
with `VITE_VOICE_CHAT_URL`, because its input is already-local text.

**Changing sensitivity.** The endpointer thresholds and the gain cap are the
knobs for "it does not hear me". They live in `DEFAULT_ENDPOINTER`
(`endpoint.ts`) and `normalizePeak` (`gain.ts`), and both have tests that encode
the current tuning.

**Changing what the page reader covers.** Read aloud and the brain both read
`main`, so a page that renders its content outside the content landmark is
silently not read. Point `pageText()` (`context.ts`) somewhere else, or move the
content back inside `main`. The chrome it hides - the shell footer, the cookie
banner - is listed in `PAGE_CHROME` in the same file.

## Known limits and gotchas

- **Whisper cannot auto-detect the language here.** `transformers.js` 3.8.1
  hard-defaults to `en`, and `prompt_ids` is not wired up, so the language token
  is the only lever. Passing `en` for Hindi audio makes Whisper *translate*
  rather than transcribe - which looks exactly like the mic not understanding
  Hindi. The app language is the mic's language, and the panel says which one is
  live.
- **Hindi needs Devanagari.** MMS-TTS is trained on Devanagari, so a reply in
  Roman script would be read out as nonsense. `chat.ts` therefore discards a
  Hindi reply containing no Devanagari and uses the canned answer instead. That
  also catches a gateway returning an English billing notice as HTTP 200.
- **The Hindi TTS checkpoint is CC-BY-NC-4.0.** Fine for a hackathon, not for
  commercial use. Shipping it needs a licensed Indic voice (Bhashini / Sarvam,
  or a local AI4Bharat Indic-TTS checkpoint), which would also mean rethinking
  the local-only rule.
- **Small local models drift.** A 4B model will sometimes answer a Hindi
  question in English; the language guard is the backstop, not the fix.
- **The first run is heavy.** Whisper small is ~238 MB and the voice model up to
  ~311 MB, downloaded once. Warm a demo up before it starts.
- **Both engines truncate silently past their own tokenizer limit.** `kokoro-js`
  tokenizes with `truncation: true` and then slices the style vector at 509
  phonemes, so one call over a long reply came back cut roughly in half while the
  panel still showed the whole thing. The speaker never sends more than
  `SPEECH_CHUNK_CHARS` (240) in one call; do not raise that without re-measuring,
  and do not hand a long string to the engine in one call.
- **`prefers-reduced-motion` stops every animation on the site**, the loading
  spinners included, because `index.css` turns `animation` off wholesale under
  it. A spinner is a status indicator rather than decoration, so `.animate-spin`
  is exempted by hand: stopped, a first-run model download reads as a button
  that did nothing.
- **The transcript is not persisted.** It lives in React state and is gone on
  reload, deliberately: it is the applicant's private business talk.
