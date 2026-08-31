# System Design

**Mandate (per `research.md`):** Rural micro-enterprise failure is a knowledge problem, not a capital problem. The platform's job is to fix two decisions before money moves — *what business to start* and *how to structure the loan* — for a low-literacy, low-connectivity, voice-first user base. Every module in this document is justified against that mandate; nothing else is in scope for v1.

---

## 0. Why This Is a Rewrite, Not an Extension

The prior draft of this design scoped in Cash Flow (double-entry ledger), Inventory, and a bespoke/ONDC Supply Chain matching engine as core modules, and treated Account Aggregator (AA) integration as a prerequisite for loan underwriting. All four decisions are reversed here:

| Removed / demoted | Why it doesn't belong in the core mandate |
|---|---|
| **Inventory module** | Requires ongoing, disciplined data entry (stock in/out) from a user segment the research explicitly characterizes as having low financial and digital literacy. This is an *operating* concern for a business that already exists — the platform's job per `research.md` §2–3 is *pre-launch* feasibility and financial structuring. Adding a daily-use bookkeeping burden at onboarding raises the abandonment risk of the core advisory flow for zero contribution to the NPA-reduction and over-indebtedness goals stated in §8.1. |
| **Cash Flow / double-entry ledger** | Same failure mode: a general ledger is a bookkeeping product, not an advisory one. The research's actual cash-flow need is narrow and already scoped — the working-capital buffer calculation and quarter-by-quarter EQI schedule in Module 2 (§5.3). That is fully covered by the Deterministic Scheme Engine below; it does not require a persistent transactional ledger. |
| **Supply Chain / ONDC matching** | Not mentioned anywhere in `research.md`. It's a marketplace/logistics problem, orthogonal to feasibility analysis and loan structuring, and pulls engineering effort into buyer/seller-side protocol integration instead of the LGD/OSM/Bhashini/scheme-router stack the research actually specifies. |
| **Account Aggregator as a hard prerequisite** | The research's borrowers are frequently *first-time*, informal-sector entrepreneurs (§2, "missing middle") — many will have thin or no formal banking/GST trail for AA to pull from. Making AA mandatory would exclude exactly the population the mandate targets. AA becomes an **optional enrichment** to the manual estimation workflow (§5.4), not a gate. |

What remains — **KYN Feasibility Engine, Deterministic Scheme Engine, DPR Generator, Multilingual Voice Layer, Compliance/Licensing checklist** — is a direct 1:1 mapping to `research.md` Modules 1 and 2, plus the two supporting concerns (DPR submission and license eligibility) the research says beneficiaries currently outsource to predatory middlemen (§7.1.3).

Farmers/Vendors directory and License checklist remain in scope as **thin, read-oriented modules** (profile + eligibility lookup), not as transactional platforms — see §3.5.

---

## 1. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ CLIENTS                                                                 │
│  • Next.js PWA — LOCAL-FIRST (IndexedDB-backed, background sync)       │
│  • React Native (Android-first), same local-first data layer            │
│  • IVR/SMS fallback (feature phones) via Bhashini + telephony gateway   │
└───────────────┬──────────────────────────────────────────────────────┬─┘
                │ REST (OpenAPI) — resilient, retry-safe                │
                │ Async voice-note upload (chunked, resumable)          │
┌───────────────▼──────────────────────────────────────────────────────▼─┐
│ API GATEWAY (Kong / AWS API Gateway) — auth, rate limit, locale routing │
└───────────────┬──────────────────────────────────────────────────────┬─┘
                │                                                        │
┌───────────────▼───────────────┐     ┌──────────────────────────────────▼─┐
│ BACKEND — FastAPI (async)      │    │ ASYNC WORKERS — Celery + Redis     │
│ Modular monolith:               │   │  • Voice-note ASR/NMT batch queue  │
│  • KYN Feasibility Engine       │   │  • DPR document rendering          │
│  • Deterministic Scheme Engine  │   │  • Bhashini live-stream fallback   │
│    (pure Python, unit-tested,   │   │    → batch reprocessing            │
│     zero LLM involvement)       │   └──────────────────────────────────┬─┘
│  • DPR Generator                │                                      │
│  • Compliance/Licensing         │   ┌──────────────────────────────────▼─┐
│  • Farmer/Vendor directory      │   │ LLM / RAG LAYER                    │
│    (read-only profile lookup)   │   │ Claude API + pgvector, HARD        │
└───────────────┬──────────────────┘  │ partitioned by LGD block/district  │
                │                     | code (§5). Verbalization only —    │
                │                     │ never computes numbers.            │
