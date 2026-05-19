import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, X, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrandPill } from '@/modules/EspaceClient/shared/components';
import { cn } from '@/lib/utils';
import { useWelcomeWizard } from './useWelcomeWizard';
import { Step1Welcome } from './steps/Step1Welcome';
import { Step2Contact } from './steps/Step2Contact';
import { Step3Preferences } from './steps/Step3Preferences';
import { Step4Tour } from './steps/Step4Tour';
import { Step5Done } from './steps/Step5Done';
import '@/modules/EspaceClient/shared/layouts/portal-theme.css';

interface WelcomeWizardProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

// Métadonnées d'étape : nom (lecture humaine) + estimation temps restant.
const STEPS: ReadonlyArray<{ num: number; label: string; minutesLeft: number }> = [
  { num: 1, label: 'Bienvenue',     minutesLeft: 2 },
  { num: 2, label: 'Coordonnées',   minutesLeft: 2 },
  { num: 3, label: 'Préférences',   minutesLeft: 1 },
  { num: 4, label: 'Tour',          minutesLeft: 1 },
  { num: 5, label: 'Tout est prêt', minutesLeft: 0 },
];

const TRANSITION = { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };

export function WelcomeWizard({ projectId, open, onOpenChange, onCompleted }: WelcomeWizardProps) {
  const wizard = useWelcomeWizard(projectId);
  const { currentStep, loading, goToStep, dismiss, complete } = wizard;

  // "Terminer plus tard" + fermeture par Esc = même comportement : incrémente
  // dismissed_count, ferme. La logique d'ouverture auto au prochain login est
  // gérée par PortalShell (palier 10) via shouldOpenAutomatically.
  const handleDismiss = async () => {
    await dismiss();
    onOpenChange(false);
  };

  const handleNext = () => {
    if (currentStep < 5) goToStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  const handleComplete = async () => {
    const { error } = await complete();
    if (error) return; // saveError sera affiché par le hook (composant futur)
    onOpenChange(false);
    onCompleted?.();
  };

  const isLast = currentStep === 5;
  const stepMeta = STEPS[currentStep - 1];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) void handleDismiss(); else onOpenChange(true); }}>
      <DialogContent
        className={cn(
          'propulspace-portal ps-shadow-floating max-w-[940px] gap-0 overflow-hidden p-0',
          'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px',
          'before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
          'max-sm:h-[100dvh] max-sm:max-w-full max-sm:rounded-none',
        )}
      >
        {/* Accessibilité : titre + description pour les lecteurs d'écran (sr-only). */}
        <DialogTitle className="sr-only">Bienvenue dans votre Propul'Space — étape {currentStep} sur 5</DialogTitle>
        <DialogDescription className="sr-only">
          Quelques minutes pour vérifier vos informations, caler vos préférences, et démarrer votre projet.
        </DialogDescription>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[var(--ps-border)] px-7 py-4">
          <div className="flex items-center gap-3.5">
            <BrandPill size="md" />
            <span
              role="status"
              aria-live="polite"
              className="ps-eyebrow-muted inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-bg-subtle)] px-2.5 py-1 text-[11px] tracking-wide"
            >
              Onboarding
              <span className="ps-num text-[var(--ps-fg)]">{currentStep}</span>
              <span className="opacity-50">/</span>
              <span className="ps-num opacity-60">5</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ps-tap h-8 gap-1.5 text-[12px] text-[var(--ps-fg-muted)] hover:text-[var(--ps-fg)]"
          >
            <X className="h-3.5 w-3.5" />
            Terminer plus tard
          </Button>
        </div>

        {/* ── Progress dots ─────────────────────────────────────────── */}
        <div
          className="flex items-center gap-1.5 px-7 py-3.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={currentStep}
        >
          {STEPS.map(s => {
            const isActive = s.num === currentStep;
            const isPast = s.num < currentStep;
            return (
              <div
                key={s.num}
                className={cn(
                  'relative h-[5px] flex-1 overflow-hidden rounded-full bg-[var(--ps-bg-subtle)]',
                )}
                aria-hidden="true"
              >
                <motion.div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full',
                    isActive && 'ps-brand-gradient ps-glow-violet-soft',
                    isPast && 'bg-[var(--ps-primary)]',
                  )}
                  initial={false}
                  animate={{ width: isActive || isPast ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            );
          })}
        </div>

        {/* ── Content area ──────────────────────────────────────────── */}
        <div className="min-h-[440px] px-7 py-7 max-sm:px-5 max-sm:py-5">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center text-sm text-[var(--ps-fg-muted)]">
              Chargement de votre espace…
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 18, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -18, scale: 0.985 }}
                transition={TRANSITION}
              >
                {currentStep === 1 && <Step1Welcome wizard={wizard} />}
                {currentStep === 2 && <Step2Contact wizard={wizard} />}
                {currentStep === 3 && <Step3Preferences wizard={wizard} />}
                {currentStep === 4 && <Step4Tour wizard={wizard} />}
                {currentStep === 5 && <Step5Done wizard={wizard} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-[var(--ps-border)] px-7 py-4">
          {currentStep > 1 ? (
            <Button variant="ghost" size="sm" onClick={handlePrev} className="ps-tap h-9 gap-1.5 text-[var(--ps-fg-muted)] hover:text-[var(--ps-fg)]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Précédent
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {!isLast && stepMeta.minutesLeft > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-bg-subtle)] px-2.5 py-1 text-[11.5px] text-[var(--ps-fg-muted)]">
                <Clock className="h-3 w-3" />
                <span className="ps-num">~ {stepMeta.minutesLeft} min</span>
              </span>
            )}
            {isLast ? (
              <Button onClick={handleComplete} className="ps-brand-gradient ps-glow-violet-soft ps-tap h-9 gap-1.5 text-white">
                <CheckCircle2 className="h-4 w-4" />
                Accéder à mon espace
              </Button>
            ) : (
              <Button onClick={handleNext} className="ps-brand-gradient ps-glow-violet-soft ps-tap h-9 gap-1.5 text-white">
                Suivant
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
