# UdyogSaarthi Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-grade Next.js PWA (Persuade landing + Operate wizard) that implements the §2.1–2.7 mandate of `systemDesign.md` with the “Sarkaar Ledger, Human Saarthi” visual world, contract-typed for the FastAPI backend.

**Architecture:** Unified Next.js 14 app-router at `frontend/`; shared `frontend/src/lib/design-tokens` + Tailwind; `Dexie` IndexedDB offline queue + `next-intl` vernacular routing; deterministic scheme math as pure client+server-shared lib (zero LLM); typed API client from OpenAPI; mocked Bhashini/OSM adapters with real contracts.

**Tech Stack:** Next.js 14 (App Router, TypeScript), Tailwind CSS, Dexie (IndexedDB), next-intl, Framer Motion (stamps only), Playwright (e2e offline), FastAPI counterpart shared types, WeasyPrint PDF contract.

**Spec:** `docs/superpowers/specs/2026-08-31-udyogsaarthi-website-design.md` (derives from `DOCS/research.md` + `DOCS/systemDesign.md`)

## Global Constraints

- Scheme math is deterministic, versioned via `scheme_rules` semantics — never use LLM for arithmetic; numbers validated before display. Copy rates verbatim: Micro ≤₹1.40L 6.5% 3y 3mo-moratorium, Term ₹1.40L–₹50L 8% 7y 6mo-moratorium, margin 10%.
- No Inventory, no double-entry ledger, no ONDC/marketplace, no AA gate (AA is optional enrichment badge only).
- PWA is LOCAL-FIRST (Dexie + background sync) per high-level architecture — all wizard state must survive offline.
- Voice is mock-pluggable: `BhashiniAdapter` interface with `asrLive` + `asrBatch` + `nmt` + `tts`, never hardcoded to one provider.
- OSM/LGD is contract-typed: `LGDResolver` + `OverpassAdapter` with `ST_DWithin` mock, partition key = LGD block/district.
- Accessibility: 44px min tap, Devanagari line-height ≥1.4, aria-live on voice transcript, respects `prefers-reduced-motion`.
- Design tokens are the single source of truth — no ad-hoc hex outside `tokens.ts`.

---

### Task 1: Scaffolding + Design System + Product Truth

**Files:**
- Create: `PRODUCT.md`
- Create: `DESIGN.md`
- Create: `.impeccable/surface-brief.json` (landing + app shell brief)
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/next.config.js`, `frontend/tailwind.config.ts`, `frontend/postcss.config.js`
- Create: `frontend/src/lib/design-tokens/tokens.ts`
- Create: `frontend/src/lib/design-tokens/tokens.css`
- Create: `frontend/src/app/layout.tsx`, `frontend/src/app/globals.css`
- Create: `frontend/src/components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `Slider.tsx`
- Modify: `infra/docker-compose.yml` — add `frontend` service (optional, not blocking)
- Test: `frontend/tests/tokens.test.ts` + manual `npm run dev` snapshot

**Interfaces:**
- Consumes: `DOCS/research.md`, `DOCS/systemDesign.md`, spec §2
- Produces: `tokens` (`inkBlue #0F2A44`, `vermilion #C73D2E`, `wheat #E8C36A`, `ledgerGrid #E6E8EC`, `paper #FFFCF6`, `mono: 'Fragment Mono'`), `PRODUCT.md` platform=web, `DESIGN.md` world=Sarkaar Ledger

- [ ] **Step 1: Write PRODUCT.md from spec §2**

```markdown
# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Users
Primary: rural first-time micro-entrepreneur (missing middle)...
## Product Purpose / Positioning / Operating Context / Capabilities / Principles
(as in spec §2 verbatim)
```

Run: `node C:/Users/asterxsk/.agents/skills/impeccable/scripts/context.mjs` to verify PRODUCT.md resolves.

- [ ] **Step 2: Scaffold Next.js**

