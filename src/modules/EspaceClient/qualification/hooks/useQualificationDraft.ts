import { useCallback, useEffect, useRef, useState } from 'react';
import { v2 } from '@/lib/supabase';
import {
  QUALIFICATION_SESSION_LOCALSTORAGE_KEY,
} from '../constants';
import type { QualificationDraft } from '../schema';
import { resetOrphanFields } from '../conditionalRules';

// Le schéma `propulspace` n'est pas exposable via PostgREST sur Supabase
// hébergé — on passe par la vue public.qualification_leads_v2 (1:1 sur
// propulspace.qualification_leads, security_invoker = true). Le proxy `v2`
// fait le mapping `qualification_leads` → `qualification_leads_v2`.
const TABLE = 'qualification_leads';
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
  // Force un upsert immédiat (utile avant le submit final).
  flush: () => Promise<{ leadId: string | null; error: string | null }>;
  clearDraft: () => void;
}

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(QUALIFICATION_SESSION_LOCALSTORAGE_KEY);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  localStorage.setItem(QUALIFICATION_SESSION_LOCALSTORAGE_KEY, fresh);
  return fresh;
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
  // Mutex anti-double-INSERT : si une opération persist() est en vol,
  // les suivantes sont ignorées (le debounce planifiera un nouveau save
  // après).
  const persistingRef = useRef(false);

  // Garde une ref synchrone des dernières valeurs pour flush() et le timer.
  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { leadIdRef.current = leadId; }, [leadId]);

  // Au mount : tente de récupérer une row 'draft' via l'ID en localStorage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sessionId = localStorage.getItem(QUALIFICATION_SESSION_LOCALSTORAGE_KEY);
      if (!sessionId) { setLoading(false); return; }

      const { data, error } = await v2
        .from(TABLE)
        .select('*')
        .eq('id', sessionId)
        .eq('status', 'draft')
        .maybeSingle();

      if (!cancelled && data && !error) {
        setLeadId(sessionId);
        setDraft(data as QualificationDraft);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Persistance : INSERT au 1er save (quand step1 validée → tous les NOT NULL
  // sont présents), UPDATE ensuite. Le mutex `persistingRef` empêche un
  // 2e INSERT concurrent. Une fois la row créée, on UPDATE même si certains
  // champs sont temporairement vides — la DB rejettera elle-même les
  // violations NOT NULL, ce qu'on veut.
  const persist = useCallback(async (data: QualificationDraft): Promise<{ leadId: string | null; error: string | null }> => {
    if (persistingRef.current) {
      return { leadId: leadIdRef.current, error: null };
    }
    const currentId = leadIdRef.current;
    // Premier INSERT : besoin des NOT NULL. Sinon, attend.
    if (!currentId) {
      if (!data.email || !data.full_name || !data.phone || !data.business_sector) {
        return { leadId: null, error: null };
      }
    }
    persistingRef.current = true;
    setSaving(true);

    try {
      if (!currentId) {
        const newId = getOrCreateSessionId();
        const { error } = await v2.from(TABLE).insert({
          id: newId,
          ...data,
          status: 'draft',
          budget_range: data.budget_range ?? '<2000',
          source: 'portal_diagnostic',
        });
        if (error) return { leadId: null, error: error.message };
        setLeadId(newId);
        leadIdRef.current = newId;
        triggerSavedIndicator();
        return { leadId: newId, error: null };
      }

      const { error } = await v2.from(TABLE).update({
        ...data,
        updated_at: new Date().toISOString(),
      }).eq('id', currentId).eq('status', 'draft');
      if (error) return { leadId: currentId, error: error.message };
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

  const clearDraft = useCallback(() => {
    localStorage.removeItem(QUALIFICATION_SESSION_LOCALSTORAGE_KEY);
    setDraft({});
    setLeadId(null);
    leadIdRef.current = null;
  }, []);

  // Cleanup au unmount : si un save est planifié (debounce non écoulé),
  // on le flush sans attendre — évite de perdre la dernière modif si
  // l'utilisateur navigue ailleurs juste après avoir tapé.
  useEffect(() => () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      void persist(draftRef.current);
    }
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  }, [persist]);

  return { draft, leadId, loading, saving, savedJustNow, setField, setFields, flush, clearDraft };
}
