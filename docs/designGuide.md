# UdyogSaarthi — Frontend Design Guide (v1)

> AI-driven hyper-local business advisory for rural micro-entrepreneurs applying for NBCFDC/NSFDC/NSTFDC/NMDFC-linked SCA schemes.

---

## 1. Product Context (why this guide looks the way it does)

UdyogSaarthi replaces two failure points documented in the research: entrepreneurs picking **saturated businesses** (no market data) and mismanaging **loan structuring** (no financial literacy). The frontend's job is to turn dense geospatial/financial computation into something a first-time, possibly low-literacy, rural applicant can trust and act on — while also serving DIC officers and SCA auditors who process the same DPR through a formal workflow.

This is a **trust-and-clarity product**, not a consumer app. It sits closer to a banking/investing tool than a lifestyle app, which is why Zerodha is the right reference: Zerodha's UI communicates "serious financial infrastructure" through restraint — plain type, a near-monochrome base palette, one confident accent color, no decorative noise, and numbers that are always legible and unambiguous (their entire P&L color convention — green/red, nothing else competing for attention — is the model to borrow for our `viable / saturated / niche-gap` verdicts and EMI/eligibility figures).

---

## 2. Target Users

| Persona | Role in API | Context | Primary need |
|---|---|---|---|
| **Ravi — the Applicant** | `applicant` | Rural/semi-urban, first-time entrepreneur, may have low formal literacy, likely on a mid-range Android phone, patchy connectivity, prefers speaking over typing, thinks in a regional language | "Tell me plainly: is my business idea safe, what will I get, what do I owe" |
| **Priya — the DIC Officer** | `dic_officer` | District Industries Centre staff, processes many DPRs a day, works from a desktop in-office | "Let me review, approve, or send this forward fast, with the numbers already verified" |
| **Anil — the SCA Auditor** | `sca_auditor` | State Channelizing Agency, final financial gatekeeper, needs an audit trail | "Show me the full history and let me finalize or reject with confidence" |

**Design consequence:** the applicant-facing product must be **voice-first, large-touch-target, low-jargon, mobile-first**. The officer/auditor-facing product is a **dense, desktop-first review console** — same design system, different density and information architecture. Treat these as two modes of one app, not one responsive layout stretched both ways.

---

## 3. Design Principles

1. **Numbers are the interface.** Every screen exists to answer a money or eligibility question. Never bury a number in a paragraph — surface it in a card, a badge, or a table cell.
2. **One verdict, unmissable.** Every analytical output (feasibility verdict, scheme tier, transition state) gets a single unambiguous colored badge. No mixed signals.
3. **Calm, not clinical.** White space and restraint, not gray corporate sterility — warm neutral background, one confident brand color, generous line-height for regional scripts (Devanagari, Bengali, Tamil, etc. need more vertical room than Latin text).
4. **Voice is a first-class input**, not an accessibility afterthought — every text field has a mic affordance next to it.
5. **Never let the AI look more certain than it is.** `ai_generated`, `confidence`, and `sources` from `/api/compliance/licenses` must always be visible when present, not hidden in a tooltip.
6. **Progressive disclosure for officers.** Applicants see conclusions first, detail on demand. Officers see structured detail first — they're auditing, not being persuaded.

---

## 4. Color System

Inspired by Zerodha Kite/zerodha.com's restrained, high-contrast financial palette: a near-white/near-black neutral base carrying almost all the UI, with color spent only on meaning (buy/sell, profit/loss) — never on decoration.

### 4.1 Neutrals (base UI)

| Token | Hex | Use |
|---|---|---|
| `bg-canvas` | `#F7F7F5` | App background |
| `bg-surface` | `#FFFFFF` | Cards, sheets, modals |
| `border-subtle` | `#E4E4E0` | Card borders, dividers |
| `text-primary` | `#1A1A1A` | Headings, key figures |
| `text-secondary` | `#5C5C5C` | Body copy, labels |
| `text-muted` | `#8A8A85` | Timestamps, helper text |
| `bg-canvas-dark` | `#161616` | Officer console dark mode |
| `bg-surface-dark` | `#1F1F1F` | Officer console cards (dark) |

