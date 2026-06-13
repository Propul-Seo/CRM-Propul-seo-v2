import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { CommTask, CommTaskStatus } from '../../../types/project-v2'

interface UseCommTasksV2Return {
  tasks: CommTask[]
  loading: boolean
  addTask: (data: Omit<CommTask, 'id' | 'created_at' | 'updated_at' | 'project_name' | 'project_color'>) => Promise<void>
  updateTask: (id: string, updates: Partial<CommTask>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  setTaskStatus: (id: string, status: CommTaskStatus) => Promise<void>
}

export function useCommTasksV2(projectId: string): UseCommTasksV2Return {
  const [tasks, setTasks] = useState<CommTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    v2
      .from('comm_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setTasks(data as CommTask[])
        setLoading(false)
      })
  }, [projectId])

  const addTask = useCallback(async (data: Omit<CommTask, 'id' | 'created_at' | 'updated_at' | 'project_name' | 'project_color'>) => {
    const { data: created, error } = await v2
      .from('comm_tasks')
      .insert({ ...data, project_id: projectId })
      .select()
      .single()
    if (!error && created) setTasks(prev => [...prev, created as CommTask])
  }, [projectId])

  const updateTask = useCallback(async (id: string, updates: Partial<CommTask>) => {
    const { data, error } = await v2
      .from('comm_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setTasks(prev => prev.map(t => t.id === id ? data as CommTask : t))
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await v2.from('comm_tasks').delete().eq('id', id)
    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const setTaskStatus = useCallback(async (id: string, status: CommTaskStatus) => {
    await updateTask(id, { status })
  }, [updateTask])

  return { tasks, loading, addTask, updateTask, deleteTask, setTaskStatus }
}
