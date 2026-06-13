import { useState, useEffect, useCallback } from 'react'
import { v2 } from '@/lib/supabase'
import { triggerStatusAutomations } from '@/services/automationService'
import type { ProjectV2, ProjectStatusV2 } from '@/types/project-v2'

interface UseProjectsV3Return {
  projects: ProjectV2[]
  loading: boolean
  updateProjectStatus: (id: string, newStatus: ProjectStatusV2) => Promise<void>
  updateProject: (id: string, updates: Partial<ProjectV2>) => Promise<void>
  addProject: (data: Omit<ProjectV2, 'id' | 'created_at' | 'updated_at'>) => Promise<ProjectV2 | null>
  deleteProject: (id: string) => Promise<void>
  getProjectById: (id: string) => ProjectV2 | undefined
  refetch: () => void
}

export function useProjectsV3(): UseProjectsV3Return {
  const [projects, setProjects] = useState<ProjectV2[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const { data, error } = await v2
      .from('projects')
      .select('*')
      .eq('is_archived', false)
      // Les projets « Clôturé » quittent le board actif → ils n'apparaissent que
      // dans « Projets terminés » (useCompletedProjectsV3). Cohérent avec ce module.
      .neq('status', 'closed')
      .order('last_activity_at', { ascending: false })
    if (!error && data) setProjects(data as ProjectV2[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const updateProjectStatus = useCallback(async (id: string, newStatus: ProjectStatusV2) => {
    const { data, error } = await v2
      .from('projects')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('[updateProjectStatus] Supabase error:', error)
      throw new Error(error.message)
    }
    if (!data) {
      throw new Error('Aucun projet retourné après update')
    }
    let fromStatus: ProjectStatusV2 | undefined
    setProjects(prev => {
      fromStatus = prev.find(p => p.id === id)?.status
      return prev.map(p => p.id === id ? data as ProjectV2 : p)
    })
    if (fromStatus && fromStatus !== newStatus) {
      triggerStatusAutomations(id, fromStatus, newStatus).catch(err =>
        console.error('[automation] triggerStatusAutomations failed:', err)
      )
    }
  }, [])

  const updateProject = useCallback(async (id: string, updates: Partial<ProjectV2>) => {
    const { data, error } = await v2
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setProjects(prev => prev.map(p => p.id === id ? data as ProjectV2 : p))
    }
  }, [])

  const addProject = useCallback(async (projectData: Omit<ProjectV2, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectV2 | null> => {
    const { data, error } = await v2
      .from('projects')
      .insert(projectData)
      .select()
      .single()
    if (error) {
      console.error('[addProject] Supabase error:', error)
      return null
    }
    if (data) {
      setProjects(prev => [data as ProjectV2, ...prev])
      return data as ProjectV2
    }
    return null
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await v2.from('projects').delete().eq('id', id)
    if (!error) setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  const getProjectById = useCallback((id: string) => {
    return projects.find(p => p.id === id)
  }, [projects])

  return {
    projects, loading,
    updateProjectStatus, updateProject, addProject, deleteProject, getProjectById,
    refetch: fetchProjects,
  }
}
