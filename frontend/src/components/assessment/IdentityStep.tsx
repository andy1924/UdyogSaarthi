import {
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import DigiLockerMark from './DigiLockerMark';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState, "stepAnimClass" | "digiError" | "digiStatus" | "digiIdentity" | "goToStep" | "startDigiRedirect" | "allowDigiConsent" | "denyDigiConsent" | "resetDigiSandbox">;

export default function IdentityStep({ stepAnimClass, digiError, digiStatus, digiIdentity, goToStep, startDigiRedirect, allowDigiConsent, denyDigiConsent, resetDigiSandbox }: Props) {
  return (<section className={`space-y-space-xl ${stepAnimClass}`}>
    <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
      <div className="max-w-2xl mb-space-lg">
        <span className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest block mb-1 font-semibold">
          KYC • Identity Verification
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary font-bold font-playfair">
          Verify Identity via DigiLocker
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Banks need a KYC-verified applicant on the DPR. Fetch your identity documents before generating the dossier.
        </p>
      </div>

      {/* Sandbox disclaimer — never a real DigiLocker call */}
      <div className="mb-space-lg p-3 rounded-xl bg-secondary-container/60 border border-dashed border-secondary flex items-start gap-2">
        <ShieldCheck size={18} className="text-secondary shrink-0 mt-0.5" />
        <p className="font-body-sm text-body-sm text-primary">
          <strong>DigiLocker Sandbox (MOCK).</strong> No real DigiLocker call is made and nothing leaves this browser.
          Press the button below to walk through a simulated DigiLocker login and consent.
        </p>
      </div>

      {digiStatus !== 'verified' ? (digiStatus === 'consent' ? (
        /* Mock DigiLocker consent page */
        <div className="max-w-lg mx-auto rounded-2xl overflow-hidden border border-outline-variant/60 shadow-sm">
          <div className="bg-[#5558A6] px-space-lg py-4 flex items-center gap-3">
            <DigiLockerMark size={44} mono />
            <div>
              <span className="text-white font-bold text-[20px] leading-none block">DigiLocker</span>
              <span className="text-white/70 text-[12px]">Your documents anytime, anywhere • Sandbox</span>
            </div>
          </div>
          <div className="p-space-lg bg-surface-container-lowest flex flex-col gap-3">
            <p className="font-body-md text-body-md text-primary">
              <strong>UdyogSaarthi</strong> is requesting access to:
            </p>
            <ul className="space-y-2">
              {['Aadhaar Card — Name, DOB, Address', 'PAN Card — Number & Name'].map((doc) => (
                <li key={doc} className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant p-2.5 rounded-xl bg-surface-container border border-outline-variant/40">
                  <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
            <p className="text-[12px] font-body-sm text-on-surface-variant">
              One-time fetch for this DPR application. No documents are stored outside this demo session.
            </p>
            <div className="flex gap-3 mt-1">
              <button
                onClick={denyDigiConsent}
                className="flex-1 px-space-md py-2.5 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
                type="button"
              >
                Deny
              </button>
              <button
                onClick={allowDigiConsent}
                className="flex-1 px-space-md py-2.5 rounded-full bg-[#5558A6] text-white font-label-ui text-label-ui font-bold hover:opacity-90 transition-colors shadow-sm cursor-pointer"
                type="button"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* DigiLocker entry — single branded button */
        <div className="max-w-lg mx-auto p-space-xl rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col items-center text-center gap-4">
          <DigiLockerMark size={64} />
          <div>
            <span className="font-bold text-[#5558A6] text-[26px] leading-none block">DigiLocker</span>
            <span className="text-[12px] font-body-sm text-on-surface-variant">Your documents anytime, anywhere</span>
          </div>
          {digiStatus === 'redirecting' ? (
            <p className="flex items-center gap-2 font-label-ui text-label-ui text-primary font-semibold">
              <RefreshCw size={18} className="animate-spin text-secondary" />
              Connecting to secure DigiLocker… (sandbox)
            </p>
          ) : (
            <button
              onClick={startDigiRedirect}
              className="w-full px-space-md py-3 rounded-xl bg-[#5558A6] text-white font-label-ui text-label-ui font-bold hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-3 cursor-pointer"
              type="button"
            >
              <DigiLockerMark size={30} mono />
              Fetch your details via DigiLocker
            </button>
          )}
          <p className="text-[12px] font-body-sm text-on-surface-variant">
            You will be taken to a simulated DigiLocker login and consent page. No real account or OTP needed.
          </p>
        </div>
      )
      ) : (
        /* Verified identity card */
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest border-2 border-primary/50 flex flex-col gap-space-md">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-label-ui text-label-ui font-bold text-primary flex items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-primary text-surface font-bold text-[18px] flex items-center justify-center">
                {digiIdentity?.name.split(' ').map((w) => w[0]).join('')}
              </span>
              {digiIdentity?.name}
            </span>
            <span className="px-3 py-1 rounded-full bg-primary text-surface font-label-kicker text-label-kicker uppercase font-bold flex items-center gap-1">
              <CheckCircle2 size={14} /> Identity Verified
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-body-sm text-body-sm">
            <div><span className="block text-[11px] text-on-surface-variant uppercase">Date of Birth</span><strong className="text-primary">{digiIdentity?.dob}</strong></div>
            <div><span className="block text-[11px] text-on-surface-variant uppercase">Gender</span><strong className="text-primary">{digiIdentity?.gender}</strong></div>
            <div><span className="block text-[11px] text-on-surface-variant uppercase">Aadhaar</span><strong className="text-primary font-mono">{digiIdentity?.maskedAadhaar}</strong></div>
            <div><span className="block text-[11px] text-on-surface-variant uppercase">PAN</span><strong className="text-primary font-mono">{digiIdentity?.pan}</strong></div>
            <div className="col-span-2"><span className="block text-[11px] text-on-surface-variant uppercase">Address (from Step 01)</span><strong className="text-primary">{digiIdentity?.address}</strong></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Aadhaar XML', 'PAN Card', 'Udyam-linked KYC'].map((doc) => (
              <span key={doc} className="px-3 py-1 rounded-full bg-surface-container border border-outline-variant/60 font-body-sm text-body-sm text-primary flex items-center gap-1">
                <CheckCircle2 size={14} className="text-secondary" /> {doc} • Mock
              </span>
            ))}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            This identity will be printed as the applicant on your DPR dossier.
            <button onClick={resetDigiSandbox} className="ml-2 text-secondary underline underline-offset-2 cursor-pointer" type="button">
              Re-verify with a different number
            </button>
          </p>
        </div>
      )}

      {digiError && (
        <p className="mt-space-md p-3 rounded-xl bg-red-50 border border-red-200 font-body-sm text-body-sm text-red-800">
          {digiError}
        </p>
      )}

      {/* Section Navigation CTA */}
      <div className="flex justify-between items-center mt-space-xl pt-space-lg border-t border-outline-variant/60">
        <button
          onClick={() => goToStep(4)}
          className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
          type="button"
        >
          ← Back to Credit
        </button>
        {digiStatus === 'verified' ? (
          <button
            onClick={() => goToStep(6)}
            className="px-space-xl py-2.5 rounded-full bg-primary text-surface font-label-ui text-label-ui font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            type="button"
          >
            Continue to DPR Dossier
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={() => goToStep(6)}
            className="px-space-md py-2 rounded-full text-on-surface-variant font-label-ui text-label-ui underline underline-offset-4 hover:text-primary transition-colors cursor-pointer"
            type="button"
          >
            Skip for now →
          </button>
        )}
      </div>
    </div>
  </section>);
}
