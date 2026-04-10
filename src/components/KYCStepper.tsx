import { Check } from 'lucide-react';
import { FC } from 'react';

import { useKYC, STEPS, type KYCStep } from '../context/KYCContext';
import { cn } from '../lib/utils';

type StepConfig = {
  key: KYCStep;
  label: string;
};

const STEP_CONFIGS: StepConfig[] = [
  { key: 'company-data', label: 'Dados da Empresa' },
  { key: 'address', label: 'Endereço' },
  { key: 'company-documents', label: 'Documentos' },
  { key: 'representatives', label: 'Representantes' },
  { key: 'review', label: 'Revisar e Enviar' },
];

export const KYCStepper: FC = () => {
  const { currentStep, currentStepIndex, goToStep, completedSteps } = useKYC();

  return (
    <nav className="w-full">
      <ol className="flex items-center w-full">
        {STEP_CONFIGS.map((step, index) => {
          const isCompleted = completedSteps.has(step.key) || index < currentStepIndex;
          const isCurrent = step.key === currentStep;
          const canNavigate = index <= currentStepIndex || completedSteps.has(step.key);

          return (
            <li
              key={step.key}
              className={cn('flex items-center', index < STEPS.length - 1 && 'flex-1')}
            >
              <button
                type="button"
                onClick={() => {
                  if (canNavigate) goToStep(step.key);
                }}
                disabled={!canNavigate}
                className="flex flex-col items-center gap-1.5 group disabled:cursor-not-allowed"
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary text-primary bg-primary/10',
                    !isCompleted &&
                      !isCurrent &&
                      'border-muted-foreground/30 text-muted-foreground/50',
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'text-xs text-center max-w-[80px] leading-tight hidden sm:block',
                    isCurrent && 'text-primary font-medium',
                    isCompleted && 'text-foreground',
                    !isCompleted && !isCurrent && 'text-muted-foreground/50',
                  )}
                >
                  {step.label}
                </span>
              </button>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 sm:mx-4',
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted-foreground/20',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
