# UdyogSaarthi Project Update

**Status:** Backend-first prototype / MVP
**Last updated:** 2026-09-02

UdyogSaarthi is a FastAPI backend prototype for helping rural micro-entrepreneurs assess a business idea, calculate scheme-linked finance, understand compliance requirements, and produce a Detailed Project Report (DPR). The active repository contains backend services and infrastructure; the frontend and mobile directories are not active applications yet.

## Current Functionalities

### API and platform foundation

- FastAPI application with interactive OpenAPI documentation at `/docs` and `/redoc` in non-production environments.
- `/health` checks PostgreSQL and Redis independently and reports `ok` or `degraded` with each dependency status.
- CORS middleware and environment-based configuration.
- PostgreSQL persistence through SQLAlchemy async sessions and Alembic migrations.
- Docker Compose setup for PostGIS, Redis, the API, and a Celery worker.

### Authentication and access control

- Applicant self-registration with bcrypt password hashing.
- OAuth2 password login at `/auth/token` returning a JWT bearer token.
- Current-user profile at `/auth/me`.
- Roles: `applicant`, `dic_officer`, and `sca_auditor`.
- Staff-only access to audit log APIs.
- Authentication is required for feasibility, DPR, and workflow operations; scheme rules/calculation, compliance, and directory lookup are public.

### Scheme calculation

- Versioned deterministic scheme rules (`v2024-11`) for `micro` and `term` tiers.
- TPC, raw maximum loan, capped loan, working-capital buffer, and quarterly EQI schedule calculations.
- Scheme routing and caps are calculated on the backend so the frontend does not need to duplicate financial logic.

### Geospatial feasibility

- Accepts a location string or latitude/longitude together with a business category.
- Mappls reverse geocoding when coordinates are supplied.
- Live state, district, and block resolution through the Data.gov.in LGD service.
- Nearby POI count using Mappls when configured, with OSM Overpass fallback.
- Deterministic density score and verdict: `saturated`, `viable`, or `niche-gap`.
- SWOT-style findings, opportunity suggestions for saturated areas, and the generated Overpass query are returned for traceability.

### Compliance guidance

- Business-category license checklist for dairy, food, retail, electronics, and other categories.
- ChromaDB/OpenAI retrieval-augmented generation can add region-aware guidance using state and district.
- Static rules are used when the RAG or AI provider is unavailable.
- Responses expose `sources`, `ai_generated`, and `confidence` metadata.

### DPR generation and PDF output

- Creates a DPR record from feasibility, scheme, CAPEX/OPEX, applicant, and business information.
- Adds KYC result, SWOT analysis, compliance section references, verification status, and report section metadata.
- KYC uses DigiLocker/API Setu-compatible integration settings and falls back to a non-authoritative result when unavailable.
- SWOT uses OpenAI when configured and a deterministic fallback otherwise.
- PDF rendering uses Jinja2, WeasyPrint, and a Celery `pdf` queue.
- DPR records are persisted with owner, status, payload, verification status, and workflow state.
- PDF download is available after the worker writes the generated file.

### DPR workflow

- Workflow state is stored with the DPR and history is appended as JSON data.
- State path: `draft -> sca_review -> dic_approved -> bank_review -> finalized`.
- Rejection moves a DPR to terminal `rejected`; `force_reject` is available to `sca_auditor` from any state.
- Trigger permissions are role-based: applicants/DIC can submit, DIC approves and sends to bank, and SCA finalizes or rejects at bank review.
- Transition and history endpoints expose the current state, allowed triggers, and history entries.

### Audit trail

- Mutating `/api/*` requests are recorded by audit middleware, including unauthenticated requests where no user is available.
- Route-level audit events record registration, login, DPR generation/rendering, and workflow transitions.
- Staff can query paginated logs, logs for a DPR, or logs for a user.
- Audit log records are intended to be immutable; migrations add database protections against update/delete operations.

### Directory lookup

- Nearby business profiles are queried from the PostGIS `business_profiles` table.
- Supports coordinate, radius, and optional category filtering.
- Returns up to 20 nearest profiles and the SQL shape used for the spatial query.

## Active API Surface

| Area | Endpoints |
|---|---|
| System | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/token`, `GET /auth/me` |
| Scheme | `GET /api/scheme/rules`, `POST /api/scheme/calculate` |
| Feasibility | `POST /api/feasibility/score` |
| Compliance | `GET /api/compliance/licenses` |
| Directory | `GET /api/directory/nearby` |
| DPR | `POST /api/dpr/render`, `GET /api/dpr/{dpr_id}`, `GET /api/dpr/{dpr_id}/download` |
| Workflow | `POST /api/dpr/{dpr_id}/transition`, `GET /api/dpr/{dpr_id}/history` |
| Audit | `GET /api/audit/logs`, `GET /api/audit/logs/dpr/{dpr_id}`, `GET /api/audit/logs/user/{user_id}` |

See [apiDocs.md](apiDocs.md) for request and response examples.

## Prototype Limitations

- **No active UI:** `frontend/` and `mobile/` are placeholders; integration currently uses the API directly.
- **External service dependency:** Feasibility depends on live Mappls/LGD/POI providers and returns `502` when authoritative location or POI data cannot be resolved. Directory queries return `503` when PostGIS data is unavailable.
- **Fallbacks are not authoritative:** AI SWOT, KYC, and compliance RAG can fall back to deterministic/static results. These results should not be treated as official verification.
- **Async PDF dependency:** DPR rendering normally returns `queued`; a running Redis broker and Celery worker are required before download succeeds. A broker failure can leave the record without a generated PDF.
- **Best-effort persistence:** DPR creation logs database persistence failures and may still return a response, so clients should verify retrieval before treating a DPR as durable.
- **Authorization gap:** DPR retrieval, download, and history currently require authentication but do not verify that the caller owns the DPR.
- **Development hardening:** CORS is permissive, secrets and provider configuration require deployment hardening, and Swagger is disabled only when `APP_ENV=production`.
- **Limited verification:** The test suite is small and focuses mainly on health/auth behavior; full provider, worker, workflow, and PDF integration coverage is still pending.

## Key Implementation Areas

- `backend/app/main.py`: application, middleware, router registration, health check
- `backend/app/core/scheme.py`: deterministic finance rules and EQI calculation
- `backend/app/services/geo_service.py`: geocoding, LGD, POI providers, and caching
- `backend/app/services/rag/compliance_rag.py`: compliance retrieval and fallback
- `backend/app/services/dpr_ai_service.py`: SWOT generation and fallback
- `backend/app/services/kyc_service.py`: KYC integration and fallback
- `backend/app/services/pdf_service.py`: Jinja2/WeasyPrint PDF rendering
- `backend/app/routers/dpr.py`: DPR assembly and persistence
- `backend/app/routers/workflow.py`: DPR transitions and history
- `backend/app/middleware/audit_middleware.py`: request audit logging
- `infra/docker-compose.yml`: local/prototype service stack
