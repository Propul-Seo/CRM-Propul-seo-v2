import { useCallback, useEffect, useRef, useState } from 'react';
import { portalSupabase as supabase } from '@/lib/supabase';

// Sprint B.2 recadré — hook du wizard d'accueil court (5 étapes).
// Distinct de useOnboarding (V1, qui devient la base de la page Configuration
// du projet en PR 2). Ici on cible UNIQUEMENT les colonnes welcome_* +
// préférences ajoutées par la migration 230.

const TABLE = 'propulspace_onboarding_v2';
const DEBOUNCE_MS = 500;
const DISMISS_THRESHOLD = 3;

export type AvailabilitySlot = 'morning' | 'afternoon' | 'evening';
export type PreferredChannel = 'email' | 'phone' | 'whatsapp';

export interface WelcomeRow {
  id: string;
  project_id: string;
  inherited_from_qualification_id: string | null;
  welcome_first_name: string | null;
  welcome_last_name: string | null;
  welcome_phone: string | null;
  welcome_company: string | null;
  preferred_channel: PreferredChannel | null;
  availability_slots: AvailabilitySlot[] | null;
  email_notifications: boolean | null;
  welcome_current_step: number | null;
  welcome_completed_at: string | null;
  welcome_dismissed_count: number | null;
  welcome_last_dismissed_at: string | null;
}

export interface QualificationLead {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  business_sector: string | null;
  main_goal: string | null;
  budget_range: string | null;
  desired_timeline: string | null;
  desired_features: string[] | null;
}

export type WelcomeField = Pick<WelcomeRow,
  | 'welcome_first_name' | 'welcome_last_name' | 'welcome_phone' | 'welcome_company'
  | 'preferred_channel' | 'availability_slots' | 'email_notifications'>;

export type WelcomeSetField = <K extends keyof WelcomeField>(key: K, value: WelcomeField[K]) => void;

export interface UseWelcomeWizardResult {
  row: Partial<WelcomeRow> | null;
  qualification: QualificationLead | null;
  loading: boolean;
  saving: boolean;
  saveError: string | null;
  currentStep: number;
  isCompleted: boolean;
  shouldOpenAutomatically: boolean;
  setField: WelcomeSetField;
  goToStep: (n: number) => void;
  dismiss: () => Promise<void>;
  complete: () => Promise<{ error: string | null }>;
}

// Découpe simple "premier mot = prénom, reste = nom". Pas parfait (Jean-Luc
// Mélenchon, particules, etc.) mais suffisant pour pré-remplir. Le client
// peut ensuite éditer librement dans Step 2.
function splitFullName(full: string | null): { first: string | null; last: string | null } {
  if (!full) return { first: null, last: null };
  const trimmed = full.trim();
  if (!trimmed) return { first: null, last: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export function useWelcomeWizard(projectId: string): UseWelcomeWizardResult {
  const [row, setRow] = useState<Partial<WelcomeRow> | null>(null);
  const [qualification, setQualification] = useState<QualificationLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const rowRef = useRef<Partial<WelcomeRow> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistingRef = useRef(false);

  useEffect(() => { rowRef.current = row; }, [row]);

  // Mount : upsert idempotent sur project_id (pattern V1), puis SELECT.
  // Si la row vient d'être créée et qu'une qualif est rattachée, on pré-remplit
  // les welcome_* depuis la qualif au premier accès uniquement (champs vides).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await supabase.from(TABLE).upsert(
        { project_id: projectId, welcome_current_step: 1 },
        { onConflict: 'project_id', ignoreDuplicates: true },
      );
      if (cancelled) return;

      const { data: rowData } = await supabase
        .from(TABLE).select('*').eq('project_id', projectId).maybeSingle();
      if (cancelled || !rowData) {
        if (!cancelled) setLoading(false);
        return;
      }

      // Fetch qualif si rattachée (le backfill 230 a peuplé inherited_from_qualification_id).
      let qualif: QualificationLead | null = null;
      if (rowData.inherited_from_qualification_id) {
        const { data: qData } = await supabase
          .schema('propulspace')
          .from('qualification_leads')
          .select('id, full_name, email, phone, company_name, business_sector, main_goal, budget_range, desired_timeline, desired_features')
          .eq('id', rowData.inherited_from_qualification_id)
          .maybeSingle();
        qualif = (qData as QualificationLead) ?? null;
      }

      // Pré-remplissage one-shot des welcome_* depuis la qualif si vides.
      const needsPrefill = qualif && (
        !rowData.welcome_first_name && !rowData.welcome_phone && !rowData.welcome_company
      );
      if (needsPrefill && qualif) {
        const { first, last } = splitFullName(qualif.full_name);
        const prefill = {
          welcome_first_name: first,
          welcome_last_name: last,
          welcome_phone: qualif.phone,
          welcome_company: qualif.company_name,
        };
        await supabase.from(TABLE).update(prefill).eq('id', rowData.id);
        Object.assign(rowData, prefill);
      }

      if (cancelled) return;
      setQualification(qualif);
      setRow(rowData as Partial<WelcomeRow>);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const persist = useCallback(async (patch: Partial<WelcomeRow>) => {
    if (persistingRef.current || !rowRef.current?.id) return;
    persistingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await supabase.from(TABLE).update(patch).eq('id', rowRef.current.id);
      if (error) setSaveError(error.message);
    } finally {
      persistingRef.current = false;
      setSaving(false);
    }
  }, []);

  const setField = useCallback<WelcomeSetField>((key, value) => {
    setRow(prev => {
      const next = { ...(prev ?? {}), [key]: value };
      rowRef.current = next;
      return next;
    });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void persist({ [key]: value } as Partial<WelcomeRow>);
    }, DEBOUNCE_MS);
  }, [persist]);

  const goToStep = useCallback((n: number) => {
    if (n < 1 || n > 5) return;
    setRow(prev => {
      const next = { ...(prev ?? {}), welcome_current_step: n };
      rowRef.current = next;
      return next;
    });
    void persist({ welcome_current_step: n });
  }, [persist]);

  const dismiss = useCallback(async () => {
    if (!rowRef.current?.id) return;
    const nextCount = (rowRef.current.welcome_dismissed_count ?? 0) + 1;
    await supabase.from(TABLE).update({
      welcome_dismissed_count: nextCount,
      welcome_last_dismissed_at: new Date().toISOString(),
    }).eq('id', rowRef.current.id);
    setRow(prev => ({
      ...(prev ?? {}),
      welcome_dismissed_count: nextCount,
      welcome_last_dismissed_at: new Date().toISOString(),
    }));
  }, []);

  const complete = useCallback(async () => {
    if (!rowRef.current?.id) return { error: 'Wizard non initialisé' };
    const { error } = await supabase.from(TABLE).update({
      welcome_completed_at: new Date().toISOString(),
      welcome_current_step: 5,
    }).eq('id', rowRef.current.id);
    if (error) return { error: error.message };
    setRow(prev => ({
      ...(prev ?? {}),
      welcome_completed_at: new Date().toISOString(),
      welcome_current_step: 5,
    }));
    return { error: null };
  }, []);

  const currentStep = row?.welcome_current_step ?? 1;
  const isCompleted = row?.welcome_completed_at != null;
  const shouldOpenAutomatically = !isCompleted
    && (row?.welcome_dismissed_count ?? 0) < DISMISS_THRESHOLD;

  return {
    row, qualification, loading, saving, saveError,
    currentStep, isCompleted, shouldOpenAutomatically,
    setField, goToStep, dismiss, complete,
  };
}
