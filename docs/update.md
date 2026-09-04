# UdyogSaarthi Project Update

**Status:** Backend + frontend MVP, live-wired
**Last updated:** 2026-09-05 (commit `ab84159` + dashboard-shell plan `7b31264`)

UdyogSaarthi helps rural micro-entrepreneurs assess a business idea, calculate
scheme-linked finance, understand compliance, and produce a Detailed Project
Report (DPR). Both halves exist and are wired together: a FastAPI backend and
a Next.js PWA frontend talking to the live API. What is *planned, not active*:
React Native app, IVR/SMS fallback, vernacular voice layer.

## What exists

### Backend (`backend/`) — FastAPI + PostGIS + Redis + Celery

- Interactive OpenAPI at `/docs` and `/redoc` (non-production). `/health`
  reports PostgreSQL and Redis independently (`ok` / `degraded`).
- Auth: applicant self-registration (`POST /auth/register`, bcrypt),
  OAuth2 form login (`POST /auth/token` → JWT bearer), `GET /auth/me`.
  Roles: `applicant`, `dic_officer`, `sca_auditor`.
- Public (no auth): `GET /api/scheme/rules`, `POST /api/scheme/calculate`,
  `GET /api/compliance/licenses` (RAG-powered), `GET /api/directory/nearby`,
  `/health`. Scheme math is deterministic — zero LLM.
- Authenticated: `POST /api/feasibility/score`, `POST /api/dpr/render`,
  `GET /api/dpr/{id}`, `GET /api/dpr/{id}/download`,
  `POST /api/dpr/{id}/transition`, `GET /api/dpr/{id}/history`.
- Staff-only: `/api/audit/*` (hash-chained audit ledger).
- DPR PDFs render via Celery worker (`backend/app/templates/dpr_report.html`,
  NSFDC government template). No list-DPR endpoint — clients keep a registry,
  server is truth.
- Docker Compose (`infra/docker-compose.yml`): PostGIS, Redis, API, worker.
  Alembic migrations for persistence.

### Frontend (`frontend/`) — Next.js PWA, wired to live API

- Pages: `/` (applicant wizard: Locate → Feasibility → Finance →
  Compliance → DPR), `/officer` (DIC/SCA review), `/audit` (staff audit),
  `/dpr/[id]` (render + polling + download), `/offline` (fallback).
- All API traffic goes through `SaarthiApi` (`src/lib/api-client.ts`,
  base in `lib/api-base.ts`: `http://localhost:8000`). Contract covered by
  `api-contract.test.ts`. Offline queue in `src/lib/offline-queue.ts`
  (IndexedDB, resumable), installable via `manifest.json`.
- Theme: **pine/emerald** per `docs/frontend/DESIGN.md`. Never compute
  finance client-side; render server values + `Scheme rules v2024-11` footnote.
- Has its own agent guide: `frontend/AGENTS.md` (+ generated `CLAUDE.md`).

### Approved next step (not yet built)

`docs/plans/dashboard-shell-plan.md` (sign-off 2026-09-05): full app shell
with sidebar + topbar. Email login stays; **phone+OTP deferred**; landing
hero retires (redirects into shell).

## Known limitations (prototype)

- Live LGD resolution + Mappls reverse geocoding are integrated; feasibility
  returns `502` when authoritative location/POI data is unreachable.
- AI/KYC/compliance fallbacks are not authoritative; DPR persistence is
  best-effort; PDF output requires a running Celery worker; DPR ownership
  checks not yet enforced.
- Security overlay in `docs/cybersecurity.md` (L1–L6) is a target — Required
  controls must be evidenced before production data.
