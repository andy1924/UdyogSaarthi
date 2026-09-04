# UdyogSaarthi — Agent Router

> Read this file first. Find your task in the table, read **only** the listed
> doc(s). Conflicts resolve by § Authority (newer / more specific wins).

## Current state (2026-09-05)

Backend (FastAPI + PostGIS + Redis + Celery) **and** frontend (Next.js PWA:
applicant wizard, officer review, audit console, DPR view) exist and are
wired to the live API. Ground truth for scope: `docs/update.md`.
Approved next build: `docs/plans/dashboard-shell-plan.md` (app shell;
phone+OTP deferred). Planned, not active: React Native, IVR/SMS, voice layer.

## Routing table

| Task | Read | Notes |
|---|---|---|
| What exists right now | `docs/update.md` | Scope truth — check before believing any design doc |
| What the product is / who it's for | `docs/PRODUCT.md` | Users, mechanism, scheme tiers, scope |
| How the system fits together | `docs/systemDesign.md` | Target architecture; cross-check `update.md` for what's built |
| Run it locally (Docker, env, migrations) | `docs/QUICKSTART.md` + `backend/env.md` + `infra/docker-compose.yml` | PostGIS + Redis + API + worker |
| REST endpoints, auth, roles, shapes | `docs/apiDocs.md` (then live `/openapi.json`) | Base `http://localhost:8000`; never recompute finance client-side |
| Frontend flows + API wiring | `frontend/AGENTS.md` + `frontend/src/` | All traffic via `SaarthiApi` (`src/lib/api-client.ts`) |
| Frontend visual system (CURRENT) | `docs/frontend/DESIGN.md` | **Authoritative: pine/emerald.** Mobile-first 360→1440, no device frame |
| Frontend component inventory + tokens | `docs/frontend/saarthi-design-system.md` + `docs/frontend/saarthi-element-map.html` | Specimen map; `DESIGN.md` wins on any conflict |
| Original ledger visual system | `docs/DESIGN.md` | Sarkaar Ledger (ink/vermilion/wheat). **History only — do not use for new UI** |
| Security requirements before prod data | `docs/cybersecurity.md` | Target overlay L1–L6; Required controls evidenced pre-launch |
| Dashboard shell build plan | `docs/plans/dashboard-shell-plan.md` | Approved 2026-09-05: shell + sidebar/topbar; landing retired |
| Codebase structure / concept graph | `graphify-out/GRAPH_REPORT.md` | Regenerate with `graphify update .` after code changes |

## Authority

1. `docs/update.md` — what exists (beats design docs on scope).
2. `docs/apiDocs.md` + `/openapi.json` — endpoint truth (beats prose).
3. `docs/frontend/DESIGN.md` — visual truth. Rejects `docs/DESIGN.md`
   (Sarkaar Ledger) and any vermilion/stamp/perforation reference — stop and
   confirm if a task points there.
4. `docs/systemDesign.md` / `docs/PRODUCT.md` — intent and background, not
   implementation proof.
5. `docs/plans/*` — approved but scoped; check sign-off dates.

## Code pointers

- Backend: `backend/app/` (routers, services, schemas, models, worker) ·
  tests `backend/tests/` · env template `backend/env.md`
- Frontend: `frontend/src/` (Next.js; own `frontend/AGENTS.md` applies once
  routed there) · contract test `api-contract.test.ts`
- Infra: `infra/docker-compose.yml`

## Standing rules

- Never do LLM arithmetic for scheme math. Render server values +
  `Scheme rules v2024-11` footnote.
- Auth: OAuth2 form-encoded `POST /auth/token`, JWT bearer. Roles:
  `applicant`, `dic_officer`, `sca_auditor`. Audit APIs staff-only.
- No list-DPR endpoint (render / get-by-id / download only). Client lists are
  registries (`saarthi-my-dprs` in localStorage); server is truth.
- Public (no auth): scheme rules/calculate, compliance licenses, directory
  nearby, `/health`. Feasibility, DPR, workflow need auth.
