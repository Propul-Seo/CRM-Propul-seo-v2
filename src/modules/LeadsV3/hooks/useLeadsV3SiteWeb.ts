import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ContactRow } from '@/types/supabase-types'
import type { SiteWebStatus } from '../utils/leadStatusMapping'

export interface SiteWebLead extends ContactRow {
  /** Statut normalisé en SiteWebStatus, fallback "prospect" si valeur inconnue. */
  normalized_status: SiteWebStatus
}

/**
 * Hook isolé pour Leads V3 — lit les contacts du site web (table `contacts`).
 * NE modifie PAS les hooks V1 (useCRMData / useSupabaseContacts).
 */
export function useLeadsV3SiteWeb() {
  const [leads, setLeads] = useState<SiteWebLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('contacts')
        .select(`
          *,
          assigned_user:users!assigned_to (id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (err) throw err

      const rows = (data ?? []) as ContactRow[]
      const enriched: SiteWebLead[] = rows.map(c => ({
        ...c,
        assigned_user_name: c.assigned_user?.name ?? null,
        normalized_status: normalize(c.status as unknown as string),
      }))
      setLeads(enriched)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  /** Mise à jour de statut isolée (n'utilise pas useContactsCRUD pour éviter de toucher V1). */
  const updateStatus = useCallback(async (id: string, status: SiteWebStatus) => {
    const { error: err } = await supabase
      .from('contacts')
      .update({ status })
      .eq('id', id)
    if (err) throw err
    await fetchLeads()
  }, [fetchLeads])

  return { leads, loading, error, refetch: fetchLeads, updateStatus }
}

const VALID = new Set<SiteWebStatus>([
  'prospect',
  'presentation_envoyee',
  'meeting_booke',
  'offre_envoyee',
  'en_attente',
  'signe',
])

function normalize(raw: string | null | undefined): SiteWebStatus {
  if (!raw) return 'prospect'
  return VALID.has(raw as SiteWebStatus) ? (raw as SiteWebStatus) : 'prospect'
}
