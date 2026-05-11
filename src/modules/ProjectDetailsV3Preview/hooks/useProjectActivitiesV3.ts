import { useState, useEffect, useCallback } from 'react'
import { v2 } from '@/lib/supabase'
import type { ProjectActivity, ActivityType } from '@/types/project-v2'

interface UseReturn {
  activities: ProjectActivity[]
  loading: boolean
  addActivity: (type: ActivityType, content: string, opts?: { author_name?: string; metadata?: Record<string, unknown> }) => Promise<void>
  updateActivity: (id: string, updates: { type?: ActivityType; content?: string }) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useProjectActivitiesV3(projectId: string): UseReturn {
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const { data, error } = await v2
      .from('project_activities')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) console.error('[useProjectActivitiesV3] fetch failed', error)
    if (!error && data) setActivities(data as ProjectActivity[])
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const addActivity = useCallback(
    async (type: ActivityType, content: string, opts?: { author_name?: string; metadata?: Record<string, unknown> }) => {
      const { data, error } = await v2
        .from('project_activities')
        .insert({
          project_id: projectId,
          type,
          content,
          author_name: opts?.author_name,
          is_auto: false,
          metadata: opts?.metadata ?? {},
        })
        .select()
        .single()
      if (error) {
        console.error('[useProjectActivitiesV3] addActivity failed', { type, projectId, error })
        throw new Error(`Impossible d'ajouter l'activité : ${error.message}`)
      }
      if (data) setActivities((prev) => [data as ProjectActivity, ...prev])
    },
    [projectId],
  )

  const updateActivity = useCallback(
    async (id: string, updates: { type?: ActivityType; content?: string }) => {
      const { data, error } = await v2
        .from('project_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) {
        console.error('[useProjectActivitiesV3] updateActivity failed', { id, updates, error })
        throw new Error(`Impossible de modifier l'activité : ${error.message}`)
      }
      if (data) {
        setActivities((prev) => prev.map((a) => (a.id === id ? (data as ProjectActivity) : a)))
      }
    },
    [],
  )

  const deleteActivity = useCallback(async (id: string) => {
    const { error } = await v2.from('project_activities').delete().eq('id', id)
    if (error) {
      console.error('[useProjectActivitiesV3] deleteActivity failed', { id, error })
      throw new Error(`Impossible de supprimer l'activité : ${error.message}`)
    }
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return { activities, loading, addActivity, updateActivity, deleteActivity, refetch: fetchActivities }
}
