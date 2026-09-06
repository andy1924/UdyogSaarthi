/**
 * Frontend test runner — runs every `src/lib/*.test.ts` suite sequentially.
 *
 * Suites are dependency-free (no framework): each exports a `run*Tests()`
 * function that throws on failure. This runner awaits them in order and
 * exits non-zero on the first failure so CI fails loudly.
 *
 * Executed from compiled output by `npm test`
 * (`tsc -p tsconfig.test.json && node .test-out/src/lib/run-tests.js`).
 * Not imported by app code — no side effects on import.
 */

import { runApiBaseTests } from "./api-base.test";
import { runContractTests } from "./api-contract.test";
import { runTransportTests } from "./api-transport.test";
import { runI18nTests } from "./i18n.test";
import { runWorkflowTests } from "./workflow-client.test";

async function main(): Promise<void> {
  await runApiBaseTests();
  await runI18nTests();
  await runWorkflowTests();
  await runTransportTests();
  await runContractTests();
  console.log("frontend: all suites passed");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
