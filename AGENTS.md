# UdyogSaarthi — Agent Router

> Read this file first. Find your task in the table, read **only** the listed
> doc(s). Conflicts resolve by § Authority (newer / more specific wins).

## Current state (2026-09-05)

Backend (FastAPI + PostGIS + Redis + Celery) **and** frontend (Next.js PWA:
applicant wizard, officer review, audit console, DPR view) exist and are
wired to the live API. Ground truth for scope: `docs/update.md`.
Approved next build: `docs/plans/dashboard-shell-plan.md` (app shell;
phone+OTP deferred). The apply-section voice assistant (on-device Whisper +
Kokoro/MMS-TTS, English + Hindi) is built; see
`docs/frontend/voice-assistant.md` for how it works and
`docs/frontend/voice-stack.md` for why the models were chosen.
Planned, not active: React Native, IVR/SMS,

## Routing table

| Task | Read | Notes |
|---|---|---|
| What exists right now | `docs/update.md` | Scope truth — check before believing any design doc |
| What the product is / who it's for | `docs/PRODUCT.md` | Users, mechanism, scheme tiers, scope |
| How the system fits together | `docs/systemDesign.md` | Target architecture; cross-check `update.md` for what's built |
| Run it locally (Docker, env, migrations) | `docs/QUICKSTART.md` + `backend/env.md` + `infra/docker-compose.yml` | PostGIS + Redis + API + worker |
| REST endpoints, auth, roles, shapes | `docs/apiDocs.md` (then live `/openapi.json`) | Base `http://localhost:8000`; never recompute finance client-side |
| Frontend flows + API wiring | `frontend/src/` | All traffic via `SaarthiApi` (`src/lib/api-client.ts`) |
| Frontend visual system (CURRENT) | `docs/frontend/DESIGN.md` | **Authoritative: pine/emerald.** Mobile-first 360→1440, no device frame |
| Frontend component inventory + tokens | `docs/frontend/saarthi-design-system.md` + `docs/frontend/saarthi-element-map.html` | Specimen map; `DESIGN.md` wins on any conflict |
| Original ledger visual system | `docs/DESIGN.md` | Sarkaar Ledger (ink/vermilion/wheat). **History only — do not use for new UI** |
| Voice assistant - mechanics, states, file map | `docs/frontend/voice-assistant.md` | Reference; EN+HI; frontend-only, never touches `backend/` |
| Voice assistant - model choices and measurements | `docs/frontend/voice-stack.md` | Design record: why Whisper small, Kokoro, MMS; latency numbers |
| Security requirements before prod data | `docs/cybersecurity.md` | Target overlay L1–L6; Required controls evidenced pre-launch |
| Dashboard shell build plan | `docs/plans/dashboard-shell-plan.md` | Approved 2026-09-05: shell + sidebar/topbar; landing retired |
| Codebase structure / context graph | `graft/INDEX.md` | Regenerate with `graft build` after code changes |

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
- Frontend: `frontend/src/` (Next.js) · contract test `api-contract.test.ts`
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
- Auto-delete throwaway artifacts you create — browser-audit screenshots and
  PNGs, PDF/image render scratch, temp logs, one-off scripts. Clear them before
  you finish, without asking. Never delete tracked assets (e.g.
  `frontend/src/assets/*.png`), user-provided files, or anything you did not
  create.

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
