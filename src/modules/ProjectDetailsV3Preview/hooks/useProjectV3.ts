import { useState, useEffect, useCallback } from 'react'
import { v2 } from '@/lib/supabase'
import type { ProjectV2 } from '@/types/project-v2'

interface UseReturn {
  project: ProjectV2 | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProjectV3(projectId: string): UseReturn {
  const [project, setProject] = useState<ProjectV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await v2
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle()
    if (err) {
      setError(err.message)
    } else if (!data) {
      setError('Projet introuvable')
    } else {
      setProject(data as ProjectV2)
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchProject() }, [fetchProject])

  return { project, loading, error, refetch: fetchProject }
}
