import { Text } from '../../lib/LanguageContext';
import { canGenerateDpr } from '../../lib/assessment-workflow';
import type { AssessmentState } from './useAssessment';
import DprPreview from './DprPreview';
import { getDprStatusLabel, isDprReady } from './report-step-helpers';
import { ReportConfirmSection, ReportHeader } from './ReportStep-sections';

type Props = Pick<AssessmentState,
  'stepAnimClass' | 'downloadSuccess' | 'dprId' | 'dprStatus' | 'applicantName' |
  'enterprise' | 'locationText' | 'feasibilityResult' | 'schemeResult' |
  'fundingPreference' | 'digiLockerStatus' | 'highestStepReached' | 'reviewConfirmed' |
  'setReviewConfirmed' | 'handleDprDownload' | 'handleShareWhatsApp' | 'goToStep'
>;

export default function ReportStep({
  stepAnimClass, downloadSuccess, dprId, dprStatus, applicantName, enterprise,
  locationText, feasibilityResult, schemeResult, fundingPreference, digiLockerStatus,
  highestStepReached, reviewConfirmed, setReviewConfirmed,
  handleDprDownload, handleShareWhatsApp, goToStep,
}: Props) {
  const canGenerate = canGenerateDpr({ userCoords: { lat: feasibilityResult?.lgd.lat ?? 0, lon: feasibilityResult?.lgd.lon ?? 0 }, locationText, selectedEnterprise: enterprise.id, feasibilityResult, schemeResult, applicantName, fundingPreference }, highestStepReached, true);
  const ready = isDprReady(dprStatus);
  const statusLabel = getDprStatusLabel(dprStatus);
  return (
    <section className={`mx-auto max-w-5xl space-y-7 ${stepAnimClass}`} aria-labelledby="report-title">
      <ReportHeader dprStatus={dprStatus} ready={ready} statusLabel={statusLabel} />

      <DprPreview applicantName={applicantName} enterprise={enterprise} locationText={locationText} feasibilityResult={feasibilityResult} schemeResult={schemeResult} fundingPreference={fundingPreference} digiLockerStatus={digiLockerStatus} />

      {!canGenerate && <p role="status" className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant"><Text>Complete applicant details, local demand, and funding before generating the report.</Text></p>}
      {dprId && <p className="break-all rounded-xl bg-surface-container p-4 font-mono text-sm text-on-surface-variant">Reference: {dprId}</p>}

      {canGenerate && <ReportConfirmSection reviewConfirmed={reviewConfirmed} setReviewConfirmed={setReviewConfirmed} dprStatus={dprStatus} ready={ready} handleDprDownload={handleDprDownload} handleShareWhatsApp={handleShareWhatsApp} />}

      {downloadSuccess && <p role="status" className="text-center text-sm font-semibold text-secondary"><Text>Your PDF download has started.</Text></p>}
      <button type="button" onClick={() => goToStep(5)} className="rounded-full border border-secondary px-5 py-3 text-secondary"><Text>Back to applicant details</Text></button>
    </section>
  );
}
