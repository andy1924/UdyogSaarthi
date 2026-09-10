import {
  BarChart3,
  CheckCircle2,
  Factory,
  FileDown,
  Landmark,
  MapPin,
  RefreshCw,
  Sliders,
  TrendingUp,
  Zap
} from 'lucide-react';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState, "stepAnimClass" | "radius" | "marginPercent" | "locationText" | "feasibilityResult" | "schemeResult" | "nearbyProfiles" | "nearbyLoading" | "enterprise" | "displayMargin" | "goToStep" | "viabilityScore" | "swotStrength" | "swotWeakness" | "swotOpportunity" | "swotThreat">;

export default function DemandStep({ stepAnimClass, radius, marginPercent, locationText, feasibilityResult, schemeResult, nearbyProfiles, nearbyLoading, enterprise, displayMargin, goToStep, viabilityScore, swotStrength, swotWeakness, swotOpportunity, swotThreat }: Props) {
  return (<section className={`space-y-space-xl ${stepAnimClass}`}>
    <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
      {/* Full Report Header — idea + site + date + print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-space-md mb-space-lg border-b border-outline-variant/50">
        <div>
          <span className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest font-semibold">
            Feasibility & Market Report • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold font-playfair">
            {enterprise.name}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {locationText} • {(radius / 1000).toFixed(0)} km cluster • {enterprise.capexLabel} benchmark CAPEX
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer flex items-center gap-2 shrink-0"
          type="button"
          title="Print or save this report as PDF"
        >
          <FileDown size={16} />
          Print / Save PDF
        </button>
      </div>

      {/* High-Confidence Verdict Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg pb-space-lg border-b border-outline-variant/50">
        <div className="flex items-center gap-space-md">
          {/* Numeric Score Ring */}
          <div className="w-24 h-24 rounded-2xl bg-primary text-surface flex flex-col items-center justify-center p-2 text-center shrink-0 shadow-inner">
            <span className="font-headline-xl text-[36px] font-bold leading-none">{viabilityScore}</span>
            <span className="font-label-kicker text-[10px] uppercase tracking-wider text-surface-dim mt-1">
              Out of 100
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-secondary border border-secondary font-label-kicker text-label-kicker uppercase font-bold">
                Viability Index: {viabilityScore >= 70 ? 'High' : 'Moderate'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                • {nearbyProfiles.length} Mapped Enterprises in {(radius / 1000).toFixed(0)}km
              </span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold font-playfair">
              {feasibilityResult?.verdict === 'saturated'
                ? 'Market Saturated — Pivot Strategy Recommended'
                : feasibilityResult?.verdict === 'niche-gap'
                  ? 'Niche Gap Identified — Specialist Entry Viable'
                  : 'Recommended for Institutional Bank Credit'}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {feasibilityResult
                ? `${feasibilityResult.poi_count} competing units found in ${(radius / 1000).toFixed(0)}km radius.`
                : 'Demand-Supply Gap Index indicates a'}
              {!feasibilityResult && <><strong> deficit in processed goods</strong> in the{' '}
                {locationText.split(',')[0]} catchment zone.</>}
              {feasibilityResult && ` Density score: ${feasibilityResult.density_score.toFixed(1)}/100.`}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <span className="px-space-md py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-secondary" />
            <span className="font-body-sm text-body-sm text-primary font-semibold">
              {feasibilityResult?.lgd?.district ? `${feasibilityResult.lgd.district}, ${feasibilityResult.lgd.state}` : 'NABARD Normalised'}
            </span>
          </span>
          {feasibilityResult && (
            <span className="px-space-md py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center gap-2">
              <BarChart3 size={18} className="text-secondary" />
              <span className="font-body-sm text-body-sm text-primary font-semibold">
                LGD: {feasibilityResult.lgd.code}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* 4-Card SWOT Matrix */}
      <div className="mt-space-xl">
        <h3 className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest mb-space-md font-semibold">
          Ground Reality • Micro-Market SWOT Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <TrendingUp size={20} className="text-secondary" />
              <span className="font-headline-md text-[18px] font-bold">Strengths</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{swotStrength}</p>
            <span className="mt-3 pt-2 border-t border-outline-variant/30 font-label-kicker text-[10px] text-secondary uppercase font-semibold">
              Local Raw Sourcing: High
            </span>
          </div>

          <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Zap size={20} className="text-secondary" />
              <span className="font-headline-md text-[18px] font-bold">Weaknesses</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{swotWeakness}</p>
            <span className="mt-3 pt-2 border-t border-outline-variant/30 font-label-kicker text-[10px] text-secondary uppercase font-semibold">
              Solar CAPEX Budgeted
            </span>
          </div>

          <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Factory size={20} className="text-secondary" />
              <span className="font-headline-md text-[18px] font-bold">Opportunities</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{swotOpportunity}</p>
            <span className="mt-3 pt-2 border-t border-outline-variant/30 font-label-kicker text-[10px] text-secondary uppercase font-semibold">
              Corridor Off-take: Strong
            </span>
          </div>

          <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Sliders size={20} className="text-secondary" />
              <span className="font-headline-md text-[18px] font-bold">Threats</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{swotThreat}</p>
            <span className="mt-3 pt-2 border-t border-outline-variant/30 font-label-kicker text-[10px] text-secondary uppercase font-semibold">
              Hedging Recommended
            </span>
          </div>
        </div>
      </div>

      {/* Nearby Enterprise Registry Table */}
      <div className="mt-space-xl">
        <div className="flex justify-between items-center mb-space-sm">
          <span className="font-label-ui text-label-ui font-semibold text-primary">
            Mapped Peer Enterprises in {(radius / 1000).toFixed(0)}km Cluster (Live PostGIS API)
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {nearbyLoading ? 'Querying...' : `${nearbyProfiles.length} verified units in database`}
          </span>
        </div>

        {nearbyLoading ? (
          <div className="flex items-center justify-center gap-3 py-10 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant font-body-sm">
            <RefreshCw size={18} className="animate-spin text-secondary" />
            <span>Querying live PostGIS cluster for {(radius / 1000).toFixed(0)}km radius...</span>
          </div>
        ) : nearbyProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-center">
            <MapPin size={28} className="text-secondary/50" />
            <p className="font-label-ui text-label-ui font-semibold text-primary">
              No Registered Peer Enterprises Found
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
              No {enterprise.apiCategory} units are registered in the PostGIS directory within {(radius / 1000).toFixed(0)}km of your location. This indicates a first-mover opportunity.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container text-primary font-headline-md text-[14px]">
                <tr>
                  <th className="p-3">Enterprise Unit</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Distance</th>
                  <th className="p-3">Cluster Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {nearbyProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-bright/50">
                    <td className="p-3 font-semibold text-primary">{p.name}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3 font-mono">{(p.distance_m / 1000).toFixed(1)} km</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container-high text-on-surface-variant">
                        Verified Peer
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Market & Demand Snapshot — live backend counts + registered peers */}
      <div className="mt-space-xl p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
        <h3 className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest mb-space-md font-semibold">
          Market Snapshot • Demand vs Competition
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-md">
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
            <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Competing units (live POI)</span>
            <span className="font-headline-md text-headline-md font-bold text-primary font-mono">
              {feasibilityResult ? feasibilityResult.poi_count : '—'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
            <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Saturation score</span>
            <span className="font-headline-md text-headline-md font-bold text-primary font-mono">
              {feasibilityResult ? `${feasibilityResult.density_score.toFixed(0)}/100` : '—'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
            <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Registered peers (PostGIS)</span>
            <span className="font-headline-md text-headline-md font-bold text-primary font-mono">
              {nearbyLoading ? '…' : nearbyProfiles.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
            <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Market verdict</span>
            <span className="font-headline-md text-[16px] font-bold text-primary capitalize">
              {feasibilityResult?.verdict?.replace('-', ' ') || 'Analysing'}
            </span>
          </div>
        </div>
        {feasibilityResult && feasibilityResult.opportunities.length > 0 ? (
          <div>
            <span className="font-label-ui text-label-ui font-semibold text-primary block mb-2">
              Allied gaps to pivot into (same catchment)
            </span>
            <ul className="space-y-2">
              {feasibilityResult.opportunities.map((o) => (
                <li key={o.title} className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                  <span><strong className="text-primary">{o.title}</strong> — {o.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {nearbyProfiles.length === 0
              ? `No ${enterprise.name.toLowerCase()} competition mapped within ${(radius / 1000).toFixed(0)} km — a first-mover window. Confirm footfall with 2–3 village visits before fixing CAPEX.`
              : `Nearest peer: ${[...nearbyProfiles].sort((a, b) => a.distance_m - b.distance_m)[0].name} at ${([...nearbyProfiles].sort((a, b) => a.distance_m - b.distance_m)[0].distance_m / 1000).toFixed(1)} km. Differentiate on quality, packaging and credit terms rather than price.`}
          </p>
        )}
      </div>

      {/* Credit & Loan Snapshot — server-calculated values only */}
      <div className="mt-space-xl p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
        <h3 className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest mb-space-md font-semibold">
          Loan Snapshot • Scheme-Linked Finance
        </h3>
        {schemeResult ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
              <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Scheme tier</span>
              <span className="font-headline-md text-[16px] font-bold text-primary capitalize">{schemeResult.tier} • {(schemeResult.rules.rate * 100).toFixed(2)}% p.a.</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
              <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Max loan eligible</span>
              <span className="font-headline-md text-[16px] font-bold text-primary font-mono">₹{schemeResult.max_loan_capped.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
              <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Your margin ({marginPercent}%)</span>
              <span className="font-headline-md text-[16px] font-bold text-primary font-mono">₹{schemeResult.margin.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
              <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Est. EQI • tenure</span>
              <span className="font-headline-md text-[16px] font-bold text-primary font-mono">₹{schemeResult.eqi_amount.toLocaleString('en-IN')} • {schemeResult.rules.tenure_years}yr</span>
            </div>
          </div>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Loan math is being calculated against live scheme rules — full EMI schedule follows in Step 04 (Credit & Subsidy).
          </p>
        )}
        <p className="mt-3 text-[11px] font-body-sm text-on-surface-variant">
          Indicative only — final sanction per bank appraisal. Scheme rules {schemeResult ? schemeResult.rules.version : 'v2024-11'} • {schemeResult ? `${schemeResult.rules.moratorium_months}-month moratorium` : 'moratorium as per tier'}.
        </p>
      </div>

      {/* Strategy & Next Steps — verdict-driven playbook */}
      <div className="mt-space-xl p-space-lg rounded-2xl bg-secondary-container/50 border border-outline-variant/60">
        <h3 className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest mb-space-md font-semibold">
          Strategy • What To Do Next
        </h3>
        <ul className="space-y-2">
          {(feasibilityResult?.verdict === 'saturated'
            ? [
              'Do not enter head-on — pick one allied gap above (lower competition, shared customers).',
              'If you proceed anyway, differentiate on quality/packaging — never on price alone.',
              'Re-run this report with a different business idea from the Step-02 dropdown.',
              'Carry this report to your DIC officer for cluster-specific guidance.',
            ]
            : feasibilityResult?.verdict === 'niche-gap'
              ? [
                'First-mover window is open — move before the gap fills; lock input-supply tie-ups now.',
                'Start lean: keep CAPEX at benchmark or below and keep 15% working-capital buffer.',
                'Register Udyam MSME + apply for the licences listed in Step 04 early (FSSAI/shop-act).',
                'Line up 2–3 buyer off-take letters — banks weight them heavily in appraisal.',
              ]
              : [
                'Viability looks sound — proceed to Step 04 to lock your credit and subsidy structure.',
                `Keep promoter margin ready: ₹${displayMargin.toLocaleString('en-IN')} (${marginPercent}% of TPC).`,
                'Collect 2 machinery quotations + shed rent deed — both are mandatory DPR annexures.',
                'Download the bank-ready DPR dossier in Step 05 after credit structuring.',
              ]
          ).map((step) => (
            <li key={step} className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
              <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section Navigation CTA */}
      <div className="flex justify-between items-center mt-space-xl pt-space-lg border-t border-outline-variant/60">
        <button
          onClick={() => goToStep(2)}
          className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
          type="button"
        >
          ← Re-adjust Category
        </button>
        <button
          onClick={() => goToStep(4)}
          className="px-space-xl py-2.5 rounded-full bg-primary text-surface font-label-ui text-label-ui font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          type="button"
        >
          Calculate Subvention & EQI
          <Landmark size={18} />
        </button>
      </div>
    </div>
  </section>);
}
