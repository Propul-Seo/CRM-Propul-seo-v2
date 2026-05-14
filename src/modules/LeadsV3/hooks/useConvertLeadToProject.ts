import { useState } from 'react'
import { v2 } from '@/lib/supabase'
import type { ProjectV2 } from '@/types/project-v2'

interface ConvertInput {
  /** Nom du projet (par défaut, le nom de l'entreprise du lead). */
  name: string
  /** Nom du client (entreprise ou contact). */
  client_name: string | null
  /** Identifiant utilisateur assigné (responsable). */
  assigned_to: string | null
  /** Nom du responsable pour cache visuel. */
  assigned_name: string | null
  /** Budget estimé (si dispo côté lead). */
  budget: number | null
  /** Source du lead (origine). */
  source: string | null
}

interface ConvertResult {
  success: boolean
  projectId?: string
  error?: string
}

/**
 * Crée un `projects_v2` minimal à partir d'un lead signé.
 * Ne supprime ni n'archive le lead source — la conversion est non destructive.
 */
export function useConvertLeadToProject() {
  const [converting, setConverting] = useState(false)

  const convert = async (input: ConvertInput): Promise<ConvertResult> => {
    setConverting(true)
    try {
      const payload: Partial<ProjectV2> = {
        name: input.name.trim() || 'Nouveau projet',
        client_name: input.client_name?.trim() || null,
        status: 'brief_received',
        priority: 'medium',
        presta_type: ['site_web'],
        category: 'site_web',
        assigned_to: input.assigned_to,
        assigned_name: input.assigned_name,
        budget: input.budget,
        progress: 0,
        is_archived: false,
        start_date: new Date().toISOString().slice(0, 10),
      }
      const { data, error } = await v2
        .from('projects')
        .insert(payload)
        .select('id')
        .single()
      if (error) {
        console.error('[useConvertLeadToProject] insert failed', error)
        return { success: false, error: error.message }
      }
      return { success: true, projectId: (data as { id: string }).id }
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
