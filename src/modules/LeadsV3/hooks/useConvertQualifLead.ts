import { useState } from 'react'
import { supabase, v2 } from '@/lib/supabase'
import type { QualificationLead } from './useLeadsV3Qualification'
import type { ProjectV2 } from '@/types/project-v2'

// Estimation budget centrale en € depuis le range qualif.
const BUDGET_MIDPOINTS: Record<string, number> = {
  '<2000':       1000,
  '2000-5000':   3500,
  '5000-10000':  7500,
  '10000-20000': 15000,
  '>20000':      25000,
}

function midpoint(range: string | null): number | null {
  if (!range) return null
  return BUDGET_MIDPOINTS[range] ?? null
}

interface ConvertResult {
  success: boolean
  projectId?: string
  portalInvited?: boolean
  error?: string
}

/**
 * Convertit un lead qualif `submitted` en projet V2 + active le portail.
 * - Crée projects_v2 avec mapping selon project_type (site / site_erp / erp).
 * - Met à jour qualification_leads (status=converted, converted_to_project_id, converted_at).
 * - Envoie l'invitation portail si activatePortal === true (best-effort, échec non bloquant).
 */
export function useConvertQualifLead() {
  const [converting, setConverting] = useState(false)

  const convert = async (lead: QualificationLead, activatePortal: boolean): Promise<ConvertResult> => {
    setConverting(true)
    try {
      const projectName = lead.company_name?.trim() || lead.full_name?.trim() || 'Nouveau projet'
      const isErp = lead.project_type === 'erp'
      const isSiteErp = lead.project_type === 'site_erp'
      const prestaType = isErp ? ['erp'] : isSiteErp ? ['site_web', 'erp'] : ['site_web']
      const category = isErp ? 'erp' : 'site_web'

      const payload: Partial<ProjectV2> = {
        name: projectName,
        client_name: lead.company_name?.trim() || lead.full_name?.trim() || null,
        status: 'brief_received',
        priority: 'medium',
        presta_type: prestaType,
        category,
        budget: midpoint(lead.budget_range),
        progress: 0,
        is_archived: false,
        start_date: new Date().toISOString().slice(0, 10),
        portal_client_email: activatePortal ? lead.email : null,
      }

      const { data: created, error: insertErr } = await v2
        .from('projects')
        .insert(payload)
        .select('id')
        .single()
      if (insertErr || !created) {
        return { success: false, error: insertErr?.message ?? 'Insert projet échoué' }
      }
      const projectId = (created as { id: string }).id

      // Update qualification_leads — table propulspace.* via supabase client.
      // Si bloqué par RLS, fallback : créer mini-migration RPC dédiée (Bloc E).
      const { error: updateErr } = await supabase
        .schema('propulspace')
        .from('qualification_leads')
        .update({
          status: 'converted',
          converted_to_project_id: projectId,
          converted_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (updateErr) {
        // Le projet est créé, mais le lead n'est pas marqué converti — l'admin
        // devra reconvertir ou nettoyer manuellement. Log + retour info.
        if (import.meta.env.DEV) console.error('[useConvertQualifLead] update qualif failed:', updateErr)
        return { success: true, projectId, portalInvited: false, error: `Projet créé mais lead non marqué : ${updateErr.message}` }
      }

      // Activation portail (best-effort)
      // Contrat edge function admin-portal-invite : { projectId, email } (camelCase strict).
      let portalInvited = false
      if (activatePortal) {
        try {
          const { error: inviteErr } = await supabase.functions.invoke('admin-portal-invite', {
            body: { projectId, email: lead.email },
          })
          portalInvited = !inviteErr
          if (inviteErr && import.meta.env.DEV) console.error('[useConvertQualifLead] portal invite failed:', inviteErr)
        } catch (e) {
          if (import.meta.env.DEV) console.error('[useConvertQualifLead] portal invite exception:', e)
        }
      }

      return { success: true, projectId, portalInvited }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      return { success: false, error: msg }
    } finally {
      setConverting(false)
    }
  }

  return { convert, converting }
}
