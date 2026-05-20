import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  QUALIFICATION_SESSION_LOCALSTORAGE_KEY,
  QUALIFICATION_TOKEN_SESSIONSTORAGE_KEY,
} from '../constants';
import type { QualificationDraft } from '../schema';
import { resetOrphanFields } from '../conditionalRules';

// Sprint A.3.1 — bascule des écritures directes sur `qualification_leads_v2`
// vers les RPC `public.qualif_*_draft` qui valident le `draft_session_token`
// stocké en sessionStorage. R-011 (fuite RGPD anon SELECT/UPDATE) fermé.
//
// Cycle de vie :
//   - mount : lit le token en sessionStorage. Si présent, appelle qualif_get_draft.
//             Purge silencieuse de l'ancienne clé localStorage (id de row).
//   - 1er save : appelle qualif_create_draft, stocke (lead_id, session_token).
//   - saves suivants : appelle qualif_update_draft(token, payload JSONB).
//   - clearDraft : remove sessionStorage token, reset état.
// L'utilisateur perd son draft s'il ferme l'onglet (sessionStorage volatile).
// Accepté pour V1 ; lien de récup email à prévoir post-Brevo (Sprint B.1).

const DEBOUNCE_MS = 500;
const SAVED_INDICATOR_MS = 1500;

interface UseQualificationDraftResult {
  draft: QualificationDraft;
  leadId: string | null;
  loading: boolean;
  saving: boolean;
  savedJustNow: boolean;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  setFields: (patch: Partial<QualificationDraft>) => void;
  flush: () => Promise<{ leadId: string | null; error: string | null }>;
  submit: () => Promise<{ leadId: string | null; error: string | null }>;
  clearDraft: () => void;
}

function readToken(): string | null {
  return sessionStorage.getItem(QUALIFICATION_TOKEN_SESSIONSTORAGE_KEY);
}

function writeToken(token: string): void {
  sessionStorage.setItem(QUALIFICATION_TOKEN_SESSIONSTORAGE_KEY, token);
}

function clearToken(): void {
  sessionStorage.removeItem(QUALIFICATION_TOKEN_SESSIONSTORAGE_KEY);
}

// Strippe les clés que la RPC update_draft refuserait (admin-only) ou qui ne
// font pas partie de la whitelist serveur. Robuste si le composant envoie un
// objet plus large que prévu.
const UPDATE_WHITELIST: ReadonlyArray<keyof QualificationDraft | 'status' | 'draft_progress_percent'> = [
  'project_type',
  'full_name', 'email', 'phone', 'company_name', 'business_sector', 'business_sector_custom',
  'has_existing_site', 'existing_site_url', 'monthly_traffic',
  'main_problems', 'main_problems_other', 'has_domain_only',
  'main_goal', 'main_goal_other', 'target_audience', 'competitors',
  'desired_features', 'desired_features_other',
  'ecommerce_platform', 'ecommerce_platform_other', 'product_count_range', 'monthly_orders_range',
  'reservation_type', 'health_specific_needs',
  'has_visual_identity', 'wants_identity_creation', 'logo_file_url', 'brand_guide_url',
  'brand_guide_external_link',
  'existing_site_screenshots',
  // ERP (migration 242)
  'erp_current_system', 'erp_current_system_other', 'erp_data_volume',
  'erp_modules', 'erp_modules_other',
  'erp_users_count', 'erp_mobile_required', 'erp_sso_type',
  'erp_integrations', 'erp_integrations_other',
  // Common (suite)
  'budget_range', 'desired_timeline', 'timeline_reason',
  'is_decision_maker', 'preferred_contact_method', 'final_cta_choice',
  'draft_progress_percent', 'status',
];

function buildPayload(draft: QualificationDraft): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of UPDATE_WHITELIST) {
    const v = (draft as Record<string, unknown>)[key as string];
    if (v !== undefined) out[key as string] = v;
  }
  return out;
}

