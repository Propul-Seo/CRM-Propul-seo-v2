import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AccessStatusShared } from '@/components/v3/access-shared'
import type { AgencyCategory } from '../constants'

export interface AgencyAccess {
  id: string
  category: AgencyCategory
  label: string
  url: string | null
  login: string | null
  password: string | null
  notes: string | null
  status: AccessStatusShared
  provided_by: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface AgencyAccessUpsertInput {
  id?: string | null
  category: AgencyCategory
  label: string
  url?: string | null
  login?: string | null
  password?: string | null
  notes?: string | null
  status: AccessStatusShared
  provided_by?: string | null
  expires_at?: string | null
}

interface UseReturn {
  accesses: AgencyAccess[]
  loading: boolean
  error: string | null
  upsertAccess: (input: AgencyAccessUpsertInput) => Promise<void>
  deleteAccess: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useAgencyAccesses(isAdmin: boolean | null): UseReturn {
  const [accesses, setAccesses] = useState<AgencyAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccesses = useCallback(async () => {
    if (isAdmin === null) return
    setLoading(true)
    setError(null)
    const rpc = isAdmin ? 'get_decrypted_agency_accesses' : 'get_agency_access_metadata'
    const { data, error: rpcError } = await supabase.rpc(rpc)
    if (rpcError) {
      console.error(`[useAgencyAccesses] ${rpc} error:`, rpcError.message)
      setError(rpcError.message)
      setAccesses([])
    } else {
      const rows = (data ?? []) as AgencyAccess[]
      setAccesses(rows.map(a => ({
        ...a,
        login: isAdmin ? a.login ?? null : null,
        password: isAdmin ? a.password ?? null : null,
        notes: isAdmin ? a.notes ?? null : null,
      })))
    }
    setLoading(false)
  }, [isAdmin])

  useEffect(() => { void fetchAccesses() }, [fetchAccesses])

  const upsertAccess = useCallback(async (input: AgencyAccessUpsertInput) => {
    const { error: rpcError } = await supabase.rpc('upsert_agency_access', {
      p_id: input.id ?? null,
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
      console.error('[useAgencyAccesses] upsert error:', rpcError.message)
      throw new Error(rpcError.message)
    }
    await fetchAccesses()
  }, [fetchAccesses])

  const deleteAccess = useCallback(async (id: string) => {
    let snapshot: AgencyAccess[] = []
    setAccesses(prev => {
      snapshot = prev
      return prev.filter(a => a.id !== id)
    })
    const { error: rpcError } = await supabase.rpc('delete_agency_access', { p_id: id })
    if (rpcError) {
      console.error('[useAgencyAccesses] delete error:', rpcError.message)
      setAccesses(snapshot)
      throw new Error(rpcError.message)
    }
  }, [])

  return { accesses, loading, error, upsertAccess, deleteAccess, refresh: fetchAccesses }
}
