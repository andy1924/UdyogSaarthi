import {
  CheckCircle2,
  FileDown,
  Share2
} from 'lucide-react';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState, "stepAnimClass" | "downloadSuccess" | "dprId" | "dprStatus" | "digiIdentity" | "handleDprDownload" | "handleShareWhatsApp" | "goToStep">;

export default function ReportStep({ stepAnimClass, downloadSuccess, dprId, dprStatus, digiIdentity, handleDprDownload, handleShareWhatsApp, goToStep }: Props) {
  return (<section className={`space-y-space-xl ${stepAnimClass}`}>
    <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
      {/* Live Generation Status */}
      <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/60 mb-space-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
          <div>
            <span className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest block mb-1 font-semibold">
              Asynchronous Rendering Worker (ID: {dprId})
            </span>
            <h3 className="font-headline-md text-headline-md text-primary font-bold font-playfair">
              Detailed Project Report (DPR) Ready for Submission
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1.5 flex-wrap">
              Applicant: <strong className="text-primary">{digiIdentity ? digiIdentity.name : 'Applicant Beneficiary'}</strong>
              {digiIdentity ? (
                <span className="px-2 py-0.5 rounded-full bg-primary text-surface text-[10px] font-bold uppercase inline-flex items-center gap-1">
                  <CheckCircle2 size={12} /> KYC Verified (Sandbox)
                </span>
              ) : (
                <button onClick={() => goToStep(5)} className="text-secondary underline underline-offset-2 cursor-pointer" type="button">
                  Verify identity in Step 05
                </button>
              )}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-ui text-label-ui font-bold self-start">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            {dprStatus}
          </span>
        </div>

        {/* Document Contents Architecture */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm pt-space-sm border-t border-outline-variant/40">
          <div className="p-3 rounded-lg bg-surface-container/60">
            <span className="font-label-kicker text-[10px] text-secondary uppercase block mb-1 font-semibold">
              Section 01
            </span>
            <strong className="font-label-ui text-label-ui text-primary block">Executive Summary</strong>
            <span className="text-[12px] text-on-surface-variant font-body-sm">Sponsor & Project Profile</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-container/60">
            <span className="font-label-kicker text-[10px] text-secondary uppercase block mb-1 font-semibold">
              Section 02
            </span>
            <strong className="font-label-ui text-label-ui text-primary block">Technical Feasibility</strong>
            <span className="text-[12px] text-on-surface-variant font-body-sm">Machinery, Civil & Power</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-container/60">
            <span className="font-label-kicker text-[10px] text-secondary uppercase block mb-1 font-semibold">
              Section 03
            </span>
            <strong className="font-label-ui text-label-ui text-primary block">Financial Projections</strong>
            <span className="text-[12px] text-on-surface-variant font-body-sm">7-Yr Balance Sheet & P&L</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-container/60">
            <span className="font-label-kicker text-[10px] text-secondary uppercase block mb-1 font-semibold">
              Section 04
            </span>
            <strong className="font-label-ui text-label-ui text-primary block">DSCR & Breakeven</strong>
            <span className="text-[12px] text-on-surface-variant font-body-sm">Average DSCR: 2.14x</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-container/60">
            <span className="font-label-kicker text-[10px] text-secondary uppercase block mb-1 font-semibold">
              Section 05
            </span>
            <strong className="font-label-ui text-label-ui text-primary block">Checklist & NOCs</strong>
            <span className="text-[12px] text-on-surface-variant font-body-sm">Panchayat Resolution Draft</span>
          </div>
        </div>
      </div>

      {/* Dossier Preview & Primary Download Card */}
      <div className="p-space-xl rounded-2xl bg-surface-container-lowest border-2 border-primary shadow-sm flex flex-col lg:flex-row items-center justify-between gap-space-xl">
        <div className="flex items-start gap-space-lg max-w-2xl">
          {/* Simulated Dossier Cover Thumbnail */}
          <div className="w-24 h-32 rounded-xl bg-surface-container border border-outline-variant/80 p-2 shrink-0 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-1">
              <span className="font-headline-md text-[10px] text-primary font-bold">DPR</span>
              <CheckCircle2 size={12} className="text-secondary" />
            </div>
            <div className="space-y-1">
              <div className="w-full h-1 bg-outline-variant/60 rounded" />
              <div className="w-3/4 h-1 bg-outline-variant/60 rounded" />
              <div className="w-5/6 h-1 bg-outline-variant/60 rounded" />
            </div>
            <div className="text-[8px] font-mono text-center text-on-surface-variant">QR VERIFIED</div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-primary text-surface font-label-kicker text-[10px] uppercase tracking-wider font-semibold">
                Bank Formulation Compliant
              </span>
              <span className="font-body-sm text-body-sm text-secondary font-semibold">
                Format: PDF (24 Pages • 2.4 MB)
              </span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-primary font-bold leading-tight font-playfair">
              Download Full Detailed Project Report & Bank Application Slip
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Pre-formatted for direct appraisal by State Bank of India, Bank of Maharashtra, Canara Bank,
              and District Central Co-op Banks.
            </p>
          </div>
        </div>

        {/* Direct Download & Share Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
          <button
            onClick={handleDprDownload}
            className="px-space-xl py-3.5 rounded-full bg-primary text-surface font-label-pill text-label-pill font-bold hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            type="button"
          >
            <FileDown size={22} />
            Download Bank-Ready DPR (.PDF)
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="px-space-md py-2.5 rounded-full bg-surface-container text-on-surface font-label-ui text-label-ui font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 border border-outline-variant/60 cursor-pointer"
            type="button"
          >
            <Share2 size={18} className="text-secondary" />
            Send to Gram Panchayat VLE / CSC
          </button>
          {downloadSuccess && (
            <span className="text-xs font-semibold text-secondary text-center animate-pulse">
              ✓ DPR Download Initiated ({dprId})
            </span>
          )}
        </div>
      </div>

      {/* Financial Health Snapshot from Generated Dossier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mt-space-xl">
        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40">
          <span className="font-body-sm text-body-sm text-on-surface-variant block">
            Internal Rate of Return (IRR)
          </span>
          <span className="font-headline-md text-headline-md font-bold text-primary font-mono">24.6%</span>
          <span className="font-body-sm text-[12px] text-secondary">Exceeds 14% benchmark hurdle</span>
        </div>
        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40">
          <span className="font-body-sm text-body-sm text-on-surface-variant block">
            Breakeven Point (Capacity Utilisation)
          </span>
          <span className="font-headline-md text-headline-md font-bold text-primary font-mono">46.2%</span>
          <span className="font-body-sm text-[12px] text-secondary">Achievable by Month 9</span>
        </div>
        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40">
          <span className="font-body-sm text-body-sm text-on-surface-variant block">
            Average Net Profit Margin
          </span>
          <span className="font-headline-md text-headline-md font-bold text-primary font-mono">18.4%</span>
          <span className="font-body-sm text-[12px] text-secondary">After debt servicing & tax</span>
        </div>
      </div>

      {/* Section Navigation CTA */}
      <div className="flex justify-between items-center mt-space-xl pt-space-lg border-t border-outline-variant/60">
        <button
          onClick={() => goToStep(5)}
          className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
          type="button"
        >
          ← Back to Identity
        </button>
        <button
          onClick={() => goToStep(1)}
          className="px-space-md py-2 rounded-full bg-surface-container text-primary font-label-ui text-label-ui font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
          type="button"
        >
          Start New Assessment +
        </button>
      </div>
    </div>
  </section>);
}
