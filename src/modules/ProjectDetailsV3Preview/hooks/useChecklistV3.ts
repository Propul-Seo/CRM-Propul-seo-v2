// Copie isolée pour V3 — comportement identique à useMockChecklist (V2).
// Ne pas modifier le hook V2 ; toute évolution se fait ici.
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
// Mocks V2 utilisés UNIQUEMENT en mode démo (projectId avec préfixe `sw-`/`erp-`/`comm-`).
// Les projets réels en BDD ont des UUID — la fonction `isMockProject` ci-dessous
// retourne false pour tout UUID, donc cette branche n'est jamais exécutée en prod.
// À supprimer le jour où on n'a plus besoin du mode démo offline.
import { MOCK_SITEWEB_CHECKLISTS } from '@/modules/ProjectDetailsV3Preview/mocks/mockSiteWebChecklists'
import { MOCK_ERP_CHECKLISTS } from '@/modules/ProjectDetailsV3Preview/mocks/mockERPChecklists'
import { buildTemplateForProject } from './checklistTemplates'
import type { ChecklistItemV2, ChecklistPhase, ChecklistStatus, PrestaType } from '@/types/project-v2'

const MOCK_REGISTRY: Record<string, ChecklistItemV2[]> = {
  ...MOCK_SITEWEB_CHECKLISTS,
  ...MOCK_ERP_CHECKLISTS,
}

// True uniquement pour les IDs de démo hardcodés (`sw-001`, `erp-002`, etc.).
// Les UUID Supabase commencent par un caractère hexadécimal, jamais par ces préfixes.
function isMockProject(projectId: string) {
  return projectId.startsWith('sw-') || projectId.startsWith('erp-') || projectId.startsWith('comm-')
}

