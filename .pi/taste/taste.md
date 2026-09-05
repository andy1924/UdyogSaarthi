# Architecture
- Scaffold Next.js 14 with App Router, TypeScript, Tailwind, src-dir and @/* import alias. Confidence: 0.40
- Centralize design tokens in tokens.ts/tokens.css as single source of truth — prohibit hardcoded hex outside tokens. Confidence: 0.40
- Load fonts via next/font and expose as CSS variables (Tiro Devanagari serif, Inter sans, Fragment Mono). Confidence: 0.40
- Responsive shell with bottom-fixed AppRail on mobile and 240px sidebar on desktop using Tailwind lg: breakpoints. Confidence: 0.40
- Use adapter interface + mock implementation for external services (BhashiniAdapter with mockBhashini). Confidence: 0.40
- Keep business logic as pure functions in shared lib modules with minimal forward-compatible stubs for future expansion. Confidence: 0.40
- Use deterministic pure math library with versioned rules for financial calculations - zero LLM arithmetic, centralized caps/rates/tenure/moratorium. Confidence: 0.40
- Use Dexie for client-side persistence with try/catch around put operations. Confidence: 0.40
- Keep compliance and directory modules thin and read-only with no transaction, issuance, or marketplace logic. Confidence: 0.40
- Use Next.js App Router route handlers at app/api/*/route.ts to stub backend contracts (POST /api/dpr/render returns {pdfUrl}) and client polling generating->ready. Confidence: 0.40
- implement PWA via next-pwa (dest public, register:true, skipWaiting:true, disable in dev, fallbacks.document to /offline) with manifest linked in layout and Dexie-backed offline queue page. Confidence: 0.40
- Build frontend with Next.js App Router + TypeScript as a PWA. Confidence: 0.40
- Never compute TPC/loan/EQI client-side; render server-provided values only. Confidence: 0.40
- API layer uses typed ApiError with distinguishable status codes, JWT via localStorage, form-encoded login, timeouts and GET-only retry with backoff. Confidence: 0.40
- Reuse existing shared contracts and only create/edit files within assigned scope. Confidence: 0.40
- Display server-provided values only, no client-side finance math. Confidence: 0.40
- Defer translations to future API integration — keep language selector as disabled coming-soon placeholder rather than hand-written dictionaries. Confidence: 0.40
- Render server-provided scores and finance values as-is with no client-side finance math. Confidence: 0.40
- Never compute finance client-side; render server values only. Confidence: 0.40
- Reuse existing auth/login UI for login nudges instead of duplicating login UI and preserve form values when auth-gated. Confidence: 0.40

# Style
- Build accessible UI primitives (Button/Card/Badge/Input/Slider) with Tailwind, design tokens, and 44px minimum touch targets. Confidence: 0.40
- Use design tokens via CSS variables for all colors, no ad-hoc hex values. Confidence: 0.40
- Use design tokens via CSS variables for all colors, prohibit ad-hoc hex values. Confidence: 0.40
- Do not modify established design-token definitions. Confidence: 0.40
- Build all UI via design tokens (CSS variables) with Tailwind and accessible sizing (44px touch targets). Confidence: 0.40
- Use CSS variable design tokens var(--color-*) for all colors and 44px minimum input height. Confidence: 0.40
- Use design tokens with Tailwind and 44px minimum touch targets for all UI. Confidence: 0.40
- Style with CSS variables from tokens.css only; do not invent new color hexes. Confidence: 0.40
- Use existing CSS var(--) tokens only, no new hardcoded hex colors. Confidence: 0.40
- Use existing CSS variables for colors with no new hex colors and no emoji — use inline SVG or text glyphs. Confidence: 0.40
- Use pine/emerald design tokens only with Plex Mono for numeric readouts, no hardcoded hex colors. Confidence: 0.40
- Use var(--…) design tokens only with pine/emerald palette. Confidence: 0.40
- Adhere strictly to project design tokens, radius, and typography. Confidence: 0.40
- Use pine/emerald design tokens only with 20px card radius, 44px targets, accent focus ring, and Sora/Inter/IBM Plex Mono typography. Confidence: 0.40

# Tooling
- Configure frontend as PWA with manifest.json. Confidence: 0.40
- Use Dexie for offline IndexedDB (SaarthiDB) persistence. Confidence: 0.40
- Use next-intl for i18n with locales en, hi, ta, bn. Confidence: 0.40
- Use framer-motion for UI animations (VoiceBar waves, progress). Confidence: 0.40
- Use Tailwind CSS with CSS variables and ensure responsive design from 360px mobile to 1440px desktop. Confidence: 0.40
- Persist client state to Dexie/IndexedDB with try/catch graceful degradation when DB unavailable. Confidence: 0.40
- Use framer-motion for UI animations and stamp transitions. Confidence: 0.40
- Use Dexie (IndexedDB) for offline queuing (e.g., dprRequests) with navigator.onLine check and mocked fallback response. Confidence: 0.40
- use npm with npm ci / npm install and verify with npm run build and npm run lint; build must pass (Next.js TypeScript check) after changes. Confidence: 0.40
- use GitHub Actions CI with separate frontend job using setup-node Node 20 cache npm ci -> build -> lint while keeping backend job intact. Confidence: 0.40
- uses uvicorn with --reload and WatchFiles for local backend dev, with full stack via Docker Compose for PostGIS and Redis when needed. Confidence: 0.40
- Verify frontend work with npx tsc --noEmit / npm run build passing and avoid adding unnecessary dependencies. Confidence: 0.40
- Reuse existing api-client/types/base contracts instead of rewriting them. Confidence: 0.40
- Verify with tsc --noEmit must exit 0. Confidence: 0.40
- Always use port 8080 for API base. Confidence: 0.40
- Verify frontend with tsc --noEmit from frontend/ passing. Confidence: 0.40
- Verify frontend changes with tsc --noEmit passing clean. Confidence: 0.40

# Documentation
- Maintain PRODUCT.md (with impeccable:product-schema comment, platform=web) and DESIGN.md at repo root documenting design system. Confidence: 0.40
- Follow project design system and API docs for UI and API contracts. Confidence: 0.40

# TypeScript
- Define explicit exported TypeScript interfaces for cross-engine payloads (DPRPayload with feasibility, finance, cashflow, verified flag). Confidence: 0.40
- Require tsc --noEmit passes in frontend. Confidence: 0.40
- Verify frontend changes with tsc --noEmit passing. Confidence: 0.40

# Testing
- prefers running backend in isolation without DB/Redis dependencies for quick API skeleton testing via degraded health mode. Confidence: 0.40
- Require npm run build to pass to verify frontend changes. Confidence: 0.40
- Verify changes with typecheck passing before production build passes, in that order. Confidence: 0.40
- Enforce design-system constraints via zero-match grep for forbidden tokens plus reasoning over states, languages, and viewports. Confidence: 0.40
- Verify frontend changes with tsc --noEmit passing. Confidence: 0.40
- Verify frontend hardening with tsc --noEmit plus static checks for 44px targets, aria-live/role alerts, and overflow-x safety without running dev server or build. Confidence: 0.40