┌───────────────▼───────────────────────┴─────────────────────────────────┐
│ DATA LAYER                                                               │
│ PostgreSQL 16 + PostGIS + pgvector (single instance, schema-per-module)  │
│ Redis (cache, session, Celery broker, offline-sync conflict resolution)  │
│ S3-compatible object store (voice notes, DPR PDFs, KYC/license docs)     │
└──────────────────────────────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────────────┐
│ EXTERNAL INTEGRATIONS                                                  │
│ Bhashini (ASR/NMT/TTS, live + batch) · LGD API · OSM Overpass ·        │
│ DigiLocker (KYC/license) · GSTN (where applicable) · JanSamarth ·      │
│ Account Aggregator (Setu/Sahamati) — OPTIONAL enrichment, not a gate   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Modules

### 2.1 KYN Feasibility Engine
Directly implements `research.md` Module 1.

- **Flow:** capture location (voice or text) → LGD code resolution → PostGIS radius query against OSM Overpass POI data → competitive density score → LLM-generated SWOT/opportunity narrative, spatially grounded per §5.
- **Entities:** `User`, `Location(lgd_state, lgd_district, lgd_block, lgd_gp, lat, lon)`, `FeasibilityReport`, `POIQueryResult`.
- **Output:** a feasibility report object (structured JSON + rendered narrative) that becomes an input to the DPR Generator — not a standalone artifact the user must interpret unaided.

### 2.2 Deterministic Scheme Engine
Directly implements `research.md` Module 2, and is the financial core of the platform. **This module contains zero LLM calls.**

- Pure, versioned, unit-tested Python functions:
  - `compute_tpc(margin_capital: Decimal) -> Decimal` → TPC = margin / 0.10
  - `max_loan_eligibility(tpc: Decimal) -> Decimal` → TPC × 0.90
  - `route_scheme(tpc: Decimal) -> SchemeTier` → Micro Finance Scheme (≤ ₹1.40L) vs Term Loan Scheme (₹1.40L–₹50L), per §5.2
  - `generate_eqi_schedule(loan, rate, tenure, moratorium) -> list[QuarterlyObligation]`
  - `working_capital_buffer(loan_amount) -> Decimal` → 20–30% reserve recommendation, §5.3
- Scheme parameters (rates, caps, tenure, moratorium) are stored as **versioned config data** (a `scheme_rules` table with an `effective_from` date), not hardcoded constants — government schemes revise rates periodically, and NPA-relevant calculations must remain auditable against the rule version active at the time of each user's calculation.
- **LLM's only role here:** take the structured output of these functions and phrase it in the user's language via the Multilingual Voice Layer. The LLM prompt explicitly forbids arithmetic and is validated by asserting the numbers in its output string match the calculator's output before the response is returned to the user.

### 2.3 Manual/Assisted Cash-Flow Estimation (replaces AA-as-prerequisite)
Since Account Aggregator cannot be assumed available for first-time informal borrowers (§0), the DPR needs a lightweight, assisted estimation workflow instead of a ledger product:

- A short, voice-guided Q&A ("What do you expect to spend on X per month? What will you charge for Y?") that produces a simple CAPEX/OPEX split — enough to feed the Scheme Engine's working-capital calculation, without requiring the user to maintain ongoing books.
- This is a **one-time or periodic estimation form**, not a transactional ledger — no double-entry, no running balance, no daily use burden.
- **Optional enrichment:** if the user has a bank/UPI history, an Account Aggregator pull (via Setu/Sahamati, with explicit consent) can refine the estimate. The DPR clearly flags whether figures are self-reported or AA-verified, since that distinction matters to the SCA/DIC reviewing the application — but AA absence never blocks DPR generation.

### 2.4 DPR Generator
- Template-driven document generation (`WeasyPrint` HTML→PDF or `python-docx`) that populates a standard Detailed Project Report template with: the Feasibility Engine's report, the Scheme Engine's TPC/eligibility/EQI output, and the cash-flow estimation from §2.3.
- Directly eliminates the "exploitative middleman" friction point named in `research.md` §7.1.3 — this is the single highest-value deliverable in the platform per the research's own competitive analysis (only Finline/DPR generators currently do this, and they assume accounting literacy the target user doesn't have).

### 2.5 Multilingual Voice Layer
See §4 for the full resiliency architecture. Functionally: ASR → NMT (to English) → route to Feasibility Engine / Scheme Engine / DPR Generator → NMT (back to native language) → TTS. Every backend response carries a `locale` field.

