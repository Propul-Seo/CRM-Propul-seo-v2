import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from './useOnboarding';
import { OnboardingWizard } from './OnboardingWizard';

interface Props { projectId: string }

// Bannière persistante sur le dashboard tant que l'onboarding n'est pas
// marqué `is_complete`. Au clic, ouvre le wizard modal.

export function OnboardingBanner({ projectId }: Props) {
  const { isComplete, percent, loading } = useOnboarding(projectId);
  const [open, setOpen] = useState(false);

  if (loading || isComplete) return null;

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--ps-border-soft)] bg-gradient-to-r from-[var(--ps-primary-subtle)] to-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ps-primary)] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[var(--ps-fg)]">
              Complétez votre onboarding — {percent}%
            </p>
            <p className="text-[12px] text-[var(--ps-fg-muted)]">
              Quelques infos pour qu'on démarre votre projet sur les bons rails. ~10 minutes.
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
              <div className="h-full bg-[var(--ps-primary)] transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} className="ps-brand-gradient shrink-0 text-white">
          {percent === 0 ? 'Commencer' : 'Continuer'}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>

      <OnboardingWizard projectId={projectId} open={open} onOpenChange={setOpen} />
    </>
  );
}