Run:
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npm install next-intl dexie dexie-react-hooks framer-motion
```

Verify: `npm run dev` → http://localhost:3000 renders default page.

- [ ] **Step 3: Define tokens (single source)**

```ts
// frontend/src/lib/design-tokens/tokens.ts
export const tokens = {
  color: {
    ink: "#0F2A44", vermilion: "#C73D2E", wheat: "#E8C36A",
    paper: "#FFFCF6", ledger: "#E6E8EC", muted: "#6B7280",
    success: "#0F6B4A", warn: "#9A6A00"
  },
  font: { serif: "var(--font-tiro)", sans: "var(--font-inter)", mono: "var(--font-fragment)" },
  radius: { card: "14px", pill: "999px" },
  shadow: { slip: "0 6px 24px rgba(15,42,68,0.08)" }
} as const;
```

Corresponding CSS vars in `tokens.css`. No hex elsewhere.

- [ ] **Step 4: Build primitive UI kit**

`Button.tsx` variants: `primary` (ink bg, wheat text), `vermilion`, `ghost`; sizes ensure 44px min. `Card` = perforated receipt slip (top/bottom dashed border + shadow). `Badge` = rule-version footnote style.

- [ ] **Step 5: Write DESIGN.md from built tokens**

Document world, typography (Tiro Devanagari 400/600 + Inter 400/600 + Fragment Mono), palette, slip grammar. Run `node .../detect.mjs --json frontend/src/app/layout.tsx` once and note.

- [ ] **Step 6: Commit**

```bash
git add PRODUCT.md DESIGN.md frontend/
git commit -m "feat(frontend): scaffold Next.js PWA + Sarkaar Ledger design system"
```

---

### Task 2: Persuade — Landing Page `/`

**Files:**
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/components/landing/HeroReceipt.tsx`
- Create: `frontend/src/components/landing/SchemeTiers.tsx`
- Create: `frontend/src/components/landing/SaturationStory.tsx`
- Create: `frontend/src/components/landing/HowItWorks.tsx`
- Create: `frontend/src/components/landing/TrustLedger.tsx`
- Create: `frontend/src/components/landing/LanguageChips.tsx`
- Test: `frontend/tests/landing.test.tsx` — a11y + CTA routes to `/app`

**Interfaces:**
- Consumes: `tokens`, primitives, `lib/scheme-math` (for live tier calculator preview)
- Produces: `GET /` Persuade flow; `CTA` → `/app`

- [ ] **Step 1: Write failing test for routing**

```tsx
// frontend/tests/landing.test.tsx
import { render, screen } from "@testing-library/react";
import Page from "@/app/page";
it("CTA goes to /app", () => {
  render(<Page />);
  expect(screen.getByRole("link", { name: /Check my block/i }).getAttribute("href")).toBe("/app");
});
```

Run: `npm test` → FAIL (no page).

- [ ] **Step 2: Implement page structure (spec §3 sequence)**

Sections in order: Header (LGD breadcrumb mock, wordmark, language chips) → HeroReceipt (live feasibility receipt with voice wave placeholder + density gauge) → SaturationStory (20% stat + herd-mentality copy verbatim from research §2) → HowItWorks (Locate → Feasibility → Finance → DPR, 4 slips) → SchemeTiers (interactive margin→TPC mini-calculator, see Step 3) → Trust/comparison table (our table vs JanSamarth/Haqdarshak/Finline) → Final CTA + footer with SCA list (NBCFDC/NSFDC/NSTDFC/NMDFC).

- [ ] **Step 3: Wire SchemeTiers mini-calculator (shares lib from Task 5)**

Use `computeTPC(margin)=margin/0.1` pure function; slider 5k–5L. Live update shows routed tier badge + “Max loan” + moratorium. No LLM.

- [ ] **Step 4: Visual polish pass**

