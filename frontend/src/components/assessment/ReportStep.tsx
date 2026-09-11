import { CheckCircle2, FileDown, RefreshCw, Share2 } from 'lucide-react';
import { Text } from '../../lib/LanguageContext';
import { canGenerateDpr } from '../../lib/assessment-workflow';
import type { AssessmentState } from './useAssessment';
import DprPreview from './DprPreview';

type Props = Pick<AssessmentState,
  'stepAnimClass' | 'downloadSuccess' | 'dprId' | 'dprStatus' | 'applicantName' |
  'enterprise' | 'locationText' | 'feasibilityResult' | 'schemeResult' |
  'panDocument' | 'aadhaarDocument' | 'highestStepReached' | 'reviewConfirmed' |
  'setReviewConfirmed' | 'handleDprDownload' | 'handleShareWhatsApp' | 'goToStep'
>;

export default function ReportStep({
  stepAnimClass, downloadSuccess, dprId, dprStatus, applicantName, enterprise,
  locationText, feasibilityResult, schemeResult, panDocument, aadhaarDocument,
  highestStepReached, reviewConfirmed, setReviewConfirmed,
  handleDprDownload, handleShareWhatsApp, goToStep,
}: Props) {
  const canGenerate = canGenerateDpr({ userCoords: { lat: feasibilityResult?.lgd.lat ?? 0, lon: feasibilityResult?.lgd.lon ?? 0 }, locationText, selectedEnterprise: enterprise.id, feasibilityResult, schemeResult, applicantName, panDocument, aadhaarDocument }, highestStepReached, true);
  const ready = dprStatus === 'ready';
  const statusLabel = dprStatus === 'queued' ? 'Generating report' : dprStatus === 'ready' ? 'Report ready' : dprStatus === 'error' ? 'Generation failed' : 'Ready to generate';
  return (
    <section className={`mx-auto max-w-5xl space-y-7 ${stepAnimClass}`} aria-labelledby="report-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Project report</Text></p>
          <h2 id="report-title" className="mt-2 font-headline-lg text-headline-lg font-bold text-primary"><Text>Review your completed project report</Text></h2>
          <p className="mt-2 text-base leading-7 text-on-surface-variant"><Text>Your DPR has been built as you completed each step. Confirm it, then convert this report to PDF.</Text></p>
        </div>
        <span role="status" className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary-container px-3 py-2 text-sm font-semibold text-primary">
          {dprStatus === 'queued' ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : ready ? <CheckCircle2 size={16} aria-hidden="true" /> : null}
          <Text>{statusLabel}</Text>
        </span>
      </div>

      <DprPreview applicantName={applicantName} enterprise={enterprise} locationText={locationText} feasibilityResult={feasibilityResult} schemeResult={schemeResult} panDocument={panDocument} aadhaarDocument={aadhaarDocument} />

      {!canGenerate && <p role="status" className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant"><Text>Complete applicant details, local demand, and funding before generating the report.</Text></p>}
      {dprId && <p className="break-all rounded-xl bg-surface-container p-4 font-mono text-sm text-on-surface-variant">Reference: {dprId}</p>}

      {canGenerate && <section aria-labelledby="confirm-title" className="rounded-2xl border-2 border-primary/20 bg-secondary-container/30 p-5 sm:p-6">
        <h3 id="confirm-title" className="text-xl font-bold text-primary"><Text>Confirm and export</Text></h3>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-surface-container-lowest p-4 text-sm leading-6 text-on-surface">
          <input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
          <span><Text>I have reviewed the applicant, location, business, demand, funding, and document details above.</Text></span>
        </label>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={handleDprDownload} disabled={!reviewConfirmed || dprStatus === 'queued'} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary shadow-sm transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-45">
            {dprStatus === 'queued' ? <RefreshCw size={20} className="animate-spin" aria-hidden="true" /> : <FileDown size={20} aria-hidden="true" />}
            <Text>{ready ? 'Download PDF again' : 'Convert report to PDF'}</Text>
          </button>
          <button type="button" onClick={handleShareWhatsApp} disabled={!ready} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-secondary px-6 py-3 font-semibold text-secondary disabled:cursor-not-allowed disabled:opacity-45">
            <Share2 size={19} aria-hidden="true" /><Text>Share reference</Text>
          </button>
        </div>
      </section>}

      {downloadSuccess && <p role="status" className="text-center text-sm font-semibold text-secondary"><Text>Your PDF download has started.</Text></p>}
      <button type="button" onClick={() => goToStep(5)} className="rounded-full border border-secondary px-5 py-3 text-secondary"><Text>Back to applicant details</Text></button>
    </section>
  );
}