### 2.6 Compliance / Licensing (thin module)
- A **checklist/state-machine**, not a transactional workflow: for a given business category (identified during KYN), surface the small set of licenses typically required (Udyam registration, FSSAI for food/dairy, trade license) and track checklist completion status.
- DigiLocker integration for pulling/verifying already-issued IDs and licenses. No bespoke license-issuance workflow is built — the platform tracks and informs, it does not replace the issuing authority.

### 2.7 Farmers/Vendors Directory (thin module)
- A read-oriented profile + geospatial lookup (`ST_DWithin` against PostGIS), scoped to "who else near me is doing what" as an input to the Feasibility Engine's competitive density scoring (§2.1) and as a discovery aid.
- Explicitly **not** a marketplace, ordering, or matching engine (see §0 — Supply Chain removed). No transaction, inventory, or logistics logic lives here.

---

## 3. Tech Stack & Justifications

| Layer | Choice | Justification |
|---|---|---|
| Backend framework | **FastAPI** (async, Uvicorn/Gunicorn) | I/O-bound integrations dominate (Bhashini, LGD, Overpass, Claude, DigiLocker) — async concurrency matters more here than in a typical CRUD app. Pydantic schemas enforce strict input validation at the boundary feeding the Deterministic Scheme Engine — a malformed margin-capital input must never reach the calculator. |
| ORM | SQLAlchemy 2.0 (async) + Alembic | GeoAlchemy2 support for PostGIS; standard migration tooling for the versioned `scheme_rules` table. |
| Frontend | **Next.js (React), configured local-first** | SSR/ISR for low-end devices; `next-i18next` for static UI strings; PWA + IndexedDB for offline form state (§6). |
| Mobile | React Native (Android-first) | Matches India's rural smartphone base; shares the local-first data layer and TypeScript types with the web PWA. |
| Database | **PostgreSQL 16 + PostGIS + pgvector** | One system for relational, geospatial, and vector data — see §5 for the mandatory partitioning strategy. |
| Caching / queue broker | Redis | Session cache, rate limiting, Celery broker, and background-sync conflict metadata (§6). |
| Background jobs | Celery | Voice-note batch processing queue (§4), DPR rendering, notification fan-out. |
| LLM | Claude API (Sonnet for SWOT/advisory synthesis, Haiku for cheap verbalization) | Reliable instruction-following for the "verbalize, never compute" constraint (§2.2); strong multi-turn RAG behavior for spatially-filtered retrieval (§5). |
| Object storage | AWS S3 (or Cloudflare R2) | Voice-note chunks, DPR PDFs, KYC/license documents. |
| Auth | Keycloak (self-hosted) or AWS Cognito | OAuth2/OIDC; supports future DigiLocker/Aadhaar-based federation. |
| Cloud | AWS `ap-south-1` (Mumbai) | Data residency for DPDP Act 2023 and RBI-adjacent norms; physical proximity to Bhashini/LGD/govt API endpoints minimizes voice-pipeline latency. |
| CI/CD | GitHub Actions → ECS Fargate | Avoids Kubernetes operational overhead until a specific module demonstrably needs independent scaling. |
| Observability | Sentry + Grafana Cloud (free tier) | Adequate for MVP scale; avoids premature APM spend. |

**No change from the prior draft on FastAPI-vs-REST reasoning** (async I/O, Pydantic validation, OpenAPI contract for DIC/NRLM integrators, native WebSocket support for the live-voice path) — that decision stands and is not affected by the scope pruning.

---

## 4. Network & Voice Architecture — Hybrid, Resilient

The prior WebSocket-only design assumed consistently available full-duplex connectivity, which is not a safe assumption across 2G/3G rural coverage. Replaced with a **hybrid ingestion pipeline**:

1. **Primary path — live streaming:** WebSocket connection to Bhashini for full-duplex ASR/TTS when connection quality supports it (client-side measures round-trip latency/packet loss and decides).
2. **Fallback path — async voice-note queue:** if the live connection degrades or drops mid-session, the client automatically switches to **recording locally and uploading resumable audio chunks** (via chunked/resumable upload, e.g. `tus` protocol or S3 multipart) as connectivity allows. A Celery worker picks up completed chunks, runs batch ASR/NMT, and pushes the result back to the client (via push notification or next poll) rather than requiring the session to stay open.
3. **Client behavior:** the UI always shows an explicit state — "Listening (live)" vs "Recorded — will process when connected" — so a low-literacy user isn't left uncertain about whether their input was captured. This is a product-trust requirement, not just an engineering nicety, given the target demographic.
4. **IVR/SMS tier:** for feature-phone users with no smartphone/data at all, a telephony gateway (Exotel/Twilio, India-compliant) captures voice over a standard phone call, applies the same batch ASR/NMT pipeline, and delivers results via SMS/voice callback.

