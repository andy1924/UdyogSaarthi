import type { FeasibilityResult, SchemeCalculationResult } from './api';
import { validateApplicantName, type IdentityDocumentState } from './identity-documents';

export interface WorkflowRequirements {
  userCoords: { lat: number; lon: number } | null;
  locationText: string;
  selectedEnterprise: string;
  feasibilityResult: FeasibilityResult | null;
  schemeResult: SchemeCalculationResult | null;
  applicantName: string;
  panDocument: IdentityDocumentState | null;
  aadhaarDocument: IdentityDocumentState | null;
}

export function isStepAccessible(step: number, highestStepReached: number): boolean {
  return step >= 1 && step <= 6 && step <= highestStepReached;
}

export function clampRestoredStep(step: number, highestStepReached: number): number {
  return Math.min(6, Math.max(1, Math.min(step, highestStepReached)));
}

export function getAdvanceError(targetStep: number, state: WorkflowRequirements): string | null {
  if (targetStep === 2) {
    const point = state.userCoords;
    if (!point || !state.locationText.trim() || point.lat < 6 || point.lat > 38 || point.lon < 68 || point.lon > 98) return 'Choose and confirm a valid location in India.';
  }
  if (targetStep === 3 && !state.selectedEnterprise) return 'Choose a business idea before checking local demand.';
  if (targetStep === 4 && !state.feasibilityResult) return 'Complete the local demand check before planning funding.';
  if (targetStep === 5 && !state.schemeResult) return 'Funding eligibility must finish loading before you continue.';
  if (targetStep === 6) {
    const nameError = validateApplicantName(state.applicantName);
    if (nameError) return nameError;
    if (state.panDocument?.status !== 'valid') return 'Upload a valid PAN document before continuing.';
    if (state.aadhaarDocument?.status !== 'valid') return 'Upload a valid Aadhaar document before continuing.';
  }
  return null;
}

export function canGenerateDpr(state: WorkflowRequirements, highestStepReached: number, reviewConfirmed: boolean): boolean {
  return highestStepReached >= 6 && reviewConfirmed && !getAdvanceError(6, state) && Boolean(state.feasibilityResult && state.schemeResult);
}
