/**
 * DPR workflow client — typed wrappers over `SaarthiApi.dprTransition` /
 * `SaarthiApi.dprHistory` for the FUTURE officer UI.
 *
 * No UI lives here (out of scope per apiDocs workflow section + design-system
 * §11.5). Officer screens import `transitionDpr` / `fetchDprHistory` when built.
 */

import {
  SaarthiApi,
  type DprHistoryOut,
  type DprTransitionAction,
  type DprTransitionOut,
} from "./api-client";

export type { DprHistoryOut, DprTransitionAction, DprTransitionOut };

/** All known workflow actions (role-gated server-side; 403 on misuse). */
export const WORKFLOW_ACTIONS: DprTransitionAction[] = [
  "submit_for_review",
  "approve_sca",
  "reject",
  "send_to_bank",
  "finalize",
  "force_reject",
];

/**
 * Fire a workflow transition for a DPR.
 * Throws `ApiError` — 403 on wrong role/transition, 404 on unknown id.
 */
export function transitionDpr(
  dprId: string,
  action: DprTransitionAction,
  note?: string,
): Promise<DprTransitionOut> {
  return SaarthiApi.dprTransition(dprId, note ? { action, note } : { action });
}

/**
 * Fetch the current workflow state, allowed triggers and append-only history.
 * Throws `ApiError` — 404 on unknown id.
 */
export function fetchDprHistory(dprId: string): Promise<DprHistoryOut> {
  return SaarthiApi.dprHistory(dprId);
}