Ledger grid background (`repeating-linear-gradient`), perforated card edges, stamp seal on trust section, wheat-gold voice-pulse. Mobile: single column, slips stack.

- [ ] **Step 5: Run detector once**

```bash
node "C:/Users/asterxsk/.agents/skills/impeccable/scripts/detect.mjs" --json frontend/src/app/page.tsx
```

Fix findings batch.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(landing): Persuade surface with receipt hero + scheme calculator"
```

---

### Task 3: Operate Shell + i18n + Voice Entry

**Files:**
- Create: `frontend/src/app/app/layout.tsx`, `frontend/src/app/app/page.tsx`
- Create: `frontend/src/components/shell/AppRail.tsx`, `TopBar.tsx`, `OfflineBadge.tsx`
- Create: `frontend/src/lib/i18n/config.ts`, `frontend/src/lib/offline/db.ts`
- Create: `frontend/src/lib/voice/bhashini.ts` (adapter interface + mock)
- Create: `frontend/src/components/voice/VoiceBar.tsx`
- Test: `frontend/tests/shell.test.tsx`, `frontend/tests/offline.test.ts`

**Interfaces:**
- Consumes: `tokens`
- Produces: `AppRail` (4 steps with progress), `VoiceBar` (mic → transcript), `offlineDb` (Dexie), `BhashiniAdapter { asrLive, asrBatch, nmt, tts }`

- [ ] **Step 1: Fail test for rail**

```ts
it("rail shows 4 steps", () => { render(<AppRail active="feasibility"/>); expect(screen.getAllByRole("link")).toHaveLength(4); })
```

- [ ] **Step 2: Implement `db.ts`**

```ts
// frontend/src/lib/offline/db.ts
import Dexie from "dexie";
export class SaarthiDB extends Dexie {
  feasibility!: Dexie.Table<FeasibilityReport, string>;
  finance!: Dexie.Table<FinanceState, string>;
  constructor(){ super("SaarthiDB"); this.version(1).stores({ feasibility:"id,lgdBlock", finance:"id" }); }
}
```

Background-sync queue: pending `dprRequests` table with retry.

- [ ] **Step 3: Implement `BhashiniAdapter` mock**

```ts
export interface BhashiniAdapter {
  asrLive(chunk: Blob): Promise<string>;
  asrBatch(url: string): Promise<string>;
  nmt(text: string, target: string): Promise<string>;
  tts(text: string, lang: string): Promise<string>;
}
export const mockBhashini: BhashiniAdapter = {
  asrLive: async () => "Hilsa block, Nalanda", // mock
  asrBatch: async () => "Hilsa block",
  nmt: async (t) => t, tts: async () => ""
};
```

`VoiceBar` shows wave animation, transcript with “Change” link, aria-live="polite".

- [ ] **Step 4: App layout**

`TopBar` = LGD breadcrumb + language switcher (`next-intl` — hi, ta, bn at minimum). `AppRail` = bottom fixed on mobile, sidebar on desktop. `OfflineBadge` reads `navigator.onLine`.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(shell): Operate frame + Dexie offline + Bhashini adapter + i18n"
```

---

### Task 4: KYN Feasibility Engine (`/app/feasibility`)

**Files:**
- Create: `frontend/src/app/app/feasibility/page.tsx`
- Create: `frontend/src/lib/feasibility/lgd.ts`, `overpass.ts`, `scoring.ts`
- Create: `frontend/src/components/feasibility/LocationPicker.tsx`, `DensityGauge.tsx`, `SWOTCard.tsx`, `OpportunityList.tsx`, `MapSlip.tsx`
- Test: `frontend/tests/feasibility.test.tsx` + `scoring.test.ts`

**Interfaces:**
- Consumes: `BhashiniAdapter`, `LGDResolver`, `OverpassAdapter`
- Produces: `FeasibilityReport { lgd, lat, lon, poiCount, densityScore, verdict: 'saturated|viable|niche-gap', swot, opportunities }`

