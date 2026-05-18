import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, SkipForward } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useOnboarding, type OnboardingRow } from './useOnboarding';
import { OnboardingStep1Recap } from './steps/OnboardingStep1Recap';
import { OnboardingStep2Brand } from './steps/OnboardingStep2Brand';
import { OnboardingStep3Visual } from './steps/OnboardingStep3Visual';
import { OnboardingStep4Access } from './steps/OnboardingStep4Access';
import { OnboardingStep5Kickoff } from './steps/OnboardingStep5Kickoff';

const STEP_LABELS = ['Récap', 'Marque', 'Visuel', 'Accès tech', 'Kickoff'];
const TOTAL_STEPS = 5;

interface OnboardingWizardProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingWizard({ projectId, open, onOpenChange }: OnboardingWizardProps) {
  const { row, loading, saving, percent, isComplete, setField, markComplete } = useOnboarding(projectId);
  const [step, setStep] = useState(1);
  const [finishing, setFinishing] = useState(false);

  const goNext = () => setStep(s => Math.min(TOTAL_STEPS, s + 1));
  const goPrev = () => setStep(s => Math.max(1, s - 1));

  async function handleFinish() {
    setFinishing(true);
    await markComplete();
    setFinishing(false);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="propulspace-portal w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Onboarding</SheetTitle>
          <SheetDescription>
            Aidez-nous à bien démarrer votre projet. Vous pouvez tout remplir d'un coup ou revenir plus tard.
          </SheetDescription>
        </SheetHeader>

        {/* Stepper */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px]">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(n)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 transition-colors ${
                  active ? 'border-[var(--ps-primary)] bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)] font-semibold'
                  : done ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-[var(--ps-border-soft)] text-[var(--ps-fg-muted)]'
                }`}
              >
                {done && <CheckCircle2 className="h-3 w-3" />}
                <span>{n}. {label}</span>
              </button>
            );
          })}
        </div>

        {/* Progress global */}
        <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--ps-fg-muted)]">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--ps-bg-subtle)]">
            <div className="h-full bg-[var(--ps-primary)] transition-all" style={{ width: `${percent}%` }} />
          </div>
          <span className="ps-num font-medium">{percent}%</span>
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>

        {/* Content */}
        <div className="mt-5 min-h-[280px]">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-[var(--ps-fg-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              {step === 1 && <OnboardingStep1Recap row={row} />}
              {step === 2 && <OnboardingStep2Brand row={row} setField={setField as unknown as <K extends keyof OnboardingRow>(k: K, v: OnboardingRow[K]) => void} />}
              {step === 3 && <OnboardingStep3Visual row={row} setField={setField as unknown as <K extends keyof OnboardingRow>(k: K, v: OnboardingRow[K]) => void} />}
              {step === 4 && <OnboardingStep4Access row={row} setField={setField as unknown as <K extends keyof OnboardingRow>(k: K, v: OnboardingRow[K]) => void} />}
              {step === 5 && <OnboardingStep5Kickoff row={row} setField={setField as unknown as <K extends keyof OnboardingRow>(k: K, v: OnboardingRow[K]) => void} />}
            </>
          )}
        </div>

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between gap-2 border-t border-[var(--ps-border-soft)] pt-4">
          <Button variant="ghost" onClick={goPrev} disabled={step === 1}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />Précédent
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-[12px] text-[var(--ps-fg-muted)]">
              Terminer plus tard
            </Button>
            {step < TOTAL_STEPS ? (
              <>
                <Button variant="outline" size="sm" onClick={goNext} className="gap-1">
                  <SkipForward className="h-3.5 w-3.5" />Passer
                </Button>
                <Button onClick={goNext} className="ps-brand-gradient text-white">
                  Suivant<ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={finishing || isComplete}
                className="ps-brand-gradient text-white"
              >
                {finishing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                {isComplete ? 'Onboarding terminé' : 'Terminer l\'onboarding'}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
