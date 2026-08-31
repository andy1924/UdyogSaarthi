/**
 * Sarkaar Ledger — Design Tokens
 * Single source of truth for all color, typography, radius, and shadow values.
 * No hex outside this file.
 */
export const tokens = {
  color: {
    ink: "#0F2A44",
    vermilion: "#C73D2E",
    wheat: "#E8C36A",
    paper: "#FFFCF6",
    ledger: "#E6E8EC",
    muted: "#6B7280",
    success: "#0F6B4A",
    warn: "#9A6A00",
  },
  font: {
    serif: "var(--font-tiro)",
    sans: "var(--font-inter)",
    mono: "var(--font-fragment)",
  },
  radius: {
    card: "14px",
    pill: "999px",
  },
  shadow: {
    slip: "0 6px 24px rgba(15,42,68,0.08)",
  },
} as const;

export type Tokens = typeof tokens;
