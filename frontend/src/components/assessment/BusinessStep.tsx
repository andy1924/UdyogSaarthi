import {
  ChevronDown,
  Factory,
  Zap
} from 'lucide-react';
import { ENTERPRISE_GROUPS, ENTERPRISE_OPTIONS } from './enterprise-catalog';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState, "stepAnimClass" | "selectedEnterprise" | "setSelectedEnterprise" | "marginPercent" | "setMarginPercent" | "schemeResult" | "enterprise" | "displayTpc" | "executeFeasibilityAI" | "goToStep">;

export default function BusinessStep({ stepAnimClass, selectedEnterprise, setSelectedEnterprise, marginPercent, setMarginPercent, schemeResult, enterprise, displayTpc, executeFeasibilityAI, goToStep }: Props) {
  return (<section className={`space-y-space-xl ${stepAnimClass}`}>
    <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
      <div className="max-w-2xl mb-space-lg">
        <span className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest block mb-1 font-semibold">
          Standard Rural Industry Classification
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary font-bold font-playfair">
          Select Enterprise Activity & Capital Investment
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Tailors DPR financial projections according to MSME/PMEGP technology norms and local agrarian output.
        </p>
      </div>

      {/* Business Idea Dropdown — full PMEGP-grounded catalog, grouped by industry family */}
      <div className="mb-space-2xl">
        <label
          className="font-label-ui text-label-ui font-semibold text-primary block mb-2"
          htmlFor="enterpriseSelect"
        >
          Choose Your Business Idea ({ENTERPRISE_OPTIONS.length} options)
        </label>
        <div className="relative">
          <select
            id="enterpriseSelect"
            value={selectedEnterprise}
            onChange={(e) => setSelectedEnterprise(e.target.value)}
            className="w-full appearance-none p-3.5 pr-12 rounded-xl bg-surface-container-lowest border-2 border-primary/40 text-on-surface font-label-ui text-label-ui font-semibold cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {ENTERPRISE_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {ENTERPRISE_OPTIONS.filter((o) => o.group === group).map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} — {opt.capexLabel}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown
            size={20}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
          />
        </div>

        {/* Selected idea summary */}
        <div className="mt-space-md flex flex-col sm:flex-row gap-space-md p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
            <Factory size={26} className="text-secondary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-label-ui text-label-ui font-bold text-primary">{enterprise.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/60 text-secondary font-label-kicker text-[10px] uppercase font-semibold">
                {enterprise.group}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {enterprise.description}
            </p>
          </div>
          <div className="sm:text-right shrink-0 sm:pl-4 sm:border-l border-outline-variant/40">
            <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase tracking-wide">
              Benchmark CAPEX
            </span>
            <span className="font-bold text-primary font-mono text-[18px]">{enterprise.capexLabel}</span>
          </div>
        </div>
      </div>

      {/* Margin Equity & Working Capital Slider Controls */}
      <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-label-ui text-label-ui font-semibold text-primary" htmlFor="equitySlider">
                Beneficiary Promoter Equity Margin
              </label>
              <span className="font-label-ui text-label-ui font-mono font-bold text-primary bg-secondary-container px-2.5 py-0.5 rounded">
                {marginPercent}% Margin Contribution
              </span>
            </div>
            <input
              id="equitySlider"
              className="w-full accent-primary h-2 bg-outline-variant/40 rounded-lg cursor-pointer"
              type="range"
              min="5"
              max="25"
              step="5"
              value={marginPercent}
              onChange={(e) => setMarginPercent(parseInt(e.target.value, 10))}
            />
            <div className="flex justify-between text-[11px] font-body-sm text-on-surface-variant mt-1.5">
              <span>5% (SC/ST/Women/NER Concession)</span>
              <span>10% (Standard PMEGP)</span>
              <span>25% (Commercial)</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-label-ui text-label-ui font-semibold text-primary">
                Target Total Project Cost (TPC)
              </label>
              <span className="font-headline-md text-headline-md font-bold text-primary font-mono">
                ₹{displayTpc.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Includes Machinery (60%), Shed/Civil Work (25%), and Initial Working Capital (15%).
            </p>
            {schemeResult && (
              <div className="mt-2 text-[11px] text-secondary font-mono">
                Scheme rules {schemeResult.rules.version} • Cap ₹{(schemeResult.rules.cap / 100000).toFixed(1)}L
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Navigation CTA */}
      <div className="flex justify-between items-center mt-space-xl pt-space-lg border-t border-outline-variant/60">
        <button
          onClick={() => goToStep(1)}
          className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
          type="button"
        >
          ← Back to Location
        </button>
        <button
          onClick={executeFeasibilityAI}
          className="px-space-xl py-2.5 rounded-full bg-primary text-surface font-label-ui text-label-ui font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          type="button"
        >
          Execute Cluster Feasibility AI
          <Zap size={18} />
        </button>
      </div>
    </div>
  </section>);
}
