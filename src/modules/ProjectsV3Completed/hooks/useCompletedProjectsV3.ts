import { useState, useEffect, useCallback } from 'react'
import { v2 } from '@/lib/supabase'
import type { ProjectV2 } from '@/types/project-v2'

interface UseReturn {
  projects: ProjectV2[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Lecture des projets archivés ou en statut "livré" / "clôturé".
 * Module V3 dédié, ne touche pas la table V1/V2 ni le hook `useProjectsV2`.
 */
export function useCompletedProjectsV3(): UseReturn {
  const [projects, setProjects] = useState<ProjectV2[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    // Projets considérés "terminés" :
    //  - archivés (is_archived = true), peu importe le statut
    //  - OU statut "delivered" / "closed"
    // On évite `status.in.(...)` dans un `.or()` (comportement instable avec PostgREST
    // sur certains environnements) ; trois conditions `eq` font le même travail.
    const { data, error: err } = await v2
      .from('projects')
      .select('*')
      .or('is_archived.eq.true,status.eq.delivered,status.eq.closed')
      .order('updated_at', { ascending: false })
    if (err) {
      console.error('[useCompletedProjectsV3] fetch failed:', err)
      setError(err.message)
    } else if (data) {
      setProjects(data as ProjectV2[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return { projects, loading, error, refetch: fetchProjects }
}