---

## 5. Database & Data Partitioning Strategy

### 5.1 Hard Spatial Partitioning for RAG (mandatory)
The prior design ran pgvector similarity search without a hard geographic filter, creating a real risk of **cross-district hallucination** — e.g., a SWOT report for a block in rural Odisha getting contaminated by embeddings retrieved from a semantically similar but geographically irrelevant district in Maharashtra. This is fixed structurally, not just by prompt instruction:

- Every embedded document (District Statistical Abstracts, prior feasibility reports, scheme-rule explanations) is tagged at ingestion time with its `lgd_district_code` (and `lgd_block_code` where applicable).
- The retrieval query is **always** of the form:
  ```sql
  SELECT content, embedding <-> :query_embedding AS distance
  FROM knowledge_base
  WHERE lgd_district_code = :user_district_code   -- hard filter, applied BEFORE similarity ranking
  ORDER BY distance
  LIMIT :k;
  ```
  The `WHERE` clause is enforced at the query-builder level (not left to prompt instructions or optional parameters), so a request literally cannot retrieve embeddings outside the user's district. If a district lacks sufficient indexed content, the system falls back to the parent state-level partition explicitly and **labels the report as state-level, not block-level**, rather than silently pulling from an unrelated district for the sake of returning *a* result.
- Implementation: a composite pgvector index scoped per partition (e.g., partial indexes per state, or a partitioned table by `lgd_state_code` with local pgvector indexes) to keep this filter cheap at scale rather than a full-table scan with a `WHERE` bolted on.

### 5.2 Deterministic Layer Isolation
The `scheme_rules`, and the calculator functions in §2.2, live in a schema with **no LLM/RAG dependency whatsoever** — no foreign keys into the `knowledge_base` or embeddings tables, no shared service layer with the RAG module. This is enforced by module boundary (separate FastAPI router + service class + DB schema), so a future refactor cannot accidentally let a "helpful" LLM shortcut compute a number that should come from the calculator.

### 5.3 Schema Layout (single Postgres instance, schema-per-module)
- `identity` — users, roles, auth metadata
- `geo` — LGD reference data, PostGIS location tables, Overpass query cache
- `feasibility` — feasibility reports, POI query results
- `scheme_engine` — `scheme_rules` (versioned), calculation audit log (every TPC/EQI calculation stored with the rule version used — required for NPA/audit traceability per `research.md` §8.1)
- `dpr` — generated DPR records and their source-data snapshots
- `compliance` — license checklist state per user/business category
- `directory` — farmer/vendor profiles (read-oriented, per §2.7)
- `knowledge_base` — embeddings + LGD partition tags, isolated from `scheme_engine` per §5.2

---

## 6. Local-First Offline Architecture (upgraded from "offline-capable")

- **Client-side storage:** IndexedDB (via a wrapper like Dexie.js) holds the canonical local copy of in-progress form state — KYN inputs, cash-flow estimation answers (§2.3), DPR draft fields. The user can complete an entire session offline.
- **Background sync:** the PWA registers a background sync task (Service Worker Background Sync API, with a polling fallback for browsers without support) that pushes queued writes to the backend as soon as connectivity resumes, without requiring the user to reopen the app or manually retry.
- **Conflict resolution:** since DPR drafts and KYN inputs are single-user, single-owner records, conflicts are resolved with last-write-wins keyed on a client-generated timestamp — no CRDT complexity needed at this data-ownership scale. Redis holds short-lived sync-state metadata (last-synced-at per record) to make idempotent replay safe if a sync retries after a partial failure.
- **Voice-note offline queue:** integrates with §4's async voice pipeline — an unsent voice note is just another IndexedDB-queued item with a binary blob, synced via the same background-sync mechanism.
- **Explicit sync status UI:** given the low-literacy constraint, sync state is shown with simple, unambiguous icons/labels ("Saved on this phone" vs "Sent"), not a technical "pending/synced" badge.

---

## 7. Phased Implementation Plan

