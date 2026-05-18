import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { BrandPill } from '@/modules/EspaceClient/shared/components';
import { useForceLightTheme } from '@/modules/EspaceClient/shared/hooks/useForceLightTheme';
import '@/modules/EspaceClient/shared/layouts/portal-theme.css';

import { useQualificationDraft } from './hooks/useQualificationDraft';
import { ProgressBar } from './components/ProgressBar';
import { SaveIndicator } from './components/SaveIndicator';
import { STEP_SCHEMAS } from './schema';
import { conditionalRules } from './conditionalRules';
import { QUALIF_TOTAL_STEPS } from './constants';
import { Step1Identity } from './steps/Step1Identity';
import { Step2Situation } from './steps/Step2Situation';
import { Step3Objectives } from './steps/Step3Objectives';
import { Step4Features } from './steps/Step4Features';
import { Step5Brand } from './steps/Step5Brand';
import { Step6Budget } from './steps/Step6Budget';
import { Step7Finalization } from './steps/Step7Finalization';

type StepErrors = Record<string, string | undefined>;

export function QualificationFlowPage() {
  useForceLightTheme();
  const navigate = useNavigate();
  const { draft, leadId, loading, saving, savedJustNow, setField, submit, clearDraft } = useQualificationDraft();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [currentStep]);

  const validateCurrent = (): boolean => {
    const schema = STEP_SCHEMAS[currentStep - 1];
    const result = schema.safeParse(draft);
    if (result.success) { setErrors({}); return true; }
    const next: StepErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  };

  const goNext = () => {
    if (!validateCurrent()) return;
    // Skip Step 2→3 si "pas de site" — uniquement quand on quitte l'étape 2.
    // (Ne pas sauter depuis l'étape 1 même si has_existing_site='non' était
    // dans un draft rechargé : l'utilisateur doit pouvoir voir la question.)
    if (currentStep === 2 && draft.has_existing_site === 'non') {
      setCurrentStep(3);
      return;
    }
    setCurrentStep(s => Math.min(QUALIF_TOTAL_STEPS, s + 1));
  };

  const goPrev = () => {
    if (currentStep === 3 && draft.has_existing_site === 'non') {
      setCurrentStep(2);
      return;
    }
    setCurrentStep(s => Math.max(1, s - 1));
  };

  async function handleSubmit() {
    // Anti-spam : honeypot rempli = bot, on simule succès silencieux.
    if (honeypot) {
      navigate('/diagnostic-envoye', { replace: true });
      return;
    }
    if (!validateCurrent()) return;
    setSubmitting(true);
    // Bascule draft→submitted via RPC (flush + qualif_update_draft{status:'submitted'}).
    // L'ancien UPDATE direct sur la vue est retiré (Sprint A.3.2 — REVOKE anon UPDATE).
    const { leadId: id, error: submitErr } = await submit();
    if (submitErr || !id) {
      setSubmitting(false);
      setErrors({ _global: submitErr ?? 'Échec de la soumission. Réessayez.' });
      return;
    }
    // Edge Function emails (best-effort, n'empêche pas la redirection)
    try {
      await supabase.functions.invoke('questionnaire-send-emails', { body: { lead_id: id } });
    } catch { /* silencieux — emails Phase 3 */ }
    clearDraft();
    setSubmitting(false);
    navigate('/diagnostic-envoye', { replace: true });
  }

  const stepNode = useMemo(() => {
    switch (currentStep) {
      case 1: return <Step1Identity draft={draft} setField={setField} errors={errors} />;
      case 2: return <Step2Situation draft={draft} leadId={leadId} setField={setField} errors={errors} />;
      case 3: return <Step3Objectives draft={draft} setField={setField} errors={errors} />;
      case 4: return <Step4Features draft={draft} setField={setField} errors={errors} />;
      case 5: return <Step5Brand draft={draft} leadId={leadId} setField={setField} errors={errors} />;
      case 6: return <Step6Budget draft={draft} setField={setField} errors={errors} />;
      case 7: return <Step7Finalization draft={draft} setField={setField} errors={errors} />;
      default: return null;
    }
  }, [currentStep, draft, leadId, setField, errors]);

  if (loading) {
    return (
      <div className="propulspace-portal flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--ps-primary)]" />
      </div>
    );
  }

  return (
    <div className="propulspace-portal min-h-screen">
      <header className="ps-frosted sticky top-0 z-10 border-b border-[var(--ps-border-soft)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <BrandPill />
          <SaveIndicator saving={saving} savedJustNow={savedJustNow} currentStep={currentStep} />
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-4 md:px-6">
          <ProgressBar currentStep={currentStep} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
        {stepNode}
        {/* Honeypot invisible aux humains, visible aux bots */}
        <label aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          Ne remplissez pas ce champ
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
          />
        </label>
        {errors._global && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{errors._global}</p>
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-[var(--ps-border-soft)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 1 || submitting}
            className="h-11"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Précédent
          </Button>

          {currentStep < QUALIF_TOTAL_STEPS ? (
            <Button onClick={goNext} className="ps-brand-gradient h-11 text-white">
              Suivant
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="ps-brand-gradient h-11 text-white disabled:opacity-60"
            >
              {submitting ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Envoi…</>
              ) : (
                <><Send className="mr-1.5 h-4 w-4" />Envoyer mon diagnostic</>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
