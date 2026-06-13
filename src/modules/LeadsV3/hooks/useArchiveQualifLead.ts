import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ArchiveResult {
  success: boolean
  error?: string
}

/**
 * Archive un lead qualif `submitted` → status='unqualified'.
 * La raison (optionnelle) est concaténée dans le champ `notes` admin.
 */
export function useArchiveQualifLead() {
  const [archiving, setArchiving] = useState(false)

  const archive = async (leadId: string, reason: string | null): Promise<ArchiveResult> => {
    setArchiving(true)
    try {
      const trimmed = reason?.trim()
      const noteSuffix = trimmed
        ? `[Archivé ${new Date().toLocaleDateString('fr-FR')}] ${trimmed}`
        : `[Archivé ${new Date().toLocaleDateString('fr-FR')}]`

      // Récup notes existantes pour append (sinon écrasement).
      const { data: existing } = await supabase
        .schema('propulspace')
        .from('qualification_leads')
        .select('notes')
        .eq('id', leadId)
        .single()

      const newNotes = existing?.notes ? `${existing.notes}\n${noteSuffix}` : noteSuffix

      const { error } = await supabase
        .schema('propulspace')
        .from('qualification_leads')
        .update({ status: 'unqualified', notes: newNotes })
        .eq('id', leadId)

      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
    } finally {
      setArchiving(false)
    }
  }

  return { archive, archiving }
}
