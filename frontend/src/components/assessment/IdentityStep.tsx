import { ArrowRight, Info } from 'lucide-react';
import { Text } from '../../lib/LanguageContext';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState, 'stepAnimClass' | 'applicantName' | 'setApplicantName' | 'goToStep'>;

export default function IdentityStep({ stepAnimClass, applicantName, setApplicantName, goToStep }: Props) {
  const canContinue = applicantName.trim().length >= 2;

  return (
    <section className={`mx-auto max-w-3xl space-y-6 ${stepAnimClass}`} aria-labelledby="identity-title">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary"><Text>Applicant details</Text></p>
        <h2 id="identity-title" className="mt-2 font-headline-lg text-headline-lg font-bold text-primary">
          <Text>Who is this project report for?</Text>
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-7 text-on-surface-variant">
          <Text>Enter the name that should appear on the report. You can complete formal identity checks with the lender later.</Text>
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container p-5 sm:p-7">
        <label htmlFor="applicant-name" className="block text-base font-semibold text-primary">
          <Text>Applicant full name</Text>
        </label>
        <input
          id="applicant-name"
          name="applicant-name"
          autoComplete="name"
          value={applicantName}
          onChange={(event) => setApplicantName(event.target.value)}
          placeholder="Enter your name"
          className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-base text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-secondary-container/50 p-4 text-sm leading-6 text-on-surface-variant">
          <Info size={19} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
          <p><Text>DigiLocker verification is not connected in this release. We will never show a simulated verification as a real one.</Text></p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5">
        <button type="button" onClick={() => goToStep(4)} className="rounded-full border border-secondary px-5 py-3 text-secondary">
          <Text>Back to funding</Text>
        </button>
        <button
          type="button"
          onClick={() => goToStep(6)}
          disabled={!canContinue}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Text>Review project report</Text>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
