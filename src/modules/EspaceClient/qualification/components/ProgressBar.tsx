import type { CSSProperties } from 'react';
import { QUALIF_TOTAL_STEPS } from '../constants';

interface ProgressBarProps {
  currentStep: number; // 1..7
}

// Largeur dynamique passée par CSS custom property `--ps-bar-w` (interprétée
// dans portal-theme.css via la classe `.ps-progress-fill`). Évite le style
// inline (règle projet "pas d'inline styles").
type BarStyle = CSSProperties & { '--ps-bar-w': string };

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const percent = Math.round((currentStep / QUALIF_TOTAL_STEPS) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-[12.5px]">
        <span className="ps-eyebrow ps-eyebrow-muted">Étape {currentStep} sur {QUALIF_TOTAL_STEPS}</span>
        <span className="ps-num font-semibold text-[var(--ps-primary-text)]">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Progression du questionnaire"
        className="h-1.5 overflow-hidden rounded-full bg-[var(--ps-bg-subtle)]"
      >
        <div
          className="ps-progress-fill ps-brand-gradient h-full rounded-full transition-all duration-500 [transition-timing-function:var(--ps-ease-out)]"
          style={{ '--ps-bar-w': `${percent}%` } as BarStyle}
        />
      </div>
    </div>
  );
}
