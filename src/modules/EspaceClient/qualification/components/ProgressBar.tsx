import { motion } from 'framer-motion';
import { QUALIF_TOTAL_STEPS_SITE } from '../constants';

interface ProgressBarProps {
  currentStep: number;     // 1..totalSteps
  totalSteps?: number;     // dynamique selon project_type (default 8 = site)
}

// DA Sky Aurora : dots gradient sky→violet→pink pour l'étape active,
// violet plein pour les passées, fond stone pour à venir.
export function ProgressBar({ currentStep, totalSteps = QUALIF_TOTAL_STEPS_SITE }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-[12.5px]">
        <span className="font-semibold uppercase tracking-wider text-stone-500">
          Étape {currentStep} sur {totalSteps}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep}
        aria-label="Progression du questionnaire"
        className="flex items-center gap-1.5"
      >
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(stepNum => {
          const isActive = stepNum === currentStep;
          const isPast = stepNum < currentStep;
          return (
            <div
              key={stepNum}
              aria-hidden
              className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-stone-200/60"
            >
              <motion.div
                className={
                  isActive
                    ? 'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 shadow-sm shadow-violet-500/30'
                    : isPast
                      ? 'absolute inset-y-0 left-0 rounded-full bg-violet-500'
                      : 'absolute inset-y-0 left-0 rounded-full'
                }
                initial={false}
                animate={{ width: isActive || isPast ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