interface UseReturn {
  items: ChecklistItemV2[]
  loading: boolean
  /** IDs des items dont une mutation (status/update/delete) est en cours côté BDD. */
  pendingIds: Set<string>
  progress: number
  progressByPhase: Record<ChecklistPhase, { total: number; done: number; percent: number }>
  addItem: (item: Omit<ChecklistItemV2, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  addItems: (items: Omit<ChecklistItemV2, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>
  updateItem: (id: string, updates: Partial<ChecklistItemV2>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  setItemStatus: (id: string, status: ChecklistStatus) => Promise<void>
}

const PHASES: ChecklistPhase[] = ['onboarding', 'conception', 'developpement', 'recette', 'post_livraison', 'general']

// Garde anti-double-matérialisation : StrictMode (mount/unmount/remount en dev)
// et navigations rapides peuvent déclencher 2 mounts concurrents avant que le
// premier INSERT ne soit visible. On verrouille par projectId au niveau module.
const materializingProjects = new Set<string>()

export function useChecklistV3(projectId: string): UseReturn {
  const [items, setItems] = useState<ChecklistItemV2[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())

  const markPending = useCallback((id: string) => {
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const unmarkPending = useCallback((id: string) => {
    setPendingIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  useEffect(() => {
    if (!projectId) return
    if (isMockProject(projectId)) {
      setItems(MOCK_REGISTRY[projectId] ?? [])
      setLoading(false)
      return
    }
    let cancelled = false
    setItems([])
    setLoading(true)
    ;(async () => {
      const { data: existing, error } = await supabase
        .from('checklist_items_v2')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })
      if (cancelled) return
      if (error) {
        console.error('[useChecklistV3] load failed', error)
        setLoading(false)
        return
      }
      if (existing && existing.length > 0) {
        setItems(existing as ChecklistItemV2[])
        setLoading(false)
        return
      }
      // Aucun item en BDD : on tente une matérialisation depuis le template
      // selon les presta_type du projet. Si le projet n'a pas de presta_type
      // reconnu, on reste sur une liste vide (comportement actuel).
      // Verrou anti-double-INSERT en cas de mounts concurrents (StrictMode).
      if (materializingProjects.has(projectId)) {
        setLoading(false)
        return
      }
      materializingProjects.add(projectId)
      try {
        const { data: project, error: projErr } = await supabase
          .from('projects_v2')
          .select('presta_type, assigned_to')
          .eq('id', projectId)
          .single()
        if (cancelled) return
        if (projErr || !project) {
          console.error('[useChecklistV3] project lookup failed', projErr)
          setItems([])
          setLoading(false)
          return
        }
        const template = buildTemplateForProject(
          (project as { presta_type: PrestaType[] | null }).presta_type,
          (project as { assigned_to: string | null }).assigned_to,
        )
        if (template.length === 0) {
          setItems([])
          setLoading(false)
          return
        }
        const rows = template.map((t) => ({
          project_id: projectId,
          parent_task_id: t.parent_task_id ?? null,
          title: t.title,
          phase: t.phase,
          status: t.status,
          priority: t.priority,
          assigned_to: t.assigned_to,
          assigned_name: t.assigned_name ?? null,
          due_date: t.due_date ?? null,
          sort_order: t.position,
        }))
        const { data: inserted, error: insErr } = await supabase
          .from('checklist_items_v2')
          .insert(rows)
          .select()
        if (cancelled) return
        if (insErr) {
          console.error('[useChecklistV3] materialize failed', insErr)
          setItems([])
          setLoading(false)
          return
        }
        setItems((inserted ?? []) as ChecklistItemV2[])
        setLoading(false)
      } finally {
        materializingProjects.delete(projectId)
      }
    })()
    return () => {
      cancelled = true
    }
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

  // Le type ChecklistItemV2 utilise `position` mais la table BDD `public.checklist_items_v2`
  // utilise `sort_order`. On normalise au point d'insertion BDD pour éviter le silent fail.
  const toDbRow = (data: Omit<ChecklistItemV2, 'id' | 'created_at' | 'updated_at'>) => {
    const { position, ...rest } = data as Record<string, unknown>
    return {
      ...rest,
      project_id: projectId,
      sort_order: position ?? (rest as Record<string, unknown>).sort_order ?? 0,
    }
  }

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
        .insert(toDbRow(data))
        .select()
        .single()
      if (error) {
        console.error('[useChecklistV3] addItem failed', { data, error })
        throw new Error(`Impossible d'ajouter la tâche : ${error.message}`)
      }
      if (created) setItems((prev) => [...prev, created as ChecklistItemV2])
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
      const rows = dataList.map(toDbRow)
      const { data: created, error } = await supabase.from('checklist_items_v2').insert(rows).select()
      if (error) {
        console.error('[useChecklistV3] addItems failed', { count: dataList.length, error })
        throw new Error(`Impossible d'ajouter les tâches : ${error.message}`)
      }
      if (created) setItems((prev) => [...prev, ...(created as ChecklistItemV2[])])
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
      const { position, ...restUpdates } = updates as Record<string, unknown>
      const dbUpdates =
        position !== undefined ? { ...restUpdates, sort_order: position } : restUpdates
      const { data, error } = await supabase
        .from('checklist_items_v2')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()
      if (error) {
        console.error('[useChecklistV3] updateItem failed', { id, updates, error })
        throw new Error(`Impossible de modifier la tâche : ${error.message}`)
      }
      if (data) setItems((prev) => prev.map((i) => (i.id === id ? (data as ChecklistItemV2) : i)))
    },
    [projectId],
  )

  const deleteItem = useCallback(
    async (id: string) => {
      if (isMockProject(projectId)) {
        setItems((prev) => prev.filter((i) => i.id !== id && i.parent_task_id !== id))
        return
      }
      // Optimiste : on capture le snapshot juste avant la mutation pour éviter
      // les races sur double-clic (lire prev dans le setter, pas dans la closure).
      let snapshot: ChecklistItemV2[] = []
      setItems((prev) => {
        snapshot = prev
        return prev.filter((i) => i.id !== id && i.parent_task_id !== id)
      })
      const { error } = await supabase.from('checklist_items_v2').delete().eq('id', id)
      if (error) {
        console.error('[useChecklistV3] deleteItem failed', { id, error })
        setItems(snapshot)
        throw new Error(`Impossible de supprimer la tâche : ${error.message}`)
      }
    },
    [projectId],
  )

  const setItemStatus = useCallback(
    async (id: string, status: ChecklistStatus) => {
      if (isMockProject(projectId)) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status, updated_at: new Date().toISOString() } : i)),
        )
        return
      }
      // Optimiste : on capture l'item au moment du setter (pas via closure)
      // pour éviter qu'un rollback efface une mutation concurrente.
      let previous: ChecklistItemV2 | null = null
      setItems((prev) => {
        const found = prev.find((i) => i.id === id)
        if (!found) return prev
        previous = found
        return prev.map((i) => (i.id === id ? { ...i, status, updated_at: new Date().toISOString() } : i))
      })
      if (!previous) return
      markPending(id)
      try {
        const { data, error } = await supabase
          .from('checklist_items_v2')
          .update({ status })
          .eq('id', id)
          .select()
          .single()
        if (error) {
          console.error('[useChecklistV3] setItemStatus failed', { id, status, error })
          const rollback = previous
          setItems((prev) => prev.map((i) => (i.id === id ? rollback : i)))
          throw new Error(`Impossible de changer le statut : ${error.message}`)
        }
        if (data) setItems((prev) => prev.map((i) => (i.id === id ? (data as ChecklistItemV2) : i)))
      } finally {
        unmarkPending(id)
      }
    },
    [projectId, markPending, unmarkPending],
  )

  return { items, loading, pendingIds, progress, progressByPhase, addItem, addItems, updateItem, deleteItem, setItemStatus }
}
