import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Seul le premier fetch déclenche `loading=true` (écran de chargement plein).
  // Les refetch (après toggle de tâche, après save modale, etc.) sont silencieux :
  // ils ne re-mount pas les enfants, le contenu actuel reste visible pendant
  // que la nouvelle valeur arrive.
  const isInitialLoadRef = useRef(true)

  const fetchProject = useCallback(async () => {
    if (!projectId) return
    if (isInitialLoadRef.current) setLoading(true)
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
    if (isInitialLoadRef.current) {
      setLoading(false)
      isInitialLoadRef.current = false
    }
  }, [projectId])

  useEffect(() => {
    // Reset du flag quand on change de projet (navigation entre deux fiches).
    isInitialLoadRef.current = true
    fetchProject()
  }, [fetchProject])

  return { project, loading, error, refetch: fetchProject }
}
