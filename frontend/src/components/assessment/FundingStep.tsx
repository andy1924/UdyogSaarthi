import { ArrowRight, ChevronDown } from 'lucide-react';
import { Text } from '../../lib/LanguageContext';
import type { FundingPreference } from '../../lib/api';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState, 'stepAnimClass' | 'schemeResult' | 'licenses' | 'marginPercent' | 'fundingPreference' | 'setFundingPreference' | 'goToStep' | 'advanceToStep'>;
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('en-IN', { style: 'percent', maximumFractionDigits: 2 });

const FUNDING_OPTIONS: Array<{ value: FundingPreference; label: string; description: string }> = [
  { value: 'scheme_linked_loan', label: 'Scheme-linked bank loan', description: 'Use the scheme estimate shown below when speaking with a bank.' },
  { value: 'standard_bank_loan', label: 'Standard bank loan', description: 'Record your preference for a regular business-loan discussion.' },
  { value: 'need_guidance', label: 'I need funding guidance', description: 'Keep the scheme estimate and flag that you want help choosing an option.' },
];

export default function FundingStep({ stepAnimClass, schemeResult, licenses, marginPercent, fundingPreference, setFundingPreference, goToStep, advanceToStep }: Props) {
  const figures = schemeResult ? [
    ['Project budget', rupees.format(schemeResult.tpc)],
    ['Loan amount', rupees.format(schemeResult.max_loan_capped)],
    ['Quarterly repayment', rupees.format(schemeResult.eqi_amount)],
  ] : [];

  return (
    <section className={`space-y-6 ${stepAnimClass}`} aria-labelledby="funding-title">
      <div>
        <h2 id="funding-title" className="font-headline-md text-headline-md font-bold text-primary"><Text>Plan your funding</Text></h2>
        <p className="mt-2 text-on-surface-variant"><Text>Understand your contribution and repayments before taking the next step.</Text></p>
      </div>

      <section aria-labelledby="contribution-title" className="rounded-2xl border-2 border-primary/20 bg-secondary-container/40 p-5 sm:p-6">
        <h3 id="contribution-title" className="text-lg font-bold text-primary"><Text>Your contribution</Text></h3>
        {schemeResult ? <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-3">
          <div><span className="block text-sm text-on-surface-variant"><Text>Contribution percentage</Text></span><strong className="mt-1 block font-mono text-2xl text-primary">{marginPercent}%</strong></div>
          <div><span className="block text-sm text-on-surface-variant"><Text>Contribution amount</Text></span><strong className="mt-1 block font-mono text-2xl text-primary">{rupees.format(schemeResult.margin)}</strong></div>
        </div> : <p className="mt-3 text-base leading-7 text-on-surface-variant"><Text>Your contribution will be shown once eligibility details are available.</Text></p>}
      </section>

      <section aria-labelledby="funding-choice-title" className="rounded-2xl border border-outline-variant bg-white p-5 sm:p-6">
        <label id="funding-choice-title" htmlFor="funding-preference" className="text-base font-bold text-primary"><Text>How would you like to fund the business?</Text></label>
        <p className="mt-1 text-sm leading-6 text-on-surface-variant"><Text>Choose one option. Your selection is saved in the project report.</Text></p>
        <div className="relative mt-4">
          <select id="funding-preference" value={fundingPreference} onChange={(event) => setFundingPreference(event.target.value as FundingPreference)} className="w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3.5 pr-12 text-base font-semibold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="" disabled>Select a funding option</option>
            {FUNDING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <ChevronDown size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary" aria-hidden="true" />
        </div>
        {fundingPreference && <p role="status" className="mt-3 rounded-xl bg-surface-container-low p-3 text-sm leading-6 text-on-surface-variant">{FUNDING_OPTIONS.find((option) => option.value === fundingPreference)?.description}</p>}
      </section>

      {schemeResult ? (
        <>
          <dl className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
            {figures.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                <dt className="text-sm leading-relaxed text-on-surface-variant"><Text>{label}</Text></dt>
                <dd className="mt-2 break-words font-mono text-2xl font-semibold tabular-nums text-primary">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="rounded-xl bg-white p-4 text-sm text-on-surface-variant border border-outline-variant">
            {percent.format(schemeResult.rules.rate)} annual interest · {schemeResult.rules.tenure_years} years · {schemeResult.rules.moratorium_months}-month grace period.
            <span className="mt-2 block font-mono text-xs">Scheme rules {schemeResult.rules.version}</span>
            <span className="mt-2 block"><Text>These figures are an estimate, not a loan approval.</Text></span>
          </p>
          <details className="rounded-xl border border-outline-variant p-4">
            <summary className="cursor-pointer min-h-11 font-semibold"><Text>Repayment schedule</Text></summary>
            <div className="overflow-x-auto" role="region" aria-label="Quarterly repayments" tabIndex={0}>
              <table className="w-full text-sm text-left">
                <caption className="sr-only">Server-calculated quarterly repayments</caption>
                <thead><tr><th scope="col" className="py-3 pr-4">Quarter</th><th scope="col" className="py-3">Payment</th></tr></thead>
                <tbody>{schemeResult.eqi_schedule.map((row) => (
                  <tr key={row.quarter} className="border-t border-outline-variant"><th scope="row" className="py-3 pr-4 font-normal">{row.due_label || row.quarter}</th><td className="py-3 font-mono">{rupees.format(row.emi)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </details>
        </>
      ) : <p role="status" className="rounded-xl bg-surface-container p-5"><Text>Funding figures are not available yet. Return to your business idea to check your contribution and try again.</Text></p>}

      <details className="rounded-xl border border-outline-variant p-4">
        <summary className="cursor-pointer min-h-11 font-semibold"><Text>Registrations to check</Text></summary>
        {licenses.length ? <ul className="divide-y divide-outline-variant">
          {licenses.map((license) => <li key={license.id} className="py-3">
            <p className="font-semibold">{license.label}{license.required ? ' · Required' : ''}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{license.desc}</p>
          </li>)}
        </ul> : <p className="text-sm text-on-surface-variant"><Text>No registration guidance has loaded for this business yet.</Text></p>}
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5">
        <button type="button" onClick={() => goToStep(3)} className="rounded-full border border-secondary px-5 py-3 text-secondary"><Text>Back to local demand</Text></button>
        <button type="button" onClick={() => advanceToStep(5)} disabled={!schemeResult || !fundingPreference} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-on-primary"><Text>Next: Applicant details</Text> <ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
  );
}
