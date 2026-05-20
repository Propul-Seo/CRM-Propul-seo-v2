import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { QualificationLead } from './useLeadsV3Qualification'

interface ConvertResult {
  success: boolean
  projectId?: string
  documentsCreated?: number
  portalInvited?: boolean
  error?: string
}

interface RpcResponse {
  project_id: string
  documents_created: number
  portal_activated: boolean
}

/**
 * Convertit un lead qualif `submitted` en projet V2 + crée les rows GED
 * depuis les fichiers uploadés (logo, charte, screenshots).
 *
 * Tout passe par la RPC SECURITY DEFINER `admin_convert_qualif_to_project`
 * qui exécute INSERT projet + INSERT documents + UPDATE qualif en transaction
 * atomique (migration 245). Plus de double-call ni de risque de désync.
 *
 * Si `activatePortal` est true, l'edge function `admin-portal-invite` est
 * appelée APRÈS la RPC (best-effort, échec non bloquant).
 */
export function useConvertQualifLead() {
  const [converting, setConverting] = useState(false)

  const convert = async (lead: QualificationLead, activatePortal: boolean): Promise<ConvertResult> => {
    setConverting(true)
    try {
      const { data, error } = await supabase.rpc('admin_convert_qualif_to_project', {
        p_qualif_id: lead.id,
        p_activate_portal: activatePortal,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      const payload = data as RpcResponse | null
      if (!payload?.project_id) {
        return { success: false, error: 'RPC retour invalide (project_id manquant)' }
      }

      const projectId = payload.project_id

      let portalInvited = false
      if (activatePortal) {
        try {
          const { error: inviteErr } = await supabase.functions.invoke('admin-portal-invite', {
            body: { projectId, email: lead.email },
          })
          portalInvited = !inviteErr
          if (inviteErr && import.meta.env.DEV) {
            console.error('[useConvertQualifLead] portal invite failed:', inviteErr)
          }
        } catch (e) {
          if (import.meta.env.DEV) console.error('[useConvertQualifLead] portal invite exception:', e)
        }
      }

      return {
        success: true,
        projectId,
        documentsCreated: payload.documents_created,
        portalInvited,
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
