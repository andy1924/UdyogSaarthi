import { ArrowRight, CheckCircle2, Cloud, FileUp, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { Text } from '../../lib/LanguageContext';
import { validateApplicantName, type IdentityDocumentKind, type IdentityDocumentState } from '../../lib/identity-documents';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState,
  'stepAnimClass' | 'applicantName' | 'setApplicantName' | 'panDocument' | 'aadhaarDocument' |
  'handleIdentityDocument' | 'digiLockerStatus' | 'digiLockerReference' | 'connectDigiLocker' |
  'goToStep' | 'advanceToStep'
>;

const fileSize = (size: number) => `${(size / 1024 / 1024).toFixed(1)} MB`;

function DocumentUpload({ kind, label, document, onSelect }: {
  kind: IdentityDocumentKind;
  label: string;
  document: IdentityDocumentState | null;
  onSelect: (kind: IdentityDocumentKind, file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const valid = document?.status === 'valid';
  return (
    <div className={`rounded-2xl border p-5 ${valid ? 'border-secondary/40 bg-secondary-container/25' : document ? 'border-error/40 bg-error-container/25' : 'border-outline-variant bg-surface-container-lowest'}`}>
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="font-semibold text-primary">{label} <span className="text-error" aria-hidden="true">*</span></h3><p className="mt-1 text-sm text-on-surface-variant"><Text>PDF, JPG, or PNG · maximum 5 MB</Text></p></div>
        {valid ? <CheckCircle2 className="shrink-0 text-secondary" size={22} aria-label="Upload complete" /> : <FileUp className="shrink-0 text-on-surface-variant" size={22} aria-hidden="true" />}
      </div>
      <input ref={inputRef} type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png" aria-label={`Upload ${label}`} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onSelect(kind, file); event.target.value = ''; }} />
      {document && <div className="mt-4"><p className="break-all text-sm font-semibold text-primary">{document.fileName}</p><p className="mt-1 text-xs text-on-surface-variant">{fileSize(document.fileSize)}</p></div>}
      {valid && <p role="status" className="mt-3 flex items-center gap-2 text-sm font-semibold text-secondary"><CheckCircle2 size={16} aria-hidden="true" /><Text>Upload complete</Text></p>}
      {document?.status === 'invalid' && <p role="alert" className="mt-3 text-sm font-semibold text-error">{document.error}</p>}
      <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded-full border border-secondary px-4 py-2 text-sm font-semibold text-secondary">
        <Text>{document ? 'Re-upload document' : 'Choose document'}</Text>
      </button>
    </div>
  );
}

export default function IdentityStep({
  stepAnimClass, applicantName, setApplicantName, panDocument, aadhaarDocument,
  handleIdentityDocument, digiLockerStatus, digiLockerReference, connectDigiLocker,
  goToStep, advanceToStep,
}: Props) {
  const [nameTouched, setNameTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const nameError = validateApplicantName(applicantName);
  const panValid = panDocument?.status === 'valid';
  const aadhaarValid = aadhaarDocument?.status === 'valid';
  const complete = !nameError && panValid && aadhaarValid;

  const continueToReview = () => {
    setAttempted(true);
    setNameTouched(true);
    if (complete) advanceToStep(6);
  };

  return (
    <section className={`mx-auto max-w-4xl space-y-7 ${stepAnimClass}`} aria-labelledby="identity-title">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Applicant information</Text></p>
        <h2 id="identity-title" className="mt-2 text-2xl font-bold text-primary sm:text-3xl"><Text>Confirm the applicant and identity documents</Text></h2>
        <p className="mt-2 max-w-2xl text-base leading-7 text-on-surface-variant"><Text>These details will be used in your DPR. Selected documents stay in this browser draft and are not sent to DigiLocker.</Text></p>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container p-5 sm:p-7">
        <label htmlFor="applicant-name" className="block text-base font-semibold text-primary"><Text>Applicant full name</Text> <span className="text-error" aria-hidden="true">*</span></label>
        <input id="applicant-name" name="applicant-name" required autoComplete="name" value={applicantName} onBlur={() => setNameTouched(true)} onChange={(event) => setApplicantName(event.target.value)} aria-invalid={Boolean((nameTouched || attempted) && nameError)} aria-describedby={nameError ? 'applicant-name-error' : undefined} placeholder="Enter your name as shown on your documents" className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-base text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
        {(nameTouched || attempted) && nameError && <p id="applicant-name-error" role="alert" className="mt-2 text-sm font-semibold text-error">{nameError}</p>}
      </div>

      <div>
        <h3 className="text-lg font-bold text-primary"><Text>Identity document uploads</Text></h3>
        <p className="mt-1 text-sm leading-6 text-on-surface-variant"><Text>Both documents are required before you can review the DPR.</Text></p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DocumentUpload kind="pan" label="PAN document" document={panDocument} onSelect={handleIdentityDocument} />
          <DocumentUpload kind="aadhaar" label="Aadhaar document" document={aadhaarDocument} onSelect={handleIdentityDocument} />
        </div>
        {attempted && (!panValid || !aadhaarValid) && <p role="alert" className="mt-3 text-sm font-semibold text-error"><Text>Upload a valid PAN and Aadhaar document to continue.</Text></p>}
      </div>

      <section aria-labelledby="digilocker-title" className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary p-5 text-on-primary sm:p-7">
        <ShieldCheck className="absolute -bottom-5 -right-4 opacity-10" size={120} aria-hidden="true" />
        <div className="relative max-w-2xl">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest"><Text>Sandbox environment</Text></span>
          <h3 id="digilocker-title" className="mt-3 text-xl font-bold"><Text>Connect with DigiLocker Sandbox</Text></h3>
          <p className="mt-2 text-sm leading-6 text-on-primary/80"><Text>Optional test connection for this release. Your required document uploads work independently if the sandbox is unavailable.</Text></p>
          {digiLockerStatus === 'success' && <p role="status" className="mt-4 flex items-center gap-2 font-semibold"><CheckCircle2 size={19} /><Text>Sandbox connected successfully</Text></p>}
          {digiLockerStatus === 'error' && <p role="alert" className="mt-4 font-semibold text-[#ffd8c2]"><Text>The sandbox connection failed. Your uploaded documents are still saved.</Text></p>}
          {digiLockerReference && <p className="mt-2 break-all font-mono text-xs opacity-75">Reference: {digiLockerReference}</p>}
          <button type="button" onClick={() => void connectDigiLocker()} disabled={digiLockerStatus === 'connecting'} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-primary">
            {digiLockerStatus === 'connecting' ? <LoaderCircle size={19} className="animate-spin" /> : digiLockerStatus === 'error' ? <RefreshCw size={19} /> : <Cloud size={19} />}
            <Text>{digiLockerStatus === 'connecting' ? 'Connecting to sandbox…' : digiLockerStatus === 'error' ? 'Retry DigiLocker Sandbox' : digiLockerStatus === 'success' ? 'Reconnect sandbox' : 'Connect with DigiLocker Sandbox'}</Text>
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5">
        <button type="button" onClick={() => goToStep(4)} className="rounded-full border border-secondary px-5 py-3 text-secondary"><Text>Back to funding</Text></button>
        <button type="button" onClick={continueToReview} aria-disabled={!complete} className={`flex items-center gap-2 rounded-full px-5 py-3 font-semibold ${complete ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}><Text>Next: Review project report</Text><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
  );
}
