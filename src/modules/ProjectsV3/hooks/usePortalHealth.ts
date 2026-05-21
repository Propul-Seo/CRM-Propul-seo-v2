import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface PortalHealth {
  project_id: string
  project_name: string
  portal_client_email: string
  portal_activated_at: string | null
  last_client_login_at: string | null
  invoices_overdue: number
  invoices_pending: number
  signatures_pending: number
  documents_count: number
}

/**
 * Charge la santé portail de tous les projets de l'équipe une fois,
 * et expose une Map indexée par project_id. Pas de cache cross-session :
 * un refresh recharge tout. Pas de subscription realtime (overkill pour les badges).
 */
export function usePortalHealth(): {
  byProjectId: Map<string, PortalHealth>
  loading: boolean
  refresh: () => Promise<void>
} {
  const [rows, setRows] = useState<PortalHealth[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects_portal_health_v2')
      .select('*')
    if (error) {
      if (import.meta.env.DEV) console.error('[usePortalHealth] fetch failed:', error)
      setRows([])
    } else {
      setRows((data ?? []) as PortalHealth[])
    }
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const byProjectId = new Map<string, PortalHealth>()
  for (const row of rows) byProjectId.set(row.project_id, row)

  return { byProjectId, loading, refresh }
}
