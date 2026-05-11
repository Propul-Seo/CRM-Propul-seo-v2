// Copie isolée pour V3 — comportement identique à useMockChecklist (V2).
// Ne pas modifier le hook V2 ; toute évolution se fait ici.
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_SITEWEB_CHECKLISTS } from '@/modules/SiteWebManager/mocks/mockSiteWebChecklists'
import { MOCK_ERP_CHECKLISTS } from '@/modules/ERPManager/mocks/mockERPChecklists'
import type { ChecklistItemV2, ChecklistPhase, ChecklistStatus } from '@/types/project-v2'

const MOCK_REGISTRY: Record<string, ChecklistItemV2[]> = {
  ...MOCK_SITEWEB_CHECKLISTS,
  ...MOCK_ERP_CHECKLISTS,
}

function isMockProject(projectId: string) {
  return projectId.startsWith('sw-') || projectId.startsWith('erp-') || projectId.startsWith('comm-')
}

interface UseReturn {
  items: ChecklistItemV2[]
  loading: boolean
  progress: number
  progressByPhase: Record<ChecklistPhase, { total: number; done: number; percent: number }>
  addItem: (item: Omit<ChecklistItemV2, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  addItems: (items: Omit<ChecklistItemV2, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>
  updateItem: (id: string, updates: Partial<ChecklistItemV2>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  setItemStatus: (id: string, status: ChecklistStatus) => Promise<void>
}

const PHASES: ChecklistPhase[] = ['onboarding', 'conception', 'developpement', 'recette', 'post_livraison', 'general']

export function useChecklistV3(projectId: string): UseReturn {
  const [items, setItems] = useState<ChecklistItemV2[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    if (isMockProject(projectId)) {
      setItems(MOCK_REGISTRY[projectId] ?? [])
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('checklist_items_v2')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setItems(data as ChecklistItemV2[])
        setLoading(false)
      })
  }, [projectId])

  const progress = useMemo(() => {
    const rootItems = items.filter((i) => !i.parent_task_id)
    if (rootItems.length === 0) return 0
    return Math.round((rootItems.filter((i) => i.status === 'done').length / rootItems.length) * 100)
  }, [items])

  const progressByPhase = useMemo(() => {
    const result = {} as Record<ChecklistPhase, { total: number; done: number; percent: number }>
    for (const phase of PHASES) {
      const phaseItems = items.filter((i) => i.phase === phase && !i.parent_task_id)
      const done = phaseItems.filter((i) => i.status === 'done').length
      result[phase] = {
        total: phaseItems.length,
        done,
        percent: phaseItems.length > 0 ? Math.round((done / phaseItems.length) * 100) : 0,
      }
    }
    return result
  }, [items])

  const addItem = useCallback(
    async (data: Omit<ChecklistItemV2, 'id' | 'created_at' | 'updated_at'>) => {
      if (isMockProject(projectId)) {
        const newItem: ChecklistItemV2 = {
          ...data,
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setItems((prev) => [...prev, newItem])
        return
      }
      const { data: created, error } = await supabase
        .from('checklist_items_v2')
        .insert({ ...data, project_id: projectId })
        .select()
        .single()
      if (!error && created) setItems((prev) => [...prev, created as ChecklistItemV2])
    },
    [projectId],
  )

  const addItems = useCallback(
    async (dataList: Omit<ChecklistItemV2, 'id' | 'created_at' | 'updated_at'>[]) => {
      if (isMockProject(projectId)) {
        const now = new Date().toISOString()
        const newItems = dataList.map((data) => ({
          ...data,
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          created_at: now,
          updated_at: now,
        }))
        setItems((prev) => [...prev, ...newItems])
        return
      }
      const rows = dataList.map((data) => {
        const { position, ...rest } = data as Record<string, unknown>
        return { ...rest, project_id: projectId, sort_order: position ?? (rest as Record<string, unknown>).sort_order ?? 0 }
      })
      const { data: created, error } = await supabase.from('checklist_items_v2').insert(rows).select()
      if (!error && created) setItems((prev) => [...prev, ...(created as ChecklistItemV2[])])
    },
    [projectId],
  )

  const updateItem = useCallback(
    async (id: string, updates: Partial<ChecklistItemV2>) => {
      if (isMockProject(projectId)) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i)),
        )
        return
      }
      const { data, error } = await supabase
        .from('checklist_items_v2')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error && data) setItems((prev) => prev.map((i) => (i.id === id ? (data as ChecklistItemV2) : i)))
    },
    [projectId],
  )

  const deleteItem = useCallback(
    async (id: string) => {
      if (isMockProject(projectId)) {
        setItems((prev) => prev.filter((i) => i.id !== id && i.parent_task_id !== id))
        return
      }
      const { error } = await supabase.from('checklist_items_v2').delete().eq('id', id)
      if (!error) setItems((prev) => prev.filter((i) => i.id !== id && i.parent_task_id !== id))
    },
    [projectId],
  )

  const setItemStatus = useCallback(
    async (id: string, status: ChecklistStatus) => {
      await updateItem(id, { status })
    },
    [updateItem],
  )

  return { items, loading, progress, progressByPhase, addItem, addItems, updateItem, deleteItem, setItemStatus }
}
