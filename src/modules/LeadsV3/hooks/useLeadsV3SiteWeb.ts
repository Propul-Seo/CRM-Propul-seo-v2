import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ContactRow } from '@/types/supabase-types'
import type { SiteWebStatus } from '../utils/leadStatusMapping'

export interface SiteWebLead extends ContactRow {
  /** Statut normalisé en SiteWebStatus, fallback "prospect" si valeur inconnue. */
  normalized_status: SiteWebStatus
  /** Dernière activité CRM enregistrée sur le prospect, si disponible. */
  last_activity_at?: string | null
  /** Type de la dernière activité CRM, pour clarifier l'affichage sur la carte. */
  last_activity_type?: string | null
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
          assigned_user:users!assigned_to (id, name, email, is_active)
        `)
        .order('created_at', { ascending: false })

      if (err) throw err

      const rows = (data ?? []) as ContactRow[]
      let activityByProspect = new Map<string, ProspectActivitySnapshot>()
      try {
        activityByProspect = await fetchLatestActivities(rows.map(contact => contact.id))
      } catch (activityError) {
        console.warn('[LeadsV3] activities fetch failed:', activityError)
      }
      const enriched: SiteWebLead[] = rows.map(c => ({
        ...c,
        assigned_user_name: c.assigned_user?.is_active === false ? null : (c.assigned_user?.name ?? null),
        normalized_status: normalize(c.status as unknown as string),
        last_activity_at: activityByProspect.get(c.id)?.activity_date ?? null,
        last_activity_type: activityByProspect.get(c.id)?.activity_type ?? null,
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

interface ProspectActivitySnapshot {
  prospect_id: string | null
  activity_date: string | null
  activity_type: string | null
  status: string | null
}

async function fetchLatestActivities(contactIds: string[]): Promise<Map<string, ProspectActivitySnapshot>> {
  if (contactIds.length === 0) return new Map()

  const activities: ProspectActivitySnapshot[] = []
  for (const ids of chunk(contactIds, 100)) {
    const { data, error } = await supabase
      .from('prospect_activities')
      .select('prospect_id, activity_date, activity_type, status')
      .in('prospect_id', ids)
      .neq('status', 'cancelled')
      .order('activity_date', { ascending: false })

    if (error) throw error
    activities.push(...((data ?? []) as ProspectActivitySnapshot[]))
  }

  const now = Date.now()
  const completed = new Map<string, ProspectActivitySnapshot>()
  const pastActivity = new Map<string, ProspectActivitySnapshot>()

  for (const activity of activities) {
    if (!activity.prospect_id || !activity.activity_date) continue

    const timestamp = new Date(activity.activity_date).getTime()
    if (Number.isNaN(timestamp)) continue

    if (activity.status === 'completed' && !completed.has(activity.prospect_id)) {
      completed.set(activity.prospect_id, activity)
    }

    if (timestamp <= now && !pastActivity.has(activity.prospect_id)) {
      pastActivity.set(activity.prospect_id, activity)
    }
  }

  const latest = new Map<string, ProspectActivitySnapshot>()
  for (const id of contactIds) {
    const activity = completed.get(id) ?? pastActivity.get(id)
    if (activity) latest.set(id, activity)
  }

  return latest
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
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
