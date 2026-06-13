import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import type { AccessCategory, AccessStatus } from '../../../types/project-v2'

// Note : depuis le Sprint 3A, la table public.project_accesses_v2 est chiffrée
// (login/password/notes en BYTEA). Ce hook passe donc par les RPC SECURITY DEFINER
// (get_decrypted_accesses / upsert_access / delete_access) au lieu des SELECT directs.
// La signature publique du hook reste identique pour ne pas casser SyntheseTab V2.

export interface ProjectAccessV2 {
  id: string
  project_id: string
  category: AccessCategory
  label: string
  url?: string | null
  login?: string | null
  password?: string | null
  notes?: string | null
  status: AccessStatus
  provided_by?: string | null
  expires_at?: string | null
  created_at: string
  updated_at: string
}

interface UseProjectAccessesV2Return {
  accesses: ProjectAccessV2[]
  loading: boolean
  addAccess: (data: Omit<ProjectAccessV2, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateAccess: (id: string, updates: Partial<ProjectAccessV2>) => Promise<void>
  deleteAccess: (id: string) => Promise<void>
}

export function useProjectAccessesV2(projectId: string): UseProjectAccessesV2Return {
  const [accesses, setAccesses] = useState<ProjectAccessV2[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAccesses = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    // Tente d'abord la lecture admin (avec secrets). Si non-admin, fallback métadonnées.
    const adminRes = await supabase.rpc('get_decrypted_accesses', { p_project_id: projectId })
    if (!adminRes.error && adminRes.data) {
      setAccesses(adminRes.data as ProjectAccessV2[])
      setLoading(false)
      return
    }
    // Non-admin (RPC raise 42501) → métadonnées seules
    const metaRes = await supabase.rpc('get_access_metadata', { p_project_id: projectId })
    if (metaRes.error) {
      console.error('[useProjectAccessesV2] fetch error:', metaRes.error.message)
      setAccesses([])
    } else {
      setAccesses((metaRes.data ?? []) as ProjectAccessV2[])
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => { void fetchAccesses() }, [fetchAccesses])

  const addAccess = useCallback(async (data: Omit<ProjectAccessV2, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.rpc('upsert_access', {
      p_id: null,
      p_project_id: projectId,
      p_category: data.category,
      p_label: data.label,
      p_url: data.url ?? null,
      p_login: data.login ?? null,
      p_password: data.password ?? null,
      p_notes: data.notes ?? null,
      p_status: data.status,
      p_provided_by: data.provided_by ?? null,
      p_expires_at: data.expires_at ?? null,
    })
    if (error) {
      console.error('[useProjectAccessesV2] insert error:', error.message)
      return
    }
    await fetchAccesses()
  }, [projectId, fetchAccesses])

  const updateAccess = useCallback(async (id: string, updates: Partial<ProjectAccessV2>) => {
    const { error } = await supabase.rpc('upsert_access', {
      p_id: id,
      p_project_id: projectId,
      p_category: updates.category ?? null,
      p_label: updates.label ?? null,
      p_url: updates.url ?? null,
      // Convention NULL=ne touche pas / ''=efface : on transmet undefined comme null
      p_login: updates.login === undefined ? null : updates.login,
      p_password: updates.password === undefined ? null : updates.password,
      p_notes: updates.notes === undefined ? null : updates.notes,
      p_status: updates.status ?? null,
      p_provided_by: updates.provided_by ?? null,
      p_expires_at: updates.expires_at ?? null,
    })
    if (error) {
      console.error('[useProjectAccessesV2] update error:', error.message)
      return
    }
    await fetchAccesses()
  }, [projectId, fetchAccesses])

  const deleteAccess = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('delete_access', { p_id: id })
    if (error) {
      console.error('[useProjectAccessesV2] delete error:', error.message)
      return
    }
    setAccesses(prev => prev.filter(a => a.id !== id))
  }, [])

  return { accesses, loading, addAccess, updateAccess, deleteAccess }
}
