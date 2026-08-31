import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  /* i18n handled via next-intl — locales: en, hi, ta, bn (default en) */
};

export default withNextIntl(nextConfig);
