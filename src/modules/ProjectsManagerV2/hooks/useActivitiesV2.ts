import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { ProjectActivity, ActivityType } from '../../../types/project-v2'

interface UseActivitiesV2Return {
  activities: ProjectActivity[]
  loading: boolean
  addActivity: (data: { type: ActivityType; content: string; author_name?: string; is_auto?: boolean; metadata?: Record<string, unknown> }) => Promise<void>
  updateActivity: (id: string, updates: Partial<Pick<ProjectActivity, 'content' | 'metadata'>>) => Promise<void>
  refetch: () => void
}

export function useActivitiesV2(projectId: string): UseActivitiesV2Return {
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
    if (!error && data) setActivities(data as ProjectActivity[])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const addActivity = useCallback(async ({ type, content, author_name, is_auto = false, metadata = {} }: {
    type: ActivityType
    content: string
    author_name?: string
    is_auto?: boolean
    metadata?: Record<string, unknown>
  }) => {
    const { data, error } = await v2
      .from('project_activities')
      .insert({ project_id: projectId, type, content, author_name, is_auto, metadata })
      .select()
      .single()
    if (!error && data) setActivities(prev => [data as ProjectActivity, ...prev])
  }, [projectId])

  const updateActivity = useCallback(async (id: string, updates: Partial<Pick<ProjectActivity, 'content' | 'metadata'>>) => {
    const { data, error } = await v2
      .from('project_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setActivities(prev => prev.map(a => a.id === id ? data as ProjectActivity : a))
  }, [])

  return { activities, loading, addActivity, updateActivity, refetch: fetchActivities }
}
