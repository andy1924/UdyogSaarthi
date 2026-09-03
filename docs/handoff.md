# UdyogSaarthi — Handoff (2026-09-04)

Applicant-side MVP is **built, typechecked, and building green**. This doc is the
single page a new session needs to continue the work.

## What exists

- `backend/` — FastAPI app (auth, feasibility, scheme, compliance, directory,
  DPR render/get/download, workflow transition/history). See `docs/apiDocs.md`.
- `frontend/` — Next.js 16 App Router + React 19 + TypeScript PWA shell.
  Routes: `/` (full flow), `/offline` (fallback), `/_not-found`.
  Flow on `/`: Header → hero → LangSwitcher → WizardForm (business → location →
  margin → Check) → sticky result column (ScoreRing → VerdictCard →
  FinanceCard → ComplianceList → PeersList) → DPR dialog → download.
- `docs/frontend/` — authoritative design system (pine/emerald). `DESIGN.md`,
  `frontend_spec.md` (older Sarkaar-Ledger spec — **superseded**, do not follow).
- `graphify-out/` — knowledge graph of the repo (graph.json + GRAPH_REPORT.md).

## Decisions that are settled (do not relitigate without asking)

1. **Design system = pine/emerald** (`docs/frontend/`). Ledger ink/vermilion/
   wheat/stamps are forbidden — `grep -rniE '#0F2A44|vermilion|#FFFCF6|wheat|stamp|perforat' frontend/src` must stay empty.
2. **API base default = `http://localhost:8080`** (`src/lib/api-base.ts`).
   A stored `localStorage` override (`saarthi-api-base`) wins over the default.
3. **English-only UI.** hi/ta/bn dicts were deleted; the switcher renders them
   disabled ("coming soon") until a translation API lands — then only
   `src/lib/i18n.ts` changes (`dicts` + `ENABLED_LANGS`).
4. **No tap counter.** `#progressLbl` removed; dots + bar remain.
5. **Zero client-side finance math.** TPC/loan/EQI are rendered from server
   values verbatim. m→km unit formatting is allowed; anything else is a bug.
6. **Hook IDs are a contract** (C01–C20 in `docs/frontend/saarthi-design-system.md`
   §3): `sizeBtn authChip apiDot stEmpty stLoad stErr stPop checkBtn dprBtn
   locInput gpsBtn locErr marginRange marginNum scoreArc scoreNo verdictChip
   verdict verdictSub tpcNo loanNo eqiNo progressFill apiBaseInput footNote …`.
   E2E/tests may depend on them — rename only with a grep + reason.
7. **JWT in `localStorage` (`saarthi-jwt`)**, login is form-encoded
   (`username=<email>&password=`), never JSON. Language in `saarthi-lang`.

## How to run / verify

```bash
# backend (serves the API the frontend expects on :8080)
cd backend && uvicorn app.main:app --port 8080

# frontend
cd frontend && npm run dev        # http://localhost:3000
npx tsc --noEmit                  # type gate
npm run build                     # Next production build (Turbopack)
```

First live end-to-end to attempt: register → feasibility → scheme → DPR PDF
against a local backend (has not been run connected yet).

## Known gotchas

- GPS (`Use GPS` button) needs HTTPS or localhost; otherwise it degrades to the
  text field with a permission note — by design.
- DPR render is async: dialog polls `dprGet` every 3 s, max 10 attempts, then
  surfaces unknown-id/timeout copy.
- `PeersList` hides itself on directory 503 (muted note only, verdict untouched).
- `VoiceDock` is a mock chip; `offline-queue.ts` stubs push/count/flush but
  nothing flushes yet (no service worker).

## Not built yet (backlog, roughly in value order)

1. Officer review UI (transition/history have typed fns in `workflow-client.ts`, no screens)
2. Audit log viewer (backend exposes it, no frontend)
3. DPR library / past-checks history (results are session-only)
4. Profile page ("Me" is a button, no account screen)
5. Translation API wiring (switcher stubs ready — see §3 above)
6. Real voice input (mock chip in place)
7. Service worker + queue flush (manifest exists, queue stubbed)

## Agent working notes

- `frontend/src` was built by 5 parallel subagents (Waves 1–2) with fenced file
  ownership; contracts that worked: `SaarthiApi` + `ApiError`, `WizardForm`
  (`onFeasibility`/`onRequestDpr`/render-prop), pure-display `FinanceCard{scheme}`.
- Polish pass moved all spacing into CSS (`tokens.css` rhythm system + component
  classes); do not reintroduce layout inline `style={{margin…}}`.
