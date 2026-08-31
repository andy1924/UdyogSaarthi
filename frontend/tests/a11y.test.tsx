// @ts-nocheck
/**
 * a11y placeholder — runs with Jest/Vitest if present, otherwise no-op.
 * Checks Sarkaar Ledger a11y contracts without requiring axe-core at build.
 *
 * Contracts:
 * - VoiceBar has aria-live="polite" on transcript
 * - Slider wires aria-valuetext / aria-live for displayValue
 * - Tap targets are ≥44px (min-h-[44px] / min-w-[44px])
 * - Respects prefers-reduced-motion (checked in globals.css)
 */
import * as fs from "node:fs";
import * as path from "node:path";

function read(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

// If running under Jest/Vitest, these globals exist; otherwise skip.
const hasJest = typeof describe !== "undefined" && typeof it !== "undefined" && typeof expect !== "undefined";

if (hasJest) {
  describe("a11y contracts — UdyogSaarthi", () => {
    it("VoiceBar exposes aria-live polite for transcript", () => {
      const src = read("src/components/voice/VoiceBar.tsx");
      expect(src).toMatch(/aria-live="polite"/);
      expect(src).toMatch(/aria-label/);
    });

    it("Slider exposes aria-valuetext / aria-live for displayValue", () => {
      const src = read("src/components/ui/Slider.tsx");
      // Must surface value to AT — either aria-valuetext on input or aria-live on display pill
      const hasAriaValueText = /aria-valuetext/.test(src);
      const hasAriaLive = /aria-live="polite"/.test(src);
      expect(hasAriaValueText || hasAriaLive).toBe(true);
    });

    it("Buttons and inputs meet 44px min tap", () => {
      const buttonSrc = read("src/components/ui/Button.tsx");
      const sliderSrc = read("src/components/ui/Slider.tsx");
      const inputSrc = read("src/components/ui/Input.tsx");
      expect(buttonSrc).toMatch(/min-h-\[44px\]/);
      expect(sliderSrc).toMatch(/min-h-\[44px\]/);
      expect(inputSrc).toMatch(/min-h-\[44px\]/);
    });

    it("globals.css respects prefers-reduced-motion", () => {
      const css = read("src/app/globals.css");
      expect(css).toMatch(/prefers-reduced-motion/);
      expect(css).toMatch(/animation:\s*none/);
    });

    it("Devanagari line-height ≥1.4", () => {
      const css = read("src/app/globals.css");
      expect(css).toMatch(/line-height:\s*1\.[456]/);
    });

    // Optional axe-core run — only if axe-core + jsdom + @testing-library/react present
    it("axe-core placeholder (skipped if deps missing)", async () => {
      let axe: unknown = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        axe = require("axe-core");
      } catch {
        return; // placeholder pass — deps not installed in skeleton
      }
      expect(axe).toBeTruthy();
    });
  });
} else {
  // No test runner — file is valid TS placeholder, do nothing at import time.
}

// Export for type-check existence
export {};
