import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CRMERPLead } from '@/modules/CRMERP/types'
import type { ErpStatus } from '../utils/leadStatusMapping'

/**
 * Hook isolé pour Leads V3 — lit les leads ERP (table `crmerp_leads`).
 * Duplique la query de `useCRMERPData` pour rester indépendant de V1.
 */
export function useLeadsV3Erp() {
  const [leads, setLeads] = useState<CRMERPLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('crmerp_leads')
        .select('*, assignee:users!assignee_id(id, name, email)')
        .order('created_at', { ascending: false })
      if (err) throw err
      setLeads((data ?? []) as CRMERPLead[])
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const updateStatus = useCallback(async (id: string, status: ErpStatus) => {
    const { error: err } = await supabase
      .from('crmerp_leads')
      .update({ status })
      .eq('id', id)
    if (err) throw err
    await fetchLeads()
  }, [fetchLeads])

  return { leads, loading, error, refetch: fetchLeads, updateStatus }
}
