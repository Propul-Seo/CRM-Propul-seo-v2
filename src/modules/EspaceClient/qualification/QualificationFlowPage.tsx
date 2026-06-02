import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useForceLightTheme } from '@/modules/EspaceClient/shared/hooks/useForceLightTheme';
import '@/modules/EspaceClient/shared/layouts/portal-theme.css';

import { useQualificationDraft } from './hooks/useQualificationDraft';
import { ProgressBar } from './components/ProgressBar';
import { SaveIndicator } from './components/SaveIndicator';
import { getStepFlow, shouldSkipForward, shouldSkipBackward } from './flowRouter';

type StepErrors = Record<string, string | undefined>;

const STEP_TRANSITION = { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const };

export function QualificationFlowPage() {
  useForceLightTheme();
  const navigate = useNavigate();
  const { draft, leadId, loading, saving, savedJustNow, setField, submit, clearDraft } = useQualificationDraft();
  const [currentStep, setCurrentStep] = useState(0); // 0 = Step0 (type de besoin)
  const [errors, setErrors] = useState<StepErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const flow = useMemo(() => getStepFlow(draft.project_type), [draft.project_type]);
  const totalSteps = flow.length;
  const currentDef = flow[Math.min(currentStep, totalSteps - 1)];
  const completedSteps = useMemo(
    () => flow.reduce((count, step) => count + (step.schema.safeParse(draft).success ? 1 : 0), 0),
    [draft, flow],
  );

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [currentStep]);

  // Si le user change de project_type après être déjà avancé, on le ramène
  // à l'étape 1 (identité) pour éviter qu'il soit projeté hors-flow.
  useEffect(() => {
    if (currentStep >= totalSteps) setCurrentStep(totalSteps - 1);
  }, [totalSteps, currentStep]);

  const validateCurrent = (): boolean => {
    const result = currentDef.schema.safeParse(draft);
    if (result.success) { setErrors({}); return true; }
    const next: StepErrors = {};
    const missingLabels: string[] = [];
    for (const issue of result.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !next[key]) {
        next[key] = issue.message;
        missingLabels.push(issue.message);
      }
    }
    const summary = missingLabels.slice(0, 3).join(' · ');
    next._global = `Complétez les champs requis avant de continuer — ${summary}`;
    setErrors(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return false;
  };

  const goNext = () => {
    if (!validateCurrent()) return;
    if (shouldSkipForward(currentDef.key, draft)) {
      // skip de "situation" vers "objectives" (index +2)
      setCurrentStep(s => Math.min(totalSteps - 1, s + 2));
      return;
    }
    setCurrentStep(s => Math.min(totalSteps - 1, s + 1));
  };

  const goPrev = () => {
    if (shouldSkipBackward(currentDef.key, draft)) {
      setCurrentStep(s => Math.max(0, s - 2));
      return;
    }
    setCurrentStep(s => Math.max(0, s - 1));
  };

  async function handleSubmit() {
    if (honeypot) {
      navigate('/diagnostic-envoye', { replace: true });
      return;
    }
    if (!validateCurrent()) return;
    setSubmitting(true);
    const { leadId: id, error: submitErr } = await submit();
    if (submitErr || !id) {
      setSubmitting(false);
      setErrors({ _global: submitErr ?? 'Échec de la soumission. Réessayez.' });
      return;
    }
    try {
      await supabase.functions.invoke('questionnaire-send-emails', { body: { lead_id: id } });
    } catch { /* silencieux — emails Phase 3 */ }
    clearDraft();
    setSubmitting(false);
    navigate('/diagnostic-envoye', { replace: true });
  }

  if (loading) {
    return (
      <div className="propulspace-portal flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div
      className="propulspace-portal ps-qualification-page relative min-h-screen"
    >
      <header className="sticky top-0 z-20 border-b border-white/55 bg-white/72 shadow-[0_10px_40px_-34px_rgba(24,24,27,0.45)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-4 text-[11px] font-bold text-white shadow-lg shadow-violet-500/20">
            ✨ Propul'SEO
          </div>
          <SaveIndicator saving={saving} savedJustNow={savedJustNow} currentStep={currentStep + 1} totalSteps={totalSteps} />
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-4 md:px-6">
          <ProgressBar currentStep={currentStep + 1} completedSteps={completedSteps} totalSteps={totalSteps} />
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-3xl px-4 py-8 pb-32 md:px-6 md:py-10 md:pb-36">
        {errors._global && (
          <div role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-[13px] text-red-800 shadow-sm backdrop-blur-sm">
            <p className="font-semibold">⚠️ {errors._global}</p>
          </div>
        )}
        <motion.div key={currentStep}
          initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={STEP_TRANSITION}>
          {currentDef.render({ draft, setField, errors, leadId })}
        </motion.div>
        <label aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          Ne remplissez pas ce champ
          <input type="text" tabIndex={-1} autoComplete="off"
            value={honeypot} onChange={e => setHoneypot(e.target.value)} />
        </label>
      </main>

      <footer className="sticky bottom-0 z-20 border-t border-white/60 bg-white/78 shadow-[0_-18px_44px_-34px_rgba(24,24,27,0.55)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Button variant="outline" onClick={goPrev} disabled={currentStep === 0 || submitting}
            className="h-11 rounded-full border-white/80 bg-white/90 px-5 text-stone-700 shadow-sm hover:bg-white">
            <ArrowLeft className="mr-1.5 h-4 w-4" />Précédent
          </Button>

          {!isLastStep ? (
            <Button onClick={goNext}
              className="h-12 gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-8 font-semibold text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50">
              Suivant<ArrowRight className="ml-0.5 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}
              className="h-12 gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-8 font-semibold text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 disabled:opacity-60">
              {submitting
                ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Envoi…</>
                : <><Send className="mr-1.5 h-4 w-4" />Envoyer mon diagnostic</>}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
