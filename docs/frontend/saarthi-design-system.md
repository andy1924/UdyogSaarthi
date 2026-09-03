# Saarthi Check — Detailed Design System Map (agent build guide)

> For AI coding agents rebuilding `saarthi-check.html`. Pair with `saarthi-element-map.html`
> (visual inventory) + `api-contract.md` (endpoint shapes) + `api-client.js` (working client).
> Source of truth for backend: `/openapi.json`. Base URL default `http://localhost:8000`,
> overridable via `localStorage 'saarthi-api-base'` / `#apiBaseInput`. Nothing here runs a server.
> Theme: pine + emerald only. Sarkaar Ledger (ink/vermilion/wheat/paper/stamps) is **forbidden**.

## 0. File map — what to read / write

| File | Role | Agent action |
|---|---|---|
| `saarthi-check.html` | shipped responsive page (single col <960px, 2-col ≥960px) | edit in place; do not reframe in phone mockup |
| `saarthi-layout.html` | layout-only reference (no JS logic) | read for grid fixes; do not ship |
| `api-client.js` | vanilla client, 14 fns, 15 s timeout, GET retry 2 s/4 s | `SaarthiApi.*`; never recompute finance |
| `api-contract.md` | endpoint shapes + error codes | copy request/response verbatim |
| `saarthi-element-map.html` | this doc rendered as clickable components | read DOM hooks + copy snippets |
| `brand-spec.md` | locked tokens | never invent hex |

## 1. Tokens (verbatim — bind as `:root`)

```css
--bg:#EDF2EF; --surface:#FFFFFF; --fg:#13261F; --muted:#5B6B62;
--border:#DCE5DF; --accent:#0E7C5B; --accent-ink:#0A5C44;
--caution:#9A6A00; --danger:#B3261E;
--font-display:"Sora","Noto Sans Devanagari",system-ui,sans-serif;
--font-body:"Inter","Noto Sans Devanagari",system-ui,sans-serif;
--font-mono:"IBM Plex Mono",ui-monospace,monospace;
--shadow:0 12px 32px rgba(19,38,31,.10); --tap:44px; --radius:20px;
```

Rules: one accent, max 2 uses per viewport (CTA + score ring). Selected language
uses `--fg`, not accent. Numerals (TPC/loan/EQI/scores/codes) always `.num`
(`IBM Plex Mono`, `tabular-nums`). Radius 20 px cards / 14–16 px inputs.
Focus: `3px solid var(--accent), offset 2px`. Contrast: pine-on-mist 14.2:1,
accent-on-white 4.9:1, muted-on-white 5.1:1 (all ≥4.5:1).

## 2. Layout — true responsive, no device frame

- `.shell{max-width:1120px;margin:auto;padding:0 20px 120px}` (56 px bottom ≥960 px).
- `.layout{display:grid;gap:16px}` → ≥960 px
  `grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:28px;align-items:start`.
- `.col-result{position:sticky;top:20px}` on desktop only; stacks below form on mobile.
- Sticky mobile CTA: `.cta-bar{position:fixed;bottom:0}` <960 px, static ≥960 px.
- Fluid type: `h1 clamp(28px,4vw,44px)`, `h2 clamp(20px,2.4vw,26px)`, body 16 px.
- Breakpoints that matter: **360** (2×2 langs, stacked loc-row), **420** (loc-row column),
  **480** (langs 4→2), **960** (1→2 col), **1120** (max width). No horizontal scroll at 360 px.
- `overflow-x:clip` on body; every flex/grid child gets `min-width:0`; headings
  `text-wrap:balance;overflow-wrap:break-word` — never `white-space:nowrap` on content.

## 3. Component catalog (all hooks in `saarthi-check.html`)

### C01 Site header — `#siteHead`
56 px sticky, surface bg. `.avatar` 44 px pine circle ("Sa"), `.head-title b/span`
truncate with ellipsis, `.icon-btn` 48 px (A+ toggle `#sizeBtn`), auth chip `#authChip`.
Overlap fix: `min-width:0` + truncate — long Hindi/Tamil titles never collide.

### C02 Hero — `#hero`
`h1` question ("Will it work in my block?") + 1-line muted sub (max 48 ch).
i18n swaps full hero per language; sets `<html lang>`.

### C03 Language switcher — `#langs .lang[data-lang]`
Grid 4-up → 2×2 ≤480 px. Buttons 44 px+, `aria-pressed` single-select,
`EN|हिं|த|বাং`. Persist `localStorage 'saarthi-lang'`. `:lang(hi){line-height:1.6}`,
ta/bn 1.65. Selected = `--fg` fill (not accent — preserves accent budget).

