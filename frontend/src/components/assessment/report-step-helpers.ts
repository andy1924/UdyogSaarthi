import type { AssessmentState } from './useAssessment';

export type DprStatus = AssessmentState['dprStatus'];

export function isDprReady(status: DprStatus): boolean {
  return status === 'ready';
}

export function getDprStatusLabel(status: DprStatus): string {
  if (status === 'queued') return 'Converting PDF';
  if (status === 'ready') return 'PDF ready';
  if (status === 'error') return 'PDF export failed';
  return 'Ready to export';
}
