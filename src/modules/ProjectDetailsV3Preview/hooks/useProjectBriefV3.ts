import { useState, useEffect, useCallback } from 'react'
import { v2 } from '@/lib/supabase'
import type { ProjectBrief } from '@/types/project-v2'

interface UseReturn {
  brief: ProjectBrief | null
  loading: boolean
  saveBrief: (data: Partial<ProjectBrief>) => Promise<void>
}

export function useProjectBriefV3(projectId: string): UseReturn {
  const [brief, setBrief] = useState<ProjectBrief | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }
    setLoading(true)
    v2
      .from('project_briefs')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('[useProjectBriefV3] fetch failed', error)
        if (!error) setBrief((data as ProjectBrief | null) ?? null)
        setLoading(false)
      })
  }, [projectId])

  const saveBrief = useCallback(
    async (data: Partial<ProjectBrief>) => {
      if (brief) {
        const { data: updated, error } = await v2
          .from('project_briefs')
          .update(data)
          .eq('id', brief.id)
          .select()
          .single()
        if (error) {
          console.error('[useProjectBriefV3] update failed', { briefId: brief.id, error })
          throw new Error(`Impossible d'enregistrer le brief : ${error.message}`)
        }
        if (updated) setBrief(updated as ProjectBrief)
      } else {
        const { data: created, error } = await v2
          .from('project_briefs')
          .insert({ ...data, project_id: projectId })
          .select()
          .single()
        if (error) {
          console.error('[useProjectBriefV3] insert failed', { projectId, error })
          throw new Error(`Impossible de créer le brief : ${error.message}`)
        }
        if (created) setBrief(created as ProjectBrief)
      }
    },
    [brief, projectId],
  )

  return { brief, loading, saveBrief }
}
