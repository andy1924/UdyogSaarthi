import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !(locales as readonly string[]).includes(locale)) {
    locale = defaultLocale;
  }
  // Placeholder messages — real messages live in ./messages/<locale>.json
  let messages: Record<string, unknown> = {};
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch {
    messages = {};
  }
  return {
    locale,
    messages,
  };
});