```ts
// scoring.ts (pure, tested)
export function densityScore(poiCount: number, population: number): number { /* 0-100 */ }
export function verdict(score: number): "saturated"|"viable"|"niche-gap" { return score>70?"saturated":score<30?"niche-gap":"viable"; }
```

- [ ] **Step 1: Write failing scoring tests**

```ts
expect(verdict(85)).toBe("saturated");
expect(verdict(15)).toBe("niche-gap");
```

- [ ] **Step 2: Implement `lgd.ts` + `overpass.ts` adapters**

`LGDResolver.resolve(input: string): Promise<LGDCode>` — mock mapping Bihar>Nalanda>Hilsa, with Overpass QL `node["shop"="electronics"](around:5000, lat, lon);` contract. Cache in Redis shape (client-side mock).

- [ ] **Step 3: Build UI flow**

Capture → LGD pill → “Querying 5km…” skeleton (ledger grid pulse) → `DensityGauge` (semicircle, color = ink/wheat/vermilion) → `SWOTCard` (4-quadrant receipt, LLM verbalization mocked as template with LGD partition key) → `OpportunityList` (3 niche pivots if saturated) → “Stamp” CTA to `/app/finance` passing `feasibilityId`.

Stamp animation: `saturated` → red “REJECT — Pivot suggested” stamp thud; `viable` → green “VIABLE — Proceed”.

- [ ] **Step 4: Offline: persist report to Dexie, queue if Overpass unavailable**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(feasibility): KYN engine with LGD+Overpass adapters + density + SWOT"
```

---

### Task 5: Deterministic Scheme Engine (`/app/finance`)

**Files:**
- Create: `frontend/src/lib/scheme/math.ts`, `frontend/src/lib/scheme/rules.ts`
- Create: `frontend/src/app/app/finance/page.tsx`
- Create: `frontend/src/components/finance/MarginSlider.tsx`, `EQITable.tsx`, `WorkingCapitalCallout.tsx`, `SchemeBadge.tsx`, `CashflowQA.tsx`
- Test: `frontend/tests/scheme-math.test.ts` (exhaustive), `frontend/tests/finance.test.tsx`

**Interfaces:**
- Consumes: `FeasibilityReport` (optional), `scheme_rules` version
- Produces: `computeTPC(m: Decimal) => Decimal`, `maxLoan(tpc)`, `routeScheme(tpc) => SchemeTier`, `generateEQI(loan, rate, tenure, moratorium)`, `workingCapitalBuffer(loan)`

```ts
// math.ts — zero LLM, Decimal.js for paise accuracy
export function computeTPC(margin: number): number { return margin / 0.10; }
export function maxLoan(tpc: number): number { return tpc * 0.90; }
export function routeScheme(tpc: number): SchemeTier { return tpc <= 140000 ? "micro" : "term"; }
export function generateEQI(loan:number, rate:number, tenureY:number, moratoriumM:number): QuarterlyObligation[] { /* amort */ }
```

Rules:
```ts
// rules.ts
export const schemeRules = {
  micro: { cap: 125000, rate: 0.065, tenureY: 3, moratoriumM: 3 },
  term:  { cap: 4500000, rate: 0.08, tenureY: 7, moratoriumM: 6 }
} as const; // versioned: effectiveFrom: "2024-11-01"
```

- [ ] **Step 1: Write exhaustive failing tests**

```ts
expect(computeTPC(10000)).toBe(100000);
expect(maxLoan(100000)).toBe(90000);
expect(routeScheme(140000)).toBe("micro");
expect(routeScheme(140001)).toBe("term");
expect(generateEQI(90000,0.065,3,3)).toHaveLength(11); // quarters minus moratorium
```

- [ ] **Step 2: Implement math + cap enforcement (loan capped to scheme cap)**

- [ ] **Step 3: Build UI**

`MarginSlider` = carbon-sheet drag (₹5k–5L log-ish). Live ledger rows: TPC, Max Loan (capped), Your Scheme badge, Rate, Tenure, Moratorium. `EQITable` = quarter-by-quarter EQI with sticky header. `WorkingCapitalCallout` = 20–30% buffer (systemDesign §5.3). `CashflowQA` = 4 voice-guided questions (spec §2.3) producing CAPEX/OPEX split — not a ledger.

Badge provenance footer: “Rule v2024.11 · validated, LLM did not compute”.

- [ ] **Step 4: Link to DPR**

Persist `FinanceState` to Dexie; CTA → `/app/dpr?financeId=...`

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(finance): deterministic engine with versioned rules + EQI + working capital"
```

