import { useEffect, useState, useCallback } from 'react'
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext'

export interface PortalProjectDetails {
  id: string
  name: string | null
  status: string | null
  description: string | null
  presta_type: string[] | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  client_first_name: string | null
  client_phone: string | null
  client_company: string | null
  assigned_name: string | null
  portal_activated_at: string | null
}

/**
 * Charge le détail étendu du projet courant côté portail client.
 * Le PortalProject minimal (auth) ne contient que id/name/status/email.
 * Ce hook complète avec presta, dates, équipe assignée, coordonnées client.
 */
export function usePortalProjectDetails(): {
  details: PortalProjectDetails | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
} {
  const { project, storage } = usePortal()
  const [details, setDetails] = useState<PortalProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await storage
      .from('projects_v2')
      .select('id, name, status, description, presta_type, start_date, end_date, budget, client_first_name, client_phone, client_company, assigned_name, portal_activated_at')
      .eq('id', project.id)
      .maybeSingle()
    if (err) { setError(err.message); setDetails(null) }
    else setDetails(data as PortalProjectDetails | null)
    setLoading(false)
  }, [project.id, storage])

  useEffect(() => { void refresh() }, [refresh])

  return { details, loading, error, refresh }
}
