import { useState } from 'react'
import { toast } from 'sonner'
import { v2 } from '@/lib/supabase'
import type { ProjectV2 } from '@/types/project-v2'

interface Result {
  success: boolean
  error?: string
}

/**
 * Hook V3 dédié à la mise à jour d'un projet sur le schéma V2 (table `projects_v2`).
 * À utiliser à la place de `useProjectsCRUD` qui tape la vieille table `public.projects` (V1)
 * dont les colonnes ne correspondent pas (pas de `presta_type`, `assigned_name`, etc.).
 */
export function useProjectUpdateV3() {
  const [saving, setSaving] = useState(false)

  const updateProject = async (id: string, updates: Partial<ProjectV2>): Promise<Result> => {
    setSaving(true)
    try {
      const { error } = await v2.from('projects').update(updates).eq('id', id)
      if (error) throw error
      toast.success('Projet mis à jour')
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('[project-update-v3]', err)
      toast.error(`Erreur lors de la mise à jour : ${message}`)
      return { success: false, error: message }
    } finally {
      setSaving(false)
    }
  }

  return { updateProject, saving }
}