### C04 Business grid — `.biz[data-biz]`
2-col mobile / 3-col desktop, cards ≥108 px tall, icon + `b` label + `span` hint,
`aria-pressed`. Values: `dairy|retail|food|electronics|agro|tailoring` →
API `business_category` via `SaarthiApi.bizToCategory()`. Tap 1 of 3.

### C05 Location + GPS — `#locInput #gpsBtn #gpsNote #locErr`
`input` placeholder "Block, District, State" (16 px prevents iOS zoom) +
`Use GPS` outline button. `.loc-row` flex → column ≤420 px. Validate **on blur**;
error → `aria-invalid + #locErr (role=alert)`. GPS failure copy preserved.
Tap 2 of 3. API anchor: `location_text` OR `lat+lon`.

### C06 Margin slider — `#marginRange #marginNum`
`range 5000–5000000 step 5000` synced with mono numeric input. Readout
`fmtINR()` display only. Client pre-guard out-of-range → `MARGIN_OUT_OF_RANGE`
without fetch; server 422 otherwise. Tap 3 setup.

### C07 Auth card — `#authCard`
Email + password(≥8, letter+digit) + Login/Register/Me/Logout. Login posts
**form-encoded** `username=<email>&password=` (not JSON) → stores `saarthi-jwt`.
Feasibility + DPR render need Bearer; without it show login nudge, keep form values.

### C08 CTA — `#ctaBar #checkBtn #dprBtn`
Primary `#checkBtn` 52–56 px full-width accent ("Check feasibility"), disabled until
category + location valid. Secondary outline `#dprBtn` ("Get bank paper") enabled
only after feasibility + scheme succeed. One primary per viewport.

### C09 Progress — `#progressFill #progressLbl`
4-dot stepper + bar (`width 33/66/100%`) + mono label "Tap X of 3".
DPR `queued` → determinate bar polling `GET /api/dpr/{id}` every 3 s (max 10).

### C10 Result state machine — `#stEmpty #stLoad #stErr #stPop`
Only one visible. Empty: dashed ring + hint. Loading: `.skel` shimmer rows +
`aria-busy` + 15 s "taking longer" notice. Error: danger box + cause + recovery +
Retry (GETs backoff 2 s/4 s, max 3 → "Contact support + error ID") + `#retryMeta`
"Last tried". Populated: C11–C15. Edge = saturated → opportunity cards.

### C11 Score ring — `#scoreArc #scoreNo`
96 px SVG ring, `stroke-dasharray` from `density_score 0–100`. Color:
viable accent / niche-gap pine / saturated caution. Number centered via flex
(not absolute overlay — overlap fix), Plex Mono 22 px.

### C12 Verdict — `#verdictChip #verdict #verdictSub`
Chip mono uppercase (`VIABLE|SATURATED|NICHE-GAP`), headline plain language
("Yes — go for it"), sub `{category} in {block} · {swot.opportunity}`.

### C13 Finance KVs — `#tpcNo #loanNo #eqiNo`
Rows label-left (muted) + value-right (mono): TPC, `max_loan_capped`, `eqi_amount`.
Footnote pill always: `Scheme rules v2024-11 · micro ≤₹1.40L 6.5%/3y · term ≤₹50L 8%/7y`.
**Never compute client-side** — render server values only.

### C14 Compliance — `#licList`
Checkbox list from `licenses[{id,label,desc,required}]`. Required badge.
Caption: `sources + ai_generated + confidence` muted, never blocking.

### C15 Peers — `#peers`
Max 5 rows: name + `{distance_km} km · {category}`. Empty → "No registered peers
in radius." 503 `DIRECTORY_UNAVAILABLE` → hide section + muted note, keep verdict.

### C16 DPR dialog — `#dprDlg`
`<dialog>`: applicant + business inputs → `POST /api/dpr/render`
(`{feasibility,scheme,applicant_name,business_name?,verified}`) →
`{dpr_id,pdf_url,status}` → poll → `GET …/download` blob → anchor download.
`transition`/`history` fns exist in client; no officer UI (out of scope).

### C17 Voice dock — `#micBtn #vTrans`
In-flow bar (never modal), mic 48 px + transcript `aria-live="polite"`.
Currently mocked ("listening… bolo…"); Bhashini adapter unplugged.

### C18 Offline — `#offBtn #queueN`
Toggle queues failed POSTs to `saarthi-queue` (Dexie shape), banner "Offline ·
saved on phone", count badge. `flush()` on `online` event.

### C19 Toasts — `#toast`
Bottom-center above CTA rail, `role="status"`, 4 s auto-dismiss, hover-pause.
One position always.

### C20 Config footer — `#apiBaseInput #footNote`
Editable base URL (persists `saarthi-api-base`) + footnote
"Base … · math from server only · queue on this phone · voice demo".

