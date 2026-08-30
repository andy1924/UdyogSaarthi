# System Design: AI-Driven Rural Micro-Enterprise Advisory & Financial Platform

**Prepared for:** Cloud-native, pan-India deployment
**Scope:** Cash Flow · Inventory · Govt Subsidies · License · Know-Your-Need (KYN) · Language · Farmers & Vendors · Supply Chain · Loans

---

## 1. Design Principles (from the research doc, translated into engineering constraints)

| Constraint from research | Engineering implication |
|---|---|
| Users are low-literacy, rural, low-bandwidth | PWA-first, offline-capable UI, voice-first interaction, aggressive payload minimization |
| Deterministic financial logic (no LLM arithmetic) | Separate a **Rules/Calculator Engine** from the **LLM/RAG layer** — never let the LLM compute EMIs or eligibility |
| 22-language support (Bhashini) | i18n at the API contract level (locale-tagged responses), not just frontend string swapping |
| Hyper-local geospatial analysis (LGD + OSM) | PostGIS is non-negotiable; treat location as a first-class entity, not a text field |
| National scale (6.7 lakh villages) but early-stage adoption | Start as a **modular monolith**, not microservices. Split into services only when a module's load/team actually demands it — avoid distributed-systems overhead on day one |
| Integrates with DICs, NRLM, SCAs (govt bodies) | Contract-first REST APIs (OpenAPI spec) so government IT teams can integrate without hand-holding |

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                          │
│  React (Next.js) Web PWA   │  React Native app (Android-first)    │
│  IVR/SMS fallback (Bhashini + Exotel/Twilio) for feature-phone use│
└───────────────┬────────────────────────────────────────────────┬─┘
                │ HTTPS/REST (OpenAPI) + WebSocket (voice stream) │
┌───────────────▼────────────────────────────────────────────────▼─┐
│  API GATEWAY  (Kong / AWS API Gateway) — auth, rate limit, i18n   │
└───────────────┬────────────────────────────────────────────────┬─┘
                │                                                  │
