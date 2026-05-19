import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWelcomeWizard, DISMISS_THRESHOLD } from './useWelcomeWizard';

// Palier 9 — bannière dashboard "Reprendre l'onboarding".
// Visible uniquement si le client a fermé la modale d'accueil 3 fois ou plus
// SANS l'avoir complétée. Cette logique anti-frustration empêche d'ouvrir
// automatiquement la modale au-delà du seuil mais propose un point d'entrée
// non-bloquant pour ceux qui veulent y revenir.
//
// La bannière ne pilote pas l'ouverture elle-même : elle remonte un callback
// au parent (DashboardPage / PortalShell au palier 10). Le state d'ouverture
// vit hors de la bannière pour éviter le couplage avec le WelcomeWizard.
//
// ⚠️ DETTE TECHNIQUE (code review HIGH #2, différé palier 10) : ce composant
// instancie sa propre instance de useWelcomeWizard, distincte de celle du
// WelcomeWizard modal. Si les deux sont montés simultanément (cas DashboardPage
// actuel), risque de désync sur welcome_dismissed_count et welcome_completed_at.
// À refondre au palier 10 : faire descendre une instance unique depuis
// PortalShell via context ou prop drilling.

interface WelcomeBannerProps {
  projectId: string;
  onReopen: () => void;
}

export function WelcomeBanner({ projectId, onReopen }: WelcomeBannerProps) {
  const { row, loading, isCompleted, currentStep } = useWelcomeWizard(projectId);

  // Phase de chargement initial : on n'affiche rien (évite un flash de
  // bannière qui disparaît juste après si le user a complété).
  if (loading) return null;
  if (isCompleted) return null;

  const dismissed = row?.welcome_dismissed_count ?? 0;
  if (dismissed < DISMISS_THRESHOLD) return null;

  // À ce stade : user a fermé 3+ fois sans terminer. On affiche la bannière
  // discrète avec un indicateur d'où il en était (current_step).
  const stepLabel = `Étape ${currentStep}/5`;

  return (
    <div className="ps-surface ps-lift relative flex items-center gap-4 overflow-hidden rounded-2xl p-4">
      {/* Halo violet diffus côté gauche pour l'identité visuelle */}
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
        onClick={onReopen}
        className="ps-brand-gradient ps-glow-violet-soft ps-tap relative h-9 gap-1.5 font-semibold text-white"
      >
        Reprendre
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
