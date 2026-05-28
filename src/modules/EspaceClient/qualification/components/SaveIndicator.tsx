import { Check, Loader2, Clock } from 'lucide-react';
import { QUALIF_TOTAL_STEPS_SITE } from '../constants';

interface SaveIndicatorProps {
  saving: boolean;
  savedJustNow: boolean;
  currentStep: number;
  totalSteps?: number;
}

// Estimation simple : ~1 min par étape restante.
function remainingMinutes(currentStep: number, total: number): number {
  return Math.max(1, total - currentStep + 1);
}

export function SaveIndicator({ saving, savedJustNow, currentStep, totalSteps = QUALIF_TOTAL_STEPS_SITE }: SaveIndicatorProps) {
  return (
    <div className="flex items-center gap-3 text-[11.5px] text-stone-500">
      <span className="inline-flex items-center gap-1.5">
        {saving ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-sky-600" />
            Sauvegarde…
          </>
        ) : savedJustNow ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-600">
            <Check className="h-3 w-3" strokeWidth={3} />
            Sauvegardé
          </span>
        ) : (
          <span className="opacity-0">·</span>
        )}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3 w-3" />
        ≈ {remainingMinutes(currentStep, totalSteps)} min restantes
      </span>
    </div>
  );
}
