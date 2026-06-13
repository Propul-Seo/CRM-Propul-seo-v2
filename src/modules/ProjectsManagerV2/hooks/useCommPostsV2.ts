import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { CommPost, CommPostStatus } from '../../../types/project-v2'

interface UseCommPostsV2Return {
  posts: CommPost[]
  loading: boolean
  addPost: (data: Omit<CommPost, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updatePost: (id: string, updates: Partial<CommPost>) => Promise<void>
  deletePost: (id: string) => Promise<void>
  setPostStatus: (id: string, status: CommPostStatus) => Promise<void>
}

export function useCommPostsV2(projectId: string): UseCommPostsV2Return {
  const [posts, setPosts] = useState<CommPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    v2
      .from('comm_posts')
      .select('*')
      .eq('project_id', projectId)
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .then(({ data, error }) => {
        if (!error && data) setPosts(data as CommPost[])
        setLoading(false)
      })
  }, [projectId])

  const addPost = useCallback(async (data: Omit<CommPost, 'id' | 'created_at' | 'updated_at'>) => {
    const { data: created, error } = await v2
      .from('comm_posts')
      .insert({ ...data, project_id: projectId })
      .select()
      .single()
    if (!error && created) setPosts(prev => [...prev, created as CommPost])
  }, [projectId])

  const updatePost = useCallback(async (id: string, updates: Partial<CommPost>) => {
    const { data, error } = await v2
      .from('comm_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setPosts(prev => prev.map(p => p.id === id ? data as CommPost : p))
  }, [])

  const deletePost = useCallback(async (id: string) => {
    const { error } = await v2.from('comm_posts').delete().eq('id', id)
    if (!error) setPosts(prev => prev.filter(p => p.id !== id))
  }, [])

  const setPostStatus = useCallback(async (id: string, status: CommPostStatus) => {
    await updatePost(id, { status })
  }, [updatePost])

  return { posts, loading, addPost, updatePost, deletePost, setPostStatus }
}
