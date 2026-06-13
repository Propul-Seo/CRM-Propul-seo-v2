import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { FollowUpEntry, FollowUpType } from '../../../types/project-v2'

interface UseFollowUpsV2Return {
  followUps: FollowUpEntry[]
  loading: boolean
  addFollowUp: (data: Omit<FollowUpEntry, 'id' | 'created_at'>) => Promise<void>
  updateFollowUp: (id: string, updates: Partial<FollowUpEntry>) => Promise<void>
  deleteFollowUp: (id: string) => Promise<void>
  toggleDone: (id: string, done: boolean) => Promise<void>
}

export function useFollowUpsV2(projectId: string): UseFollowUpsV2Return {
  const [followUps, setFollowUps] = useState<FollowUpEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    v2
      .from('follow_ups')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setFollowUps(data as FollowUpEntry[])
        setLoading(false)
      })
  }, [projectId])

  const addFollowUp = useCallback(async (data: Omit<FollowUpEntry, 'id' | 'created_at'>) => {
    const { data: created, error } = await v2
      .from('follow_ups')
      .insert({ ...data, project_id: projectId })
      .select()
      .single()
    if (!error && created) setFollowUps(prev => [created as FollowUpEntry, ...prev])
  }, [projectId])

  const updateFollowUp = useCallback(async (id: string, updates: Partial<FollowUpEntry>) => {
    const { data, error } = await v2
      .from('follow_ups')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setFollowUps(prev => prev.map(f => f.id === id ? data as FollowUpEntry : f))
  }, [])

  const deleteFollowUp = useCallback(async (id: string) => {
    const { error } = await v2.from('follow_ups').delete().eq('id', id)
    if (!error) setFollowUps(prev => prev.filter(f => f.id !== id))
  }, [])

  const toggleDone = useCallback(async (id: string, done: boolean) => {
    await updateFollowUp(id, { follow_up_done: done })
  }, [updateFollowUp])

  return { followUps, loading, addFollowUp, updateFollowUp, deleteFollowUp, toggleDone }
}
