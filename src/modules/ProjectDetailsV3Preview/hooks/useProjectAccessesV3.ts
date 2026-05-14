import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AccessCategory, AccessStatus } from '@/types/project-v2'

export interface ProjectAccessV3 {
  id: string
  project_id: string
  category: AccessCategory
  label: string
  url: string | null
  login: string | null
  password: string | null
  notes: string | null
  status: AccessStatus
  provided_by: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Convention pour les 3 champs chiffrés (login/password/notes) :
 *  - `undefined` ou `null` → ne touche pas à la valeur en BDD (préserve)
 *  - `''` (string vide)     → EFFACE la valeur en BDD
 *  - valeur                 → chiffre et remplace
 *
 * Les formulaires d'édition doivent envoyer `undefined` pour les champs non modifiés,
 * pas `''`, sinon le secret existant sera supprimé.
 */
export interface AccessUpsertInput {
  id?: string | null
  category: AccessCategory
  label: string
  url?: string | null
  login?: string | null
  password?: string | null
  notes?: string | null
  status: AccessStatus
  provided_by?: string | null
  expires_at?: string | null
}

interface UseReturn {
  accesses: ProjectAccessV3[]
  loading: boolean
  error: string | null
  hasSecrets: boolean
  upsertAccess: (input: AccessUpsertInput) => Promise<void>
  deleteAccess: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useProjectAccessesV3(projectId: string, isAdmin: boolean): UseReturn {
  const [accesses, setAccesses] = useState<ProjectAccessV3[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccesses = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    const rpc = isAdmin ? 'get_decrypted_accesses' : 'get_access_metadata'
    const { data, error: rpcError } = await supabase.rpc(rpc, { p_project_id: projectId })
    if (rpcError) {
      console.error(`[useProjectAccessesV3] ${rpc} error:`, rpcError.message)
      setError(rpcError.message)
      setAccesses([])
    } else {
      const rows = (data ?? []) as ProjectAccessV3[]
      setAccesses(rows.map(a => ({
        ...a,
        login: isAdmin ? a.login ?? null : null,
        password: isAdmin ? a.password ?? null : null,
        notes: isAdmin ? a.notes ?? null : null,
      })))
    }
    setLoading(false)
  }, [projectId, isAdmin])

  useEffect(() => { void fetchAccesses() }, [fetchAccesses])

  const upsertAccess = useCallback(async (input: AccessUpsertInput) => {
    const { error: rpcError } = await supabase.rpc('upsert_access', {
      p_id: input.id ?? null,
      p_project_id: projectId,
      p_category: input.category,
      p_label: input.label,
      p_url: input.url ?? null,
      p_login: input.login ?? null,
      p_password: input.password ?? null,
      p_notes: input.notes ?? null,
      p_status: input.status,
      p_provided_by: input.provided_by ?? null,
      p_expires_at: input.expires_at ?? null,
    })
    if (rpcError) {
      console.error('[useProjectAccessesV3] upsert error:', rpcError.message)
      throw new Error(rpcError.message)
    }
    await fetchAccesses()
  }, [projectId, fetchAccesses])

  const deleteAccess = useCallback(async (id: string) => {
    let snapshot: ProjectAccessV3[] = []
    setAccesses(prev => {
      snapshot = prev
      return prev.filter(a => a.id !== id)
    })
    const { error: rpcError } = await supabase.rpc('delete_access', { p_id: id })
    if (rpcError) {
      console.error('[useProjectAccessesV3] delete error:', rpcError.message)
      setAccesses(snapshot)
      throw new Error(rpcError.message)
    }
  }, [])

  return {
    accesses, loading, error,
    hasSecrets: isAdmin,
    upsertAccess, deleteAccess,
    refresh: fetchAccesses,
  }
}
