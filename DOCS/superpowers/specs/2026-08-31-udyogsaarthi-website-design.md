# UdyogSaarthi Website — Design Spec

**Date:** 2026-08-31
**Sources:** `DOCS/research.md` §§1–9 · `DOCS/systemDesign.md` §§0–6 · Backend skeleton (`backend/app/main.py`, `infra/docker-compose.yml`)
**Skill:** `impeccable` (new-work) + `brainstorming` (Architectural path)

---

## 1. Classification

**Architectural.** No frontend exists (`frontend/` not present, `hasVisualImplementation: false`). This is a greenfield PWA with brand creation, multi-surface information architecture, and backend integration — not a bounded tweak to existing code.

---

## 2. Product Truth (synthesized for PRODUCT.md)

**Users:**
- Primary: First-time rural micro-entrepreneur (18–35, “missing middle” between SHG microfinance and formal bank), low financial/digital literacy, speaking 1 of 22 vernaculars, on low-end Android with spotty connectivity. Job: decide *what* business will survive in my block, and *how* to finance it without drowning in debt, without paying a middleman.
- Secondary: DIC/SCA field officer reviewing DPRs — needs auditable numbers, scheme-rule versioning, AA-verified flags.
- Excluded: daily bookkeeping/ledger user (deliberately out of scope per systemDesign §0).

**Platform:** `web` — Next.js PWA (local-first, IndexedDB + background sync), React Native Phase 2, IVR/SMS fallback. Desktop + mobile (360px–1440px), voice-first, touch-large targets.

**Purpose:** Fix two decisions *before* money moves — business viability and loan structuring — by replacing predatory DPR middlemen with hyper-local feasibility + deterministic scheme math, delivered in the user’s language.

**Mechanism that no neighbor can copy:** LGD-block-pooled RAG (784 districts, 7,323 blocks, 2.6L GPs) + live OSM Overpass POI density (5–10km radius, `node["shop"="…"]`) + deterministic calculator (versioned `scheme_rules`, zero LLM arithmetic) → DPR that SCAs can trust. Competitors assume you already know the business; we prove whether it will survive *there*.

**Operating context:** User walks into DIC with margin cash (typically 10%); needs DPR on the spot or via field agent (DAY-NRLM / white-labeled kiosk). Environment: dusty block office, shared phone, intermittent data. Workflow is linear: **Locate → Feasibility → Finance → DPR → Licenses/Search**. Offline queue + voice notes (chunked, resumable) are not nice-to-haves.

**Constraints:** No ONDC/marketplace, no double-entry ledger, no AA gate (optional enrichment only), no bespoke license issuance. All scheme math must be versioned + auditable. Numbers must be validated after LLM verbalization. Accessibility = voice, large type, vernacular numerals, not just WCAG AA.

**Evidence on hand:** `research.md` (scheme math, failure analysis, NPA goals), `systemDesign.md` (module boundaries, data layer PostGIS+pgvector+Redis+S3), working FastAPI skeleton with PostGIS/Redis health check.

**Principles:**
1. **Shield before compass** — dissuade from saturated bets before offering finance.
2. **Math is deterministic, words are generous** — never let LLM compute.
3. **Paper that kills middlemen** — DPR is the single highest-value artifact.
4. **Lowest-common-device first** — offline + voice + vernacular, not desktop retrofits.

---

## 3. Visitor Modes & Surface Map

| Surface | Mode | Job | Success metric |
|---|---|---|---|
| `/` Landing | **Persuade** | Rural youth *or* parent/mentor decides this tool won’t cheat them; DIC officer sees auditability. | CTA tap → `/app` with location permission granted |
| `/app`, `/feasibility`, `/finance`, `/dpr` | **Operate** | Complete task: locate → see saturation score → pick structure → download DPR. | DPR PDF generated offline-capable, with correct EQI math |
| `/compliance`, `/directory` | **Operate/Read** | Thin lookup: “what license for dairy?” / “who else near me does this?” | Checklist completed, `ST_DWithin` result shown |
| `/docs` (design handoff) | **Read** | Explain scheme tiers without jargon | User can restate MF vs Term Loan in their own words |

**Sequence (Persuade):** Hero with voice entry → Saturation horror-story (20% survive) → “What we prove *before* you borrow” (3-step: Locate/Feasibility/Finance) → Scheme tiers as calculator, not brochure (interactive margin→TPC) → How it kills middlemen (compare) → Trust ledger (SCAs, PostGIS, versioned rules) → CTA with language chips. No generic SaaS pricing; the price is margin money.

**Operate topology:** Persistent bottom rail (mobile) / sidebar (desktop) with 4 steps + progress: ① Location ② Feasibility ③ Finance ④ DPR. Every step shows “offline-ready” state. Voice mic is omnipresent but not modal-blocking — bar at bottom, like GBoard.

---

## 4. Content & Data Ranges

- Locations: state → district → block → GP, lat/lon, LGD codes. Needs typeahead with fuzzy Hindi transliteration.
- POI density: 0–200 shops in 5km; density score 0–100 + “saturated / viable / niche gap” signal.
- Scheme math: margin ₹5k–₹5L → TPC ₹50k–₹50L, Micro (≤1.4L, 6.5%, 3y, 3mo moratorium) vs Term (≤50L, 8%, 7y, 6mo). EQI table 12–28 rows.
- DPR: 8–12 page PDF (feasibility narrative, EQI, CAPEX/OPEX split, license checklist).
- Licenses: 3–5 per business type (Udyam, FSSAI, trade).
- Directory: 0–50 nearby profiles per query.