### 4.2 Brand accent

| Token | Hex | Use |
|---|---|---|
| `brand-primary` | `#2B5D3F` | Primary buttons, active nav, links, focus rings — an earthy, trustworthy green (nods to agriculture/rural economy, distinct from any bank's blue) |
| `brand-primary-hover` | `#224A32` | Hover/pressed state |
| `brand-tint` | `#E7F0EA` | Selected chips, light backgrounds behind the brand color |

### 4.3 Semantic (verdicts, states — the Zerodha-style P&L convention)

| Token | Hex | Meaning |
|---|---|---|
| `state-positive` | `#0F8A4E` | `viable` verdict, approved, positive EQI status |
| `state-warning` | `#C97A1A` | `niche-gap` verdict, `sca_review`/`bank_review` pending states |
| `state-negative` | `#C43D3D` | `saturated` verdict, `rejected`, `403`/error states |
| `state-neutral` | `#5C6470` | `draft`, `queued`, informational |
| `state-info-tint` | `#EAF2FB` | Background behind info banners (e.g. "self-reported" vs "aa-verified") |

**Rule:** exactly one semantic color per state, always paired with a text label (not color alone) — required for low-literacy and color-blind accessibility.

### 4.4 Typography

- **UI font:** Inter or Noto Sans (Noto Sans has full glyph coverage across Devanagari, Bengali, Tamil, Telugu, Gujarati etc. — non-negotiable for a pan-India product; Inter alone will not render Indic scripts).
- **Numeral font:** tabular figures for all currency/EMI tables so columns align.
- **Scale:** 28/22/18/16/14/12 px, 1.5 line-height minimum for Indic body text (vs 1.4 for Latin).
- **Currency formatting:** always Indian digit grouping (₹9,00,000 not ₹900,000).

---

## 5. Information Architecture / Screens → API Mapping

### 5.1 Applicant app (mobile-first)

| Screen | Endpoint(s) | Required inputs | Key UI elements |
|---|---|---|---|
| **Onboarding / Login** | `POST /auth/register`, `POST /auth/token` | email, password (8+ chars, 1 letter + 1 digit), optional name/username | Minimal form, mic-assisted name entry, large CTA, password strength meter |
| **Location & Business Setup** | (feeds into `/api/feasibility/score`) | `location_text` or `lat`/`lon`, `business_category` | Voice input primary, map-pin fallback, GPS auto-detect, searchable business-category picker with icons |
| **Feasibility Report** | `POST /api/feasibility/score` | location, category, optional `radius_m` (1000–10000), `population` | Verdict badge (`saturated`/`viable`/`niche-gap`) at top in semantic color; map with `poi_count` pins; `density_score` as a simple gauge, not a raw number; SWOT as 4 expandable cards; `opportunities` as a scrollable card row |
| **Loan Calculator** | `GET /api/scheme/rules`, `POST /api/scheme/calculate` | `margin` (₹5,000–₹50,00,000), `business_category` | Big slider/number input for margin with live-updating result card: TPC, capped max loan, tier badge (Micro/Term), EQI schedule as a simple stacked bar per quarter, working-capital-buffer called out as a warning card, not a footnote |
| **Compliance Checklist** | `GET /api/compliance/licenses` | `business_category`, optional `state`/`district` | Checklist UI, each license as a row with required/optional tag; small "AI-assisted, confidence X%" disclosure chip when `ai_generated: true` |
| **Nearby Businesses** | `GET /api/directory/nearby` | `lat`, `lon`, optional `radius_m` (1000–50000), `category` | Map + list toggle, max 20 pins, empty/`503` state: "Directory data temporarily unavailable" (never a raw error) |
| **DPR Generation** | `POST /api/dpr/render` | assembled `feasibility` + `scheme` objects, optional `business_name`, `capex_opex`, `verified` | Auto-filled review screen (nothing retyped), single "Generate Report" CTA, then a polling state ("Preparing your report…") since status starts `queued` |
| **DPR Status / Download** | `GET /api/dpr/{id}`, `GET /api/dpr/{id}/download` | dpr_id (from context) | Status stepper (queued → ready), download button disabled with tooltip until PDF exists, retry affordance on 404 |
| **Application Tracker** | `GET /api/dpr/{id}/history`, `POST /api/dpr/{id}/transition` (only `submit_for_review` is applicant-triggerable) | dpr_id, `action`, optional `note` | Vertical timeline matching the state machine (`draft → sca_review → dic_approved → bank_review → finalized`, or `rejected`), one primary action button per state |

### 5.2 Officer / Auditor console (desktop-first)

| Screen | Endpoint(s) | Required inputs | Key UI elements |
|---|---|---|---|
| **Review Queue** | `GET /api/dpr/{id}`, list via backend query | role, state filter | Dense table: applicant, tier, verdict, current state, age — sortable, state as colored pill |
| **DPR Detail / Decision** | `GET /api/dpr/{id}`, `POST /api/dpr/{id}/transition` | `action` per the state table (`approve_sca`, `reject`, `send_to_bank`, `finalize`, `force_reject`), `note` | Full assembled report read view + role-gated action buttons (only valid transitions for current role/state rendered — grey out rest, don't hide, so officers understand the workflow) |
| **History / Audit Trail** | `GET /api/dpr/{id}/history`, `GET /api/audit/logs*` (dic_officer/sca_auditor only) | `page`, `page_size` (≤200) | Append-only log table: action, endpoint, user, IP, timestamp, redacted payload — monospace for payload snippets |

---

## 6. Components

- **Verdict Badge** — pill, semantic color + icon + label, never color-only.
- **Money Card** — large tabular-figure number, small muted label above, optional trend/comparison line below.
- **State Stepper** — horizontal on desktop, vertical on mobile, mirrors the DPR state machine exactly (draft/sca_review/dic_approved/bank_review/finalized/rejected).
- **Confidence Chip** — small outlined chip: "AI-assisted · 72% confidence" or "Verified source" — used anywhere `ai_generated`/`confidence`/`sources` appear.
- **Voice Input Field** — text input + mic icon, waveform state while listening, transcript shown before submit for confirmation (never auto-submit voice input).
- **Empty/Degraded State** — used for `502`/`503` responses (feasibility, directory): friendly icon, plain-language explanation, retry button. Never show a raw HTTP status to the applicant; officers' console may show the technical detail in a collapsed "details" row.

---

## 7. Accessibility & Localization

- Minimum touch target 44×44px on applicant app.
- WCAG AA contrast minimum on all semantic colors against their backgrounds (`state-positive`/`state-negative` above are tuned to pass on `bg-surface`).
- Full UI string catalog externalized for Bhashini-driven translation into the 22 target languages — no hardcoded English strings in components.
- Every screen with a written form has a "speak instead" affordance.
- Numerals, dates, and currency localized per user's selected language/region, not just translated labels.

---

## 8. Open Questions for Next Design Pass

1. Confirm whether the applicant app is a PWA or native — affects offline handling for `queued`/polling states in low-connectivity areas.
2. Map component choice (Leaflet/Mapbox) for POI density + directory — needs to work well on low-end Android given OSM tile weight.
3. Do we need a distinct "no scheme fits" state when `margin` falls outside ₹5,000–₹50,00,000, or does the calculator just clamp with a warning?

---

*This is a v1 structural/visual direction document — happy to turn any section (e.g. the Feasibility Report screen or the Loan Calculator) into a high-fidelity mockup next.*