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

const TRANSITION = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const };

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
      <DialogContent className="propulspace-portal max-w-[940px] gap-0 p-0 max-sm:h-[100dvh] max-sm:max-w-full max-sm:rounded-none">
        {/* Accessibilité : titre + description pour les lecteurs d'écran (sr-only). */}
        <DialogTitle className="sr-only">Bienvenue dans votre Propul'Space — étape {currentStep} sur 5</DialogTitle>
        <DialogDescription className="sr-only">
          Quelques minutes pour vérifier vos informations, caler vos préférences, et démarrer votre projet.
        </DialogDescription>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[var(--ps-border)] px-6 py-3">
          <div className="flex items-center gap-3">
            <BrandPill size="md" />
            <span
              role="status"
              aria-live="polite"
              className="text-[12.5px] font-medium text-[var(--ps-fg-muted)]"
            >
              Onboarding · {currentStep}/5
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="h-8 gap-1.5 text-[12px]"
          >
            <X className="h-3.5 w-3.5" />
            Terminer plus tard
          </Button>
        </div>

        {/* ── Progress dots ─────────────────────────────────────────── */}
        <div className="flex gap-1.5 px-6 py-3" role="progressbar"
             aria-valuemin={1} aria-valuemax={5} aria-valuenow={currentStep}>
          {STEPS.map(s => (
            <div
              key={s.num}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                s.num === currentStep && 'ps-brand-gradient',
                s.num < currentStep && 'bg-[var(--ps-primary)]',
                s.num > currentStep && 'bg-[var(--ps-bg-subtle)]',
              )}
              aria-label={s.label}
            />
          ))}
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
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
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
        <div className="flex items-center justify-between border-t border-[var(--ps-border)] px-6 py-3">
          {currentStep > 1 ? (
            <Button variant="ghost" size="sm" onClick={handlePrev} className="h-9 gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Précédent
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {!isLast && stepMeta.minutesLeft > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-[var(--ps-fg-muted)]">
                <Clock className="h-3 w-3" />~ {stepMeta.minutesLeft} min
              </span>
            )}
            {isLast ? (
              <Button onClick={handleComplete} className="ps-brand-gradient h-9 gap-1.5 text-white">
                <CheckCircle2 className="h-4 w-4" />
                Accéder à mon espace
              </Button>
            ) : (
              <Button onClick={handleNext} className="ps-brand-gradient h-9 gap-1.5 text-white">
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
