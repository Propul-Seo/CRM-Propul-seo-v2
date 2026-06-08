import { useState } from 'react'
import { adminRpc } from '@/modules/EspaceClient/admin/lib/adminRpc'
import type { QualificationLead } from './useLeadsV3Qualification'

interface ConvertResult {
  success: boolean
  projectId?: string
  documentsCreated?: number
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
    && typeof o.documents_created === 'number'
}

/**
 * Convertit un lead qualif `submitted` en projet V2 + crée les rows GED
 * depuis les fichiers uploadés (logo, charte, screenshots).
 *
 * Tout passe par la RPC unifiée SP2 `admin_convert_lead_to_project`
 * (p_lead_type='qualification') qui exécute INSERT projet + contact primary
 * + activité + INSERT documents + UPDATE qualif en transaction atomique.
 *
 * Le portail est découplé de la conversion (décision Q6) : l'activation se
 * fait depuis la section Propul'Space admin (PortalStatusSection), plus ici.
 */
export function useConvertQualifLead() {
  const [converting, setConverting] = useState(false)

  const convert = async (lead: QualificationLead): Promise<ConvertResult> => {
    setConverting(true)
    try {
      const { data, error } = await adminRpc('admin_convert_lead_to_project', {
        p_lead_id: lead.id,
        p_lead_type: 'qualification',
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!isRpcResponse(data)) {
        if (import.meta.env.DEV) console.error('[useConvertQualifLead] RPC shape inattendu:', data)
        return { success: false, error: 'RPC retour invalide (shape inattendu)' }
      }

      return {
        success: true,
        projectId: data.project_id,
        documentsCreated: data.documents_created,
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      return { success: false, error: msg }
    } finally {
      setConverting(false)
    }
  }

  return { convert, converting }
}
