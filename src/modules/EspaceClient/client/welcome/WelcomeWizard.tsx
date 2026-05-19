import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, X, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWelcomeWizard } from './useWelcomeWizard';
import { Step1Welcome } from './steps/Step1Welcome';
import { Step2Contact } from './steps/Step2Contact';
import { Step3Preferences } from './steps/Step3Preferences';
import { Step4Tour } from './steps/Step4Tour';
import { Step5Done } from './steps/Step5Done';

interface WelcomeWizardProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function WelcomeWizard({ projectId, open, onOpenChange, onCompleted }: WelcomeWizardProps) {
  const wizard = useWelcomeWizard(projectId);
  const { currentStep, loading, goToStep, dismiss, complete } = wizard;

  const handleDismiss = async () => { await dismiss(); onOpenChange(false); };
  const handleNext = () => { if (currentStep < 5) goToStep(currentStep + 1); };
  const handlePrev = () => { if (currentStep > 1) goToStep(currentStep - 1); };
  const handleComplete = async () => {
    const { error } = await complete();
    if (error) return;
    onOpenChange(false);
    onCompleted?.();
  };

  const isLast = currentStep === 5;
  const stepMeta = STEPS[currentStep - 1];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) void handleDismiss(); else onOpenChange(true); }}>
      <DialogContent
        className={cn(
          'max-w-[820px] gap-0 overflow-hidden border-0 p-0',
          'max-sm:h-[100dvh] max-sm:max-w-full max-sm:rounded-none',
          '[&>button]:hidden', // masque le X automatique de shadcn
        )}
        style={{
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fff7ed 100%)',
          color: '#1c1917', // stone-900 — force texte foncé contre theme dark CRM
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 40px 80px -20px rgba(139,92,246,0.30), inset 0 1px 0 rgba(255,255,255,0.5)',
        }}
      >
        <DialogTitle className="sr-only">Bienvenue dans votre Propul'Space — étape {currentStep} sur 5</DialogTitle>
        <DialogDescription className="sr-only">
          Quelques minutes pour vérifier vos informations, caler vos préférences, et démarrer votre projet.
        </DialogDescription>

        {/* Auroras diagonales partagées */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-[10%] top-[5%] h-[400px] w-[600px] -rotate-12 rounded-full opacity-45 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, #7dd3fc 0%, transparent 60%)' }} />
          <div className="absolute right-[5%] top-[20%] h-[400px] w-[500px] rotate-12 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, #c4b5fd 0%, transparent 60%)' }} />
          <div className="absolute left-[30%] bottom-[0%] h-[300px] w-[500px] rounded-full opacity-45 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, #fed7aa 0%, transparent 60%)' }} />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/40 bg-white/50 px-6 py-2 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-7 items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-3 text-[11px] font-bold text-white shadow-sm">
              ✨ Propul'SEO
            </div>
            <span
              role="status" aria-live="polite"
              className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-stone-600 ring-1 ring-stone-200/60"
            >
              Onboarding <span className="font-mono tabular-nums text-stone-900">{currentStep}</span>
              <span className="opacity-40">/</span><span className="font-mono opacity-60">5</span>
            </span>
          </div>
          <Button
            type="button" variant="outline" size="sm"
            onClick={() => { void handleDismiss(); }}
            className="h-8 gap-1.5 border-stone-200 bg-white text-[12px] font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          >
            <X className="h-3.5 w-3.5" />Terminer plus tard
          </Button>
        </div>

        {/* Progress dots */}
        <div className="relative z-10 flex items-center gap-1.5 bg-white/30 px-6 py-2 backdrop-blur-sm"
          role="progressbar" aria-valuemin={1} aria-valuemax={5} aria-valuenow={currentStep}>
          {STEPS.map(s => {
            const isActive = s.num === currentStep;
            const isPast = s.num < currentStep;
            return (
              <div key={s.num} className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-white/60" aria-hidden="true">
                <motion.div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full',
                    isActive && 'bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 shadow-sm shadow-violet-500/30',
                    isPast && 'bg-violet-500',
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
            <div className="flex h-[340px] items-center justify-center text-sm text-stone-500">
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

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/40 bg-white/50 px-6 py-2 backdrop-blur-md">
          {currentStep > 1 ? (
            <Button variant="ghost" size="sm" onClick={handlePrev}
              className="h-9 gap-1.5 text-stone-500 hover:bg-transparent hover:text-stone-900">
              <ArrowLeft className="h-3.5 w-3.5" />Précédent
            </Button>
          ) : <span />}
          <div className="flex items-center gap-3">
            {!isLast && stepMeta.minutesLeft > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-mono tabular-nums text-stone-500">
                <Clock className="h-3 w-3" />~ {stepMeta.minutesLeft} min
              </span>
            )}
            {isLast ? (
              <Button onClick={handleComplete}
                className="h-9 gap-1.5 rounded-full bg-stone-900 px-5 text-[12.5px] font-semibold text-white shadow-lg hover:bg-stone-800">
                <CheckCircle2 className="h-4 w-4" />Accéder à mon espace
              </Button>
            ) : (
              <Button onClick={handleNext}
                className="h-9 gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-5 text-[12.5px] font-semibold text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50">
                Suivant <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
