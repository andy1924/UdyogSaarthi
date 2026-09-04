# UdyogSaarthi — Product Truth

<!-- impeccable:product-schema 1 -->

> **Implementation note (2026-09-05):** This document describes the intended product experience. Backend (`backend/`) and Next.js PWA frontend (`frontend/`, wired to the live API) are implemented — see `update.md` for current scope. The React Native app, IVR/SMS layer, and vernacular voice layer described below are planned rather than active.

## Platform

web — Next.js PWA (local-first, IndexedDB + background sync), React Native Phase 2, IVR/SMS fallback. Desktop + mobile (360px–1440px), voice-first, touch-large targets.

## Users

- **Primary:** First-time rural micro-entrepreneur (18–35, "missing middle" between SHG microfinance and formal bank), low financial/digital literacy, speaking 1 of 22 vernaculars, on low-end Android with spotty connectivity. Job: decide *what* business will survive in my block, and *how* to finance it without drowning in debt, without paying a middleman.
- **Secondary:** DIC/SCA field officer reviewing DPRs — needs auditable numbers, scheme-rule versioning, AA-verified flags.
- **Excluded:** Daily bookkeeping/ledger user (deliberately out of scope per systemDesign §0).

## Purpose

Fix two decisions *before* money moves — business viability and loan structuring — by replacing predatory DPR middlemen with hyper-local feasibility + deterministic scheme math, delivered in the user's language.

## Mechanism (Why We Win)

LGD-block-pooled RAG (784 districts, 7,323 blocks, 2.6L GPs) + live OSM Overpass POI density (5–10km radius, `node["shop"="…"]`) + deterministic calculator (versioned `scheme_rules`, zero LLM arithmetic) → DPR that SCAs can trust. Competitors assume you already know the business; we prove whether it will survive *there*.

## Operating Context

User walks into DIC with margin cash (typically 10%); needs DPR on the spot or via field agent (DAY-NRLM / white-labeled kiosk). Environment: dusty block office, shared phone, intermittent data. Workflow is linear: **Locate → Feasibility → Finance → DPR → Licenses/Search**. Offline queue + voice notes (chunked, resumable) are not nice-to-haves.

## Constraints

- No ONDC/marketplace, no double-entry ledger, no AA gate (optional enrichment only), no bespoke license issuance.
- All scheme math must be versioned + auditable. Numbers must be validated after LLM verbalization.
- Accessibility = voice, large type, vernacular numerals, not just WCAG AA.

## Scheme Tiers (Deterministic Math)

| Tier | Total Project Cost | Max Loan (90%) | Interest | Tenure | Moratorium |
|------|-------------------|-----------------|----------|--------|------------|
| Micro Finance | ≤ ₹1.40L | ₹1.25L | 6.5% p.a. | 3 years | 3 months |
| Term Loan | ₹1.40L – ₹50.00L | ₹45.00L | 8% p.a. | 7 years | 6 months |

Margin money: 10% of TPC. EQI computed deterministically per `scheme_rules` version — zero LLM arithmetic.

## Evidence on Hand

- `research.md` (scheme math, failure analysis, NPA goals)
- `systemDesign.md` (module boundaries, data layer PostGIS+pgvector+Redis+S3)
- Working FastAPI skeleton with PostGIS/Redis health check

## Principles

1. **Shield before compass** — dissuade from saturated bets before offering finance.
2. **Math is deterministic, words are generous** — never let LLM compute.
3. **Paper that kills middlemen** — DPR is the single highest-value artifact.
4. **Lowest-common-device first** — offline + voice + vernacular, not desktop retrofits.

## Success Metrics

- CTA tap → `/app` with location permission granted (Persuade)
- DPR PDF generated offline-capable, with correct EQI math (Operate)
- Checklist completed, `ST_DWithin` result shown (Compliance/Directory)
- User can restate MF vs Term Loan in own words (Docs)

## Out of Scope

Inventory, ledger, ONDC, AA-gated flow, bespoke license issuance, RN mobile (Phase 2 placeholder only), real Bhashini/ASR (mocked interface, pluggable), real OSM live (mock + contract-typed adapter).
