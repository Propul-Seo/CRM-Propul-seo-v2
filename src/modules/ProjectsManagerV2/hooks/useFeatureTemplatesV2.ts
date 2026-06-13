import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { FeatureTemplate } from '../../../types/project-v2'

interface UseFeatureTemplatesV2Return {
  templates: FeatureTemplate[]
  loading: boolean
  getByCategory: (category: string) => FeatureTemplate[]
  addTemplate: (data: Omit<FeatureTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateTemplate: (id: string, updates: Partial<FeatureTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
}

export function useFeatureTemplatesV2(): UseFeatureTemplatesV2Return {
  const [templates, setTemplates] = useState<FeatureTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    v2
      .from('feature_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setTemplates(data as FeatureTemplate[])
        setLoading(false)
      })
  }, [])

  const getByCategory = useCallback(
    (category: string) => templates.filter(t => t.category === category),
    [templates]
  )

  const addTemplate = useCallback(async (data: Omit<FeatureTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    const { data: created, error } = await v2
      .from('feature_templates')
      .insert(data)
      .select()
      .single()
    if (!error && created) setTemplates(prev => [...prev, created as FeatureTemplate])
  }, [])

  const updateTemplate = useCallback(async (id: string, updates: Partial<FeatureTemplate>) => {
    const { data, error } = await v2
      .from('feature_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setTemplates(prev => prev.map(t => t.id === id ? data as FeatureTemplate : t))
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    const { error } = await v2.from('feature_templates').delete().eq('id', id)
    if (!error) setTemplates(prev => prev.filter(t => t.id !== id))
  }, [])

  return { templates, loading, getByCategory, addTemplate, updateTemplate, deleteTemplate }
}
