import { useState } from 'react'
import { adminRpc } from '@/modules/EspaceClient/admin/lib/adminRpc'

/** Type de pipeline source pour la conversion (hors qualification). */
export type LeadConversionType = 'site_web' | 'erp'

interface ConvertInput {
  /** Identifiant du lead source (contacts.id pour site_web, crmerp_leads.id pour erp). */
  leadId: string
  /** Pipeline d'origine du lead — détermine la table source côté RPC. */
  leadType: LeadConversionType
}

interface ConvertResult {
  success: boolean
  projectId?: string
  error?: string
}

interface RpcResponse {
  project_id: string
  lead_type: string
  documents_created: number
  contact_created: boolean
}

function isRpcResponse(v: unknown): v is RpcResponse {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.project_id === 'string'
}

/**
 * Convertit un lead signé (site web ou ERP) en projet `projects_v2` COMPLET
 * via la RPC unifiée SP2 `admin_convert_lead_to_project` : projet +
 * contact primary + activité système + marquage `converted_to_project_id`
 * sur la source (anti double-conversion). La conversion est non destructive.
 */
export function useConvertLeadToProject() {
  const [converting, setConverting] = useState(false)

  const convert = async (input: ConvertInput): Promise<ConvertResult> => {
    setConverting(true)
    try {
      const { data, error } = await adminRpc('admin_convert_lead_to_project', {
        p_lead_id: input.leadId,
        p_lead_type: input.leadType,
      })
      if (error) {
        console.error('[useConvertLeadToProject] rpc failed', error)
        return { success: false, error: error.message }
      }
      if (!isRpcResponse(data)) {
        if (import.meta.env.DEV) console.error('[useConvertLeadToProject] RPC shape inattendu:', data)
        return { success: false, error: 'RPC retour invalide (shape inattendu)' }
      }
      return { success: true, projectId: data.project_id }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('[useConvertLeadToProject] exception', err)
      return { success: false, error: msg }
    } finally {
      setConverting(false)
    }
  }

  return { convert, converting }
}
