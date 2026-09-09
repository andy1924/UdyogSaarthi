# Graph Report - sih  (2026-09-10)

## Corpus Check
- 127 files · ~87,076 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 900 nodes · 1277 edges · 88 communities (52 shown, 17 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e089ecf9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- FeasibilityCheck.tsx
- devDependencies
- Layer3BoundaryMiddleware
- _rag_pipeline
- verify_applicant
- routers/feasibility.py
- AuditLog
- tsconfig.json
- _CacheService
- package.json
- AuditMiddleware
- calculate
- workflow.py
- pdf_tasks.py
- routers/auth.py
- FakeRedis
- NSFDC Government DPR Template
- compilerOptions
- UserOut
- User
- compilerOptions
- compilerOptions
- Layer1RateLimitMiddleware
- main.py
- Layer2AuthMiddleware
- update.md backend prototype status
- geo_tasks.py
- ValueError
- Deterministic Scheme Engine zero LLM
- test_security_overlay.py
- Trade Licence Baseline
- DPR render workflow and audit endpoints
- Udyam Registration Baseline
- Feasibility score endpoint
- Ink vermilion wheat paper token palette
- Geospatial Feasibility Scoring
- UdyogSaarthi Platform
- E-Waste Management Compliance
- celery_app.py
- saarthi-design-system.md agent build guide
- Footer.tsx
- Primary rural micro-entrepreneur user
- Docker Compose PostGIS Redis FastAPI Celery stack
- layer3_validation.py
- UdyogSaarthi — Frontend Design Guide (v1)
- App.tsx
- cybersecurity.md security overlay policy
- Sarkaar Ledger Human Saarthi world
- Live specimens with copy snippets
- DIC and SCA field officer reviewer
- QUICKSTART.md developer quickstart
- Layer1HMACMiddleware
- udyogsaarthi
- generate_swot
- LanguageSelector.tsx
- RequireRole
- routers/dpr.py
- Dashboard App Shell — Parallel Implementation Plan
- nearby
- taste.md
- UdyogSaarthi — Agent Router
- HeroSection.tsx
- CorrelationIDMiddleware
- Cybersecurity Layer 1 and Layer 2 Test Suite
- FeasibilityCheck
- Navbar.tsx
- security.py
- README.md
- LGD-block-pooled RAG with OSM Overpass

## God Nodes (most connected - your core abstractions)
1. `User` - 28 edges
2. `compilerOptions` - 16 edges
3. `compilerOptions` - 16 edges
4. `compilerOptions` - 16 edges
5. `AuditLog` - 15 edges
6. `ApiService` - 15 edges
7. `log_audit_action()` - 14 edges
8. `DPRRecord` - 14 edges
9. `Layer1HMACMiddleware` - 12 edges
10. `calculate()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `CI Postgres PostGIS Service` --semantically_similar_to--> `PostGIS Database Service`  [INFERRED] [semantically similar]
  .github/workflows/ci.yml → infra/docker-compose.yml
- `Celery DPR Worker Service` --references--> `NSFDC Government DPR Template`  [INFERRED]
  infra/docker-compose.yml → backend/app/templates/dpr_report.html
- `PostGIS Database Stack` --conceptually_related_to--> `PostGIS Database Service`  [INFERRED]
  backend/requirements.txt → infra/docker-compose.yml
- `OpenAI DPR Narrative Integration` --conceptually_related_to--> `UdyogSaarthi Platform`  [INFERRED]
  backend/env.md → README.md
- `setup_layer1_security()` --uses--> `Layer1HMACMiddleware`  [INFERRED]
  backend/app/core/security/setup.py → backend/app/core/security/layer1_hmac.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Design system evolution from ledger to pine** — docs_design_sarkaar_ledger, docs_frontend_design_pine_emerald, docs_frontend_saarthi_design_system_component_catalog [EXTRACTED 0.85]
- **Locate to Feasibility to Finance to DPR flow** — docs_product_dpr_artifact, docs_systemdesign_kyn_feasibility, docs_systemdesign_deterministic_scheme_engine, docs_apidocs_dpr_workflow [EXTRACTED 0.95]
- **Production PostGIS Redis API topology** — infra_docker_compose_postgis_db, infra_docker_compose_redis, infra_docker_compose_api, infra_docker_compose_worker [EXTRACTED 1.00]
- **Deterministic math trust chain** — docs_product_deterministic_calculator, docs_product_scheme_tiers, docs_systemdesign_deterministic_scheme_engine, docs_apidocs_scheme_api [INFERRED 0.85]
- **DPR generation template and worker stack** — readme_dpr_generation_pipeline, backend_app_templates_dpr_report_government_dpr_template, backend_app_templates_dpr_report_old_legacy_dpr_template, backend_requirements_dpr_pdf_stack, infra_docker_compose_worker [INFERRED 0.85]
- **Universal micro-enterprise licensing baseline** — backend_app_services_rag_knowledge_base_licenses_udyam_registration, backend_app_services_rag_knowledge_base_licenses_trade_licence, backend_app_services_rag_knowledge_base_licenses_gst_registration, backend_app_services_rag_knowledge_dairy_fssai_registration, backend_app_services_rag_knowledge_food_fssai_licence [INFERRED 0.85]

## Communities (88 total, 17 thin omitted)

### Community 0 - "FeasibilityCheck.tsx"
Cohesion: 0.07
Nodes (23): ENTERPRISE_GROUPS, ENTERPRISE_OPTIONS, EnterpriseOption, FeasibilityCheckProps, ensureInitialized(), MAPPLS_KEY, mapplsClient, RealMap() (+15 more)

### Community 1 - "devDependencies"
Cohesion: 0.06
Nodes (33): autoprefixer, eslint, @eslint/js, eslint-plugin-import, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies (+25 more)

### Community 2 - "Layer3BoundaryMiddleware"
Cohesion: 0.11
Nodes (18): Layer3BoundaryMiddleware, public_endpoint(), Send, Deny-by-default path boundary for routes without an explicit policy., Mark an endpoint for use by a routing-aware boundary integration., Reject unknown paths while preserving existing route-level auth policies.…, configure_logging(), Request (+10 more)

### Community 3 - "_rag_pipeline"
Cohesion: 0.08
Nodes (31): licenses(), get, Compliance router — RAG-powered license checklist. Replaces the static…, Return a compliance and licensing checklist for the given business type. When…, ComplianceOut, LicenseItem, BaseModel, _build_fallback() (+23 more)

### Community 4 - "verify_applicant"
Cohesion: 0.33
Nodes (6): KYCResult, BaseModel, Async KYC verification service — DigiLocker Sandbox via API Setu. Fetches mock…, Normalised identity verification payload embedded in the DPR., Call the DigiLocker sandbox to retrieve mock user identity data. Returns a…, verify_applicant()

### Community 5 - "routers/feasibility.py"
Cohesion: 0.09
Nodes (38): get_forward_geocode(), get_reverse_geocode(), get, post, Feasibility router with strict live geospatial validation., Resolve (lat, lon) coordinates to administrative boundary., Resolve location string to coordinates and administrative boundary., _resolve_lgd_for_input() (+30 more)

### Community 6 - "AuditLog"
Cohesion: 0.09
Nodes (26): AuditLog, Immutable compliance ledger for security and governance events. DB-level…, BusinessProfile, Canonical business directory record for spatial peer discovery., SQLAlchemy ORM model for persisted DPR (Detailed Project Report) records., UserRole, audit_logs_for_dpr(), audit_logs_for_user() (+18 more)

### Community 8 - "_CacheService"
Cohesion: 0.16
Nodes (10): _CacheService, Any, Redis, Async Redis cache service. Provides a thin, namespaced wrapper over…, Gracefully close the Redis connection pool., Lazy-connecting async Redis client with namespaced JSON helpers., Build a namespaced, versioned cache key. Example: ``make_key("revgeo", "25.32",…, Retrieve a JSON-decoded value from Redis. Returns ``None`` on cache miss *or*… (+2 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (22): axios, dependencies, axios, lucide-react, mappls-web-maps, react, react-dom, name (+14 more)

### Community 10 - "AuditMiddleware"
Cohesion: 0.09
Nodes (19): async_sessionmaker, AuditMiddleware, _extract_user_id_from_request(), Any, AsyncSession, Request, UUID, AuditMiddleware — automatic immutable logging for all mutating API requests.… (+11 more)

### Community 11 - "calculate"
Cohesion: 0.22
Nodes (16): capped_loan(), compute_tpc(), generate_eqi_schedule(), max_loan_raw(), Equal quarterly instalments after moratorium quarters. Returns list of dicts., route_scheme(), working_capital_buffer(), calculate() (+8 more)

### Community 12 - "workflow.py"
Cohesion: 0.10
Nodes (25): get_dpr_history(), AsyncSession, BaseModel, get, post, Request, DPR workflow transition router. Exposes two endpoints: POST…, Return the immutable workflow event history for a DPR. All authenticated roles… (+17 more)

### Community 13 - "pdf_tasks.py"
Cohesion: 0.15
Nodes (15): generate_dpr_pdf(), Async-safe PDF rendering service for DPR documents. Uses Jinja2 for HTML…, Render a DPR HTML template to a PDF file. This is a **blocking** call; use…, Generate a DPR PDF asynchronously. Parameters ---------- dpr_id: Unique…, _render_pdf_sync(), _BaseTask, generate_dpr_pdf_task(), _get_sync_engine() (+7 more)

### Community 14 - "routers/auth.py"
Cohesion: 0.17
Nodes (20): get_db(), AsyncSession, Shared authentication utilities and perimeter security middleware., create_access_token(), get_current_user(), get_password_hash(), log_audit_action(), Any (+12 more)

### Community 15 - "FakeRedis"
Cohesion: 0.20
Nodes (7): asyncio, FakeRedis, make_token(), test_layer2_asgi_state_injection(), test_layer2_revoked_token_rejected(), test_layer4_sets_and_clears_transaction_local_rls_context(), timedelta

### Community 16 - "NSFDC Government DPR Template"
Cohesion: 0.14
Nodes (14): NSFDC Government DPR Template, Legacy DPR Template, DPR PDF Generation Stack, FastAPI Application Stack, PostGIS Database Stack, Docker Build Job, Lint and Test Job, CI Postgres PostGIS Service (+6 more)

### Community 17 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 18 - "UserOut"
Cohesion: 0.20
Nodes (11): me(), get, Return the profile of the currently authenticated user., BaseModel, Pydantic schemas for authentication and user management., Safe public representation of a User — never exposes hashed_password., OAuth2-compatible token response., Payload for POST /auth/register. (+3 more)

### Community 19 - "User"
Cohesion: 0.33
Nodes (4): Dependency callable that enforces RBAC on a route., RequireRole, Application user for authentication and RBAC., User

### Community 20 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 21 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 22 - "Layer1RateLimitMiddleware"
Cohesion: 0.13
Nodes (12): Layer1HeadersMiddleware, Send, Defensive response headers for the Layer 1 security overlay., Layer1RateLimitMiddleware, policy_for(), Redis, Send, Redis token-bucket rate limiting for perimeter-sensitive routes. (+4 more)

### Community 23 - "main.py"
Cohesion: 0.12
Nodes (16): FastAPI, Composition entry point for the Layer 2 identity overlay., Attach JWT validation and identity context injection to the app., setup_layer2_security(), healthcheck(), get, Probes the DB and Redis connections. Returns 'ok' or 'degraded'., test_dpr_render_requires_auth() (+8 more)

### Community 24 - "Layer2AuthMiddleware"
Cohesion: 0.16
Nodes (14): Layer2AuthMiddleware, Redis, Send, ASGI identity context injection and fail-closed JWT validation., decode_active_token(), is_token_revoked(), Layer2JWTError, Redis (+6 more)

### Community 25 - "update.md backend prototype status"
Cohesion: 0.33
Nodes (6): apiDocs.md backend API guide, DESIGN.md Sarkaar Ledger design system, frontend DESIGN.md responsive rebuild, PRODUCT.md product truth, systemDesign.md target architecture, update.md backend prototype status

### Community 26 - "geo_tasks.py"
Cohesion: 0.33
Nodes (6): task, Geo cache warm-up background task. Runs in the ``default`` queue. Called after…, Persist a Mappls reverse-geocode result to Redis. Parameters ---------- lat,…, Persist a resolved LGD record to Redis. Parameters ---------- state, district,…, warm_lgd_cache_task(), warm_revgeo_cache_task()

### Community 27 - "ValueError"
Cohesion: 0.06
Nodes (39): model_validator, Refuse to start in production if SECRET_KEY is still the insecure default., Settings, field_validator, Pydantic validator mixin for bounded, non-script text fields., SafeTextMixin, _b64decode(), _b64encode() (+31 more)

### Community 28 - "Deterministic Scheme Engine zero LLM"
Cohesion: 0.40
Nodes (5): Scheme rules and calculate endpoints, Deterministic scheme calculator versioned rules, Micro Finance and Term Loan tiers, Deterministic Scheme Engine zero LLM, Rewrite not extension scope reversal rationale

### Community 29 - "test_security_overlay.py"
Cohesion: 0.29
Nodes (17): collect_response(), _ok_response(), _ok_response_app(), run_asgi(), scope_for(), sign_request(), signed_headers(), test_business_route_math_is_unchanged_with_both_layers() (+9 more)

### Community 30 - "Trade Licence Baseline"
Cohesion: 0.40
Nodes (5): GST Registration Threshold Rule, Trade Licence Baseline, Milk Chilling Plant NOC, Electronics BIS Certification, Retail Shop and Establishment Licence

### Community 31 - "DPR render workflow and audit endpoints"
Cohesion: 0.40
Nodes (5): DPR render workflow and audit endpoints, Hash-chained audit ledger with WORM export, Zero trust defense in depth rationale, DPR highest-value artifact, Shield before compass principle

### Community 32 - "Udyam Registration Baseline"
Cohesion: 0.67
Nodes (4): Udyam Registration Baseline, Dairy FSSAI Registration, Food FSSAI Licence Tiers, PM FME Scheme for Food Units

### Community 34 - "Ink vermilion wheat paper token palette"
Cohesion: 0.50
Nodes (4): Receipt slip layout grammar, Ink vermilion wheat paper token palette, Pine emerald mist palette rejecting ledger, C00 to C20 component catalog with hooks

### Community 40 - "Geospatial Feasibility Scoring"
Cohesion: 0.67
Nodes (3): Mappls Location Integration Key, Overpass POI Data Source, Geospatial Feasibility Scoring

### Community 41 - "UdyogSaarthi Platform"
Cohesion: 0.67
Nodes (3): OpenAI DPR Narrative Integration, Deterministic Scheme Engine Principle, UdyogSaarthi Platform

### Community 45 - "Footer.tsx"
Cohesion: 0.15
Nodes (12): DOC_META, Footer(), LegalDoc, COOKIE_CONSENT_KEY, CookieNotice(), CookieNoticeProps, readConsent(), CookiePolicy() (+4 more)

### Community 48 - "layer3_validation.py"
Cohesion: 0.12
Nodes (16): bounded_float(), bounded_int(), BaseModel, Reusable strict validation and sanitization helpers for service boundaries., Base model for new boundary schemas that reject unknown fields., Reject script/event markup and enforce a strict text length bound., Validate an actual integer against inclusive bounds., Validate a finite numeric value against inclusive bounds. (+8 more)

### Community 49 - "UdyogSaarthi — Frontend Design Guide (v1)"
Cohesion: 0.12
Nodes (15): 1. Product Context (why this guide looks the way it does), 2. Target Users, 3. Design Principles, 4.1 Neutrals (base UI), 4.2 Brand accent, 4.3 Semantic (verdicts, states — the Zerodha-style P&L convention), 4.4 Typography, 4. Color System (+7 more)

### Community 50 - "App.tsx"
Cohesion: 0.16
Nodes (9): App(), ViewMode, HowItWorks(), StepCardProps, STEPS, OfficialBacking(), StatCardProps, STATS (+1 more)

### Community 62 - "Layer1HMACMiddleware"
Cohesion: 0.24
Nodes (7): Layer1HMACMiddleware, Redis, Send, Request signing and replay protection for mutating API requests., Validate HMAC signatures and atomically reserve request nonces., _response(), Receive

### Community 64 - "generate_swot"
Cohesion: 0.31
Nodes (8): generate_swot(), BaseModel, Async AI narrative service — SWOT synthesis via OpenAI Structured Outputs. Uses…, Generate a SWOT analysis via OpenAI Structured Outputs. Falls back to…, Schema passed to OpenAI ``response_format`` for structured output., Deterministic SWOT when AI is unavailable., _static_fallback(), SWOTAnalysis

### Community 65 - "LanguageSelector.tsx"
Cohesion: 0.27
Nodes (9): BUTTON_STYLES, LanguageSelector(), LanguageSelectorProps, readStoredLanguage(), shortTag(), BHASHINI_LANGUAGES, BhashiniLanguage, DEFAULT_LANGUAGE_CODE (+1 more)

### Community 66 - "RequireRole"
Cohesion: 0.22
Nodes (7): Request, UUID, Reusable role and DPR object-scope guards for Layer 2., FastAPI dependency that authorizes roles from the injected identity., Return whether an identity may access a loaded DPR object. Callers must load…, RequireRole, verify_dpr_ownership()

### Community 67 - "routers/dpr.py"
Cohesion: 0.18
Nodes (15): DPRRecord, Persisted DPR record with full payload, PDF path, and workflow state., download_dpr(), get_dpr(), AsyncSession, get, post, Request (+7 more)

### Community 68 - "Dashboard App Shell — Parallel Implementation Plan"
Cohesion: 0.22
Nodes (8): Contract (all tracks obey), Dashboard App Shell — Parallel Implementation Plan, File ownership, Out of scope, Routes, Verification per agent, Wave 0 — Shell foundation (1 agent, first, blocks all), Wave 1 — Sections (4 agents, parallel, blocked on B0)

### Community 69 - "nearby"
Cohesion: 0.39
Nodes (6): nearby(), AsyncSession, get, DirectoryOut, NearbyProfile, BaseModel

### Community 70 - "taste.md"
Cohesion: 0.29
Nodes (6): Architecture, Documentation, Style, Testing, Tooling, TypeScript

### Community 71 - "UdyogSaarthi — Agent Router"
Cohesion: 0.29
Nodes (6): Authority, Code pointers, Current state (2026-09-05), Routing table, Standing rules, UdyogSaarthi — Agent Router

### Community 72 - "HeroSection.tsx"
Cohesion: 0.33
Nodes (5): HeroSection(), HeroSectionProps, PhoneLoginModal(), PhoneLoginModalProps, Step

### Community 73 - "CorrelationIDMiddleware"
Cohesion: 0.40
Nodes (3): CorrelationIDMiddleware, Send, Attach a correlation ID to every HTTP request and response.

### Community 74 - "Cybersecurity Layer 1 and Layer 2 Test Suite"
Cohesion: 0.40
Nodes (4): Cybersecurity Layer 1 and Layer 2 Test Suite, Interpreting Failures, Overview, Run From VS Code Terminal

### Community 76 - "Navbar.tsx"
Cohesion: 0.50
Nodes (3): NAV_ITEMS, Navbar(), NavbarProps

## Ambiguous Edges - Review These
- `DPR render workflow and audit endpoints` → `Hash-chained audit ledger with WORM export`  [AMBIGUOUS]
  docs/cybersecurity.md · relation: conceptually_related_to

## Knowledge Gaps
- **188 isolated node(s):** `udyogsaarthi`, `name`, `private`, `version`, `type` (+183 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 450 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `DPR render workflow and audit endpoints` and `Hash-chained audit ledger with WORM export`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `User` connect `User` to `routers/dpr.py`, `routers/feasibility.py`, `AuditLog`, `workflow.py`, `routers/auth.py`, `UserOut`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `log_audit_action()` connect `routers/auth.py` to `routers/dpr.py`, `User`, `workflow.py`, `AuditLog`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `AuditMiddleware` connect `AuditMiddleware` to `AuditLog`, `main.py`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `User` (e.g. with `get_current_user()` and `log_audit_action()`) actually correct?**
  _`User` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udyogsaarthi`, `name`, `private` to the rest of the system?**
  _188 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `FeasibilityCheck.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06968641114982578 - nodes in this community are weakly interconnected._