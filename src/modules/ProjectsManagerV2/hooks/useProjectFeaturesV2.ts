import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { ProjectFeature, ProjectFeatureStatus } from '../../../types/project-v2'

interface UseProjectFeaturesV2Return {
  features: ProjectFeature[]
  loading: boolean
  totalPrice: number
  totalHours: number
  addFeature: (data: Omit<ProjectFeature, 'id' | 'created_at' | 'updated_at' | 'template'>) => Promise<void>
  updateFeature: (id: string, updates: Partial<ProjectFeature>) => Promise<void>
  deleteFeature: (id: string) => Promise<void>
  setFeatureStatus: (id: string, status: ProjectFeatureStatus) => Promise<void>
}

export function useProjectFeaturesV2(projectId: string): UseProjectFeaturesV2Return {
  const [features, setFeatures] = useState<ProjectFeature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    v2
      .from('project_features')
      .select('*, template:feature_templates(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setFeatures(data as ProjectFeature[])
        setLoading(false)
      })
  }, [projectId])

  const totalPrice = features.reduce((sum, f) => {
    const price = f.custom_price ?? f.template?.price ?? 0
    return sum + price
  }, 0)

  const totalHours = features.reduce((sum, f) => {
    const hours = f.custom_hours ?? f.template?.estimated_hours ?? 0
    return sum + hours
  }, 0)

  const addFeature = useCallback(async (data: Omit<ProjectFeature, 'id' | 'created_at' | 'updated_at' | 'template'>) => {
    const { data: created, error } = await v2
      .from('project_features')
      .insert({ ...data, project_id: projectId })
      .select('*, template:feature_templates(*)')
      .single()
    if (!error && created) setFeatures(prev => [...prev, created as ProjectFeature])
  }, [projectId])

  const updateFeature = useCallback(async (id: string, updates: Partial<ProjectFeature>) => {
    const { data, error } = await v2
      .from('project_features')
      .update(updates)
      .eq('id', id)
      .select('*, template:feature_templates(*)')
      .single()
    if (!error && data) setFeatures(prev => prev.map(f => f.id === id ? data as ProjectFeature : f))
  }, [])

  const deleteFeature = useCallback(async (id: string) => {
    const { error } = await v2.from('project_features').delete().eq('id', id)
    if (!error) setFeatures(prev => prev.filter(f => f.id !== id))
  }, [])

  const setFeatureStatus = useCallback(async (id: string, status: ProjectFeatureStatus) => {
    await updateFeature(id, { status })
  }, [updateFeature])

  return { features, loading, totalPrice, totalHours, addFeature, updateFeature, deleteFeature, setFeatureStatus }
}
