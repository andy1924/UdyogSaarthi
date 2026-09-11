import { ArrowRight, CheckCircle2, MapPin, RefreshCw } from 'lucide-react';
import { Text } from '../../lib/LanguageContext';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState,
  'stepAnimClass' | 'radius' | 'locationText' | 'feasibilityResult' |
  'nearbyProfiles' | 'nearbyLoading' | 'enterprise' | 'goToStep' | 'advanceToStep' | 'executeFeasibilityAI'
>;

const verdictCopy = {
  viable: 'Good potential',
  'niche-gap': 'A focused opportunity',
  saturated: 'High competition',
} as const;

export default function DemandStep({
  stepAnimClass, radius, locationText, feasibilityResult, nearbyProfiles,
  nearbyLoading, enterprise, goToStep, advanceToStep, executeFeasibilityAI,
}: Props) {
  if (!feasibilityResult) {
    return (
      <section className={`mx-auto max-w-2xl space-y-5 text-center ${stepAnimClass}`} aria-labelledby="demand-title">
        <div className="rounded-2xl border border-outline-variant bg-surface-container p-6 sm:p-9">
          <MapPin size={34} className="mx-auto text-secondary" aria-hidden="true" />
          <h2 id="demand-title" className="mt-4 text-2xl font-bold text-primary"><Text>Local demand could not be loaded</Text></h2>
          <p className="mx-auto mt-2 max-w-lg text-base leading-7 text-on-surface-variant"><Text>Your location and business choice are saved. Try the live check again when the service is available.</Text></p>
          <button type="button" onClick={executeFeasibilityAI} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary">
            <RefreshCw size={18} aria-hidden="true" /><Text>Try local demand again</Text>
          </button>
        </div>
        <button type="button" onClick={() => goToStep(2)} className="rounded-full border border-secondary px-5 py-3 text-secondary"><Text>Back to business idea</Text></button>
      </section>
    );
  }

  const score = Math.max(0, Math.round(100 - feasibilityResult.density_score));
  const swot = [
    ['S', 'Strengths', feasibilityResult.swot.strength],
    ['W', 'Weaknesses', feasibilityResult.swot.weakness],
    ['O', 'Opportunities', feasibilityResult.swot.opportunity],
    ['T', 'Threats', feasibilityResult.swot.threat],
  ];

  return (
    <section className={`space-y-6 ${stepAnimClass}`} aria-labelledby="demand-title">
      <div className="rounded-2xl border border-outline-variant bg-surface-container p-5 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Live local demand check</Text></p>
            <h2 id="demand-title" className="mt-2 text-2xl font-bold text-primary sm:text-3xl">{verdictCopy[feasibilityResult.verdict]}</h2>
            <p className="mt-2 text-base leading-7 text-on-surface-variant">{enterprise.name} · {locationText} · {(radius / 1000).toFixed(0)} km</p>
          </div>
          <div className="flex items-baseline gap-2 rounded-2xl bg-primary px-5 py-4 text-on-primary">
            <strong className="font-mono text-4xl">{score}</strong><span className="text-sm opacity-80"><Text>out of 100</Text></span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-outline-variant pt-5 sm:grid-cols-4">
          <div><dt className="text-sm text-on-surface-variant"><Text>Nearby units</Text></dt><dd className="mt-1 font-mono text-xl font-semibold text-primary">{feasibilityResult.poi_count}</dd></div>
          <div><dt className="text-sm text-on-surface-variant"><Text>Competition score</Text></dt><dd className="mt-1 font-mono text-xl font-semibold text-primary">{feasibilityResult.density_score.toFixed(0)}/100</dd></div>
          <div><dt className="text-sm text-on-surface-variant"><Text>District</Text></dt><dd className="mt-1 text-base font-semibold text-primary">{feasibilityResult.lgd.district}</dd></div>
          <div><dt className="text-sm text-on-surface-variant">LGD</dt><dd className="mt-1 break-all font-mono text-base font-semibold text-primary">{feasibilityResult.lgd.code}</dd></div>
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-bold text-primary"><Text>What the local data suggests</Text></h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {swot.map(([letter, label, value]) => <article key={letter} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
            <h4 className="font-semibold text-secondary"><span aria-hidden="true">{letter} — </span><Text>{label}</Text></h4>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{value}</p>
          </article>)}
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-primary"><Text>Registered businesses nearby</Text></h3>
          <span className="text-sm text-on-surface-variant">{nearbyLoading ? <Text>Loading…</Text> : `${nearbyProfiles.length} found`}</span>
        </div>
        {nearbyLoading ? <div role="status" className="flex items-center gap-2 py-7 text-on-surface-variant"><RefreshCw size={18} className="animate-spin" /><Text>Checking the local directory…</Text></div>
          : nearbyProfiles.length ? <ul className="mt-3 divide-y divide-outline-variant">{nearbyProfiles.map((profile) => <li key={profile.id} className="flex items-start justify-between gap-4 py-3">
            <div><p className="font-semibold text-primary">{profile.name}</p><p className="text-sm text-on-surface-variant">{profile.category}</p></div>
            <span className="shrink-0 font-mono text-sm">{(profile.distance_m / 1000).toFixed(1)} km</span>
          </li>)}</ul>
          : <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface-container p-4 text-sm leading-6 text-on-surface-variant"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-secondary" /><Text>No matching businesses are registered in the directory for this radius. Treat this as a data gap, not proof of zero competition.</Text></p>}
      </div>

      {feasibilityResult.opportunities.length > 0 && <div className="rounded-2xl bg-secondary-container/50 p-5">
        <h3 className="text-lg font-bold text-primary"><Text>Related opportunities</Text></h3>
        <ul className="mt-3 space-y-3">{feasibilityResult.opportunities.map((item) => <li key={item.title}><p className="font-semibold text-primary">{item.title}</p><p className="mt-1 text-sm leading-6 text-on-surface-variant">{item.reason}</p></li>)}</ul>
      </div>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5">
        <button type="button" onClick={() => goToStep(2)} className="rounded-full border border-secondary px-5 py-3 text-secondary"><Text>Back to business idea</Text></button>
        <button type="button" onClick={() => advanceToStep(4)} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-on-primary"><Text>Next: Plan funding</Text><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
  );
}
