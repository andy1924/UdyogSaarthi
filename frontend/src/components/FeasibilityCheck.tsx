import {
  Phone,
  RefreshCw
} from 'lucide-react';
import AssessmentNavigation from './assessment/AssessmentNavigation';
import BusinessStep from './assessment/BusinessStep';
import DemandStep from './assessment/DemandStep';
import FundingStep from './assessment/FundingStep';
import IdentityStep from './assessment/IdentityStep';
import LocationStep from './assessment/LocationStep';
import ReportStep from './assessment/ReportStep';
import { useAssessment } from './assessment/useAssessment';
import LanguageSelector from './LanguageSelector';

interface FeasibilityCheckProps { onBackToLanding: () => void; }

export default function FeasibilityCheck({ onBackToLanding }: FeasibilityCheckProps) {
  const assessment = useAssessment();
  const { t, currentStep, stepContentRef, loadingState, goToStep } = assessment;
  return (
    <div className="assessment min-h-screen bg-surface-container-lowest text-on-surface font-body-md antialiased selection:bg-secondary-container">
      {/* ==================== HEADER ==================== */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-outline-variant/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] bg-surface-container-lowest/95">
        <div className="h-20 max-w-[1200px] mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-left cursor-pointer focus:outline-none group"
              title="Return to Landing Page"
            >
              <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary leading-none font-playfair text-2xl group-hover:text-primary/80 transition-colors">
                Udyog-Saarthi
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Loading Overlay */}
      {loadingState && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <RefreshCw size={36} className="text-secondary animate-spin mb-4" />
            <span className="font-headline-md text-primary font-bold text-lg mb-1">Processing Request</span>
            <p className="font-body-sm text-on-surface-variant">{loadingState}</p>
          </div>
        </div>
      )}

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="w-full pt-20 bg-surface-container-lowest">
        <div className="flex flex-col w-full">

          {/* Main Multi-Step Container */}
          <div className="max-w-[1200px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-xl">
            {/* Editorial Headline Block */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-space-2xl pb-space-lg border-b border-outline-variant/50">
              <div className="max-w-3xl">
                <span className="font-label-kicker text-label-kicker uppercase tracking-widest text-secondary mb-2 block font-semibold">
                  Your business, one step at a time
                </span>
                <h1 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight leading-tight font-playfair">
                  Turn your idea into a business plan
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                  Explore demand nearby, understand funding, and prepare your project report.
                </p>
              </div>
              <div className="shrink-0 self-end md:self-start md:pt-1">
                <LanguageSelector variant="wizard" />
              </div>
            </div>

            <AssessmentNavigation currentStep={currentStep} onStepChange={goToStep} />

            {/* Step panels — goToStep scroll-locks to this anchor */}
            <div ref={stepContentRef} tabIndex={-1} aria-label={`Assessment step ${currentStep}`} className="scroll-mt-24">

              {/* ==================== STEP 1: GEOLOCATION & RADIUS ==================== */}
              {currentStep === 1 && <LocationStep {...assessment} />}

              {/* ==================== STEP 2: ENTERPRISE CATEGORY & SCALE ==================== */}
              {currentStep === 2 && <BusinessStep {...assessment} />}

              {/* ==================== STEP 3: FEASIBILITY & MARKET VERDICT ==================== */}
              {currentStep === 3 && <DemandStep {...assessment} />}

              {/* ==================== STEP 4: CREDIT & SUBSIDY ==================== */}
              {currentStep === 4 && <FundingStep {...assessment} />}

              {/* ==================== STEP 5: DIGILOCKER SANDBOX IDENTITY ==================== */}
              {currentStep === 5 && <IdentityStep {...assessment} />}

              {/* ==================== STEP 6: BANK-READY DPR & DOWNLOAD DOSSIER ==================== */}
              {currentStep === 6 && <ReportStep {...assessment} />}
            </div>

            {/* ==================== SIGNATURE RURAL HELPLINE BAR ==================== */}
            <div className="mt-space-3xl w-full rounded-2xl bg-[#324622] text-[#e8f0df] p-space-xl flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-md">
              <div className="flex items-center gap-space-md">
                <div className="w-14 h-14 rounded-full bg-surface-bright/15 flex items-center justify-center shrink-0">
                  <Phone size={28} className="text-surface-bright" />
                </div>
                <div>
                  <span className="font-label-kicker text-label-kicker uppercase tracking-widest text-[#ceebba] block font-semibold">
                    Direct State Enterprise Mission Call Center
                  </span>
                  <h4 className="font-headline-md text-headline-md font-bold text-[#eeffde] font-playfair">
                    Have questions regarding your Panchayat DPR or Subvention?
                  </h4>
                  <p className="font-body-sm text-body-sm text-[#ceebba]">
                    Certified Lead District Manager (LDM) field officers are ready to assist across 36 districts.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center items-center bg-[#e8efe0] text-[#1e3314] px-space-lg py-3 rounded-2xl shadow-inner gap-3 max-w-full">
                <div className="flex items-center gap-2">
                  <Phone size={20} className="text-[#243b19]" />
                  <a className="font-headline-md text-[20px] font-bold tracking-wide hover:underline" href="tel:+918983172377">
                    +91 89831 72377
                  </a>
                </div>
                <span className="font-label-ui text-[13px] font-semibold text-[#364d2b] text-center">
                  Monday–Saturday • 09:00–19:00 hrs
                </span>
              </div>
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
                  <span className="font-bold">UdyogSaarthi</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  A digital public utility built to remove friction from institutional credit and state subsidy adoption
                  for rural innovators, self-help clusters, and micro-enterprises.
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-block px-space-md py-space-xs rounded-full text-secondary border border-outline-variant font-label-kicker text-label-kicker uppercase tracking-wider bg-surface-container-low font-semibold">
                  Autonomous Advisory Mission
                </span>
              </div>
            </div>
          </div>

          <div className="pt-space-lg border-t border-outline-variant/50 flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
            <div>© 2026 UdyogSaarthi Rural Enterprise Advisory.</div>
            <div className="flex flex-wrap items-center gap-space-md">
              <button onClick={onBackToLanding} className="hover:text-on-surface underline underline-offset-4 transition-colors">{t('wizardBackToLanding')}
              </button>
              <span className="hover:text-on-surface underline underline-offset-4 cursor-pointer">
                Data Privacy Charter
              </span>
              <span className="hover:text-on-surface underline underline-offset-4 cursor-pointer">
                Advisory Terms
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