┌───────────────▼───────────┐   ┌──────────────────────────────────▼─┐
│  BACKEND — FastAPI (Python)│   │  ASYNC WORKERS — Celery + Redis    │
│  Modular monolith, domain- │   │  (DPR generation, Bhashini calls,  │
│  driven modules:           │   │  credit-bureau pulls, notif.)      │
│  • KYN / Feasibility Engine│   └──────────────────────────────────┬─┘
│  • Financial Calculator    │                                      │
│  • Subsidy/Scheme Router   │   ┌──────────────────────────────────▼─┐
│  • License & Compliance    │   │  LLM / RAG LAYER                   │
│  • Cash Flow & Ledger      │   │  Anthropic Claude API + pgvector   │
│  • Inventory               │   │  (advisory text, SWOT, verbaliza-  │
│  • Vendor/Farmer Directory │   │  tion — NEVER does arithmetic)     │
│  • Supply Chain Matching   │   └─────────────────────────────────────┘
│  • Loan Origination        │
└───────────────┬────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────┐
│  DATA LAYER                                                        │
│  PostgreSQL 16 + PostGIS  (transactional + geospatial, single      │
│  source of truth — schema-per-module inside one DB initially)      │
│  Redis (cache, session, Celery broker)                             │
│  S3-compatible object store (DPRs, KYC docs, licenses)             │
│  OpenSearch (optional, phase 2) — vendor/supplier search           │
└──────────────────────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────┐
│  EXTERNAL INTEGRATIONS                                             │
│  Bhashini (ASR/NMT/TTS) · LGD API · OSM Overpass · Account         │
│  Aggregator (Setu/Sahamati) · DigiLocker (KYC/license) · GSTN ·    │
│  ONDC (supply-chain matching) · JanSamarth · Payment gateway       │
└──────────────────────────────────────────────────────────────────┘
```

**Why a modular monolith, not microservices:** the 9 features share one user, one location context, and one financial ledger. Splitting them into separate services on day one means distributed transactions for something as simple as "loan disbursal updates cash flow and inventory." Build clean module boundaries (separate FastAPI routers + service classes + DB schemas) inside one deployable unit; extract a module to its own service later only if it needs independent scaling (Supply Chain matching and the LLM/RAG layer are the most likely early candidates, since they carry different load profiles).

---

## 3. FastAPI vs "REST" — the actual decision

This isn't really an either/or — FastAPI is a *framework* for building REST (or GraphQL) APIs; REST is the architectural *style*. Here's the concrete recommendation:

- **Use FastAPI as the framework, exposing RESTful endpoints.** Reasons specific to this project:
  - **Async-native** — critical because Bhashini ASR/TTS calls, Claude API calls, and Account Aggregator calls are all I/O-bound network calls. Django (WSGI, sync by default) would block worker threads; FastAPI/ASGI (via Uvicorn/Gunicorn) handles concurrent I/O far better with less infra.
  - **Pydantic validation** — you have deterministic financial math (EMI, moratorium, TPC) where a malformed input must never silently pass through to the calculator. Pydantic schemas enforce this at the boundary.
  - **Auto-generated OpenAPI spec** — you need this for DIC/NRLM integrators and for your own React frontend to codegen a typed client (`openapi-typescript`).
  - **Native WebSocket support** — needed for Bhashini's full-duplex voice pipeline.
- **Don't add GraphQL.** Your data access patterns are workflow-driven (apply for scheme → get eligibility → generate DPR), not ad-hoc client-side querying. GraphQL would add a resolver layer and N+1 query risk for no real benefit here. Revisit only if you build a public developer ecosystem around the platform.
- **Django REST Framework** is a reasonable alternative if the team is more comfortable with a batteries-included admin panel and ORM migrations out of the box — but given the async, voice-streaming, and LLM-orchestration needs, FastAPI is the better fit.

---

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **FastAPI** + Uvicorn/Gunicorn | See §3 |
| ORM | **SQLAlchemy 2.0 (async)** + Alembic for migrations | Mature, works cleanly with PostGIS via GeoAlchemy2 |
| Frontend | **Next.js (React)** | SSR/ISR for low-end devices, built-in i18n routing, PWA support via `next-pwa`, better SEO for DIC-facing landing pages than a plain CRA/Vite SPA |
| Mobile | **React Native (Android-first)** | India rural smartphone penetration is overwhelmingly Android; share business logic/types with the Next.js codebase via a shared TypeScript package |
| Database | **PostgreSQL 16 + PostGIS** | Already implied by the research doc's use of PostGIS for the 5–10km radius queries; also handles JSONB for flexible scheme-rule storage |
| Caching / queue broker | **Redis** | Session cache, rate limiting, Celery broker — one tool, multiple jobs, avoids over-provisioning |
| Background jobs | **Celery** (or **Dramatiq** if you want a lighter dependency footprint) | DPR generation, Bhashini calls, notification fan-out |
| Vector store (RAG) | **pgvector** (Postgres extension) | Avoid standing up a separate vector DB (Pinecone/Weaviate) until you have real scale pain — pgvector keeps your data layer to one system |
| LLM | **Claude API** (Claude Sonnet 5 for advisory generation, Claude Haiku 4.5 for cheap/fast verbalization tasks) | Strong at following deterministic-constraint prompting (i.e., "only phrase this output, don't compute it") and at multi-turn RAG |
| Object storage | **AWS S3** (or Cloudflare R2 to cut egress costs) | KYC docs, DPRs, license uploads |
| Search (phase 2) | **OpenSearch** or Postgres full-text (`tsvector`) to start | Vendor/supplier directory search — don't introduce Elasticsearch/OpenSearch until directory size justifies it |
| API Gateway | **Kong** (self-hosted) or **AWS API Gateway** | Central auth, rate limiting, request/response locale tagging |
| Auth | **Keycloak** (self-hosted) or **AWS Cognito** | OAuth2/OIDC, supports Aadhaar/DigiLocker-based eKYC federation later |
| Cloud | **AWS (ap-south-1, Mumbai)** | See §5 |
| CI/CD | **GitHub Actions** → container build → **AWS ECS Fargate** (or EKS once you need finer orchestration control) | Fargate avoids managing K8s nodes for a team that isn't there yet |
| Observability | **Grafana + Prometheus** (self-hosted or Grafana Cloud free tier) + **Sentry** for error tracking | Cheap, standard, avoids vendor lock-in to a pricier APM |
| Infra-as-code | **Terraform** | Reproducible environments across dev/staging/prod |

---

## 5. Cloud Provider Recommendation

**AWS, region `ap-south-1` (Mumbai).**

- Data residency: RBI's data localization norms for payment/financial data, and the DPDP Act 2023, both push toward keeping financial and personal data within India — Mumbai region satisfies this without extra compliance engineering.
- Bhashini, LGD, and most Indian govt APIs are hosted in India — co-locating your compute in Mumbai minimizes round-trip latency for the voice pipeline (latency matters per §6.2 of your research doc).
- Mature managed-service ecosystem: RDS for Postgres+PostGIS, ElastiCache for Redis, ECS Fargate/EKS, Cognito, S3 — all first-party, well-documented, and easy to hire for.
- GCP (`asia-south1`) is a reasonable alternative if you want tighter Vertex AI integration, but AWS currently has broader startup credit programs (AWS Activate) and a larger Indian systems-integrator/partner base for eventual govt procurement.

Avoid multi-cloud at this stage — it triples your ops burden for no benefit until you have a specific regulatory or redundancy reason.

---

## 6. Feature Module Breakdown

### 6.1 Know Your Need (KYN) — the Feasibility Engine
Maps to Module 1 of the research doc. Onboarding wizard (voice or text) → location capture → LGD lookup → Overpass POI density query → LLM-generated SWOT/opportunity report.
- **Key entities:** `User`, `Location(lgd_code, lat, lon)`, `FeasibilityReport`, `POIQueryResult`
- **Components:** LGD API client, Overpass QL query builder, PostGIS radius queries, Claude API for SWOT synthesis (RAG-grounded on District Statistical Abstracts you ingest into pgvector)

### 6.2 Cash Flow
- **Key entities:** `Ledger`, `Transaction` (double-entry: debit/credit), `CashFlowForecast`
- Build this as a proper append-only ledger table (never mutate historical rows) — this is what your EMI/moratorium schedule (§5.3 of the research doc) and future audits both depend on.
- Expose read-side projections (running balance, quarterly EQI schedule) computed via a scheduled job, not on every read, to keep it fast at scale.

### 6.3 Inventory
- **Key entities:** `Product`, `StockLevel`, `StockMovement`
- Simple event-sourced stock ledger (movements in/out), same pattern as cash flow — reuse the append-only design so you don't build two different consistency models.
- Low-bandwidth UI: barcode/photo-based stock entry where possible (use device camera + a lightweight on-device OCR/barcode lib rather than round-tripping images to the server for every scan).

### 6.4 Govt Subsidies (Scheme Router)
- Maps to Module 2. This is the deterministic rules engine — implement scheme eligibility as versioned, testable Python functions (not LLM prompts), e.g. `route_scheme(tpc: Decimal) -> SchemeTier`. Store scheme parameters (rates, caps, tenures) as data (JSONB or a config table), not hardcoded constants, since government schemes change rates/caps periodically.

### 6.5 License
- **Key entities:** `LicenseApplication`, `LicenseDocument`, `ComplianceChecklist`
- Integrate **DigiLocker** for pulling/verifying existing government IDs and issued licenses, and **GSTN API** for business registration status where applicable. Store checklist state machine per license type (Udyam registration, FSSAI for food/dairy businesses, trade license, etc.) — most rural micro-enterprises will need a small, predictable set of these.

### 6.6 Language
- **Bhashini API** integration exactly as the research doc describes: ASR → NMT (to English) → LLM → NMT (back to native) → TTS, over WebSocket for full-duplex low latency.
- At the API contract level, every response carries a `locale` field so the frontend/IVR layer doesn't need to guess which language to render in.
- Fallback: pre-translated static UI strings via `next-i18next` for the 8–10 highest-traffic languages, reserving live Bhashini NMT for dynamic/generated content (SWOT reports, chat responses).

### 6.7 Farmers and Vendors
- **Key entities:** `Vendor`, `Farmer`, `Profile(category, location, products_offered)`
- This is essentially a directory/marketplace core — geospatial search (PostGIS `ST_DWithin`) for "vendors near me," plus a verification badge tied to the License module's compliance checklist.

### 6.8 Supply Chain (vendor ↔ supplier, e.g. e-milk)
- **This is the strongest candidate to build on ONDC (Open Network for Digital Commerce)** rather than a bespoke matching engine. ONDC is a government-backed open protocol specifically designed to connect buyers/sellers/logistics across categories including agriculture and retail, and several dairy/agri networks are already live on it. Building your matching layer as an ONDC network participant (buyer-app or seller-app role, per your users' side) gives you interoperability with an existing national supplier base instead of a cold-start marketplace.
- If ONDC integration isn't feasible in your first release, build a minimal internal matching service (order/demand posted by vendor → matched against supplier inventory within radius) as a stopgap, but design the data model to be ONDC-schema-compatible from day one so migration is cheap later.

### 6.9 Loan
- **Key entities:** `LoanApplication`, `DPR (Detailed Project Report)`, `DisbursementSchedule`
- DPR auto-generation: template-driven document generation (populate a DOCX/PDF template with the calculator's output — TPC, margin, scheme tier, EMI schedule) rather than asking an LLM to draft financial figures.
- Where feasible, integrate the **Account Aggregator framework (via Setu or Anumati)** for consented, verified cash-flow/bank-statement data — this both strengthens the DPR and gives real underwriting signal, and it's the RBI-sanctioned way to pull financial data with user consent (avoids scraping or manual statement uploads).
- Loan status can integrate with **JanSamarth** where the relevant SCA/scheme is already on that portal, rather than duplicating a lending workflow the government already runs.

---

## 7. Third-Party APIs — Consolidated List

| API / Service | Used for | Notes |
|---|---|---|
| **Bhashini** | ASR, NMT, TTS across 22 languages | Free, govt-provided; use WebSocket mode for latency |
| **LGD API** (Ministry of Panchayati Raj) | District/block/GP codes | Free, authoritative source of administrative boundaries |
| **OSM Overpass API** | POI density, spatial queries | Free but rate-limited — self-host an Overpass instance if query volume grows, rather than hammering the public endpoint |
| **Account Aggregator (Setu / Sahamati / Anumati)** | Consented bank statement / cash-flow data for loans | RBI-regulated, consent-based — the correct way to underwrite, not screen-scraping |
| **DigiLocker** | KYC, license document verification | Govt-issued document verification |
| **GSTN API** | Business registration/license status | For vendors above GST threshold |
| **ONDC** | Supply-chain vendor↔supplier matching | See §6.8 |
| **JanSamarth** | Cross-reference/integration with existing govt loan portal | Avoids duplicating scheme application workflows |
| **Anthropic Claude API** | RAG-based advisory text, SWOT synthesis, conversational layer | Never used for arithmetic — deterministic calculator owns all numbers |
| **Payment gateway** (Razorpay / Setu Payment) | Margin money collection, EMI reminders/collection where applicable | Razorpay has the most mature India-specific payments developer experience |

---

## 8. Security & Compliance Notes

- **DPDP Act 2023** compliance: explicit consent capture for data collection, right-to-erasure support, data localization (satisfied by choosing `ap-south-1`).
- Financial and KYC data encrypted at rest (RDS encryption, S3 SSE) and in transit (TLS everywhere, enforced at the API Gateway).
- Separate the **Rules Engine** module's test suite from the LLM layer's — the calculator needs deterministic unit tests with fixed inputs/outputs (this is a regulatory/audit surface, not just a code-quality one).
- Role-based access control from day one (farmer/vendor/DIC-official/admin roles) — DIC officials will need read access to aggregate, anonymized data, not individual user financials.

---

## 9. Suggested "Best-in-Market, Don't-Overcomplicate" Toolset

| Need | Recommended tool | Why this and not the fancier alternative |
|---|---|---|
| Backend framework | FastAPI | See §3 |
| Frontend | Next.js | Skip a separate Node/Express BFF layer initially — Next.js API routes can proxy where needed |
| DB | Postgres + PostGIS | One database does relational + geospatial + (via pgvector) vector search — avoids running 3 different databases |
| Auth | Keycloak (self-hosted) or Cognito | Skip building your own auth/JWT system |
| Background jobs | Celery + Redis | Skip Kafka/RabbitMQ until you have genuine high-throughput event streaming needs (e.g., real-time supply-chain order matching at scale) |
| LLM orchestration | Direct Claude API calls + a thin custom RAG layer (pgvector + LangChain *only if* the retrieval logic gets complex) | Don't reach for a heavy agent framework for what is fundamentally "retrieve context → prompt → format output" |
| Document generation | `python-docx` / `WeasyPrint` (HTML→PDF) for DPRs | Skip a paid DPR-generation SaaS — your templates are well-defined and static |
| Monitoring | Sentry + Grafana Cloud (free tier) | Skip a full Datadog/New Relic contract until team/infra size justifies the cost |
| Infra | Terraform + AWS ECS Fargate | Skip Kubernetes until you have more than a handful of services genuinely needing independent scaling |

---

## 10. Phased Rollout

1. **MVP (single state pilot):** KYN feasibility engine + Financial Calculator/Scheme Router + basic multilingual chat (text-first, Bhashini text NMT only) + License checklist. Modular monolith, single Postgres instance, no Celery yet (synchronous is fine at low volume).
2. **Phase 2:** Voice (Bhashini ASR/TTS full pipeline), Cash Flow + Inventory modules, DPR auto-generation, Account Aggregator integration for loans.
3. **Phase 3 (national scale):** Supply Chain via ONDC, Farmers/Vendors directory with geospatial search at scale, extract high-load modules (LLM/RAG layer, Supply Chain matching) into independently-scaled services, introduce OpenSearch if directory search volume demands it.

---

*This document assumes the feature list maps directly onto the two modules described in the uploaded research (Feasibility Engine, Financial Calculator/Scheme Router), with Cash Flow, Inventory, License, Farmers/Vendors, Supply Chain, and Loan treated as adjacent operational modules built on the same platform.*
