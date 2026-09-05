# Graph Report - sih  (2026-09-05)

## Corpus Check
- 120 files · ~60,747 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 777 nodes · 1198 edges · 67 communities (52 shown, 15 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ab841592`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api-client.ts
- app/page.tsx
- WizardForm.tsx
- _rag_pipeline
- routers/dpr.py
- geo_service.py
- AuditLog
- compilerOptions
- _CacheService
- package.json
- AuditMiddleware
- routers/scheme.py
- workflow.py
- pdf_tasks.py
- UdyogSaarthi Handoff
- routers/auth.py
- NSFDC Government DPR Template
- routers/audit.py
- UserRegisterIn
- User
- manifest.json
- offline-queue.ts
- [id]/page.tsx
- api-contract.test.ts
- env.py
- PRODUCT.md product truth
- geo_tasks.py
- Settings
- Deterministic Scheme Engine zero LLM
- compilerOptions
- Trade Licence Baseline
- DPR render workflow and audit endpoints
- Udyam Registration Baseline
- Hyper-local feasibility engine with LGD OSM
- Ink vermilion wheat paper token palette
- Geospatial Feasibility Scoring
- UdyogSaarthi Platform
- E-Waste Management Compliance
- celery_app.py
- saarthi-design-system.md agent build guide
- Offline local-first PWA with IndexedDB queue
- Primary rural micro-entrepreneur user
- Docker Compose PostGIS Redis FastAPI Celery stack
- next.config.js
- next-env.d.ts
- cybersecurity.md security overlay policy
- Sarkaar Ledger Human Saarthi world
- Live specimens with copy snippets
- DIC and SCA field officer reviewer
- QUICKSTART.md developer quickstart
- udyogsaarthi
- SWOTAnalysis
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `User` - 29 edges
2. `compilerOptions` - 17 edges
3. `AuditLog` - 15 edges
4. `SaarthiApi` - 14 edges
5. `UdyogSaarthi Handoff` - 14 edges
6. `log_audit_action()` - 13 edges
7. `Base` - 13 edges
8. `ApiError` - 12 edges
9. `DPRRecord` - 11 edges
10. `render()` - 11 edges

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
- **Design system evolution from ledger to pine** — docs_design_sarkaar_ledger, docs_frontend_design_pine_emerald, docs_frontend_saarthi_design_system_component_catalog [EXTRACTED 0.85]
- **Locate to Feasibility to Finance to DPR flow** — docs_product_dpr_artifact, docs_systemdesign_kyn_feasibility, docs_systemdesign_deterministic_scheme_engine, docs_apidocs_dpr_workflow [EXTRACTED 0.95]
- **Applicant feasibility to DPR flow** — docs_handoff_wizardform_flow, docs_handoff_dpr_render_polling, docs_handoff_backend_fastapi, docs_handoff_frontend_nextjs_pwa [EXTRACTED 1.00]
- **Settled design and implementation decisions** — docs_handoff_design_system_pine_emerald, docs_handoff_api_base_config, docs_handoff_english_only_ui, docs_handoff_zero_client_finance_math, docs_handoff_hook_ids_contract, docs_handoff_jwt_auth_storage [EXTRACTED 1.00]
- **Production PostGIS Redis API topology** — infra_docker_compose_postgis_db, infra_docker_compose_redis, infra_docker_compose_api, infra_docker_compose_worker [EXTRACTED 1.00]
- **Deterministic math trust chain** — docs_product_deterministic_calculator, docs_product_scheme_tiers, docs_systemdesign_deterministic_scheme_engine, docs_apidocs_scheme_api [INFERRED 0.85]
- **DPR generation template and worker stack** — readme_dpr_generation_pipeline, backend_app_templates_dpr_report_government_dpr_template, backend_app_templates_dpr_report_old_legacy_dpr_template, backend_requirements_dpr_pdf_stack, infra_docker_compose_worker [INFERRED 0.85]
- **Universal micro-enterprise licensing baseline** — backend_app_services_rag_knowledge_base_licenses_udyam_registration, backend_app_services_rag_knowledge_base_licenses_trade_licence, backend_app_services_rag_knowledge_base_licenses_gst_registration, backend_app_services_rag_knowledge_dairy_fssai_registration, backend_app_services_rag_knowledge_food_fssai_licence [INFERRED 0.85]

## Communities (67 total, 15 thin omitted)

### Community 0 - "api-client.ts"
Cohesion: 0.07
Nodes (41): AuditPage(), clampPageSize(), snapshotText(), metadata, viewport, AuthCard(), errorMessage(), passwordError() (+33 more)

### Community 1 - "app/page.tsx"
Cohesion: 0.06
Nodes (50): Home(), swotOpportunity(), ComplianceList(), ComplianceListProps, Status, LABELS, LangSwitcher(), LangSwitcherProps (+42 more)

### Community 2 - "WizardForm.tsx"
Cohesion: 0.07
Nodes (34): BizValue, BusinessGrid(), BusinessGridProps, OPTIONS, DprDialog(), DprDialogProps, errorMessage(), Phase (+26 more)

### Community 3 - "_rag_pipeline"
Cohesion: 0.08
Nodes (31): licenses(), get, Compliance router — RAG-powered license checklist. Replaces the static…, Return a compliance and licensing checklist for the given business type. When…, ComplianceOut, LicenseItem, BaseModel, _build_fallback() (+23 more)

### Community 4 - "routers/dpr.py"
Cohesion: 0.13
Nodes (18): download_dpr(), get_dpr(), AsyncSession, get, post, Request, DPR (Detailed Project Report) router — Stage 3 (PDF + DB persistence).…, Return DPR metadata from PostgreSQL. Requires authentication. (+10 more)

### Community 5 - "geo_service.py"
Cohesion: 0.10
Nodes (25): post, _resolve_lgd_for_input(), score(), build_overpass_ql(), compute_density_score(), compute_verdict(), GeoUnavailableError, get_poi_count_and_query() (+17 more)

### Community 6 - "AuditLog"
Cohesion: 0.17
Nodes (12): AuditLog, Immutable compliance ledger for security and governance events. DB-level…, BusinessProfile, Canonical business directory record for spatial peer discovery., DPRRecord, SQLAlchemy ORM model for persisted DPR (Detailed Project Report) records., Persisted DPR record with full payload, PDF path, and workflow state., UserRole (+4 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx, lib (+19 more)

### Community 8 - "_CacheService"
Cohesion: 0.09
Nodes (13): healthcheck(), get, Probes the DB and Redis connections. Returns 'ok' or 'degraded'., _CacheService, Any, Async Redis cache service. Provides a thin, namespaced wrapper over…, Gracefully close the Redis connection pool., Lazy-connecting async Redis client with namespaced JSON helpers. (+5 more)

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (25): dependencies, next, react, react-dom, devDependencies, @types/node, @types/react, @types/react-dom (+17 more)

### Community 10 - "AuditMiddleware"
Cohesion: 0.14
Nodes (15): async_sessionmaker, AuditMiddleware, _extract_user_id_from_request(), Any, AsyncSession, Request, UUID, AuditMiddleware — automatic immutable logging for all mutating API requests.… (+7 more)

### Community 11 - "routers/scheme.py"
Cohesion: 0.12
Nodes (25): capped_loan(), compute_tpc(), generate_eqi_schedule(), max_loan_raw(), Equal quarterly instalments after moratorium quarters. Returns list of dicts., route_scheme(), working_capital_buffer(), calculate() (+17 more)

### Community 12 - "workflow.py"
Cohesion: 0.10
Nodes (25): get_dpr_history(), AsyncSession, BaseModel, get, post, Request, DPR workflow transition router. Exposes two endpoints: POST…, Return the immutable workflow event history for a DPR. All authenticated roles… (+17 more)

### Community 13 - "pdf_tasks.py"
Cohesion: 0.15
Nodes (15): generate_dpr_pdf(), Async-safe PDF rendering service for DPR documents. Uses Jinja2 for HTML…, Render a DPR HTML template to a PDF file. This is a **blocking** call; use…, Generate a DPR PDF asynchronously. Parameters ---------- dpr_id: Unique…, _render_pdf_sync(), _BaseTask, generate_dpr_pdf_task(), _get_sync_engine() (+7 more)

### Community 14 - "UdyogSaarthi Handoff"
Cohesion: 0.20
Nodes (15): API base default localhost 8080 with localStorage override, Backend FastAPI app, Pine emerald design system, DPR async render polling flow, English-only UI with disabled language switcher, Frontend Next.js PWA shell, GPS graceful degradation by design, UdyogSaarthi Handoff (+7 more)

### Community 15 - "routers/auth.py"
Cohesion: 0.13
Nodes (24): get_db(), AsyncSession, create_access_token(), get_current_user(), get_password_hash(), log_audit_action(), Any, AsyncSession (+16 more)

### Community 16 - "NSFDC Government DPR Template"
Cohesion: 0.14
Nodes (14): NSFDC Government DPR Template, Legacy DPR Template, DPR PDF Generation Stack, FastAPI Application Stack, PostGIS Database Stack, Docker Build Job, Lint and Test Job, CI Postgres PostGIS Service (+6 more)

### Community 17 - "routers/audit.py"
Cohesion: 0.27
Nodes (10): audit_logs_for_dpr(), audit_logs_for_user(), list_audit_logs(), AsyncSession, get, UUID, Read-only audit log router. Provides paginated access to the immutable audit…, Return paginated audit events for a specific user UUID. (+2 more)

### Community 18 - "UserRegisterIn"
Cohesion: 0.22
Nodes (9): BaseModel, Pydantic schemas for authentication and user management., Safe public representation of a User — never exposes hashed_password., OAuth2-compatible token response., Payload for POST /auth/register., TokenResponse, UserOut, UserRegisterIn (+1 more)

### Community 19 - "User"
Cohesion: 0.25
Nodes (5): Dependency callable that enforces RBAC on a route. Usage::…, RequireRole, Application user for authentication and RBAC., User, Feasibility router with strict live geospatial validation.

### Community 20 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, lang, name, short_name, start_url (+1 more)

### Community 21 - "offline-queue.ts"
Cohesion: 0.38
Nodes (8): OfflineBar(), dbSupported(), openDb(), queueCount(), QueuedForm, queueFlush(), queuePush(), run()

### Community 22 - "[id]/page.tsx"
Cohesion: 0.08
Nodes (38): btnGhost, btnPrimary, DprDetailPage(), errorCopy(), isDownloadable(), Phase, recordStatus(), recordText() (+30 more)

### Community 23 - "api-contract.test.ts"
Cohesion: 0.08
Nodes (35): ApiBaseField(), API_BASE_KEY, DEFAULT_API_BASE, getApiBase(), NOTE: Agent 1 owns layout/shell/tokens.css — this file did not exist, readStored(), setApiBase(), assert() (+27 more)

### Community 24 - "env.py"
Cohesion: 0.20
Nodes (12): nearby(), AsyncSession, get, DirectoryOut, NearbyProfile, BaseModel, do_run_migrations(), include_object() (+4 more)

### Community 25 - "PRODUCT.md product truth"
Cohesion: 0.29
Nodes (8): apiDocs.md backend API guide, DESIGN.md Sarkaar Ledger design system, frontend DESIGN.md responsive rebuild, frontend_spec.md frontend requirements, PRODUCT.md product truth, research.md macro-economic research, systemDesign.md target architecture, update.md backend prototype status

### Community 26 - "geo_tasks.py"
Cohesion: 0.33
Nodes (6): task, Geo cache warm-up background task. Runs in the ``default`` queue. Called after…, Persist a Mappls reverse-geocode result to Redis. Parameters ---------- lat,…, Persist a resolved LGD record to Redis. Parameters ---------- state, district,…, warm_lgd_cache_task(), warm_revgeo_cache_task()

### Community 27 - "Settings"
Cohesion: 0.33
Nodes (4): model_validator, Refuse to start in production if SECRET_KEY is still the insecure default., Settings, BaseSettings

### Community 28 - "Deterministic Scheme Engine zero LLM"
Cohesion: 0.33
Nodes (6): Scheme rules and calculate endpoints, Deterministic scheme calculator versioned rules, Micro Finance and Term Loan tiers, NPA reduction via viable selection rationale, Deterministic Scheme Engine zero LLM, Rewrite not extension scope reversal rationale

### Community 29 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, incremental, jsx, module, moduleResolution, noEmit, outDir, types (+5 more)

### Community 30 - "Trade Licence Baseline"
Cohesion: 0.40
Nodes (5): GST Registration Threshold Rule, Trade Licence Baseline, Milk Chilling Plant NOC, Electronics BIS Certification, Retail Shop and Establishment Licence

### Community 31 - "DPR render workflow and audit endpoints"
Cohesion: 0.40
Nodes (5): DPR render workflow and audit endpoints, Hash-chained audit ledger with WORM export, Zero trust defense in depth rationale, DPR highest-value artifact, Shield before compass principle

### Community 32 - "Udyam Registration Baseline"
Cohesion: 0.67
Nodes (4): Udyam Registration Baseline, Dairy FSSAI Registration, Food FSSAI Licence Tiers, PM FME Scheme for Food Units

### Community 33 - "Hyper-local feasibility engine with LGD OSM"
Cohesion: 0.50
Nodes (4): Feasibility score endpoint, LGD-block-pooled RAG with OSM Overpass, Hyper-local feasibility engine with LGD OSM, KYN Feasibility Engine

### Community 34 - "Ink vermilion wheat paper token palette"
Cohesion: 0.50
Nodes (4): Receipt slip layout grammar, Ink vermilion wheat paper token palette, Pine emerald mist palette rejecting ledger, C00 to C20 component catalog with hooks

### Community 40 - "Geospatial Feasibility Scoring"
Cohesion: 0.67
Nodes (3): Mappls Location Integration Key, Overpass POI Data Source, Geospatial Feasibility Scoring

### Community 41 - "UdyogSaarthi Platform"
Cohesion: 0.67
Nodes (3): OpenAI DPR Narrative Integration, Deterministic Scheme Engine Principle, UdyogSaarthi Platform

### Community 64 - "SWOTAnalysis"
Cohesion: 0.33
Nodes (6): BaseModel, Async AI narrative service — SWOT synthesis via OpenAI Structured Outputs. Uses…, Schema passed to OpenAI ``response_format`` for structured output., Deterministic SWOT when AI is unavailable., _static_fallback(), SWOTAnalysis

## Ambiguous Edges - Review These
- `DPR render workflow and audit endpoints` → `Hash-chained audit ledger with WORM export`  [AMBIGUOUS]
  docs/cybersecurity.md · relation: conceptually_related_to

## Knowledge Gaps
- **164 isolated node(s):** `udyogsaarthi`, `nextConfig`, `name`, `version`, `private` (+159 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `DPR render workflow and audit endpoints` and `Hash-chained audit ledger with WORM export`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `User` connect `User` to `routers/dpr.py`, `geo_service.py`, `AuditLog`, `workflow.py`, `routers/auth.py`, `routers/audit.py`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `AuditLog` connect `AuditLog` to `routers/audit.py`, `AuditMiddleware`, `User`, `routers/auth.py`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `AuditMiddleware` connect `AuditMiddleware` to `_CacheService`, `AuditLog`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `User` (e.g. with `RequireRole` and `AuditLog`) actually correct?**
  _`User` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `AuditLog` (e.g. with `RequireRole` and `AuditMiddleware`) actually correct?**
  _`AuditLog` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udyogsaarthi`, `nextConfig`, `name` to the rest of the system?**
  _164 weakly-connected nodes found - possible documentation gaps or missing edges._