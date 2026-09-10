import { ArrowRight } from 'lucide-react';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState, 'stepAnimClass' | 'schemeResult' | 'licenses' | 'goToStep'>;
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('en-IN', { style: 'percent', maximumFractionDigits: 2 });

export default function FundingStep({ stepAnimClass, schemeResult, licenses, goToStep }: Props) {
  const figures = schemeResult ? [
    ['Project budget', rupees.format(schemeResult.tpc)],
    ['Your contribution', rupees.format(schemeResult.margin)],
    ['Loan amount', rupees.format(schemeResult.max_loan_capped)],
    ['Quarterly repayment', rupees.format(schemeResult.eqi_amount)],
  ] : [];

  return (
    <section className={`space-y-6 ${stepAnimClass}`} aria-labelledby="funding-title">
      <div>
        <h2 id="funding-title" className="font-headline-md text-headline-md font-bold text-primary">Plan your funding</h2>
        <p className="mt-2 text-on-surface-variant">Understand your contribution and repayments before taking the next step.</p>
      </div>

      {schemeResult ? (
        <>
          <dl className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
            {figures.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                <dt className="text-sm leading-relaxed text-on-surface-variant">{label}</dt>
                <dd className="mt-2 break-words font-mono text-2xl font-semibold tabular-nums text-primary">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="rounded-xl bg-white p-4 text-sm text-on-surface-variant border border-outline-variant">
            {percent.format(schemeResult.rules.rate)} annual interest · {schemeResult.rules.tenure_years} years · {schemeResult.rules.moratorium_months}-month grace period.
            <span className="mt-2 block font-mono text-xs">Scheme rules {schemeResult.rules.version}</span>
            <span className="mt-2 block">These figures are an estimate, not a loan approval.</span>
          </p>
          <details className="rounded-xl border border-outline-variant p-4">
            <summary className="cursor-pointer min-h-11 font-semibold">Repayment schedule</summary>
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
      ) : <p role="status" className="rounded-xl bg-surface-container p-5">Funding figures are not available yet. Return to your business idea to check your contribution and try again.</p>}

      <details className="rounded-xl border border-outline-variant p-4">
        <summary className="cursor-pointer min-h-11 font-semibold">Registrations to check</summary>
        {licenses.length ? <ul className="divide-y divide-outline-variant">
          {licenses.map((license) => <li key={license.id} className="py-3">
            <p className="font-semibold">{license.label}{license.required ? ' · Required' : ''}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{license.desc}</p>
          </li>)}
        </ul> : <p className="text-sm text-on-surface-variant">No registration guidance has loaded for this business yet.</p>}
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5">
        <button type="button" onClick={() => goToStep(3)} className="rounded-full border border-secondary px-5 py-3 text-secondary">Back to local demand</button>
        <button type="button" onClick={() => goToStep(5)} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-on-primary">Continue to identity <ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
  );
}
