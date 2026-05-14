// src/modules/ClientPortal/useClientPortal.ts
import { useState, useCallback } from 'react'
import { supabaseAnon, v2 } from '@/lib/supabase'
import { generateShortCode } from '@/lib/shortCode'
import type { ProjectV2, ChecklistItemV2 } from '@/types/project-v2'

export interface PortalInvoice {
  id: string
  label: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  date: string | null
  due_date: string | null
}

export interface PortalClientContact {
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  sector: string | null
}

export interface PortalData {
  project: Pick<
    ProjectV2,
    | 'id'
    | 'name'
    | 'client_name'
    | 'status'
    | 'progress'
    | 'completion_score'
    | 'next_action_label'
    | 'next_action_due'
    | 'presta_type'
    | 'start_date'
    | 'end_date'
    | 'budget'
    | 'ai_summary'
    | 'portal_expires_at'
  >
  checklist: Pick<ChecklistItemV2, 'id' | 'title' | 'phase' | 'status'>[]
  invoices: PortalInvoice[]
  contact: PortalClientContact | null
}

export function useClientPortal() {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lecture publique via RPC SECURITY DEFINER : validation token cote serveur.
  // Renvoie projet + checklist + invoices + contact en un appel atomique.
  const fetchPortalData = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)
    setData(null)

    const { data: payload, error: rpcError } = await supabaseAnon.rpc('get_portal_data', {
      p_short_code: token,
    })

    if (rpcError || !payload || typeof payload !== 'object') {
      setError('Lien invalide ou expiré.')
      setLoading(false)
      return
    }

    const p = payload as { error?: string; project?: PortalData['project']; checklist?: PortalData['checklist']; invoices?: PortalInvoice[]; contact?: PortalClientContact | null }
    if (p.error || !p.project) {
      setError('Lien invalide ou expiré.')
      setLoading(false)
      return
    }

    setData({
      project: p.project,
      checklist: p.checklist ?? [],
      invoices: p.invoices ?? [],
      contact: p.contact ?? null,
    })
    setLoading(false)
  }, [])

  // Génère un token et active le portail (client authentifié)
  const generateToken = useCallback(async (projectId: string): Promise<{ shortCode: string; expiresAt: string } | null> => {
    const token = crypto.randomUUID()
    const shortCode = generateShortCode()
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await v2
      .from('projects')
      .update({
        portal_token: token,
        portal_enabled: true,
        portal_short_code: shortCode,
        portal_expires_at: expiresAt,
      })
      .eq('id', projectId)

    if (error) return null
    return { shortCode, expiresAt }
  }, [])

  // Désactive le portail et efface le token (client authentifié)
  const revokeToken = useCallback(async (projectId: string): Promise<boolean> => {
    const { error } = await v2
      .from('projects')
      .update({ portal_token: null, portal_enabled: false, portal_short_code: null, portal_expires_at: null })
      .eq('id', projectId)

    return !error
  }, [])

  return { data, loading, error, fetchPortalData, generateToken, revokeToken }
}
