import { motion } from 'framer-motion';
import { QUALIF_TOTAL_STEPS_SITE } from '../constants';

interface ProgressBarProps {
  currentStep: number;     // 1..totalSteps
  completedSteps?: number; // nombre d'étapes validées
  totalSteps?: number;     // dynamique selon project_type (default 8 = site)
}

// DA Aurora : segments remplis en violet de marque (--ps-primary),
// fond clair neutre pour les étapes à venir.
export function ProgressBar({
  currentStep,
  completedSteps = Math.max(0, currentStep - 1),
  totalSteps = QUALIF_TOTAL_STEPS_SITE,
}: ProgressBarProps) {
  const boundedCompleted = Math.min(totalSteps, Math.max(0, completedSteps));
  const percent = Math.round((boundedCompleted / totalSteps) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4 text-[12.5px]">
        <span className="font-bold uppercase tracking-[0.18em] text-stone-500">
          Étape {currentStep} sur {totalSteps}
        </span>
        <span className="font-semibold tabular-nums text-violet-700">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep}
        aria-label="Progression du questionnaire"
        className="flex items-center gap-2"
      >
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(stepNum => {
          const isComplete = stepNum <= boundedCompleted;
          return (
            <div
              key={stepNum}
              aria-hidden
              className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-[var(--ps-bg-subtle)] shadow-inner shadow-stone-200/80"
            >
              <motion.div
                className={
                  isComplete
                    ? 'absolute inset-y-0 left-0 rounded-full bg-[var(--ps-primary)]'
                    : 'absolute inset-y-0 left-0 rounded-full'
                }
                initial={false}
                animate={{ width: isComplete ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