---

### Task 6: DPR Generator (`/app/dpr`)

**Files:**
- Create: `frontend/src/app/app/dpr/page.tsx`
- Create: `frontend/src/components/dpr/DPRPreview.tsx`, `DPRMeta.tsx`
- Create: `frontend/src/lib/dpr/template.tsx` (HTML→PDF contract)
- Create: `backend/app/dpr/` (if extending backend) or `frontend/src/lib/dpr/client.ts` (contract to `POST /api/dpr/render`)
- Test: `frontend/tests/dpr.test.tsx`

**Interfaces:**
- Consumes: `FeasibilityReport` + `FinanceState` + `CashflowEstimate`
- Produces: `DPR { id, pdfUrl, data: JSON, verifiedBadge: 'self-reported'|'aa-verified' }`

- [ ] **Step 1: Test DPR requires both engines**

```ts
it("shows missing feasibility warning if no location", () => { render(<DPRPage />); expect(screen.getByText(/add location/i)).toBeInTheDocument(); })
```

- [ ] **Step 2: Implement preview**

`DPRPreview` = 8-section receipt booklet: Cover (UdyogSaarthi seal + LGD + date) → Feasibility (density + SWOT) → Scheme Structure (TPC/loan/EQI) → Cash-flow split (CAPEX/OPEX bar) → Quarter EQI → License checklist snapshot → Declaration (AA-verified flag). Uses `WeasyPrint`/`python-docx` contract shape but renders HTML preview first; PDF is async job (Celery+Redis mock status polling).

States: generating → ready → download. Offline-queued if no network.

- [ ] **Step 3: Implement `client.ts`**

```ts
export async function renderDPR(payload: DPRPayload): Promise<{pdfUrl:string}> {
  // POST /api/dpr/render — mocked until backend implements
  return { pdfUrl: "/mock/dpr.pdf" };
}
```

Backend placeholder: `backend/app/routers/dpr.py` with `WeasyPrint` stub.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(dpr): preview + PDF contract + AA badge"
```

---

### Task 7: Thin Modules — Compliance & Directory

**Files:**
- Create: `frontend/src/app/app/compliance/page.tsx`, `frontend/src/app/app/directory/page.tsx`
- Create: `frontend/src/lib/compliance/rules.ts`, `frontend/src/components/compliance/Checklist.tsx`
- Create: `frontend/src/lib/directory/client.ts`, `frontend/src/components/directory/NearbyList.tsx`
- Test: `frontend/tests/compliance.test.tsx`, `frontend/tests/directory.test.tsx`

- [ ] **Step 1: Compliance checklist (thin state machine)**

Map `businessCategory` → licenses `[Udyam, FSSAI, Trade]` with `status: done|pending` + DigiLocker pull mock. No issuance workflow.

- [ ] **Step 2: Directory (read-only PostGIS)**

`NearbyList` uses `ST_DWithin(lat, lon, 10000)` contract. Mock 0–5 profiles. Input to feasibility scorer, not marketplace.

- [ ] **Step 3: Wire to feasibility category**

When user picks “dairy” in feasibility → compliance auto-preselects FSSAI. Directory pivot: “who else near Hilsa does dairy?”.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(thin): compliance checklist + farmer/vendor directory (read-only)"
```

