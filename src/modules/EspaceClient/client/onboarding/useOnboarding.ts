import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Sprint B.2 — hook onboarding portail.
// Charge / crée / met à jour la row propulspace.onboarding_responses du projet
// courant. Autosave debounced 500ms. Calcule un completion_percent simple
// basé sur les 14 champs déclarés "obligatoires" pour considérer l'onboarding
// complet (cf isComplete).

const TABLE = 'propulspace_onboarding_v2';
const DEBOUNCE_MS = 500;

export interface OnboardingRow {
  id: string;
  project_id: string;
  inherited_from_qualification_id: string | null;
  detailed_personas: Record<string, unknown>[] | null;
  brand_voice_notes: string | null;
  content_strategy: string | null;
  logo_uploaded: boolean | null;
  charter_uploaded: boolean | null;
  content_uploaded: boolean | null;
  legal_mentions_provided: boolean | null;
  has_provided_google_access: boolean | null;
  has_provided_hosting_access: boolean | null;
  has_provided_dns_access: boolean | null;
  has_provided_social_access: boolean | null;
  access_credentials_vault_id: string | null;
  completion_percent: number | null;
  is_complete: boolean | null;
  completed_at: string | null;
  kickoff_call_scheduled_at: string | null;
  kickoff_call_completed_at: string | null;
}

// Champs comptés pour le pourcentage de complétion. Volontairement minimal :
// si le client remplit 14 champs, il est "complet" — pas besoin de tout
// remplir (un wizard skippable doit garder un seuil atteignable).
const TRACKED_KEYS: ReadonlyArray<keyof OnboardingRow> = [
  'brand_voice_notes', 'content_strategy',
  'logo_uploaded', 'charter_uploaded', 'content_uploaded', 'legal_mentions_provided',
  'has_provided_google_access', 'has_provided_hosting_access',
  'has_provided_dns_access', 'has_provided_social_access',
  'access_credentials_vault_id',
  'kickoff_call_scheduled_at',
];

function computePercent(row: Partial<OnboardingRow>): number {
  const total = TRACKED_KEYS.length;
  const done = TRACKED_KEYS.reduce((acc, k) => {
    const v = row[k];
    if (v === true) return acc + 1;
    if (typeof v === 'string' && v.trim().length > 0) return acc + 1;
    return acc;
  }, 0);
  return Math.round((done / total) * 100);
}

interface UseOnboardingResult {
  row: Partial<OnboardingRow> | null;
  loading: boolean;
  saving: boolean;
  percent: number;
  isComplete: boolean;
  setField: <K extends keyof OnboardingRow>(key: K, value: OnboardingRow[K]) => void;
  markComplete: () => Promise<{ error: string | null }>;
}

export function useOnboarding(projectId: string): UseOnboardingResult {
  const [row, setRow] = useState<Partial<OnboardingRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const rowRef = useRef<Partial<OnboardingRow> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistingRef = useRef(false);

  useEffect(() => { rowRef.current = row; }, [row]);

  // Mount : charge la row existante. Si absente, crée-la (1re visite).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from(TABLE).select('*').eq('project_id', projectId).maybeSingle();
      if (cancelled) return;
      if (data) {
        setRow(data as Partial<OnboardingRow>);
      } else {
        const { data: created, error } = await supabase
          .from(TABLE)
          .insert({ project_id: projectId, completion_percent: 0 })
          .select('*')
          .maybeSingle();
        if (!cancelled && created && !error) setRow(created as Partial<OnboardingRow>);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const persist = useCallback(async (patch: Partial<OnboardingRow>) => {
    if (persistingRef.current || !rowRef.current?.id) return;
    persistingRef.current = true;
    setSaving(true);
    try {
      const next = { ...rowRef.current, ...patch };
      const percent = computePercent(next);
      await supabase
        .from(TABLE)
        .update({ ...patch, completion_percent: percent })
        .eq('id', rowRef.current.id);
    } finally {
      persistingRef.current = false;
      setSaving(false);
    }
  }, []);

  const setField = useCallback<UseOnboardingResult['setField']>((key, value) => {
    setRow(prev => {
      const next = { ...(prev ?? {}), [key]: value };
      rowRef.current = next;
      return next;
    });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void persist({ [key]: value } as Partial<OnboardingRow>);
    }, DEBOUNCE_MS);
  }, [persist]);

  const markComplete = useCallback(async () => {
    if (!rowRef.current?.id) return { error: 'Onboarding non initialisé' };
    const { error } = await supabase
      .from(TABLE)
      .update({ is_complete: true, completed_at: new Date().toISOString(), completion_percent: 100 })
      .eq('id', rowRef.current.id);
    if (error) return { error: error.message };
    setRow(prev => ({ ...(prev ?? {}), is_complete: true, completion_percent: 100 }));
    return { error: null };
  }, []);

  const percent = row ? computePercent(row) : 0;
  const isComplete = row?.is_complete === true;

  return { row, loading, saving, percent, isComplete, setField, markComplete };
}
