import { ArrowRight, CheckCircle2, Cloud, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Text } from '../../lib/LanguageContext';
import { validateApplicantName } from '../../lib/identity-documents';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState,
  'stepAnimClass' | 'applicantName' | 'setApplicantName' | 'digiLockerStatus' |
  'digiLockerReference' | 'connectDigiLocker' | 'goToStep' | 'advanceToStep'
>;

export default function IdentityStep({
  stepAnimClass, applicantName, setApplicantName, digiLockerStatus,
  digiLockerReference, connectDigiLocker, goToStep, advanceToStep,
}: Props) {
  const [nameTouched, setNameTouched] = useState(false);
  const nameError = validateApplicantName(applicantName);
  const continueToReview = () => {
    setNameTouched(true);
    if (!nameError) advanceToStep(6);
  };

  return (
    <section className={`mx-auto max-w-4xl space-y-7 ${stepAnimClass}`} aria-labelledby="identity-title">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Applicant information</Text></p>
        <h2 id="identity-title" className="mt-2 text-2xl font-bold text-primary sm:text-3xl"><Text>Confirm the applicant</Text></h2>
        <p className="mt-2 max-w-2xl text-base leading-7 text-on-surface-variant"><Text>Your name appears on the final DPR. DigiLocker Sandbox is available as the single document-verification route.</Text></p>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container p-5 sm:p-7">
        <label htmlFor="applicant-name" className="block text-base font-semibold text-primary"><Text>Applicant full name</Text> <span className="text-error" aria-hidden="true">*</span></label>
        <input id="applicant-name" name="applicant-name" required autoComplete="name" value={applicantName} onBlur={() => setNameTouched(true)} onChange={(event) => setApplicantName(event.target.value)} aria-invalid={Boolean(nameTouched && nameError)} aria-describedby={nameTouched && nameError ? 'applicant-name-error' : undefined} placeholder="Enter your name as shown in DigiLocker" className="mt-2 w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-base text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
        {nameTouched && nameError && <p id="applicant-name-error" role="alert" className="mt-2 text-sm font-semibold text-error">{nameError}</p>}
      </div>

      <section aria-labelledby="digilocker-title" className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-primary p-6 text-on-primary shadow-[0_18px_60px_rgba(23,33,13,0.12)] sm:p-8">
        <ShieldCheck className="absolute -bottom-5 -right-4 opacity-10" size={150} aria-hidden="true" />
        <div className="relative max-w-2xl">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest"><Text>Sandbox environment</Text></span>
          <h3 id="digilocker-title" className="mt-4 font-crimson text-3xl font-semibold"><Text>Connect with DigiLocker Sandbox</Text></h3>
          <p className="mt-2 text-sm leading-6 text-on-primary/80"><Text>Use the test connection to verify identity documents without separate PAN or Aadhaar uploads. The sandbox remains optional for this release.</Text></p>
          {digiLockerStatus === 'success' && <p role="status" className="mt-4 flex items-center gap-2 font-semibold"><CheckCircle2 size={19} /><Text>Sandbox connected successfully</Text></p>}
          {digiLockerStatus === 'error' && <p role="alert" className="mt-4 font-semibold text-[#ffd8c2]"><Text>The sandbox is temporarily unavailable. You can still complete and export your report.</Text></p>}
          {digiLockerReference && <p className="mt-2 break-all font-mono text-xs opacity-75">Reference: {digiLockerReference}</p>}
          <button type="button" onClick={() => void connectDigiLocker()} disabled={digiLockerStatus === 'connecting'} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-primary shadow-sm transition hover:bg-surface-container-low">
            {digiLockerStatus === 'connecting' ? <LoaderCircle size={19} className="animate-spin" /> : digiLockerStatus === 'error' ? <RefreshCw size={19} /> : <Cloud size={19} />}
            <Text>{digiLockerStatus === 'connecting' ? 'Connecting to sandbox…' : digiLockerStatus === 'error' ? 'Retry DigiLocker Sandbox' : digiLockerStatus === 'success' ? 'Reconnect sandbox' : 'Connect with DigiLocker Sandbox'}</Text>
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5">
        <button type="button" onClick={() => goToStep(4)} className="rounded-full border border-secondary px-5 py-3 text-secondary"><Text>Back to funding</Text></button>
        <button type="button" onClick={continueToReview} aria-disabled={Boolean(nameError)} className={`flex items-center gap-2 rounded-full px-5 py-3 font-semibold ${nameError ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary'}`}><Text>Next: Review project report</Text><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
  );
}
