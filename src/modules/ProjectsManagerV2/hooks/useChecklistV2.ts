import { useState, useEffect, useCallback, useMemo } from 'react'
import { v2 } from '../../../lib/supabase'
import type { ChecklistItemV2, ChecklistPhase, ChecklistStatus } from '../../../types/project-v2'

interface UseChecklistV2Return {
  items: ChecklistItemV2[]
  loading: boolean
  progress: number
  progressByPhase: Record<ChecklistPhase, { total: number; done: number; percent: number }>
  addItem: (item: Omit<ChecklistItemV2, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateItem: (id: string, updates: Partial<ChecklistItemV2>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  setItemStatus: (id: string, status: ChecklistStatus) => Promise<void>
}

export function useChecklistV2(projectId: string): UseChecklistV2Return {
  const [items, setItems] = useState<ChecklistItemV2[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    v2
      .from('checklist_items')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setItems(data as ChecklistItemV2[])
        setLoading(false)
      })
  }, [projectId])

  const progress = useMemo(() => {
    const rootItems = items.filter(i => !i.parent_task_id)
    if (rootItems.length === 0) return 0
    const done = rootItems.filter(i => i.status === 'done').length
    return Math.round((done / rootItems.length) * 100)
  }, [items])

  const progressByPhase = useMemo(() => {
    const phases: ChecklistPhase[] = ['onboarding', 'conception', 'developpement', 'recette', 'post_livraison', 'general']
    const result = {} as Record<ChecklistPhase, { total: number; done: number; percent: number }>
    for (const phase of phases) {
      const phaseItems = items.filter(i => i.phase === phase && !i.parent_task_id)
      const done = phaseItems.filter(i => i.status === 'done').length
      result[phase] = {
        total: phaseItems.length,
        done,
        percent: phaseItems.length > 0 ? Math.round((done / phaseItems.length) * 100) : 0,
      }
    }
    return result
  }, [items])

  const addItem = useCallback(async (data: Omit<ChecklistItemV2, 'id' | 'created_at' | 'updated_at'>) => {
    const { data: created, error } = await v2
      .from('checklist_items')
      .insert({ ...data, project_id: projectId })
      .select()
      .single()
    if (!error && created) setItems(prev => [...prev, created as ChecklistItemV2])
  }, [projectId])

  const updateItem = useCallback(async (id: string, updates: Partial<ChecklistItemV2>) => {
    const { data, error } = await v2
      .from('checklist_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setItems(prev => prev.map(i => i.id === id ? data as ChecklistItemV2 : i))
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await v2.from('checklist_items').delete().eq('id', id)
    if (!error) setItems(prev => prev.filter(i => i.id !== id && i.parent_task_id !== id))
  }, [])

  const setItemStatus = useCallback(async (id: string, status: ChecklistStatus) => {
    await updateItem(id, { status })
  }, [updateItem])

  return { items, loading, progress, progressByPhase, addItem, updateItem, deleteItem, setItemStatus }
}