**Phase 1 — MVP (single-state pilot):**
- KYN Feasibility Engine (text-first; Bhashini live voice optional, batch voice-note fallback available from day one — §4 is not a "later" feature, it's required at launch given the target network conditions)
- Deterministic Scheme Engine, fully unit-tested, with versioned `scheme_rules`
- Manual cash-flow estimation workflow (§2.3) — no AA integration yet
- DPR Generator (template-driven, PDF output)
- Compliance/Licensing checklist (read-only, DigiLocker-verified where available)
- Local-first PWA with IndexedDB + background sync from day one (retrofitting offline-first later is materially more expensive than building it in from the start)
- Hard LGD-partitioned pgvector retrieval from day one (§5.1) — this is a correctness property, not an optimization, so it is not deferred

**Phase 2:**
- Live full-duplex Bhashini voice as the primary (not sole) input path, hybrid fallback already in place from Phase 1
- Optional Account Aggregator enrichment for cash-flow estimation, clearly flagged as optional in the DPR
- Farmer/Vendor directory (read-only, geospatial lookup)
- IVR/SMS tier for feature-phone users

**Phase 3 — scale-out:**
- Extract the LLM/RAG layer into an independently-scaled service if load justifies it
- Expand district-level knowledge base coverage to close state-level-fallback gaps identified in Phase 1–2 usage data
- Revisit Inventory/Cash-Flow/Supply-Chain **only if** post-launch data shows a validated demand signal from users who have already successfully launched via this platform — at that point it is a distinct, opt-in product for existing businesses, not a core-mandate feature bundled into onboarding

## 8. Directory Structure
```
UdyogSaarthi/
├── backend/                          # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py             # env/settings (pydantic-settings)
│   │   │   ├── security.py           # auth/JWT
│   │   │   └── database.py           # async SQLAlchemy engine/session
│   │   ├── api/v1/
│   │   │   ├── router.py
│   │   │   └── endpoints/
│   │   │       ├── auth.py
│   │   │       ├── feasibility.py
│   │   │       ├── scheme_engine.py
│   │   │       ├── cashflow.py
│   │   │       ├── dpr.py
│   │   │       ├── compliance.py
│   │   │       └── voice.py
│   │   ├── modules/                  # domain logic, isolated per module boundary
│   │   │   ├── identity/
│   │   │   ├── geo/                  # LGD data, PostGIS helpers, Overpass client
│   │   │   ├── feasibility/
│   │   │   │   ├── service.py
│   │   │   │   ├── overpass_client.py
│   │   │   │   └── lgd_client.py
│   │   │   ├── scheme_engine/        # PURE deterministic — no LLM import allowed
│   │   │   │   ├── calculator.py     # compute_tpc, route_scheme, eqi_schedule
│   │   │   │   ├── rules_repository.py
│   │   │   │   └── tests/
│   │   │   ├── cashflow_estimation/
│   │   │   ├── dpr_generator/
│   │   │   │   ├── service.py
│   │   │   │   └── templates/dpr_template.html
│   │   │   ├── compliance/
│   │   │   │   └── digilocker_client.py
│   │   │   ├── voice/
│   │   │   │   ├── bhashini_client.py
│   │   │   │   ├── stream_handler.py
│   │   │   │   └── batch_processor.py
│   │   │   └── rag/                  # separate schema/service from scheme_engine
│   │   │       ├── embeddings.py
│   │   │       ├── retriever.py      # hard LGD-partition filter lives here
│   │   │       └── llm_client.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── migrations/           # alembic
│   │   ├── workers/
│   │   │   ├── celery_app.py
│   │   │   └── tasks/
│   │   │       ├── voice_batch.py
│   │   │       └── dpr_render.py
│   │   └── schemas/                  # shared pydantic models
│   ├── tests/
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── Dockerfile
│
├── frontend/                         # Next.js PWA
│   ├── src/
│   │   ├── app/                      # routes
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── api-client/           # typed client generated from OpenAPI spec
│   │   │   └── offline/              # IndexedDB (Dexie), background-sync queue
│   │   ├── locales/                  # next-i18next strings
│   │   └── public/manifest.json      # PWA manifest
│   ├── next.config.js
│   └── package.json
│
├── mobile/                           # React Native — Phase 2, empty for now
├── infra/
│   ├── terraform/
│   └── docker-compose.yml            # local Postgres+PostGIS, Redis
├── docs/
│   ├── systemDesign.md
│   └── research.md
└── .github/workflows/                # CI: lint, test, build, deploy
```

---

*This design treats `research.md` as the source of truth for scope: the platform's job ends at "the entrepreneur has a viable business idea, a structured loan application, and a filed DPR." Anything past that boundary (running the business day-to-day) is deliberately out of scope for the core mandate and is deferred to a future, separately-justified product decision.*