**States required:** empty (no location), loading (Overpass querying), partial (saturation high → pivot suggestion), offline-queued, error (LGD miss / Overpass timeout), success (DPR ready), AA-verified vs self-reported badge.

---

## 5. Approaches Considered

### Architecture

**A. Unified Next.js PWA (RECOMMENDED):** Single `frontend/` app, app-router, Persuade landing at `/` and Operate flows at `/app/*`, shared design tokens, Dexie IndexedDB offline queue. Fits systemDesign §1 exactly, one deployment, one i18n pipeline, offline from day 1. Con: slightly heavier initial bundle — mitigated by route-splitting.

**B. Split static landing + SPA:** Astro/marketing at `www.` + Vite SPA at `app.` — faster marketing iteration, but duplicates shell, breaks offline continuity, two i18n systems. Rejected: violates local-first mandate.

**C. SSR-only without offline:** Pure SSR Next.js, no IndexedDB — simplest to build, but fails the “spotty connectivity” operating context; user loses work mid-DPR. Rejected.

### Visual World (impeccable new-work)

*Rut to avoid:* Generic fintech gradient / startup SaaS hero with floating dashboards — opposite of government-trust + rural empathy. Literal “wheat field + handshake” stock.

**Direction 1 — “Sarkaar Ledger” (RECOMMENDED):** India Post ledger + Railway timetable + District Gazette. Ink-blue (#0F2A44), carbon-paper grid, perforated edges, stamp seals, monospaced “rule number” annotation. Warm counterweight: vermilion/sindoor (#C73D2E) and wheat-gold (#E8C36A) for CTA/voice-pulse. Typography: serif for authority (Tiro Devanagari + Fraunces) + grotesk for data (Inter / Sora). Feels like a document you can take to the DIC and they stamp it.

**Direction 2 — “Mandi Chit”:** Cooperative society chit + market-yard hand-painted sign, high-contrast, chalk-stroke icons, kraft paper. More artisanal, less institutional — risk: feels informal for loan audit.

**Direction 3 — “Kendra Poster”:** Krishi Vigyan Kendra instructional poster — numbered steps, isometric illustrations, icon-heavy didactic. Excellent for low-literacy but can feel childish for financial credibility.

Challengers (dealt) would be weighed against Direction 1 on *audience identification* (does a first-time borrower see themselves as an entrepreneur, not a beneficiary?) and *product clarity* (does the interface make deterministic math feel un-fakeable?).

---

## 6. Selected Direction — “Sarkaar Ledger, Human Saarthi”

**Thesis:** Government-grade trust (the ledger) fused with a human guide (the Saarthi) — not a bank, not a startup, a companion who holds the paper while you speak.

**First viewport:** Top ledger-rule header with LGD breadcrumb (“Bihar > Nalanda > Hilsa > …”), left: ink-blue wordmark `UdyogSaarthi` with stamp dot, right: language chips (हिंदी, தமிழ், বাংলা…). Hero is a full-width “feasibility card” — not a headline, a live feasibility receipt: location pill + voice wave + density gauge. CTA is “Check my block — बोलें” with mic.

**Visitor path:** Persuade scroll → Operate rail. Every Operate card looks like a perforated receipt slip; numbers sit in mono boxes with rule-version footnotes (“Scheme rules v2024.11 · 6.5% MF”). Voice transcript appears as carbon-copy.

**Signature interaction:** Margin slider → live TPC/EQI ledger update (no LLM, instant). Dragging feels like extending a carbon sheet. Over-saturated result triggers a physical “REJECT — pivot suggested” stamp animation, then niche alternatives fan out.

**Risk:** Ledger aesthetic can feel dense; mitigated by generous whitespace between slips, and reducing grid to detail level on mobile (cards stack, rules collapse to “i”).

---

## 7. Scope & Anti-Goals

**In:** Landing, app shell, 4-step wizard, scheme calculator, DPR preview+PDF, compliance checklist, farmer/vendor geo-lookup, voice entry mock, offline indicator, i18n routing, design tokens, PRODUCT.md + DESIGN.md.

**Out (per §0):** Inventory, ledger, ONDC, AA-gated flow, bespoke license issuance, RN mobile (Phase 2 placeholder only), real Bhashini/ASR (mocked interface, pluggable), real OSM live (mock + contract-typed adapter).

**Platform constraints:** Next.js 14+ app-router, Tailwind, TypeScript, Dexie, `next-intl`, WeasyPrint/python-docx contract kept server-side. A11y: 44px min tap, 1.4 line-height for Devanagari, aria-live for voice, reduced-motion.

---

## 8. Interaction & Layout Principles (intent, not CSS)

- Hierarchy: Document > Card > Ledger-row. Scan by seal color, not icon count.
- Responsive: 360 mobile (single column, bottom rail), 768 tablet (2-col, slip stacks), 1024 desktop (sidebar + 8-col grid, receipt stays sticky).
- Feedback: Every calculation shows its rule provenance; every voice result shows transcript + “change” link.
- Transitions: Slip slides (150ms), stamp thud (200ms, prefers-reduced-motion → fade), no parallax.

---

## 9. Open Decisions (recorded, not invented)

- Language parity at launch: Hindi + English + 2 south/east (need confirmation).
- Primary device for DIC officer view: desktop vs shared tablet?
- DPR filing: download-only v1 or direct DIC/SCA submission mock?
