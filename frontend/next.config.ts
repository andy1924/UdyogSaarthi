import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// PWA hardening — next-pwa (dest: public, offline fallback to /offline)
// Manifest is linked via metadata.manifest in layout.tsx; service worker
// registration is handled by next-pwa (register:true, skipWaiting:true).
// Disabled in dev to avoid cache noise; enabled in production.
// If next-pwa is incompatible with this Next version, remove withPWA wrapper
// and keep manual registration comment below:
//   // Manual SW registration fallback: if ('serviceWorker' in navigator) { ... }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWAInit = require("next-pwa") as unknown as { default?: (o: unknown) => (c: NextConfig) => NextConfig } & ((o: unknown) => (c: NextConfig) => NextConfig);
const withPWAFactory = (withPWAInit as unknown as { default?: unknown }).default ?? withPWAInit;
const withPWA = (withPWAFactory as unknown as (o: unknown) => (c: NextConfig) => NextConfig)({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
});

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  /* i18n handled via next-intl — locales: en, hi, ta, bn (default en) */
};

export default withPWA(withNextIntl(nextConfig));
