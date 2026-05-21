import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type PortalState = 'inactive' | 'orphan' | 'broken' | 'invited' | 'active'

export interface PortalStateRow {
  project_id: string
  project_name: string
  portal_client_email: string | null
  portal_activated_at: string | null
  has_auth_account: boolean
  last_login_at: string | null
  state: PortalState
}

/**
 * Charge l'état réel du portail pour un projet donné (vue propulspace_portal_state_v2).
 * Renvoie 5 états distincts en croisant projects_v2 et auth.users :
 *   - inactive : pas d'email portail
 *   - orphan   : email + activated_at NULL + pas de compte auth
 *   - broken   : email + activated_at remplis + compte auth supprimé
 *   - invited  : compte auth créé, jamais connecté
 *   - active   : compte auth + au moins une connexion
 */
export function usePortalState(projectId: string | null): {
  data: PortalStateRow | null
  loading: boolean
  refresh: () => Promise<void>
} {
  const [data, setData] = useState<PortalStateRow | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!projectId) { setData(null); setLoading(false); return }
    setLoading(true)
    const { data: row, error } = await supabase
      .from('propulspace_portal_state_v2')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
    if (error) {
      if (import.meta.env.DEV) console.error('[usePortalState] fetch failed:', error)
      setData(null)
    } else {
      setData(row as PortalStateRow | null)
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => { void refresh() }, [refresh])

  return { data, loading, refresh }
}
