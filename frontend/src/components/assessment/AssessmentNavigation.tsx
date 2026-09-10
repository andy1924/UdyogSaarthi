import { Text } from '../../lib/LanguageContext';
import { isStepAccessible } from '../../lib/assessment-workflow';

const STEPS = ['Location', 'Business idea', 'Local demand', 'Funding', 'Identity', 'Project report'];

interface AssessmentNavigationProps {
  currentStep: number;
  highestStepReached: number;
  onStepChange: (step: number) => void;
}

/** One responsive navigation, shared by desktop and the mobile thumb zone. */
export default function AssessmentNavigation({ currentStep, highestStepReached, onStepChange }: AssessmentNavigationProps) {
  return (
    <nav aria-label="Assessment steps" className="assessment-navigation">
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-container" role="progressbar" aria-label="Application progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={currentStep}>
        <div className="h-full rounded-full bg-secondary transition-[width]" style={{ width: `${(currentStep / STEPS.length) * 100}%` }} />
      </div>
      <p className="mb-2 text-sm font-semibold text-on-surface-variant md:hidden" aria-live="polite">
        <Text>Step</Text> {currentStep} <Text>of</Text> {STEPS.length} · <Text>{STEPS[currentStep - 1]}</Text>
      </p>
      <ol className="grid grid-cols-3 gap-1.5 md:grid-cols-6">
        {STEPS.map((label, index) => {
          const step = index + 1;
          const active = step === currentStep;
          const locked = !isStepAccessible(step, highestStepReached);
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => onStepChange(step)}
                disabled={locked}
                aria-current={active ? 'step' : undefined}
                aria-label={`${label}${locked ? ' — complete previous steps first' : ''}`}
                className={`flex min-h-12 w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm leading-relaxed transition-colors md:px-3 ${active ? 'bg-primary text-on-primary' : locked ? 'cursor-not-allowed text-on-surface-variant/45' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                <span aria-hidden="true" className="shrink-0 font-mono text-xs opacity-70">{step}</span>
                <span><Text>{label}</Text></span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
