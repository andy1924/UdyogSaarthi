# UdyogSaarthi — Responsive Frontend Rebuild (DESIGN.md)

Goal: true responsive web, 360px→1440px, mobile-first. 3 taps to answer.
Locate → Feasibility → Finance → Compliance/DPR. Keeps pine/emerald identity.
Rejects: Sarkaar Ledger theme (ink/vermilion/wheat/paper), iPhone-frame mockup.

## 1. Design tokens

| Token | Hex | OKLch | Use |
|---|---|---|---|
| `--bg` | `#EDF2EF` | `oklch(0.94 0.012 165)` | app background |
| `--surface` | `#FFFFFF` | `oklch(1 0 0)` | cards, sheets |
| `--fg` | `#13261F` | `oklch(0.25 0.032 165)` | text, headings |
| `--muted` | `#5B6B62` | `oklch(0.55 0.030 165)` | secondary text |
| `--border` | `#DCE5DF` | `oklch(0.90 0.012 165)` | borders, dividers |
| `--accent` | `#0E7C5B` | `oklch(0.55 0.120 165)` | CTA, focus, active |
| `--caution` | `#9A6A00` | `oklch(0.58 0.115 85)` | saturated/warn |
| `--danger` | `#B3261E` | `oklch(0.50 0.150 25)` | errors, reject |

Fonts: **Sora** (display/headings), **Inter** (body/labels), **IBM Plex Mono**
(numerals only: TPC, loan, EQI, LGD codes, rule footnotes). Radius 12px cards,
8px inputs. Shadow `0 2px 12px rgba(19,38,31,.08)`. No dashed ledger borders,
no rubber stamps, no perforations.

## 2. Layout system (no device frame)

- **<960px:** single column, `max-width 100%`, 16px gutters. Sticky bottom
  wizard rail (Back | Step n/4 | Continue) replaces fixed phone chrome.
  Result card stacks below form (`order` via grid).
- **≥960px:** two columns — form (min 380px) + sticky result (`position:
  sticky; top: 24px`). `grid-template-columns: minmax(380px,5fr) 7fr`.
- **≥1280px:** page `max-width: 1120px` centered, 24px gutters.
- Fluid type: `clamp()` headings (20→28px); body 15→16px. No fixed 390px
  canvas, no absolute-positioned chrome, no horizontal scroll at 360px.

## 3. Components

- **Header:** sticky, 56px, surface bg, pine wordmark + step pill. No notch/island.
- **Language switcher:** segmented EN | हिं | த | বাং, 44px targets,
  persists to `localStorage`, swaps all strings + `lang` attr.
- **Business grid:** 2-col (mobile) / 3-col (desktop) cards, 44px+, icon +
  label, `aria-pressed` single-select (dairy, retail, food, electronics,
  agro-processing, tailoring).
- **Location + GPS:** text input ("Block, District, State") + "Use GPS" button
  with permission-error copy. Validate on blur; 502 → inline retry row.
- **Margin slider:** `input[type=range]` 5000–5000000 step 5000 + numeric
  input synced; Plex Mono readout. Never computes — display server values.
- **CTA:** full-width 52px accent button ("Check feasibility"); disabled until
  category + location anchor valid. Secondary outline for DPR download.
- **Progress:** 4-dot stepper with `aria-current="step"`; DPR render shows
  determinate bar while `status: queued` (poll `GET /api/dpr/{id}` 3s).
- **Result card states:** `empty` (illustration + hint), `loading` (skeleton
  rows, `aria-busy`), `error` (danger text + retry, keeps form values),
  `populated` (verdict chip + KV + peers + DPR), `edge` (saturated → 3
  opportunity cards).
- **Score ring (SVG):** 96px ring, `stroke-dasharray` from `density_score`;
  color: viable accent, niche-gap pine, saturated caution. Number in Plex Mono.
- **KV rows:** label (muted, left) + value (Plex Mono, right): TPC,
  `max_loan_capped`, `eqi_amount`, tier. Footnote pill: `Scheme rules v2024-11`.
- **Compliance checklist:** checkbox list from `licenses[]`; required badge;
  `sources` + `ai_generated` shown as muted caption, never blocking.
- **Peers list:** max 5 rows: name, category, distance (km, 1 decimal). Empty →
  "No registered peers in radius." 503 → hide section + muted note.
- **DPR button:** enabled after feasibility + scheme succeed; opens
  name/business dialog → `POST /render` → download link (`pdf_url`) + polling.
- **Voice dock:** mic button bottom-right (mocked); records note chip, no ASR
  call yet. **Offline toggle:** demo switch showing `/offline` fallback banner.
  **Text-size toggle:** A / A+ root `font-size` 100%↔112%.
- **Toasts:** bottom-center above wizard rail, `role="status"`, auto-dismiss 4s.

## 4. API contract

Base `http://localhost:8000`. Auth: `Authorization: Bearer <JWT>` (24h) where 🔒.

