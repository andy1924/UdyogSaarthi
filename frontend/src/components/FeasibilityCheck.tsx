import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { Text } from '../lib/LanguageContext';
import AssessmentNavigation from './assessment/AssessmentNavigation';
import BusinessStep from './assessment/BusinessStep';
import DemandStep from './assessment/DemandStep';
import FundingStep from './assessment/FundingStep';
import IdentityStep from './assessment/IdentityStep';
import LocationStep from './assessment/LocationStep';
import ReportStep from './assessment/ReportStep';
import { useAssessment } from './assessment/useAssessment';
import BotanicalAccent from './BotanicalAccent';
import DprPreview from './assessment/DprPreview';
import BrandLogo from './BrandLogo';
import type { SessionUser } from '../lib/api';
import { useVoice } from '../lib/voice/VoiceContext';

const STEP_TITLES = ['Location', 'Business', 'Demand', 'Credit & subsidy', 'Identity', 'Report'];

interface FeasibilityCheckProps {
  onBackToLanding: () => void;
  user: SessionUser | null;
}

export default function FeasibilityCheck({ onBackToLanding, user }: FeasibilityCheckProps) {
  const assessment = useAssessment();
  const holderName = user?.username?.trim() || user?.full_name?.trim() || user?.email?.trim() || '';
  const { t, currentStep, highestStepReached, stepContentRef, loadingState, uiError, setUiError, goToStep } = assessment;

  // Ground the voice assistant in whatever step the wizard is showing.
  const { setContext } = useVoice();
  useEffect(() => {
    const feasibility = assessment.feasibilityResult;
    // The fast feasibility path returns one SWOT sentence per box and the
    // enriched DPR returns arrays; normalise both so the snapshot is never
    // blank and the assistant can quote what is actually on screen.
    const list = (detailed?: string[], concise?: string) => {
      if (detailed?.length) return detailed;
      return concise?.trim() ? [concise] : undefined;
    };
    setContext({
      step: currentStep,
      stepTitle: STEP_TITLES[currentStep - 1] ?? 'Location',
      locationText: assessment.locationText || undefined,
      enterprise: assessment.selectedEnterprise || undefined,
      feasibilityVerdict: feasibility?.verdict,
      marginPercent: assessment.marginPercent,
      radiusMeters: assessment.radius,
      nearbyUnits: feasibility?.poi_count,
      competitionScore: feasibility ? Math.round(feasibility.density_score) : undefined,
      feasibilityScore: feasibility ? Math.max(0, Math.round(100 - feasibility.density_score)) : undefined,
      district: feasibility?.lgd.district,
      swot: feasibility ? {
        strengths: list(feasibility.swot?.strengths, feasibility.swot?.strength),
        weaknesses: list(feasibility.swot?.weaknesses, feasibility.swot?.weakness),
        opportunities: list(feasibility.swot?.opportunities, feasibility.swot?.opportunity),
        threats: list(feasibility.swot?.threats, feasibility.swot?.threat),
      } : undefined,
      opportunities: feasibility?.opportunities,
      identityVerified: assessment.digiLockerVerified,
      reportReady: Boolean(assessment.dprId),
    });
  }, [currentStep, assessment.locationText, assessment.selectedEnterprise,
      assessment.feasibilityResult, assessment.marginPercent, assessment.radius,
      assessment.digiLockerVerified, assessment.dprId, setContext]);

  // Lock page scroll while the loading overlay is open so the page behind it
  // cannot be scrolled with the wheel, touch, or keyboard.
  useEffect(() => {
    if (!loadingState) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [loadingState]);

  return (
    <div className="assessment min-h-screen bg-surface-container-lowest text-on-surface font-body-md antialiased selection:bg-secondary-container">
      {/* Loading Overlay */}
      {loadingState && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <RefreshCw size={36} className="text-secondary animate-spin mb-4" />
            <span className="font-headline-md text-primary font-bold text-lg mb-1"><Text>Working on your request</Text></span>
            <p className="font-body-sm text-on-surface-variant">{loadingState}</p>
          </div>
        </div>
      )}

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="relative isolate w-full overflow-hidden bg-surface-container-lowest">
        <BotanicalAccent className="top-28" />
        <BotanicalAccent side="left" className="top-[46rem]" />
        <div className="flex flex-col w-full">

          {/* Main Multi-Step Container */}
          <div className="max-w-[1200px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-xl">
            {/* Editorial Headline Block */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-space-2xl pb-space-lg border-b border-outline-variant/50">
              <div className="max-w-3xl">
                <span className="font-label-kicker text-label-kicker uppercase tracking-widest text-secondary mb-2 block font-semibold">
                  <Text>Your business, one step at a time</Text>
                </span>
                <h1 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight leading-tight font-playfair">
                  <Text>Turn your idea into a business plan</Text>
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                  <Text>Explore demand nearby, understand funding, and prepare your project report.</Text>
                </p>
              </div>
            </div>

            <AssessmentNavigation currentStep={currentStep} highestStepReached={highestStepReached} onStepChange={goToStep} />

            {uiError && (
              <div role="alert" className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-error/30 bg-error-container p-4 text-on-error-container">
                <p>{uiError}</p>
                <button type="button" onClick={() => setUiError(null)} className="min-h-0 shrink-0 underline">Dismiss</button>
              </div>
            )}

            {/* Step panels — goToStep scroll-locks to this anchor */}
            <div ref={stepContentRef} tabIndex={-1} aria-label={`Assessment step ${currentStep}`} className={`scroll-mt-24 ${currentStep >= 4 && currentStep <= 5 ? 'grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>

              <div className="min-w-0">

              {/* ==================== STEP 1: GEOLOCATION & RADIUS ==================== */}
              {currentStep === 1 && <LocationStep {...assessment} />}

              {/* ==================== STEP 2: ENTERPRISE CATEGORY & SCALE ==================== */}
              {currentStep === 2 && <BusinessStep {...assessment} />}

              {/* ==================== STEP 3: FEASIBILITY & MARKET VERDICT ==================== */}
              {currentStep === 3 && <DemandStep {...assessment} />}

              {/* ==================== STEP 4: CREDIT & SUBSIDY ==================== */}
              {currentStep === 4 && <FundingStep {...assessment} />}

              {/* ==================== STEP 5: DIGILOCKER SANDBOX IDENTITY ==================== */}
              {currentStep === 5 && <IdentityStep {...assessment} holderName={holderName} />}

              {/* ==================== STEP 6: BANK-READY DPR & DOWNLOAD DOSSIER ==================== */}
              {currentStep === 6 && <ReportStep {...assessment} />}
              </div>

              {currentStep >= 4 && currentStep <= 5 && (
                <div>
                  <DprPreview {...assessment} compact />
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant/60 pt-space-3xl pb-space-xl mt-space-3xl">
        <div className="max-w-[1200px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <div className="p-space-xl lg:p-space-2xl rounded-2xl border border-outline-variant/60 mb-space-3xl bg-surface-container-lowest">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-primary font-headline-md text-headline-md mb-space-xs font-playfair">
                  <BrandLogo />
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Clear local-demand, funding, and project-report guidance for rural entrepreneurs and small businesses.
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-block px-space-md py-space-xs rounded-full text-secondary border border-outline-variant font-label-kicker text-label-kicker uppercase tracking-wider bg-surface-container-low font-semibold">
                  Independent advisory platform
                </span>
              </div>
            </div>
          </div>

          <div className="pt-space-lg border-t border-outline-variant/50 flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
            <div>© 2026 UdyogSaarthi Rural Enterprise Advisory.</div>
            <div className="flex flex-wrap items-center gap-space-md">
              <button onClick={onBackToLanding} className="hover:text-on-surface underline underline-offset-4 transition-colors">{t('wizardBackToLanding')}
              </button>
              <span>Advisory estimates only</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
