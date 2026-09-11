import { ArrowRight, ChevronDown, Factory } from 'lucide-react';
import { Text } from '../../lib/LanguageContext';
import { ENTERPRISE_GROUPS, ENTERPRISE_OPTIONS } from './enterprise-catalog';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState,
  'stepAnimClass' | 'selectedEnterprise' | 'setSelectedEnterprise' | 'marginPercent' |
  'setMarginPercent' | 'schemeResult' | 'capitalEstimate' | 'locationCostFactor' | 'enterprise' | 'displayTpc' | 'executeFeasibilityAI' | 'goToStep'
>;

export default function BusinessStep({
  stepAnimClass, selectedEnterprise, setSelectedEnterprise, marginPercent,
  setMarginPercent, schemeResult, capitalEstimate, locationCostFactor, enterprise, displayTpc, executeFeasibilityAI, goToStep,
}: Props) {
  return (
    <section className={`mx-auto max-w-4xl space-y-6 ${stepAnimClass}`} aria-labelledby="business-title">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Business idea</Text></p>
        <h2 id="business-title" className="mt-2 text-2xl font-bold text-primary sm:text-3xl"><Text>What would you like to start?</Text></h2>
        <p className="mt-2 max-w-2xl text-base leading-7 text-on-surface-variant"><Text>Choose the closest match. We will use its project-cost estimate and local business category.</Text></p>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container p-5 sm:p-7">
        <label className="block text-base font-semibold text-primary" htmlFor="enterpriseSelect"><Text>Choose a business idea</Text></label>
        <div className="relative mt-2">
          <select id="enterpriseSelect" value={selectedEnterprise} onChange={(event) => setSelectedEnterprise(event.target.value)} className="w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5 pr-12 text-base font-semibold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="" disabled>Choose a business idea</option>
            {ENTERPRISE_GROUPS.map((group) => <optgroup key={group} label={group}>{ENTERPRISE_OPTIONS.filter((option) => option.group === group).map((option) => <option key={option.id} value={option.id}>{option.name} — ₹{Math.round(option.capex * locationCostFactor).toLocaleString('en-IN')}</option>)}</optgroup>)}
          </select>
          <ChevronDown size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary" aria-hidden="true" />
        </div>

        {selectedEnterprise ? <div className="mt-4 flex items-start gap-4 rounded-xl bg-surface-container-lowest p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary-container text-secondary"><Factory size={22} aria-hidden="true" /></span>
          <div className="min-w-0"><p className="font-semibold text-primary">{enterprise.name}</p><p className="mt-1 text-sm leading-6 text-on-surface-variant">{enterprise.description}</p></div>
        </div> : <p className="mt-4 rounded-xl bg-surface-container-lowest p-4 text-sm text-on-surface-variant"><Text>Select an idea to see its project-cost estimate.</Text></p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant p-5">
          <div className="flex items-center justify-between gap-3"><label htmlFor="equitySlider" className="font-semibold text-primary"><Text>Your contribution</Text></label><strong className="font-mono text-primary">{marginPercent}%</strong></div>
          <input id="equitySlider" className="mt-4 h-2 w-full cursor-pointer rounded-lg accent-primary" type="range" min="5" max="25" step="5" value={marginPercent} onChange={(event) => setMarginPercent(Number(event.target.value))} />
          <p className="mt-3 text-sm leading-6 text-on-surface-variant"><Text>Adjust the share you can contribute. Funding figures update automatically.</Text></p>
        </div>
        <div className="rounded-2xl border border-outline-variant p-5">
          <p className="text-sm text-on-surface-variant"><Text>Estimated project budget</Text></p>
          <p className="mt-2 break-words font-mono text-2xl font-semibold text-primary">{selectedEnterprise ? `₹${displayTpc.toLocaleString('en-IN')}` : '—'}</p>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">{schemeResult ? <><Text>Calculated using scheme rules</Text> <span className="font-mono">{schemeResult.rules.version}</span>.</> : <Text>Live funding rules are still loading.</Text>}</p>
          {capitalEstimate && <details className="mt-3 text-sm text-on-surface-variant"><summary className="cursor-pointer font-semibold text-secondary">View local cost breakdown</summary><dl className="mt-2 grid grid-cols-2 gap-2">{[
            ['Rent deposit', capitalEstimate.rent_deposit], ['Equipment', capitalEstimate.equipment],
            ['Setup labour', capitalEstimate.labour_setup], ['Materials & stock', capitalEstimate.materials_inventory],
            ['Licences & utilities', capitalEstimate.licences_utilities],
          ].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd className="font-mono font-semibold text-primary">₹{Number(value).toLocaleString('en-IN')}</dd></div>)}</dl><p className="mt-2 text-xs">{capitalEstimate.explanation}</p></details>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5">
        <button type="button" onClick={() => goToStep(1)} className="rounded-full border border-secondary px-5 py-3 text-secondary"><Text>Back to location</Text></button>
        <button type="button" onClick={executeFeasibilityAI} aria-disabled={!selectedEnterprise} className={`flex items-center gap-2 rounded-full px-5 py-3 font-semibold ${selectedEnterprise ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}><Text>Next: Check local demand</Text><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
  );
}
