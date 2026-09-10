const STEPS = ['Location', 'Business idea', 'Local demand', 'Funding', 'Identity', 'Project report'];

interface AssessmentNavigationProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

/** One responsive navigation, shared by desktop and the mobile thumb zone. */
export default function AssessmentNavigation({ currentStep, onStepChange }: AssessmentNavigationProps) {
  return (
    <nav aria-label="Assessment steps" className="assessment-navigation">
      <p className="mb-2 text-sm text-on-surface-variant md:hidden" aria-live="polite">
        Step {currentStep} of {STEPS.length} · {STEPS[currentStep - 1]}
      </p>
      <ol className="grid grid-cols-3 gap-1.5 md:grid-cols-6">
        {STEPS.map((label, index) => {
          const step = index + 1;
          const active = step === currentStep;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => onStepChange(step)}
                aria-current={active ? 'step' : undefined}
                className={`flex min-h-12 w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm leading-relaxed transition-colors md:px-3 ${active ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                <span aria-hidden="true" className="shrink-0 font-mono text-xs opacity-70">{step}</span>
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
