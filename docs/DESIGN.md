# UdyogSaarthi — Design System

> **Implementation note (2026-09-02):** This is the planned frontend design system. The active repository does not currently contain the referenced frontend implementation; backend prototype status is tracked in [update.md](update.md).

## World: Sarkaar Ledger, Human Saarthi

**Thesis:** Government-grade trust (the ledger) fused with a human guide (the Saarthi) — not a bank, not a startup, a companion who holds the paper while you speak.

**Metaphor:** India Post ledger + Railway timetable + District Gazette. Every card is a receipt slip; every number lives in a mono box with a rule-version footnote. A vermilion/sindoor stamp marks rejection or trust — the physicality makes deterministic math feel un-fakeable.

**Rut avoided:** Generic fintech gradient / SaaS hero with floating dashboards. No wheat-field stock — warmth comes from *wheat-gold* (#E8C36A) and vermilion, not photography.

---

## Palette (tokens: `frontend/src/lib/design-tokens/tokens.ts`)

| Token | Hex | Role |
|-------|-----|------|
| `ink` | `#0F2A44` | Primary text, header, primary button bg, ledger ink |
| `vermilion` | `#C73D2E` | CTA accent, stamp, error, voice pulse, focus ring |
| `wheat` | `#E8C36A` | CTA text on ink, highlight, warmth counterweight |
| `paper` | `#FFFCF6` | Page background, card footer tint |
| `ledger` | `#E6E8EC` | Borders, carbon grid, disabled, perforation |
| `muted` | `#6B7280` | Secondary text, placeholder |
| `success` | `#0F6B4A` | Viable / AA-verified |
| `warn` | `#9A6A00` | Caution / saturated warning |

No hex outside `tokens.ts` / `tokens.css`. Tailwind consumes CSS vars `--color-*`.

---

## Typography

| Role | Face | Var | Usage |
|------|------|-----|-------|
| Serif (authority) | **Tiro Devanagari Hindi** 400 | `var(--font-tiro)` | Headings, wordmark, stamp, Devanagari body |
| Sans (data) | **Inter** 400/600 | `var(--font-inter)` | Body, labels, UI |
| Mono (numbers) | **Fragment Mono** 400 | `var(--font-fragment)` | EQI tables, TPC/margin figures, rule footnotes, LGD codes |

- Loaded via `next/font/google` in `frontend/src/app/layout.tsx` with `variable` exposure.
- Devanagari line-height ≥ 1.4 (1.6 via `:lang(hi)` in `globals.css`).
- Base body: `font-[var(--font-inter)]`, `bg-[var(--color-paper)]`, `text-[var(--color-ink)]`.

---

## Radii & Shadows

- `radius.card: 14px` — cards, inputs, textareas.
- `radius.pill: 999px` — buttons, badges, pills.
- `shadow.slip: 0 6px 24px rgba(15,42,68,0.08)` — receipt slip elevation.

Perforation: `border-top/bottom: 2px dashed var(--color-ledger)` via `.perforated-top` / `.perforated-bottom` on `Card`.

---

## Slip Grammar (Layout Language)

1. **Document > Card > Ledger-row** — scan by seal color, not icon count.
2. **Receipt slip:** `Card` is white, `14px` radius, `ledger` border, dashed perforation top/bottom, `slip` shadow. Header has `ledger` bottom border; footer is `paper/50` tint.
3. **Mono boxes:** Numbers (TPC, EQI, margin) sit in `ledger/50` mono pills with rule footnote: `Scheme rules v2024.11 · 6.5% MF`.
4. **Stamp:** Vermilion rejection or success badge uses `framer-motion` `scale` 200ms (respects `prefers-reduced-motion` → fade).
5. **Generous whitespace** between slips; grid collapses to single column on mobile, detail rules hide behind “i”.
6. **Voice transcript** appears as carbon-copy (muted mono, duplicate offset).

### Responsive

- **360px mobile:** single column, bottom rail wizard, slips stack.
- **768px tablet:** 2-col, slip stacks with sticky receipt.
- **1024px desktop:** sidebar + 8-col grid, receipt stays sticky.

### Accessibility

- 44px min tap (Button `min-h-[44px]`, Input `min-h-[44px]`, Slider wrapper `min-h-[44px]`).
- `aria-live="polite"` on Slider displayValue, Input errors have `role="alert"`.
- Focus ring: `var(--color-vermilion)`.
- Reduced-motion: transitions degrade to fade.

---

## Primitives (`frontend/src/components/ui/`)

| Component | Variants | Notes |
|-----------|----------|-------|
| `Button` | `primary` (ink/wheat), `vermillion` (vermilion/white), `ghost` (ledger border) — sizes `md`/`lg` all ≥44px | `rounded-[var(--radius-pill)]`, focus ring vermilion |
| `Card` | `perforated` (default true) + `CardHeader`/`CardBody`/`CardFooter` | Receipt slip; perforated dashed ledger |
| `Badge` | `default`/`success`/`warn`/`vermilion`/`ledger` | `ledger` variant is mono footnote style |
| `Input` / `Textarea` | `label`/`hint`/`error` | `14px` radius, ledger border, vermilion error, a11y labelled |
| `Slider` | `label`/`displayValue` (mono pill + `aria-live`) | Range with vermilion thumb, 44px hit target |

All primitives use only token vars + Tailwind — no ad-hoc hex.

---

## PWA

- `public/manifest.json`: `name "UdyogSaarthi"`, `short_name "Saarthi"`, `display "standalone"`, `background_color "#FFFCF6"` (paper), `theme_color "#0F2A44"` (ink) — uses token palette, no ad-hoc hex.
- `next-pwa` → `public` dest, `register:true`, `skipWaiting:true`, disabled in dev, document fallback `/offline`.
- `/offline` fallback page: "You are offline — your work is queued" with live Dexie `SaarthiDB` counts (feasibility/finance/DPR/directory) — local-first queue survives reload.
- `globals.css` has `@media (prefers-reduced-motion:reduce) { * { animation:none } }` for stamp/ledger pulse.

## File Map

- Tokens: `frontend/src/lib/design-tokens/tokens.ts` (source) + `tokens.css` (CSS vars)
- Globals: `frontend/src/app/globals.css` imports `tokens.css` + `@theme inline`
- Layout: `frontend/src/app/layout.tsx` loads Tiro/Inter/Fragment Mono, sets `lang="en"`, wraps `tokens.css`
- PWA: `public/manifest.json`, `src/app/offline/page.tsx`, `next.config.ts` (withPWA + withNextIntl)
