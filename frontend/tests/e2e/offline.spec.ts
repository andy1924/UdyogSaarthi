import { test, expect } from "@playwright/test";

/**
 * PWA offline survival — feasibility wizard must survive offline reload
 * and show the offline fallback / queued state.
 *
 * Placeholder spec: valid TS even if @playwright/test is not installed in CI
 * (CI will skip e2e; keep as contract for local `npx playwright test`).
 */
test("feasibility survives offline", async ({ page, context }) => {
  // Ensure online first
  await context.setOffline(false);
  await page.goto("/app/feasibility");

  // Verify feasibility surface renders (pick a stable heading)
  await expect(page.getByRole("heading").first()).toBeVisible();

  // Go offline and reload — SW / Dexie queue should keep fallback visible
  await context.setOffline(true);
  await page.reload();

  // Offline fallback: either dedicated /offline page or inline offline cue
  // The offline page uses "You are offline — your work is queued"
  const offlineText = page.getByText(/offline/i);
  await expect(offlineText.first()).toBeVisible({ timeout: 10000 });

  // Restore
  await context.setOffline(false);
});

test("offline page shows Dexie queue count", async ({ page, context }) => {
  await context.setOffline(false);
  await page.goto("/offline");
  await expect(page.getByText(/You are offline/i)).toBeVisible();
  // Queue counts rendered via Dexie — total queued label
  await expect(page.getByText(/Total queued/i)).toBeVisible();
});