---

### Task 8: PWA Hardening, A11y, Perf, CI

**Files:**
- Create: `frontend/public/manifest.json`, `frontend/src/app/offline/page.tsx`
- Modify: `frontend/next.config.js` (PWA), `frontend/src/app/globals.css` (reduce-motion)
- Create: `frontend/tests/e2e/offline.spec.ts`, `frontend/tests/a11y.test.tsx`
- Modify: `.github/workflows/ci.yml` — add `frontend` lint+test

**Interfaces:**
- Consumes: all surfaces

- [ ] **Step 1: Manifest + service worker**

```json
{ "name":"UdyogSaarthi","short_name":"Saarthi","display":"standalone","background_color":"#FFFCF6" }
```

Service worker via `next-pwa`. Offline fallback at `/offline`.

- [ ] **Step 2: A11y fixes**

Audit with `axe-core`. Fix: voice transcript `aria-live`, slider `aria-valuetext` in rupees + words, stamp respects `prefers-reduced-motion` (fade not thud), 200% zoom still readable.

- [ ] **Step 3: Perf**

Route-split Operate chunks, image optimize, `font-display: swap` for Tiro. ruff + eslint + type-check in CI.

- [ ] **Step 4: E2E offline**

```ts
// offline.spec.ts
test("feasibility survives offline", async ({ page, context }) => {
  await context.setOffline(false); await page.goto("/app/feasibility");
  await context.setOffline(true); await page.reload();
  await expect(page.getByText(/offline/i)).toBeVisible();
  await expect(page.getByText(/queued/i)).toBeVisible();
});
```

- [ ] **Step 5: Impeccable finish (bounded, per SKILL.md Setup)**

Build fully, screenshot desktop+mobile (`/` and `/app/feasibility`), run `detect.mjs --json <changed targets>` once, batch-fix findings, one recapture + reviewer verdict. Then documenter writes `DESIGN.md` sidecar.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(pwa): manifest + offline + a11y + perf + e2e"
```

---

## File Structure at Completion

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx, page.tsx (/ Persuade)
│   │   ├── app/ (Operate)
│   │   │   ├── layout.tsx, page.tsx
│   │   │   ├── feasibility/page.tsx
│   │   │   ├── finance/page.tsx
│   │   │   ├── dpr/page.tsx
│   │   │   ├── compliance/page.tsx
│   │   │   └── directory/page.tsx
│   │   └── offline/page.tsx
│   ├── components/
│   │   ├── ui/ (Button, Card, Badge, Input, Slider)
│   │   ├── landing/ (HeroReceipt, SchemeTiers...)
│   │   ├── shell/ (AppRail, TopBar, OfflineBadge)
│   │   ├── voice/ (VoiceBar)
│   │   ├── feasibility/ (Gauge, SWOT, Opportunity)
│   │   ├── finance/ (MarginSlider, EQITable)
│   │   └── dpr/ (Preview)
│   └── lib/
│       ├── design-tokens/ (tokens.ts, tokens.css)
│       ├── offline/db.ts (Dexie)
│       ├── voice/bhashini.ts
│       ├── feasibility/ (lgd, overpass, scoring)
│       ├── scheme/ (math, rules)
│       └── dpr/ (template, client)
├── public/manifest.json
└── tests/ (unit + e2e)
```

## Verification Checklist (before claiming complete)

- [ ] `npm run build` passes, no ad-hoc hex outside tokens.ts
- [ ] Scheme math tests green (edge: cap, moratorium quarters, paise)
- [ ] `detect.mjs` single pass → batch fix → one recapture → verdict table reported
- [ ] Offline: wizard survives refresh while offline; queue retries on reconnect
- [ ] Voice bar usable with keyboard + screen reader; Devanagari at 200% zoom intact
- [ ] DPR preview renders with correct numbers; numbers === calculator output (assertion)
