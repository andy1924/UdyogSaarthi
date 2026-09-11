## What

<!-- One change, one reason. Link issues with `Fixes #123`. -->

## Why

<!-- Applicant / officer / auditor impact, or the bug being fixed. -->

## How was this tested?

<!-- Commands run, e.g. `pytest -q`, `npm test`, `npm run typecheck`.Browser-verified steps for UI / voice / map changes. -->

## Checklist

- [ ] Tests added or updated for the changed code (`pytest` / `vitest`)
- [ ] Backend: `ruff check .` clean; migrations added if models changed (`alembic check`)
- [ ] Frontend: `npm run typecheck`, `npm test`, `npm run lint` clean
- [ ] No scheme math computed client-side (server values + `Scheme rules v2024-11` footnote)
- [ ] No secrets, keys, or personal data committed (frontend `.env` stays voice-only)
- [ ] Docs updated if behavior changed (`docs/update.md` where applicable)