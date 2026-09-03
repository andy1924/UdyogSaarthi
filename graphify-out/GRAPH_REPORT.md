# Graph Report - sih  (2026-09-04)

## Corpus Check
- 33 files · ~51,168 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 645 nodes · 933 edges · 64 communities (50 shown, 14 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Compliance RAG Pipeline
- Feasibility Geo Scoring
- DPR Generation SWOT KYC
- Data Models Migrations
- Cache App Health Tests
- Audit Middleware
- Scheme Math Engine
- DPR Workflow Transitions
- PDF Rendering Workers
- Auth Security Core
- Infra CI Docker Stack
- Audit Log Router
- Auth Schemas
- RBAC User Profile
- DPR State Machine
- Auth Login Register
- Directory Nearby Search
- Docs Corpus Index
- Geo Cache Tasks
- App Config Settings
- Scheme Engine Docs
- License Knowledge Base
- DPR Trust Security Docs
- Food Dairy Udyam Licenses
- Feasibility API Docs
- Design System Tokens
- Migration DPR Records
- Migration Business Profiles
- Migration Users Audit
- Migration Workflow State
- Migration Status Comment
- Geo Env Config
- Platform Principles Docs
- E-Waste Legal Metrology
- Celery App Worker
- Middleware Package Init
- Services Package Init
- RAG Package Init
- Workflow Package Init
- Worker Package Init
- Worker Tasks Init
- Cybersecurity Policy Doc
- Sarkaar Ledger World
- Element Map Specimens
- DIC Officer Role
- Cybersecurity Overlay Policy
- Superseded Ledger Spec
- Element Map Specimens
- Officer Reviewer Personas
- Developer Quickstart
- Project Metadata

## God Nodes (most connected - your core abstractions)
1. `User` - 29 edges
2. `compilerOptions` - 18 edges
3. `AuditLog` - 15 edges
4. `UdyogSaarthi Handoff` - 14 edges
5. `Base` - 13 edges
6. `log_audit_action()` - 13 edges
7. `DPRRecord` - 11 edges
8. `render()` - 11 edges
9. `login_for_access_token()` - 10 edges
10. `register()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `CI Postgres PostGIS Service` --semantically_similar_to--> `PostGIS Database Service`  [INFERRED] [semantically similar]
  .github/workflows/ci.yml → infra/docker-compose.yml
- `Celery DPR Worker Service` --references--> `NSFDC Government DPR Template`  [INFERRED]
  infra/docker-compose.yml → backend/app/templates/dpr_report.html
- `PostGIS Database Stack` --conceptually_related_to--> `PostGIS Database Service`  [INFERRED]
  backend/requirements.txt → infra/docker-compose.yml
- `OpenAI DPR Narrative Integration` --conceptually_related_to--> `UdyogSaarthi Platform`  [INFERRED]
  backend/env.md → README.md
- `RequireRole` --uses--> `AuditLog`  [INFERRED]
  backend/app/core/security.py → backend/app/models/audit.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Settled design and implementation decisions** — docs_handoff_design_system_pine_emerald, docs_handoff_api_base_config, docs_handoff_english_only_ui, docs_handoff_zero_client_finance_math, docs_handoff_hook_ids_contract, docs_handoff_jwt_auth_storage [EXTRACTED 1.00]
- **Applicant feasibility to DPR flow** — docs_handoff_wizardform_flow, docs_handoff_dpr_render_polling, docs_handoff_backend_fastapi, docs_handoff_frontend_nextjs_pwa [EXTRACTED 1.00]
- **Design system evolution from ledger to pine** — docs_design_sarkaar_ledger, docs_frontend_design_pine_emerald, docs_frontend_saarthi_design_system_component_catalog [EXTRACTED 0.85]
- **Locate to Feasibility to Finance to DPR flow** — docs_product_dpr_artifact, docs_systemdesign_kyn_feasibility, docs_systemdesign_deterministic_scheme_engine, docs_apidocs_dpr_workflow [EXTRACTED 0.95]
- **Production PostGIS Redis API topology** — infra_docker_compose_postgis_db, infra_docker_compose_redis, infra_docker_compose_api, infra_docker_compose_worker [EXTRACTED 1.00]
- **Deterministic math trust chain** — docs_product_deterministic_calculator, docs_product_scheme_tiers, docs_systemdesign_deterministic_scheme_engine, docs_apidocs_scheme_api [INFERRED 0.85]
- **DPR generation template and worker stack** — readme_dpr_generation_pipeline, backend_app_templates_dpr_report_government_dpr_template, backend_app_templates_dpr_report_old_legacy_dpr_template, backend_requirements_dpr_pdf_stack, infra_docker_compose_worker [INFERRED 0.85]
- **Universal micro-enterprise licensing baseline** — backend_app_services_rag_knowledge_base_licenses_udyam_registration, backend_app_services_rag_knowledge_base_licenses_trade_licence, backend_app_services_rag_knowledge_base_licenses_gst_registration, backend_app_services_rag_knowledge_dairy_fssai_registration, backend_app_services_rag_knowledge_food_fssai_licence [INFERRED 0.85]

## Communities (64 total, 14 thin omitted)

### Community 0 - "Compliance RAG Pipeline"
Cohesion: 0.05
Nodes (51): ApiBaseField(), AuthCard(), errorMessage(), passwordError(), ComplianceList(), ComplianceListProps, Status, PeersList() (+43 more)

### Community 1 - "Feasibility Geo Scoring"
Cohesion: 0.09
Nodes (29): Home(), swotOpportunity(), FinanceCard(), FinanceCardProps, fmtINR(), LABELS, LangSwitcher(), LangSwitcherProps (+21 more)

### Community 2 - "DPR Generation SWOT KYC"
Cohesion: 0.08
Nodes (31): BizValue, BusinessGrid(), BusinessGridProps, OPTIONS, DprDialog(), DprDialogProps, errorMessage(), Phase (+23 more)

### Community 3 - "Data Models Migrations"
Cohesion: 0.08
Nodes (31): licenses(), get, Compliance router — RAG-powered license checklist. Replaces the static…, Return a compliance and licensing checklist for the given business type. When…, ComplianceOut, LicenseItem, BaseModel, _build_fallback() (+23 more)

### Community 4 - "Cache App Health Tests"
Cohesion: 0.09
Nodes (29): download_dpr(), get_dpr(), AsyncSession, get, post, Request, DPR (Detailed Project Report) router — Stage 3 (PDF + DB persistence).…, Return DPR metadata from PostgreSQL. Requires authentication. (+21 more)

### Community 5 - "Audit Middleware"
Cohesion: 0.10
Nodes (28): post, Feasibility router with strict live geospatial validation., _resolve_lgd_for_input(), score(), FeasibilityIn, LGDCode, BaseModel, model_validator (+20 more)

### Community 6 - "Scheme Math Engine"
Cohesion: 0.13
Nodes (18): AuditLog, Immutable compliance ledger for security and governance events. DB-level…, BusinessProfile, Canonical business directory record for spatial peer discovery., DPRRecord, SQLAlchemy ORM model for persisted DPR (Detailed Project Report) records., Persisted DPR record with full payload, PDF path, and workflow state., UserRole (+10 more)

### Community 7 - "DPR Workflow Transitions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx (+20 more)

### Community 8 - "PDF Rendering Workers"
Cohesion: 0.09
Nodes (13): healthcheck(), get, Probes the DB and Redis connections. Returns 'ok' or 'degraded'., _CacheService, Any, Async Redis cache service. Provides a thin, namespaced wrapper over…, Gracefully close the Redis connection pool., Lazy-connecting async Redis client with namespaced JSON helpers. (+5 more)

### Community 9 - "Auth Security Core"
Cohesion: 0.09
Nodes (21): dependencies, next, react, react-dom, devDependencies, @types/react, @types/react-dom, typescript (+13 more)

### Community 10 - "Infra CI Docker Stack"
Cohesion: 0.14
Nodes (15): async_sessionmaker, AuditMiddleware, _extract_user_id_from_request(), Any, AsyncSession, Request, UUID, AuditMiddleware — automatic immutable logging for all mutating API requests.… (+7 more)

### Community 11 - "Audit Log Router"
Cohesion: 0.22
Nodes (15): capped_loan(), compute_tpc(), generate_eqi_schedule(), max_loan_raw(), Equal quarterly instalments after moratorium quarters. Returns list of dicts., route_scheme(), working_capital_buffer(), calculate() (+7 more)

### Community 12 - "Auth Schemas"
Cohesion: 0.15
Nodes (17): get_dpr_history(), AsyncSession, BaseModel, get, post, DPR workflow transition router. Exposes two endpoints: POST…, Return the immutable workflow event history for a DPR. All authenticated roles…, Advance the DPR workflow state machine. Access is controlled per-trigger by the… (+9 more)

### Community 13 - "RBAC User Profile"
Cohesion: 0.15
Nodes (15): generate_dpr_pdf(), Async-safe PDF rendering service for DPR documents. Uses Jinja2 for HTML…, Render a DPR HTML template to a PDF file. This is a **blocking** call; use…, Generate a DPR PDF asynchronously. Parameters ---------- dpr_id: Unique…, _render_pdf_sync(), _BaseTask, generate_dpr_pdf_task(), _get_sync_engine() (+7 more)

### Community 14 - "DPR State Machine"
Cohesion: 0.20
Nodes (15): API base default localhost 8080 with localStorage override, Backend FastAPI app, Pine emerald design system, DPR async render polling flow, English-only UI with disabled language switcher, Frontend Next.js PWA shell, GPS graceful degradation by design, UdyogSaarthi Handoff (+7 more)

### Community 15 - "Auth Login Register"
Cohesion: 0.22
Nodes (12): get_db(), AsyncSession, create_access_token(), get_current_user(), get_password_hash(), log_audit_action(), Any, AsyncSession (+4 more)

### Community 16 - "Directory Nearby Search"
Cohesion: 0.14
Nodes (14): NSFDC Government DPR Template, Legacy DPR Template, DPR PDF Generation Stack, FastAPI Application Stack, PostGIS Database Stack, Docker Build Job, Lint and Test Job, CI Postgres PostGIS Service (+6 more)

### Community 17 - "Docs Corpus Index"
Cohesion: 0.27
Nodes (10): audit_logs_for_dpr(), audit_logs_for_user(), list_audit_logs(), AsyncSession, get, UUID, Read-only audit log router. Provides paginated access to the immutable audit…, Return paginated audit events for a specific user UUID. (+2 more)

### Community 18 - "Geo Cache Tasks"
Cohesion: 0.22
Nodes (9): BaseModel, Pydantic schemas for authentication and user management., Safe public representation of a User — never exposes hashed_password., OAuth2-compatible token response., Payload for POST /auth/register., TokenResponse, UserOut, UserRegisterIn (+1 more)

### Community 19 - "App Config Settings"
Cohesion: 0.22
Nodes (7): Dependency callable that enforces RBAC on a route. Usage::…, RequireRole, Application user for authentication and RBAC., User, me(), get, Return the profile of the currently authenticated user.

### Community 20 - "Scheme Engine Docs"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, lang, name, short_name, start_url (+1 more)

### Community 21 - "License Knowledge Base"
Cohesion: 0.33
Nodes (8): OfflineBar(), dbSupported(), openDb(), queueCount(), QueuedForm, queueFlush(), queuePush(), run()

### Community 22 - "DPR Trust Security Docs"
Cohesion: 0.28
Nodes (7): apply_transition(), build_machine(), _DPRModel, DPR workflow state machine. States and allowed transitions: draft └─…, Internal stateful object used by the transitions machine., Create a transitions Machine seeded with *current_state*. Usage:: m =…, Execute the state machine and return the new state. Raises…

### Community 23 - "Food Dairy Udyam Licenses"
Cohesion: 0.32
Nodes (8): login_for_access_token(), AsyncSession, post, Request, Authenticate with email + password, receive a JWT access token., Create a new user account with role=applicant. Email must be unique. Password…, register(), OAuth2PasswordRequestForm

### Community 24 - "Feasibility API Docs"
Cohesion: 0.39
Nodes (6): nearby(), AsyncSession, get, DirectoryOut, NearbyProfile, BaseModel

### Community 25 - "Design System Tokens"
Cohesion: 0.29
Nodes (8): apiDocs.md backend API guide, DESIGN.md Sarkaar Ledger design system, frontend DESIGN.md responsive rebuild, frontend_spec.md frontend requirements, PRODUCT.md product truth, research.md macro-economic research, systemDesign.md target architecture, update.md backend prototype status

### Community 26 - "Migration DPR Records"
Cohesion: 0.33
Nodes (6): task, Geo cache warm-up background task. Runs in the ``default`` queue. Called after…, Persist a Mappls reverse-geocode result to Redis. Parameters ---------- lat,…, Persist a resolved LGD record to Redis. Parameters ---------- state, district,…, warm_lgd_cache_task(), warm_revgeo_cache_task()

### Community 27 - "Migration Business Profiles"
Cohesion: 0.33
Nodes (4): model_validator, Refuse to start in production if SECRET_KEY is still the insecure default., Settings, BaseSettings

### Community 28 - "Migration Users Audit"
Cohesion: 0.33
Nodes (6): Scheme rules and calculate endpoints, Deterministic scheme calculator versioned rules, Micro Finance and Term Loan tiers, NPA reduction via viable selection rationale, Deterministic Scheme Engine zero LLM, Rewrite not extension scope reversal rationale

### Community 29 - "Migration Workflow State"
Cohesion: 0.40
Nodes (3): metadata, viewport, Header()

### Community 30 - "Migration Status Comment"
Cohesion: 0.40
Nodes (5): GST Registration Threshold Rule, Trade Licence Baseline, Milk Chilling Plant NOC, Electronics BIS Certification, Retail Shop and Establishment Licence

### Community 31 - "Geo Env Config"
Cohesion: 0.40
Nodes (5): DPR render workflow and audit endpoints, Hash-chained audit ledger with WORM export, Zero trust defense in depth rationale, DPR highest-value artifact, Shield before compass principle

### Community 32 - "Platform Principles Docs"
Cohesion: 0.67
Nodes (4): Udyam Registration Baseline, Dairy FSSAI Registration, Food FSSAI Licence Tiers, PM FME Scheme for Food Units

### Community 33 - "E-Waste Legal Metrology"
Cohesion: 0.50
Nodes (4): Feasibility score endpoint, LGD-block-pooled RAG with OSM Overpass, Hyper-local feasibility engine with LGD OSM, KYN Feasibility Engine

### Community 34 - "Celery App Worker"
Cohesion: 0.50
Nodes (4): Receipt slip layout grammar, Ink vermilion wheat paper token palette, Pine emerald mist palette rejecting ledger, C00 to C20 component catalog with hooks

### Community 40 - "Middleware Package Init"
Cohesion: 0.67
Nodes (3): Mappls Location Integration Key, Overpass POI Data Source, Geospatial Feasibility Scoring

### Community 41 - "Services Package Init"
Cohesion: 0.67
Nodes (3): OpenAI DPR Narrative Integration, Deterministic Scheme Engine Principle, UdyogSaarthi Platform

## Ambiguous Edges - Review These
- `DPR render workflow and audit endpoints` → `Hash-chained audit ledger with WORM export`  [AMBIGUOUS]
  docs/cybersecurity.md · relation: conceptually_related_to

## Knowledge Gaps
- **134 isolated node(s):** `udyogsaarthi`, `Legacy DPR Template`, `DPR PDF Generation Stack`, `FastAPI Application Stack`, `PostGIS Database Stack` (+129 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `DPR render workflow and audit endpoints` and `Hash-chained audit ledger with WORM export`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `User` connect `App Config Settings` to `Cache App Health Tests`, `Audit Middleware`, `Scheme Math Engine`, `Auth Schemas`, `Auth Login Register`, `Docs Corpus Index`, `Food Dairy Udyam Licenses`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `AuditLog` connect `Scheme Math Engine` to `Docs Corpus Index`, `Infra CI Docker Stack`, `App Config Settings`, `Auth Login Register`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `AuditMiddleware` connect `Infra CI Docker Stack` to `PDF Rendering Workers`, `Scheme Math Engine`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `User` (e.g. with `RequireRole` and `AuditLog`) actually correct?**
  _`User` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `AuditLog` (e.g. with `RequireRole` and `AuditMiddleware`) actually correct?**
  _`AuditLog` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `Base` (e.g. with `AuditLog` and `BusinessProfile`) actually correct?**
  _`Base` has 5 INFERRED edges - model-reasoned connections that need verification._