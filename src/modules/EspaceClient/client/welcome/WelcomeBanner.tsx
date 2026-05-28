import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DISMISS_THRESHOLD } from './useWelcomeWizard';
import { useWelcomeWizardCtx } from './WelcomeWizardContext';

// Palier 9 — bannière dashboard "Reprendre l'onboarding".
// Visible uniquement si le client a fermé la modale d'accueil 3 fois ou plus
// SANS l'avoir complétée. Palier 10 : consomme l'instance unique du wizard via
// WelcomeWizardContext (plus de duplication d'instance — dette HIGH #2 fermée).

export function WelcomeBanner() {
  const { wizard, openWizard } = useWelcomeWizardCtx();
  const { row, loading, isCompleted, currentStep } = wizard;

  if (loading) return null;
  if (isCompleted) return null;

  const dismissed = row?.welcome_dismissed_count ?? 0;
  if (dismissed < DISMISS_THRESHOLD) return null;

  const stepLabel = `Étape ${currentStep}/5`;

  return (
    <div className="ps-surface ps-lift relative flex items-center gap-4 overflow-hidden rounded-2xl p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--ps-primary-subtle),transparent_70%)]"
      />

      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ps-primary)] to-[var(--ps-primary-deep)] ps-glow-violet-soft">
        <Sparkles className="h-5 w-5 text-white" />
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-[var(--ps-fg)]">
            Reprenez votre onboarding
          </p>
          <span className="ps-num rounded-full bg-[var(--ps-bg-subtle)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--ps-fg-muted)]">
            {stepLabel}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-[var(--ps-fg-secondary)]">
          Quelques minutes pour finir de configurer votre espace.
        </p>
      </div>

      <Button
        size="sm"
        onClick={openWizard}
        className="ps-brand-gradient ps-glow-violet-soft ps-tap relative h-9 gap-1.5 font-semibold text-white"
      >
        Reprendre
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