export function useQualificationDraft(): UseQualificationDraftResult {
  const [draft, setDraft] = useState<QualificationDraft>({});
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedJustNow, setSavedJustNow] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef<QualificationDraft>({});
  const leadIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const persistingRef = useRef(false);

  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { leadIdRef.current = leadId; }, [leadId]);

  // Mount : récupère le draft via token sessionStorage, purge l'ancienne clé localStorage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Purge silencieuse de l'ancien stockage (Sprint A.3.1 migration)
      try { localStorage.removeItem(QUALIFICATION_SESSION_LOCALSTORAGE_KEY); } catch {}

      const token = readToken();
      if (!token) { setLoading(false); return; }
      tokenRef.current = token;

      const { data, error } = await supabase.rpc('qualif_get_draft', { p_token: token });
      if (!cancelled && Array.isArray(data) && data.length > 0 && !error) {
        const row = data[0] as QualificationDraft & { id: string };
        setLeadId(row.id);
        leadIdRef.current = row.id;
        setDraft(row);
      } else if (error || !Array.isArray(data) || data.length === 0) {
        // Token périmé / row inexistante / submitted : on nettoie.
        clearToken();
        tokenRef.current = null;
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback(async (
    data: QualificationDraft,
  ): Promise<{ leadId: string | null; error: string | null }> => {
    if (persistingRef.current) {
      return { leadId: leadIdRef.current, error: null };
    }
    const currentId = leadIdRef.current;
    const currentToken = tokenRef.current;

    // Premier save : on crée le draft dès qu'on a au moins UN champ utilisateur.
    // La RPC qualif_create_draft accepte les strings vides (DEFAULT en DB).
    // Comme ça l'upload (qui exige un leadId) marche dès le Step2 (situation)
    // même si l'utilisateur n'a pas encore validé Step1 fully.
    // Garde minimale : avoir AU MOINS un champ touché pour éviter de créer un
    // row au simple mount (l'utilisateur n'a rien fait).
    if (!currentId) {
      const hasAnyInput = Boolean(
        data.project_type || data.full_name || data.email || data.phone ||
        data.business_sector || data.company_name,
      );
      if (!hasAnyInput) {
        return { leadId: null, error: null };
      }
    }
    persistingRef.current = true;
    setSaving(true);

    try {
      // INSERT initial via RPC create_draft, puis UPDATE pour pousser les champs
      if (!currentId || !currentToken) {
        const { data: created, error: createErr } = await supabase.rpc('qualif_create_draft', {
          p_source: 'portal_diagnostic',
        });
        if (createErr || !Array.isArray(created) || created.length === 0) {
          if (import.meta.env.DEV) console.error('[useQualificationDraft] qualif_create_draft échoué:', createErr, 'data:', created);
          return { leadId: null, error: createErr?.message ?? 'create_draft failed' };
        }
        const { lead_id, session_token } = created[0] as { lead_id: string; session_token: string };
        writeToken(session_token);
        tokenRef.current = session_token;
        setLeadId(lead_id);
        leadIdRef.current = lead_id;

        const { error: updErr } = await supabase.rpc('qualif_update_draft', {
          p_token: session_token,
          p_payload: buildPayload(data),
        });
        if (updErr) {
          if (import.meta.env.DEV) console.error('[useQualificationDraft] update_draft (post-create) échoué:', updErr);
          return { leadId: lead_id, error: updErr.message };
        }
        triggerSavedIndicator();
        return { leadId: lead_id, error: null };
      }

      const { error } = await supabase.rpc('qualif_update_draft', {
        p_token: currentToken,
        p_payload: buildPayload(data),
      });
      if (error) {
        if (import.meta.env.DEV) console.error('[useQualificationDraft] update_draft échoué:', error);
        return { leadId: currentId, error: error.message };
      }
      triggerSavedIndicator();
      return { leadId: currentId, error: null };
    } finally {
      persistingRef.current = false;
      setSaving(false);
    }
  }, []);

  function triggerSavedIndicator() {
    setSavedJustNow(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedJustNow(false), SAVED_INDICATOR_MS);
  }

  const scheduleSave = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void persist(draftRef.current);
    }, DEBOUNCE_MS);
  }, [persist]);

  const setField = useCallback<UseQualificationDraftResult['setField']>((key, value) => {
    setDraft(prev => {
      const next = resetOrphanFields(prev, { ...prev, [key]: value });
      draftRef.current = next;
      return next;
    });
    scheduleSave();
  }, [scheduleSave]);

  const setFields = useCallback((patch: Partial<QualificationDraft>) => {
    setDraft(prev => {
      const next = resetOrphanFields(prev, { ...prev, ...patch });
      draftRef.current = next;
      return next;
    });
    scheduleSave();
  }, [scheduleSave]);

  const flush = useCallback(async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    return persist(draftRef.current);
  }, [persist]);

  // Bascule explicite draft → submitted via la RPC (autorise cette transition).
  // Flush d'abord pour pousser les derniers champs métier, puis envoie un
  // payload minimal { status: 'submitted' } : la RPC met submitted_at = NOW()
  // automatiquement et bloque toute écriture ultérieure (status reste 'submitted',
  // submitted_at NOT NULL).
  const submit = useCallback(async (): Promise<{ leadId: string | null; error: string | null }> => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const { leadId: id, error: flushErr } = await persist(draftRef.current);
    if (flushErr || !id) return { leadId: id, error: flushErr ?? 'Draft non initialisé' };
    const token = tokenRef.current;
    if (!token) return { leadId: id, error: 'Session token absent' };

    const { error } = await supabase.rpc('qualif_update_draft', {
      p_token: token,
      p_payload: { status: 'submitted' },
    });
    if (error) return { leadId: id, error: error.message };
    // Défensif (review H-3) : on nettoie le token immédiatement après submit
    // réussi côté serveur, indépendamment du clearDraft() côté composant
    // (qui peut être interrompu par navigate / crash JS).
    clearToken();
    tokenRef.current = null;
    return { leadId: id, error: null };
  }, [persist]);

  const clearDraft = useCallback(() => {
    clearToken();
    tokenRef.current = null;
    setDraft({});
    setLeadId(null);
    leadIdRef.current = null;
  }, []);

  useEffect(() => () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      void persist(draftRef.current);
    }
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  }, [persist]);

  return { draft, leadId, loading, saving, savedJustNow, setField, setFields, flush, submit, clearDraft };
}
