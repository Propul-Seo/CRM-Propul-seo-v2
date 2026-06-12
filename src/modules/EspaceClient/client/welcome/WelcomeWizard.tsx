import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, X, CheckCircle2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWelcomeWizardCtx } from './WelcomeWizardContext';
import { Step1Welcome } from './steps/Step1Welcome';
import { Step2Contact } from './steps/Step2Contact';
import { Step3Preferences } from './steps/Step3Preferences';
import { Step4Tour } from './steps/Step4Tour';
import { Step5Done } from './steps/Step5Done';

interface WelcomeWizardProps {
  onCompleted?: () => void;
}

const STEPS: ReadonlyArray<{ num: number; label: string; minutesLeft: number }> = [
  { num: 1, label: 'Bienvenue',     minutesLeft: 2 },
  { num: 2, label: 'Coordonnées',   minutesLeft: 2 },
  { num: 3, label: 'Préférences',   minutesLeft: 1 },
  { num: 4, label: 'Tour',          minutesLeft: 1 },
  { num: 5, label: 'Tout est prêt', minutesLeft: 0 },
];

const TRANSITION = { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };

export function WelcomeWizard({ onCompleted }: WelcomeWizardProps) {
  const { wizard, isOpen, openWizard, closeWizard } = useWelcomeWizardCtx();
  const { currentStep, loading, goToStep, dismiss, complete } = wizard;

  const handleDismiss = async () => { await dismiss(); closeWizard(); };
  const handleNext = () => { if (currentStep < 5) goToStep(currentStep + 1); };
  const handlePrev = () => { if (currentStep > 1) goToStep(currentStep - 1); };
  const handleComplete = async () => {
    const { error } = await complete();
    if (error) return;
    closeWizard();
    onCompleted?.();
  };

  const isLast = currentStep === 5;
  const stepMeta = STEPS[currentStep - 1];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) void handleDismiss(); else openWizard(); }}>
      <DialogContent
        className={cn(
          // Scope Aurora clair : rend les tokens --ps-* et classes .ps-* dispo
          // dans le portal Radix (rendu hors de l'arbre .propulspace-portal).
          'propulspace-portal !min-h-0 max-w-[820px] gap-0 overflow-hidden border-0 p-0',
          'bg-[var(--ps-bg)] text-[var(--ps-fg)] shadow-[var(--ps-shadow-floating)]',
          'max-sm:h-[100dvh] max-sm:max-w-full max-sm:rounded-none',
          '[&>button]:hidden', // masque le X automatique de shadcn
        )}
      >
        <DialogTitle className="sr-only">Bienvenue dans votre Propul'Space — étape {currentStep} sur 5</DialogTitle>
        <DialogDescription className="sr-only">
          Quelques minutes pour vérifier vos informations, caler vos préférences, et démarrer votre projet.
        </DialogDescription>

        {/* Halos violets diffus partagés (un seul accent — DA Aurora) */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="ps-hero-glow absolute -left-[10%] top-[5%] h-[400px] w-[600px] rounded-full opacity-70 blur-3xl" />
          <div className="ps-hero-glow absolute -right-[5%] bottom-[0%] h-[320px] w-[500px] rounded-full opacity-50 blur-3xl" />
        </div>

        {/* Header */}
        <div className="ps-frosted relative z-10 flex items-center justify-between border-b border-[var(--ps-border-soft)] px-6 py-2">
          <div className="flex items-center gap-3">
            <div className="ps-brand-gradient inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold text-white shadow-sm">
              <Sparkles className="h-3 w-3" />Propul'SEO
            </div>
            <span
              role="status" aria-live="polite"
              className="rounded-full bg-[var(--ps-bg-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--ps-fg-secondary)] ring-1 ring-[var(--ps-border)]"
            >
              Onboarding <span className="font-mono tabular-nums text-[var(--ps-fg)]">{currentStep}</span>
              <span className="opacity-40">/</span><span className="font-mono opacity-60">5</span>
            </span>
          </div>
          <Button
            type="button" variant="outline" size="sm"
            onClick={() => { void handleDismiss(); }}
            className="h-8 gap-1.5 border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] text-[12px] font-medium text-[var(--ps-fg-secondary)] hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]"
          >
            <X className="h-3.5 w-3.5" />Terminer plus tard
          </Button>
        </div>

        {/* Progress dots */}
        <div className="relative z-10 flex items-center gap-1.5 px-6 py-2"
          role="progressbar" aria-valuemin={1} aria-valuemax={5} aria-valuenow={currentStep}>
          {STEPS.map(s => {
            const isActive = s.num === currentStep;
            const isPast = s.num < currentStep;
            return (
              <div key={s.num} className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-[var(--ps-bg-subtle)]" aria-hidden="true">
                <motion.div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full',
                    isActive && 'ps-brand-gradient',
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

        {/* Content */}
        <div className="relative z-10 min-h-[380px] px-6 py-4 max-sm:px-5 max-sm:py-5">
          {loading ? (
            <div className="grid h-[340px] content-center gap-4 md:grid-cols-2" role="status" aria-label="Chargement de votre espace">
              <div className="space-y-3">
                <div className="ps-skeleton h-11 w-11 !rounded-2xl" />
                <div className="ps-skeleton h-9 w-3/4" />
                <div className="ps-skeleton h-4 w-full" />
                <div className="ps-skeleton h-4 w-2/3" />
              </div>
              <div className="space-y-3">
                <div className="ps-skeleton h-6 w-1/2" />
                <div className="ps-skeleton h-20 w-full" />
                <div className="ps-skeleton h-20 w-full" />
              </div>
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

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-[var(--ps-border-soft)] bg-[var(--ps-bg-elevated)] px-6 py-2">
          {currentStep > 1 ? (
            <Button variant="ghost" size="sm" onClick={handlePrev}
              className="h-9 gap-1.5 text-[var(--ps-fg-muted)] hover:bg-transparent hover:text-[var(--ps-fg)]">
              <ArrowLeft className="h-3.5 w-3.5" />Précédent
            </Button>
          ) : <span />}
          <div className="flex items-center gap-3">
            {!isLast && stepMeta.minutesLeft > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-[var(--ps-bg-subtle)] px-2 py-0.5 text-[11px] font-mono tabular-nums text-[var(--ps-fg-muted)]">
                <Clock className="h-3 w-3" />~ {stepMeta.minutesLeft} min
              </span>
            )}
            {isLast ? (
              <Button onClick={handleComplete}
                className="ps-brand-gradient ps-glow-violet-soft ps-tap h-9 gap-1.5 rounded-full px-5 text-[12.5px] font-semibold text-white">
                <CheckCircle2 className="h-4 w-4" />Accéder à mon espace
              </Button>
            ) : (
              <Button onClick={handleNext}
                className="ps-brand-gradient ps-glow-violet-soft ps-tap h-9 gap-1.5 rounded-full px-5 text-[12.5px] font-semibold text-white">
                Suivant <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