## 4. Screen composition

Mobile (<960): header → hero → langs → business → location → margin → result card
→ auth → config. CTA fixed bottom. Desktop (≥960): left column form (C03–C08),
right sticky result (C10–C15); header/hero span full width.

## 5. API wiring (client fn → endpoint → DOM)

| Fn | Method + path | Auth | Binds to |
|---|---|---|---|
| `register` | `POST /auth/register` JSON | public | C07 → 201 UserOut / 409 / 422 |
| `login` | `POST /auth/token` **form** | public | C07 stores JWT |
| `me` | `GET /auth/me` | Bearer | C07 chip |
| `getSchemeRules` | `GET /api/scheme/rules` | public | C13 footnote version |
| `calcScheme(margin,cat?)` | `POST /api/scheme/calculate` | public | C06→C13; 422 range |
| `scoreFeasibility` | `POST /api/feasibility/score` | Bearer | C04+C05→C11/C12; 502 `LGD_UNAVAILABLE` retry UI |
| `getLicenses` | `GET /api/compliance/licenses?…` | public | C14; static fallback ok |
| `getNearby` | `GET /api/directory/nearby?…` | public | C15; 503 hide peers |
| `renderDpr` | `POST /api/dpr/render` | Bearer | C16 dialog |
| `getDpr / downloadDpr` | `GET /api/dpr/{id}[ /download]` | Bearer | C16 poll + blob |
| `transitionDpr/historyDpr` | `POST|GET /api/dpr/{id}/…` | Bearer+role | client only, no UI |
| `health` | `GET /health` | public | C20 dot |

Timeout 15 s (AbortController). GET retry 2 s/4 s max 3. POST never auto-retries.
Error object: `{message,status,code,cause,recovery,lastTried,input}` — input always
preserved for retry UI.

## 6. Five-state matrix (every data surface)

Loading: skeleton + 15 s slow notice. Empty: headline + explanation + CTA
("Be the first" peers). Error: what/why/fix + retry + preserved input.
Populated: the designed case. Edge: 200-char titles, missing avatar/CTA,
10k-row peers, RTL content — layout must not break (`min-width:0`, wrap, snap).

Forms: untouched (no msg) → dirty-valid (helper stays, no green) →
submitted-pending (button spinner, fields locked). Validate on blur; clear error
the instant input turns valid. Focus first error on submit; `role="alert"`.

## 7. i18n keys (EN/HI/TA/BN live for hero+CTA; rest stubbed)

`hero.title, hero.sub, cta.check, biz.{6}, loc.placeholder, gps.label,
verdict.{viable,saturated,niche}`. Swap strings + `<html lang>` (`en|hi|ta|bn`);
persist choice. Devanagari/Tamil/Bengali `line-height ≥1.6`, no truncation.

## 8. Motion

150 ms default state feedback (`cubic-bezier(.2,0,0,1)`); entering UI 200–300 ms;
cross-screen ≤500 ms. Skeleton shimmer until content lands only.
`prefers-reduced-motion:reduce` strips translate/scale, keeps opacity fades.
No looping reward motion; spinner escalates to cancel at 30 s, error at 60 s.

## 9. Forbidden list (lint before ship)

Phone frame / Island / rails, ledger ink `#0F2A44`, vermilion, wheat/paper
`#FFFCF6`, stamps, perforation, dashed receipt borders, Inter/Roboto/Arial as
display, emoji icons, purple gradient wash, 3+ primary CTAs, gray-on-hover text,
hotlinked/remote images, client-computed loan math, second accent color.

## 10. Agent build order

1. Bind tokens + fonts + shell grid (§1–2) → verify 360/960/1120 no-scroll.
2. Build C01–C06 static → a11y pass (44 px, focus, labels).
3. Wire `api-client.js` auth + scheme → C13 numbers render.
4. Wire feasibility → C10–C12 state machine + 502 retry.
5. Add C14/C15 (licenses + peers + 503 degrade).
6. Add C16 DPR dialog (render→poll→download).
7. Add C17–C20 (voice mock, offline queue, toasts, base field).
8. Run 5-state × 4-language × 360/390/960/1440 check; update §11 log.

## 11. Open issues log (maintain as you build)

1. 2026-09-03 — Voice/ASR mocked; Bhashini adapter unplugged.
2. 2026-09-03 — GPS demo-grade; `location_text` reliable anchor.
3. 2026-09-03 — Needs live backend `http://localhost:8000` (editable); nothing run per instruction.
4. 2026-09-03 — Directory radius UI 10000 vs API max 50000 — clamp client-side.
5. 2026-09-03 — DPR transition/history have client fns, no officer UI.
6. 2026-09-03 — i18n hero+CTA live; deeper strings stubbed.
