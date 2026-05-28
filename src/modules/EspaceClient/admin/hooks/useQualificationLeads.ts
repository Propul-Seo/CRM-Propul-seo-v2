import { useCallback, useEffect, useState } from 'react';
import { v2 } from '@/lib/supabase';

export interface QualificationLeadRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string | null;
  business_sector: string;
  has_existing_site: boolean | null;
  existing_site_url: string | null;
  main_problems: string[] | null;
  main_goal: string | null;
  target_audience: string | null;
  competitors: string | null;
  desired_features: string[] | null;
  ecommerce_platform: string | null;
  product_count_range: string | null;
  has_visual_identity: string | null;
  logo_file_url: string | null;
  brand_guide_url: string | null;
  budget_range: string;
  desired_timeline: string | null;
  is_decision_maker: string | null;
  preferred_contact_method: string | null;
  monthly_traffic: string | null;
  existing_site_screenshots: string[] | null;
  quality_score: number | null;
  status: string;
  source: string | null;
  submitted_at: string | null;
  contacted_at: string | null;
  created_at: string;
  notes: string | null;
  pappers_enrichment: Record<string, unknown> | null;
  converted_to_project_id: string | null;
}

export type LeadStatusFilter = 'all' | 'submitted' | 'contacted' | 'qualified' | 'unqualified' | 'converted';

// Champs explicitement mutables par l'admin via le portail. Toute autre
// colonne (quality_score, pappers_enrichment, project_id, etc.) reste
// hors de portée du flux UI — empêche un futur dev de patcher par erreur.
export type LeadAdminPatch = Partial<Pick<QualificationLeadRow, 'status' | 'notes' | 'contacted_at'>>;

interface UseLeadsResult {
  leads: QualificationLeadRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateStatus: (id: string, patch: LeadAdminPatch) => Promise<{ error: string | null }>;
}

export function useQualificationLeads(filter: LeadStatusFilter = 'all'): UseLeadsResult {
  const [leads, setLeads] = useState<QualificationLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = v2.from('qualification_leads').select('*').order('created_at', { ascending: false });
    if (filter === 'all') {
      // Exclure les drafts qui ne sont pas des leads soumis.
      q = q.neq('status', 'draft');
    } else {
      q = q.eq('status', filter);
    }
    const { data, error: err } = await q;
    if (err) { setError(err.message); setLeads([]); }
    else { setError(null); setLeads((data ?? []) as QualificationLeadRow[]); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { void refresh(); }, [refresh]);

  const updateStatus = useCallback<UseLeadsResult['updateStatus']>(async (id, patch) => {
    const { error: err } = await v2.from('qualification_leads').update(patch).eq('id', id);
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  return { leads, loading, error, refresh, updateStatus };
}
