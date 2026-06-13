import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { DocumentCategory } from '../../../types/project-v2'

export interface DocumentV2 {
  id: string
  project_id: string
  category: DocumentCategory
  name: string
  file_url: string
  file_size?: number | null
  mime_type?: string | null
  version: number
  uploaded_by?: string | null
  created_at: string
  updated_at: string
}

interface UseDocumentsV2Return {
  documents: DocumentV2[]
  loading: boolean
  addDocument: (data: Omit<DocumentV2, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateDocument: (id: string, updates: Partial<DocumentV2>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
}

export function useDocumentsV2(projectId: string): UseDocumentsV2Return {
  const [documents, setDocuments] = useState<DocumentV2[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    v2
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setDocuments(data as DocumentV2[])
        setLoading(false)
      })
  }, [projectId])

  const addDocument = useCallback(async (data: Omit<DocumentV2, 'id' | 'created_at' | 'updated_at'>) => {
    const { data: created, error } = await v2
      .from('project_documents')
      .insert({ ...data, project_id: projectId })
      .select()
      .single()
    if (!error && created) setDocuments(prev => [created as DocumentV2, ...prev])
  }, [projectId])

  const updateDocument = useCallback(async (id: string, updates: Partial<DocumentV2>) => {
    const { data, error } = await v2
      .from('project_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setDocuments(prev => prev.map(d => d.id === id ? data as DocumentV2 : d))
  }, [])

  const deleteDocument = useCallback(async (id: string) => {
    const { error } = await v2.from('project_documents').delete().eq('id', id)
    if (!error) setDocuments(prev => prev.filter(d => d.id !== id))
  }, [])

  return { documents, loading, addDocument, updateDocument, deleteDocument }
}
