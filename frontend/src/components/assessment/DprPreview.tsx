import { Building2, Check, FileText, MapPin, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { Text } from '../../lib/LanguageContext';
import type { AssessmentState } from './useAssessment';

type PreviewData = Pick<AssessmentState,
  'applicantName' | 'enterprise' | 'locationText' | 'feasibilityResult' |
  'schemeResult' | 'fundingPreference' | 'digiLockerStatus'
>;

interface Props extends PreviewData {
  compact?: boolean;
  showSwot?: boolean;
}

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const verdictCopy = {
  viable: 'Good potential',
  'niche-gap': 'Focused opportunity',
  saturated: 'High competition',
} as const;

const fundingPreferenceCopy = {
  scheme_linked_loan: 'Scheme-linked bank loan',
  standard_bank_loan: 'Standard bank loan',
  need_guidance: 'Funding guidance requested',
} as const;

export default function DprPreview({
  applicantName, enterprise, locationText, feasibilityResult, schemeResult,
  fundingPreference, digiLockerStatus, compact = false, showSwot = false,
}: Props) {
  const completed = [
    Boolean(locationText),
    Boolean(feasibilityResult),
    Boolean(schemeResult && fundingPreference),
    Boolean(applicantName.trim()),
  ].filter(Boolean).length;
  const score = feasibilityResult ? Math.max(0, Math.round(100 - feasibilityResult.density_score)) : null;
  const swot = feasibilityResult ? [
    ['S', 'Strengths', feasibilityResult.swot.strength],
    ['W', 'Weaknesses', feasibilityResult.swot.weakness],
    ['O', 'Opportunities', feasibilityResult.swot.opportunity],
    ['T', 'Threats', feasibilityResult.swot.threat],
  ] : [];

  return (
    <article aria-label="Live project report preview" className={`overflow-hidden border border-outline-variant/80 bg-white shadow-[0_18px_60px_rgba(23,33,13,0.09)] ${compact ? 'rounded-[28px] lg:sticky lg:top-24' : 'rounded-[32px]'}`}>
      <header className="relative overflow-hidden bg-primary px-5 py-6 text-on-primary sm:px-7">
        <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full border border-white/10" />
        <div className="absolute -right-2 top-10 h-20 w-20 rounded-full border border-white/10" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-on-primary/70">
              <FileText size={15} aria-hidden="true" /> <Text>Live DPR draft</Text>
            </div>
            <h2 className="mt-3 font-crimson text-2xl font-semibold leading-tight sm:text-3xl">{enterprise.name}</h2>
            <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-on-primary/75">
              <MapPin size={16} className="mt-1 shrink-0" aria-hidden="true" />
              <span>{locationText || <Text>Add a location to begin</Text>}</span>
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"><Text>Draft</Text></span>
        </div>
      </header>

      <div className={compact ? 'space-y-5 p-5' : 'space-y-7 p-5 sm:p-8'}>
        <section aria-label="Report readiness">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-primary"><Text>Report readiness</Text></span>
            <span className="font-mono text-on-surface-variant">{completed}/4</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={completed}>
            <div className="h-full rounded-full bg-secondary transition-[width]" style={{ width: `${completed * 25}%` }} />
          </div>
        </section>

        <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'sm:grid-cols-3'}`}>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <Sparkles size={18} className="text-secondary" aria-hidden="true" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"><Text>Demand outlook</Text></p>
            <p className="mt-1 font-semibold text-primary">{feasibilityResult ? verdictCopy[feasibilityResult.verdict] : '—'}</p>
            {score !== null && <p className="mt-1 font-mono text-sm text-secondary">{score}/100</p>}
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <WalletCards size={18} className="text-secondary" aria-hidden="true" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"><Text>Project budget</Text></p>
            <p className="mt-1 break-words font-mono font-semibold text-primary">{schemeResult ? rupees.format(schemeResult.tpc) : '—'}</p>
          </div>
          {!compact && <div className="rounded-2xl bg-surface-container-low p-4">
            <ShieldCheck size={18} className="text-secondary" aria-hidden="true" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"><Text>Applicant</Text></p>
            <p className="mt-1 font-semibold text-primary">{applicantName || '—'}</p>
          </div>}
        </div>

        {showSwot && feasibilityResult ? (
          <section aria-labelledby={compact ? 'preview-swot-title' : 'report-swot-title'}>
            <div className="flex items-center justify-between gap-3">
              <h3 id={compact ? 'preview-swot-title' : 'report-swot-title'} className="font-bold text-primary"><Text>Local SWOT analysis</Text></h3>
              <span className="rounded-full bg-secondary-container px-2.5 py-1 text-xs font-semibold text-on-secondary-container">{feasibilityResult.poi_count} <Text>nearby</Text></span>
            </div>
            <div className={`mt-3 grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
              {swot.map(([letter, label, value]) => (
                <div key={letter} className="rounded-xl border border-outline-variant/70 p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary"><span aria-hidden="true">{letter} — </span><Text>{label}</Text></p>
                  <p className={`mt-1.5 text-sm leading-6 text-on-surface-variant ${compact ? 'line-clamp-2' : ''}`}>{value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : showSwot ? (
          <div className="rounded-2xl border border-dashed border-outline-variant p-5 text-center">
            <Building2 size={22} className="mx-auto text-secondary" aria-hidden="true" />
            <p className="mt-2 text-sm leading-6 text-on-surface-variant"><Text>Your local demand and SWOT analysis will appear here after the business check.</Text></p>
          </div>
        ) : null}

        {!compact && schemeResult && (
          <section aria-labelledby="report-funding-title">
            <h3 id="report-funding-title" className="font-bold text-primary"><Text>Funding structure</Text></h3>
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                ['Your contribution', rupees.format(schemeResult.margin)],
                ['Estimated loan', rupees.format(schemeResult.max_loan_capped)],
                ['Quarterly repayment', rupees.format(schemeResult.eqi_amount)],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-outline-variant/70 p-4"><dt className="text-xs text-on-surface-variant"><Text>{label}</Text></dt><dd className="mt-1 break-words font-mono font-semibold text-primary">{value}</dd></div>)}
            </dl>
            <p className="mt-3 text-xs text-on-surface-variant">Scheme rules {schemeResult.rules.version} · <Text>Advisory estimate, not a loan approval.</Text></p>
            {fundingPreference && <p className="mt-2 text-sm font-semibold text-primary"><Text>Funding preference</Text>: {fundingPreferenceCopy[fundingPreference]}</p>}
          </section>
        )}

        {!compact && (
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-on-surface-variant">
            {[['Location', Boolean(locationText)], ['Demand', Boolean(feasibilityResult)], ['Funding', Boolean(schemeResult && fundingPreference)], ['Applicant', Boolean(applicantName.trim())]].map(([label, done]) => (
              <span key={String(label)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 ${done ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container'}`}>
                {done && <Check size={13} aria-hidden="true" />}<Text>{String(label)}</Text>
              </span>
            ))}
            {digiLockerStatus === 'success' && <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-2 text-on-secondary-container"><Check size={13} aria-hidden="true" /><Text>DigiLocker Sandbox connected</Text></span>}
          </div>
        )}
      </div>
    </article>
  );
}
