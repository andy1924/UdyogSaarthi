# Dashboard App Shell — Parallel Implementation Plan

**Approved scope (user sign-off 2026-09-05):** full app shell, sidebar + topbar.
Email login stays. **Phone+OTP explicitly deferred** — no OTP UI, no OTP endpoints.
Landing hero retires (redirects into shell).

## Contract (all tracks obey)

- API only via `SaarthiApi` (`frontend/src/lib/api-client.ts`); base `http://localhost:8000`
  (`lib/api-base.ts`, frozen unless Wave 0-style alignment needed).
- Auth: OAuth2 form-encoded `POST /auth/token`, JWT `saarthi-jwt`, 15s timeout,
  GET retry 2s/4s ×3, POST never retries. 401 → login nudge (keep values),
  422 → inline field error, 502 → retry row, 503 → degrade section.
- Never compute finance client-side; render server values + `Scheme rules v2024-11`.
- Design tokens: pine/emerald only, `var(--radius)` cards, 44px targets, accent focus
  ring, Sora / Inter / IBM Plex Mono. Responsive 360→1440, no horizontal scroll.
- No list-DPR endpoint exists (render / get-by-id / download only) → **My Applications
  uses a client registry** (`saarthi-my-dprs` in localStorage: id, business name,
  created-at), hydrated live via `dprGet`. Registry is an index; server is truth.
  Swap one function when a list endpoint lands.

## Routes

| Route | Content |
|---|---|
| `/` | Redirects to `/overview` (landing hero retired) |
| `/overview` | Status cards (account, API health, scheme version) + next-step nudge |
| `/apply` | Existing wizard → result cards (moved, internals untouched) |
| `/applications` | Registry list → per-row live status via `dprGet`, download + deep link |
| `/applications/[id]` | Existing `app/dpr/[id]` view, re-homed |
| `/schemes` | `SchemeRulesCard` full-page |
| `/review` | Existing officer workflow UI (role-gated) |
| `/audit` | Existing audit UI (role-gated) |
| `/account` | AuthCard, API base override, sign out |

## Wave 0 — Shell foundation (1 agent, first, blocks all)

- **B0 Shell + nav:** `components/Shell.tsx` (sidebar ≥720px, bottom bar <720px,
  topbar with health dot, LangSwitcher, auth chip), route group wiring,
  `/` → `/overview` redirect, auth gate (locked sections login-first via existing
  nudge copy, no duplicate login UI), role-gated Review/Audit nav.
- Verify: `tsc` clean, shell renders at 360/390/960/1440 with no overflow.

## Wave 1 — Sections (4 agents, parallel, blocked on B0)

- **B1 Overview + Schemes:** `/overview` cards (me, health, scheme version via
  `schemeRules`), `/schemes` full-page rules. Own: new overview components only.
- **B2 Apply move:** relocate wizard + result column under `/apply` and `DprDialog`
  with it. Own: `app/apply/*`, `app/page.tsx` redirect. Component internals frozen.
- **B3 Applications:** registry lib (`lib/my-dprs.ts`: push on render success,
  list/clear) + `/applications` list + re-home `/applications/[id]`.
  Own: new files + dpr route move. Hook render-success from `DprDialog` via
  callback prop (minimal edit) or page-level wrapper.
- **B4 Account + polish:** `/account` (AuthCard, ApiBaseField, sign out),
  role-gating copy pass, a11y sweep (aria-live, focus, 44px), responsive check.

## File ownership

```
B0: components/Shell.tsx (new), app/layout.tsx, app/page.tsx (redirect), middleware/guard (new)
B1: app/overview/*, app/schemes/* (new)
B2: app/apply/* (new), DprDialog callback prop (one-line, coordinated)
B3: lib/my-dprs.ts (new), app/applications/** (new + move)
B4: app/account/* (new), a11y/responsive pass (read-mostly)
Frozen: lib/api-client.ts, lib/api-base.ts, lib/workflow-client.ts,
        all result-card components (ScoreRing, VerdictCard, FinanceCard,
        ComplianceList, PeersList, SchemeRulesCard internals)
```

## Verification per agent

1. `node_modules/.bin/tsc --noEmit` clean.
2. `npm run build` clean (final agent).
3. Browser click-through vs live `:8000`: login → overview → apply E2E →
   DPR appears in `/applications` → download → officer review → audit.
4. 360px no-overflow, 44px targets, `aria-live` on async regions.

## Out of scope

Phone/OTP login, DPR list endpoint, LGD/MapPLS keys (tracked in issues #4–#6),
visual redesign beyond shell (tokens unchanged).
