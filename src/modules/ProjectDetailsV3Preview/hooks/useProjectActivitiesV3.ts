import { useState, useEffect, useCallback } from 'react'
import { v2 } from '@/lib/supabase'
import { adminRpc } from '@/modules/EspaceClient/admin/lib/adminRpc'
import type { ProjectActivity, ActivityType } from '@/types/project-v2'

interface ActivityUpdate {
  type?: ActivityType
  content?: string
  metadata?: Record<string, unknown>
  visible_to_client?: boolean
}

interface UseReturn {
  activities: ProjectActivity[]
  loading: boolean
  addActivity: (type: ActivityType, content: string, opts?: { author_name?: string; metadata?: Record<string, unknown>; visibleToClient?: boolean }) => Promise<void>
  updateActivity: (id: string, updates: ActivityUpdate) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

// SP5 : les écritures passent désormais par les RPC SECURITY DEFINER
// admin_*_activity (migration 297) — garde is_team_member(), MAJ last_activity_at,
// user_id résolu côté serveur. La lecture reste un SELECT direct sur la table.
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
    async (type: ActivityType, content: string, opts?: { author_name?: string; metadata?: Record<string, unknown>; visibleToClient?: boolean }) => {
      const { error } = await adminRpc('admin_create_activity', {
        p_project_id: projectId,
        p_type: type,
        p_content: content,
        p_author_name: opts?.author_name ?? null,
        p_metadata: opts?.metadata ?? {},
        p_visible_to_client: opts?.visibleToClient ?? false,
      })
      if (error) {
        console.error('[useProjectActivitiesV3] addActivity failed', { type, projectId, error })
        throw new Error(`Impossible d'ajouter l'activité : ${error.message}`)
      }
      await fetchActivities()
    },
    [projectId, fetchActivities],
  )

  const updateActivity = useCallback(
    async (id: string, updates: ActivityUpdate) => {
      const { error } = await adminRpc('admin_update_activity', {
        p_id: id,
        p_type: updates.type ?? null,
        p_content: updates.content ?? null,
        p_metadata: updates.metadata ?? null,
        p_visible_to_client: updates.visible_to_client ?? null,
      })
      if (error) {
        console.error('[useProjectActivitiesV3] updateActivity failed', { id, updates, error })
        throw new Error(`Impossible de modifier l'activité : ${error.message}`)
      }
      await fetchActivities()
    },
    [fetchActivities],
  )

  const deleteActivity = useCallback(async (id: string) => {
    const { error } = await adminRpc('admin_delete_activity', { p_id: id })
    if (error) {
      console.error('[useProjectActivitiesV3] deleteActivity failed', { id, error })
      throw new Error(`Impossible de supprimer l'activité : ${error.message}`)
    }
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return { activities, loading, addActivity, updateActivity, deleteActivity, refetch: fetchActivities }
}
