import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceV2 {
  id: string
  project_id: string
  label: string
  amount: number
  status: InvoiceStatus
  date: string | null
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface UseBillingV2Return {
  invoices: InvoiceV2[]
  loading: boolean
  addInvoice: (data: Omit<InvoiceV2, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateInvoice: (id: string, updates: Partial<InvoiceV2>) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  setInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>
}

export function useBillingV2(projectId: string): UseBillingV2Return {
  const [invoices, setInvoices] = useState<InvoiceV2[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    v2
      .from('invoices')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setInvoices(data as InvoiceV2[])
        setLoading(false)
      })
  }, [projectId])

  const addInvoice = useCallback(async (data: Omit<InvoiceV2, 'id' | 'created_at' | 'updated_at'>) => {
    const { data: created, error } = await v2
      .from('invoices')
      .insert({ ...data, project_id: projectId })
      .select()
      .single()
    if (!error && created) setInvoices(prev => [...prev, created as InvoiceV2])
  }, [projectId])

  const updateInvoice = useCallback(async (id: string, updates: Partial<InvoiceV2>) => {
    const { data, error } = await v2
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setInvoices(prev => prev.map(i => i.id === id ? data as InvoiceV2 : i))
  }, [])

  const deleteInvoice = useCallback(async (id: string) => {
    const { error } = await v2.from('invoices').delete().eq('id', id)
    if (!error) setInvoices(prev => prev.filter(i => i.id !== id))
  }, [])

  const setInvoiceStatus = useCallback(async (id: string, status: InvoiceStatus) => {
    await updateInvoice(id, { status })
  }, [updateInvoice])

  return { invoices, loading, addInvoice, updateInvoice, deleteInvoice, setInvoiceStatus }
}
