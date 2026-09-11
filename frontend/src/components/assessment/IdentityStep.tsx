import { ArrowRight, CheckCircle2, CreditCard, Fingerprint, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Text } from '../../lib/LanguageContext';
import { validateApplicantName } from '../../lib/identity-documents';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState,
  'stepAnimClass' | 'applicantName' | 'setApplicantName' | 'digiLockerStatus' |
  'digiLockerReference' | 'connectDigiLocker' | 'goToStep' | 'advanceToStep' |
  'simulatedPan' | 'setSimulatedPan' | 'incomeTier' | 'setIncomeTier' | 'overrideScheme' | 'setOverrideScheme'
> & {
  holderName: string;
};

const FALLBACK_HOLDER = 'Asha Patil';

export default function IdentityStep({
  stepAnimClass, applicantName, setApplicantName, digiLockerStatus,
  digiLockerReference, connectDigiLocker, goToStep, advanceToStep, holderName,
  simulatedPan, setSimulatedPan, incomeTier, setIncomeTier, overrideScheme, setOverrideScheme,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [accessGranted, setAccessGranted] = useState(false);
  const [showBlockedHint, setShowBlockedHint] = useState(false);
  const nameError = validateApplicantName(applicantName);
  const displayHolder = holderName.trim() || FALLBACK_HOLDER;
  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(simulatedPan);
  const eligibleSchemes = incomeTier === 'low'
    ? ['PMEGP subsidy-linked loan', 'MUDRA Shishu']
    : incomeTier === 'middle' ? ['MUDRA Kishor', 'Standard bank loan'] : ['Standard bank loan'];

  const sandboxDocuments = [
    { id: 'pan', label: 'PAN Card', issuer: 'Income Tax Department', number: 'XXXXX1234F', holder: displayHolder, Icon: CreditCard },
    { id: 'aadhaar', label: 'Aadhaar Card', issuer: 'UIDAI', number: 'XXXX XXXX 1234', holder: displayHolder, Icon: Fingerprint },
  ];

  const toggleDocument = (id: string) => {
    setSelected((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  };

  const startConnect = () => {
    setAccessGranted(false);
    setShowBlockedHint(false);
    void connectDigiLocker();
  };

  const allowAccess = () => {
    setApplicantName(displayHolder);
    setAccessGranted(true);
    setShowBlockedHint(false);
  };

  const continueToReview = () => {
    if (nameError) {
      setShowBlockedHint(true);
      return;
    }
    advanceToStep(6);
  };

  const showDocuments = digiLockerStatus === 'success' && !accessGranted;
  const showGranted = digiLockerStatus === 'success' && accessGranted;
  const sharedDocs = sandboxDocuments.filter((doc) => selected.includes(doc.id));

  return (
    <section className={`mx-auto max-w-4xl space-y-7 ${stepAnimClass}`} aria-labelledby="identity-title">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Applicant information</Text></p>
        <h2 id="identity-title" className="mt-2 text-2xl font-bold text-primary sm:text-3xl"><Text>Confirm the applicant</Text></h2>
        <p className="mt-2 max-w-2xl text-base leading-7 text-on-surface-variant"><Text>DigiLocker Sandbox is the document-verification route. Connect, select PAN or Aadhaar, and allow access — your verified name appears on the final DPR.</Text></p>
      </div>

      <section aria-labelledby="digilocker-title" className="relative overflow-hidden rounded-[28px] bg-violet-950 p-6 text-white shadow-[0_18px_60px_rgba(46,16,101,0.25)] sm:p-8">
        <ShieldCheck className="absolute -bottom-5 -right-4 text-white opacity-10" size={150} aria-hidden="true" />
        <div className="relative max-w-2xl">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest"><Text>Sandbox environment</Text></span>
          <h3 id="digilocker-title" className="mt-4 font-crimson text-3xl font-semibold"><Text>DigiLocker Sandbox</Text></h3>
          <p className="mt-2 text-sm leading-6 text-white/80"><Text>Test connection for identity documents. No PAN or Aadhaar uploads needed — select the documents you share below.</Text></p>

          {digiLockerStatus === 'connecting' && <p role="status" className="mt-4 flex items-center gap-2 font-semibold"><LoaderCircle size={19} className="animate-spin" /><Text>Connecting to DigiLocker Sandbox…</Text></p>}
          {digiLockerStatus === 'error' && <p role="alert" className="mt-4 font-semibold text-[#ffd8c2]"><Text>The sandbox is temporarily unavailable. You can still complete and export your report.</Text></p>}

          {digiLockerStatus !== 'connecting' && !showDocuments && !showGranted && (
            <button type="button" onClick={startConnect} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-violet-950 shadow-sm transition hover:bg-violet-100">
              {digiLockerStatus === 'error' ? <RefreshCw size={19} /> : <ShieldCheck size={19} />}
              <Text>{digiLockerStatus === 'error' ? 'Retry DigiLocker Sandbox' : 'Connect with DigiLocker Sandbox'}</Text>
            </button>
          )}
        </div>

        {showDocuments && (
          <div className="relative mt-6">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-bold"><Text>Choose documents to share</Text></h4>
              <span role="status" className="rounded-full bg-white/15 px-3 py-1 font-mono text-xs">{selected.length} of {sandboxDocuments.length} selected</span>
            </div>
            <ul className="mt-3 space-y-3">
              {sandboxDocuments.map(({ id, label, issuer, number, holder, Icon }) => {
                const checked = selected.includes(id);
                return (
                  <li key={id}>
                    <label className={`flex min-h-12 cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 text-violet-950 transition ${checked ? 'ring-2 ring-white' : 'hover:bg-violet-100'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDocument(id)}
                        aria-label={`Share ${label}`}
                        className="size-6 shrink-0 accent-violet-800"
                      />
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-900">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold">{label}</span>
                        <span className="mt-0.5 block truncate text-sm text-violet-950/70">{holder} · {number}</span>
                        <span className="block text-xs text-violet-950/60">Issued by {issuer}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={allowAccess}
              disabled={selected.length === 0}
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-violet-950 shadow-sm transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Text>Allow access to selected documents</Text>
            </button>
          </div>
        )}

        {showGranted && (
          <div className="relative mt-6 rounded-2xl bg-white p-5 text-violet-950">
            <p role="status" className="flex items-center gap-2 font-bold"><CheckCircle2 size={20} className="text-violet-800" /><Text>Identity verified via DigiLocker Sandbox</Text></p>
            <p className="mt-2 text-sm"><Text>Verified name</Text>: <strong>{applicantName}</strong></p>
            <p className="mt-1 text-sm text-violet-950/70"><Text>Shared</Text>: {sharedDocs.map((doc) => doc.label).join(', ')}</p>
            {digiLockerReference && <p className="mt-2 break-all font-mono text-xs text-violet-950/60">Reference: {digiLockerReference}</p>}
            <button type="button" onClick={startConnect} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-violet-300 px-5 font-semibold text-violet-900 transition hover:bg-violet-100">
              <RefreshCw size={17} /><Text>Reconnect sandbox</Text>
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="sandbox-controls-title" className="rounded-2xl border border-outline-variant bg-surface-container p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Tester controls</p>
            <h3 id="sandbox-controls-title" className="mt-1 text-xl font-bold text-primary">Simulated eligibility</h3>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">Use mock values to inspect scheme matching without sending real identity data.</p>
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-primary">Sandbox only</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-semibold text-primary">Mock PAN
            <input value={simulatedPan} onChange={(e) => setSimulatedPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} placeholder="ABCDE1234F" className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-3 font-mono outline-none focus:ring-2 focus:ring-primary/20" aria-invalid={Boolean(simulatedPan) && !panValid} />
            {simulatedPan && !panValid && <span className="mt-1 block text-xs font-normal text-error">Enter a valid mock PAN format.</span>}
          </label>
          <label className="block text-sm font-semibold text-primary">Income tier
            <select value={incomeTier} onChange={(e) => setIncomeTier(e.target.value as typeof incomeTier)} className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-3 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="low">Low income</option><option value="middle">Middle income</option><option value="high">High income</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-primary">Force-select scheme <span className="font-normal text-on-surface-variant">(optional)
            <select value={overrideScheme} onChange={(e) => setOverrideScheme(e.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-3 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Use eligibility result</option>{eligibleSchemes.map((scheme) => <option key={scheme} value={scheme}>{scheme}</option>)}
            </select>
          </span></label>
        </div>
        {panValid && <p className="mt-4 rounded-xl bg-secondary-container/60 p-3 text-sm text-primary"><strong>Eligible schemes:</strong> {overrideScheme || eligibleSchemes.join(', ')}</p>}
      </section>

      {showBlockedHint && nameError && <p role="alert" className="rounded-xl border border-error/30 bg-error-container p-4 text-sm font-semibold text-on-error-container"><Text>Connect DigiLocker Sandbox and allow document access to continue.</Text></p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5">
        <button type="button" onClick={() => goToStep(4)} className="rounded-full border border-secondary px-5 py-3 text-secondary"><Text>Back to funding</Text></button>
        <button type="button" onClick={continueToReview} aria-disabled={Boolean(nameError)} className={`flex items-center gap-2 rounded-full px-5 py-3 font-semibold ${nameError ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary'}`}><Text>Next: Review project report</Text><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
  );
}
