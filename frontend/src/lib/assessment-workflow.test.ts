import { describe, expect, it } from 'vitest';
import { canGenerateDpr, clampRestoredStep, getAdvanceError, isStepAccessible, type WorkflowRequirements } from './assessment-workflow';

const validDocument = { fileName: 'document.pdf', fileSize: 1024, fileType: 'application/pdf', status: 'valid' as const };
const feasibility = { lgd: { state: 'Maharashtra', district: 'Pune', block: 'Haveli', gp: null, code: '1', lat: 18.5, lon: 73.8 }, business_category: 'food', poi_count: 1, density_score: 20, verdict: 'viable' as const, swot: { strength: '', weakness: '', opportunity: '', threat: '' }, opportunities: [] };
const scheme = { margin: 10000, tpc: 100000, max_loan_raw: 90000, max_loan_capped: 90000, tier: 'micro', rules: { tier: 'micro', cap: 140000, rate: 0.065, tenure_years: 3, moratorium_months: 3, effective_from: '2024-11-01', version: 'v2024-11' }, working_capital_buffer: 0, eqi_schedule: [], eqi_amount: 1000 };

const complete: WorkflowRequirements = { userCoords: { lat: 18.5, lon: 73.8 }, locationText: 'Pune, Maharashtra', selectedEnterprise: 'food', feasibilityResult: feasibility, schemeResult: scheme, applicantName: 'Asha Patil', panDocument: validDocument, aadhaarDocument: validDocument };

describe('strict assessment workflow', () => {
  it('locks future steps and clamps restored navigation', () => {
    expect(isStepAccessible(2, 1)).toBe(false);
    expect(isStepAccessible(3, 3)).toBe(true);
    expect(clampRestoredStep(6, 4)).toBe(4);
  });

  it('validates each mandatory stage before progression', () => {
    expect(getAdvanceError(2, { ...complete, userCoords: null })).toMatch(/location/i);
    expect(getAdvanceError(3, { ...complete, selectedEnterprise: '' })).toMatch(/business idea/i);
    expect(getAdvanceError(4, { ...complete, feasibilityResult: null })).toMatch(/demand/i);
    expect(getAdvanceError(5, { ...complete, schemeResult: null })).toMatch(/eligibility/i);
    expect(getAdvanceError(6, { ...complete, applicantName: '123' })).toMatch(/letters/i);
    expect(getAdvanceError(6, { ...complete, panDocument: null })).toMatch(/PAN/i);
    expect(getAdvanceError(6, complete)).toBeNull();
  });

  it('requires explicit review confirmation before DPR generation', () => {
    expect(canGenerateDpr(complete, 6, false)).toBe(false);
    expect(canGenerateDpr(complete, 6, true)).toBe(true);
  });
});
