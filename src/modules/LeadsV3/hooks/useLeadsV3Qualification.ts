import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Lead venant du questionnaire `/diagnostic` (table `propulspace.qualification_leads`,
 * vue `public.qualification_leads_v2`). Filtré par project_type pour s'afficher
 * dans la bonne colonne LeadsV3 (Site web vs ERP).
 */
export interface QualificationLead {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  company_name: string | null
  business_sector: string | null
  business_sector_custom: string | null
  project_type: 'site' | 'site_erp' | 'erp'
  budget_range: string | null
  desired_timeline: string | null
  main_goal: string | null
  status: string
  submitted_at: string | null
  created_at: string
  converted_to_project_id: string | null
  // Bloc complet pour le panel détails (drawer).
  raw: Record<string, unknown>
}

export type QualifScope = 'site' | 'erp'

/**
 * Fetch les leads qualif `submitted` non convertis pour l'onglet courant.
 * - scope='site' → project_type IN ('site', 'site_erp')
 * - scope='erp'  → project_type IN ('erp',  'site_erp')
 */
export function useLeadsV3Qualification(scope: QualifScope) {
  const [leads, setLeads] = useState<QualificationLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const projectTypes = scope === 'site' ? ['site', 'site_erp'] : ['erp', 'site_erp']

      const { data, error: err } = await supabase
        .from('qualification_leads_v2')
        .select('*')
        .eq('status', 'submitted')
        .is('converted_to_project_id', null)
        .in('project_type', projectTypes)
        .order('submitted_at', { ascending: false })

      if (err) throw err

      const rows = (data ?? []) as Array<Record<string, unknown>>
      const enriched: QualificationLead[] = rows.map(r => ({
        id: String(r.id),
        full_name: (r.full_name as string | null) ?? null,
        email: String(r.email ?? ''),
        phone: (r.phone as string | null) ?? null,
        company_name: (r.company_name as string | null) ?? null,
        business_sector: (r.business_sector as string | null) ?? null,
        business_sector_custom: (r.business_sector_custom as string | null) ?? null,
        project_type: (r.project_type as QualificationLead['project_type']) ?? 'site',
        budget_range: (r.budget_range as string | null) ?? null,
        desired_timeline: (r.desired_timeline as string | null) ?? null,
        main_goal: (r.main_goal as string | null) ?? null,
        status: String(r.status ?? 'submitted'),
        submitted_at: (r.submitted_at as string | null) ?? null,
        created_at: String(r.created_at ?? new Date().toISOString()),
        converted_to_project_id: (r.converted_to_project_id as string | null) ?? null,
        raw: r,
      }))
      setLeads(enriched)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  return { leads, loading, error, refetch: fetchLeads }
}