| Method/Path | Auth | Request | Response | Errors |
|---|---|---|---|---|
| `POST /auth/register` | public | JSON `{email, password≥8+letter+digit, full_name?, username?}` | 201 `{id,email,username,full_name,role,is_active}` | 409 dup email, 422 weak pw |
| `POST /auth/token` | public | OAuth2 **form** `username=email&password=` | `{access_token, token_type: bearer}` | 401 bad creds, 403 inactive |
| `GET /auth/me` | 🔒 | — | UserOut (as register) | 401 no/invalid token |
| `GET /api/scheme/rules` | public | — | `[{tier: micro\|term, cap, rate, tenure_years, moratorium_months, effective_from, version}]` (v2024-11) | — |
| `POST /api/scheme/calculate` | public | `{margin: 5000–5000000, business_category?}` | `{margin, tpc, max_loan_raw, max_loan_capped, tier, rules, working_capital_buffer, eqi_schedule[{quarter,principal,interest,emi,balance,due_label}], eqi_amount}` | 422 margin out of range |
| `POST /api/feasibility/score` | 🔒 | `{location_text} \| {lat -90..90 + lon -180..180}, business_category, radius_m 1000–10000 (def 5000), population?` | `{lgd{state,district,block,gp?,code,lat,lon}, business_category, poi_count, density_score 0–100, verdict: saturated\|viable\|niche-gap, swot{strength,weakness,opportunity,threat}, opportunities[{title,reason}], overpass_ql}` | 401 no token, 422 no anchor, **502 geo fail → graceful retry UI** |
| `GET /api/compliance/licenses?business_category&state&district` | public | query: category required, state/district optional | `{business_category, state, district, licenses[{id,label,desc,required}], sources[], ai_generated, confidence}` | — (RAG fallback static rules) |
| `GET /api/directory/nearby?lat&lon&radius_m&category` | public | query: lat, lon, radius_m 1000–50000 (def 10000), category? | `{query, count, profiles[{id,name,category,distance_m,lat,lon}] ≤20 by distance, sql}` via `ST_DWithin` | **503 dir down → hide peers, keep verdict** |
| `POST /api/dpr/render` | 🔒 | `{feasibility, scheme, capex_opex?, verified: self-reported\|aa-verified, applicant_name, business_name?}` | `{dpr_id, pdf_url, status: ready\|queued, data, verified}` | 401, 422 missing feasibility/scheme |
| `GET /api/dpr/{id}` | 🔒 | — | DPR record + `status` (poll while queued) | 404 unknown id |
| `GET /api/dpr/{id}/download` | 🔒 | — | PDF binary (`Content-Disposition: attachment`) | 404 not-ready/missing |
| `POST /api/dpr/{id}/transition` | 🔒 | `{action: submit_for_review\|approve_sca\|reject\|send_to_bank\|finalize\|force_reject, note?}` | `{dpr_id, previous_state, current_state, triggered_by, history[]}` | 403 wrong role/transition, 404 |
| `GET /api/dpr/{id}/history` | 🔒 | — | `{dpr_id, current_state, allowed_triggers[], history[{from,to,trigger,by_user_id,timestamp,note}]}` | 404 |
| `GET /health` | public | — | `{status: ok\|degraded, database: up, redis: up}` | — |

Rule: **never compute TPC/loan/EQI on client** — render server values +
footnote `Scheme rules v2024-11 · micro ≤₹1.40L 6.5%/3y · term ≤₹50L 8%/7y`.

## 5. Accessibility

- 44px min targets; visible accent focus ring (`2px solid --accent`, offset 2px).
- `aria-live="polite"` on result + toast regions; `aria-busy` during fetch.
- Validate on blur with inline `aria-describedby` errors; GPS/502 errors announced.
- `prefers-reduced-motion`: disable transitions/skeleton shimmer.
- Devanagari/Tamil/Bengali: `line-height ≥1.6`, no truncation of labels.
- Contrast ≥4.5:1 body (pine on mist 14.2:1, accent on white 4.9:1, muted on
  white 5.1:1). Mono numerals `font-variant-numeric: tabular-nums`.

## 6. Overlap fixes log (vs saarthi-check.html)

1. Removed 390px iPhone frame + side buttons + Dynamic Island (absolute,
   overflow at >390px viewports) → fluid breakpoints above.
2. Toast was `position:absolute top:64px` inside phone canvas → fixed
   bottom-center above wizard rail, viewport-relative.
3. Score value `position:absolute inset:0` overlay → SVG ring with centered
   `<text>`, scales with container.
4. Sarkaar Ledger tokens (ink `#0F2A44`, vermilion, wheat, paper `#FFFCF6`,
   dashed borders, stamp animation) → pine/emerald/mist tokens §1.
5. Single static phone screen → 4-state result card (empty/loading/error/
   populated) + polled DPR `queued` state.

## 7. Open issues (maintained 2026-09-03 — element map added)

1. Voice/ASR mocked (dock UI only) — Bhashini adapter unplugged (PRODUCT.md scope).
2. GPS is demo-grade; `location_text` is the reliable anchor until LGD live verify.
3. Wired: `saarthi-check.html` + `api-client.js` cover all 14 endpoints per `api-contract.md`; preview still needs live backend at `http://localhost:8000` (configurable via API-base field) — nothing was run per instruction.
4. Directory `radius_m` mismatch: UI sends 10000, API allows 50000 — clamped client-side.
5. DPR `transition`/`history` officer UI out of scope for applicant rebuild (client fns exist, no UI).
6. i18n hero+CTA live for HI/TA/BN; deeper strings stubbed.
7. NEW: `saarthi-design-system.md` (detailed agent spec, 20 components C00–C20) + `saarthi-element-map.html` (visual inventory with live specimens + copy snippets) added as build map — canonical hooks unchanged.

1. Voice/ASR mocked (dock UI only) — Bhashini adapter unplugged (PRODUCT.md scope).
2. GPS is demo-grade; `location_text` is the reliable anchor until LGD live verify.
3. Wired: `saarthi-check.html` + `api-client.js` cover all 14 endpoints per `api-contract.md`; preview still needs live backend at `http://localhost:8000` (configurable via API-base field) — nothing was run per instruction.
4. Directory `radius_m` mismatch: UI sends 10000, API allows 50000 — clamped client-side.
5. DPR `transition`/`history` officer UI out of scope for applicant rebuild (client fns exist, no UI).
6. i18n hero+CTA live for HI/TA/BN; deeper strings stubbed.
