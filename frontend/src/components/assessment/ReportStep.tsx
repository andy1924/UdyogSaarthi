import { CheckCircle2, FileDown, RefreshCw, Share2 } from 'lucide-react';
import { Text } from '../../lib/LanguageContext';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState,
  'stepAnimClass' | 'downloadSuccess' | 'dprId' | 'dprStatus' | 'applicantName' |
  'enterprise' | 'locationText' | 'feasibilityResult' | 'schemeResult' |
  'handleDprDownload' | 'handleShareWhatsApp' | 'goToStep'
>;

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function ReportStep({
  stepAnimClass, downloadSuccess, dprId, dprStatus, applicantName, enterprise,
  locationText, feasibilityResult, schemeResult, handleDprDownload, handleShareWhatsApp, goToStep,
}: Props) {
  const canGenerate = Boolean(applicantName.trim() && feasibilityResult && schemeResult);
  const ready = dprStatus === 'ready';
  const statusLabel = dprStatus === 'queued' ? 'Generating report' : dprStatus === 'ready' ? 'Report ready' : dprStatus === 'error' ? 'Generation failed' : 'Ready to generate';
  const summary = [
    ['Applicant', applicantName || '—'],
    ['Business idea', enterprise.name],
    ['Area', locationText || '—'],
    ['Market verdict', feasibilityResult?.verdict.replace('-', ' ') || '—'],
    ['Project budget', schemeResult ? rupees.format(schemeResult.tpc) : '—'],
    ['Estimated loan', schemeResult ? rupees.format(schemeResult.max_loan_capped) : '—'],
  ];

  return (
    <section className={`mx-auto max-w-4xl space-y-6 ${stepAnimClass}`} aria-labelledby="report-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Project report</Text></p>
          <h2 id="report-title" className="mt-2 font-headline-lg text-headline-lg font-bold text-primary"><Text>Review before generating your PDF</Text></h2>
          <p className="mt-2 text-base leading-7 text-on-surface-variant"><Text>The report uses only the live results shown below.</Text></p>
        </div>
        <span role="status" className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary-container px-3 py-2 text-sm font-semibold text-primary">
          {dprStatus === 'queued' ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : ready ? <CheckCircle2 size={16} aria-hidden="true" /> : null}
          <Text>{statusLabel}</Text>
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-outline-variant bg-surface-container p-5 sm:grid-cols-2 sm:p-7">
        {summary.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-xl bg-surface-container-lowest p-4">
            <dt className="text-sm text-on-surface-variant"><Text>{label}</Text></dt>
            <dd className="mt-1 break-words text-base font-semibold capitalize text-primary">{value}</dd>
          </div>
        ))}
      </dl>

      {!canGenerate && <p role="status" className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant"><Text>Complete applicant details, local demand, and funding before generating the report.</Text></p>}
      {dprId && <p className="break-all rounded-xl bg-surface-container p-4 font-mono text-sm text-on-surface-variant">Reference: {dprId}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={handleDprDownload} disabled={!canGenerate || dprStatus === 'queued'} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary shadow-sm transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-45">
          {dprStatus === 'queued' ? <RefreshCw size={20} className="animate-spin" aria-hidden="true" /> : <FileDown size={20} aria-hidden="true" />}
          <Text>{ready ? 'Download report again' : 'Generate and download PDF'}</Text>
        </button>
        <button type="button" onClick={handleShareWhatsApp} disabled={!ready} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-secondary px-6 py-3 font-semibold text-secondary disabled:cursor-not-allowed disabled:opacity-45">
          <Share2 size={19} aria-hidden="true" /><Text>Share reference</Text>
        </button>
      </div>

      {downloadSuccess && <p role="status" className="text-center text-sm font-semibold text-secondary"><Text>Your PDF download has started.</Text></p>}
      <button type="button" onClick={() => goToStep(5)} className="rounded-full border border-secondary px-5 py-3 text-secondary"><Text>Back to applicant details</Text></button>
    </section>
  );
}
