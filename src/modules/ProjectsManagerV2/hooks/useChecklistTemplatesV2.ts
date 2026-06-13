import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { ChecklistTemplate, ChecklistPhase } from '../../../types/project-v2'

interface UseChecklistTemplatesV2Return {
  templates: ChecklistTemplate[]
  loading: boolean
  getByPrestaType: (prestaType: string) => ChecklistTemplate[]
  addTemplate: (data: Omit<ChecklistTemplate, 'id' | 'created_at'>) => Promise<void>
  updateTemplate: (id: string, updates: Partial<ChecklistTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  applyToProject: (projectId: string, prestaType: string) => Promise<void>
}

export function useChecklistTemplatesV2(): UseChecklistTemplatesV2Return {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    v2
      .from('checklist_templates')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setTemplates(data as ChecklistTemplate[])
        setLoading(false)
      })
  }, [])

  const getByPrestaType = useCallback(
    (prestaType: string) => templates.filter(t => t.presta_type === prestaType),
    [templates]
  )

  const addTemplate = useCallback(async (data: Omit<ChecklistTemplate, 'id' | 'created_at'>) => {
    const { data: created, error } = await v2
      .from('checklist_templates')
      .insert(data)
      .select()
      .single()
    if (!error && created) setTemplates(prev => [...prev, created as ChecklistTemplate])
  }, [])

  const updateTemplate = useCallback(async (id: string, updates: Partial<ChecklistTemplate>) => {
    const { data, error } = await v2
      .from('checklist_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setTemplates(prev => prev.map(t => t.id === id ? data as ChecklistTemplate : t))
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    const { error } = await v2.from('checklist_templates').delete().eq('id', id)
    if (!error) setTemplates(prev => prev.filter(t => t.id !== id))
  }, [])

  const applyToProject = useCallback(async (projectId: string, prestaType: string) => {
    const matching = templates.filter(t => t.presta_type === prestaType)
    if (matching.length === 0) return

    const items = matching.map(t => ({
      project_id: projectId,
      template_id: t.id,
      phase: t.phase,
      title: t.title,
      description: t.description ?? null,
      priority: t.priority,
      estimated_hours: t.estimated_hours ?? null,
      position: t.position,
      status: 'todo' as const,
    }))

    await v2.from('checklist_items').insert(items)
  }, [templates])

  return { templates, loading, getByPrestaType, addTemplate, updateTemplate, deleteTemplate, applyToProject }
}
