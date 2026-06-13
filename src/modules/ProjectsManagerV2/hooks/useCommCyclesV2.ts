import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { CommCycle, CommCycleStatus } from '../../../types/project-v2'

interface UseCommCyclesV2Return {
  cycles: CommCycle[]
  loading: boolean
  currentCycle: CommCycle | null
  addCycle: (data: Omit<CommCycle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateCycle: (id: string, updates: Partial<CommCycle>) => Promise<void>
  deleteCycle: (id: string) => Promise<void>
  setCycleStatus: (id: string, status: CommCycleStatus) => Promise<void>
}

export function useCommCyclesV2(projectId: string): UseCommCyclesV2Return {
  const [cycles, setCycles] = useState<CommCycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    v2
      .from('comm_cycles')
      .select('*')
      .eq('project_id', projectId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setCycles(data as CommCycle[])
        setLoading(false)
      })
  }, [projectId])

  const now = new Date()
  const currentCycle = cycles.find(
    c => c.month === now.getMonth() + 1 && c.year === now.getFullYear()
  ) ?? null

  const addCycle = useCallback(async (data: Omit<CommCycle, 'id' | 'created_at' | 'updated_at'>) => {
    const { data: created, error } = await v2
      .from('comm_cycles')
      .insert({ ...data, project_id: projectId })
      .select()
      .single()
    if (!error && created) setCycles(prev => [created as CommCycle, ...prev])
  }, [projectId])

  const updateCycle = useCallback(async (id: string, updates: Partial<CommCycle>) => {
    const { data, error } = await v2
      .from('comm_cycles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setCycles(prev => prev.map(c => c.id === id ? data as CommCycle : c))
  }, [])

  const deleteCycle = useCallback(async (id: string) => {
    const { error } = await v2.from('comm_cycles').delete().eq('id', id)
    if (!error) setCycles(prev => prev.filter(c => c.id !== id))
  }, [])

  const setCycleStatus = useCallback(async (id: string, status: CommCycleStatus) => {
    await updateCycle(id, { status })
  }, [updateCycle])

  return { cycles, loading, currentCycle, addCycle, updateCycle, deleteCycle, setCycleStatus }
}
