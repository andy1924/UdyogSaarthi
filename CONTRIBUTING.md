# Contributing to UdyogSaarthi

Thanks for picking this up. Small, focused pull requests beat big ones here:
one change, one reason, tests included.

## Ground rules (read before coding)

* **Scope truth first.** `docs/update.md` describes what exists; design docs
  describe intent. Check `update.md` before believing any design doc.
* **Never compute scheme math client-side.** Render server values with the
  `Scheme rules v2024-11` footnote. Anything that lets a client alter a
  computed figure is a bug.
* **Server is truth for DPRs.** There is no list-DPR endpoint; clients keep
  registries, the server keeps records.
* **Voice is frontend-only.** Nothing under `backend/` may become involved in
  speech recognition or synthesis (see `docs/frontend/voice-assistant.md`).
* **Map keys stay server-side.** The Mappls key lives in `backend/.env`
  (`MAPPLS_REST_KEY`); the frontend map renders keyless tiles and the frontend
  `.env` is voice-only.
* **No secrets in the repo.** Test fixtures only - never commit real
  credentials, Aadhaar numbers, or key material.
* Match the surrounding code style, touch only what the change needs, and run
  `graft build` after code changes so the context graph stays in sync.

## Setup

Fastest path is Docker (PostGIS + Redis + API + worker):

```bash
# see docs/QUICKSTART.md and backend/env.md for env + migrations
docker compose -f infra/docker-compose.yml up
```

Or run each side manually. Backend (Python 3.11+):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[dev]"
alembic upgrade head
```

Frontend (Node 22):

```bash
cd frontend
npm ci
```

## Checks (CI runs all of these)

Backend, from `backend/`:

```bash
ruff check .
alembic check        # no unapplied model changes
pytest -q
```

Frontend, from `frontend/`:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Write tests for the code you change. Pure logic modules carry unit tests
(`*.test.ts` next to the source); the microphone path is verified by hand in
a browser.

## Pull requests

* Fork, branch from `main`, open the PR against `main`.
* Fill in the PR template, including the checklist - CI must be green.
* Link any related issue (`Fixes #123`).
* One reviewer approval is enough for routine changes; security-sensitive
  changes (auth, audit, key handling) need a maintainer's explicit sign-off.

## Reporting problems

* Bugs and feature requests go through the issue templates.
* **Security issues are never public issues** - see [SECURITY.md](SECURITY.md).
* Questions about scope ("does X exist yet?") are usually answered by
  `docs/update.md` before they need an issue.