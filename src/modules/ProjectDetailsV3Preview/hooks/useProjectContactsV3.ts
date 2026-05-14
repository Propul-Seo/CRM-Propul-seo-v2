import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase, v2 } from '@/lib/supabase'
import type {
  ProjectContactRole,
  ProjectContactWithDetails,
} from '@/types/project-v2'

interface UseReturn {
  contacts: ProjectContactWithDetails[]
  loading: boolean
  refetch: () => Promise<void>
  /** Lier un contact existant au projet avec un rôle. */
  linkContact: (contactId: string, role?: ProjectContactRole) => Promise<boolean>
  /**
   * Créer un nouveau contact et le lier au projet.
   * `customLabel` est stocké dans `notes` (utile pour role='other' avec libellé libre).
   */
  createAndLink: (
    data: { name: string; email: string; phone?: string | null; company?: string | null },
    role?: ProjectContactRole,
    customLabel?: string | null,
  ) => Promise<boolean>
  /** Délier un contact du projet (ne supprime pas le contact). */
  unlinkContact: (projectContactId: string) => Promise<boolean>
  /**
   * Changer le rôle d'un contact lié au projet.
   * `customLabel` (optionnel) est stocké dans `notes` ; passer `null` pour effacer.
   */
  setRole: (
    projectContactId: string,
    role: ProjectContactRole,
    customLabel?: string | null,
  ) => Promise<boolean>
}

/**
 * Liste les contacts liés à un projet via la table `project_contacts`.
 * Permet d'ajouter, retirer, changer le rôle des contacts.
 *
 * Note : `project_contacts` est en schéma public (pas v2), donc on utilise
 * `supabase` directement (pas le proxy v2).
 */
export function useProjectContactsV3(projectId: string): UseReturn {
  const [contacts, setContacts] = useState<ProjectContactWithDetails[]>([])
  const [loading, setLoading] = useState(false)

  /**
   * Synchronise projects_v2.client_id avec le contact 'primary' de project_contacts.
   * Évite la divergence entre l'ancien système (client_id) et le nouveau (project_contacts).
   * Appelée après chaque changement qui peut affecter le contact principal.
   */
  const syncPrimaryToClientId = useCallback(async () => {
    if (!projectId) return
    // Récupérer le contact primary actuel (peut être null si aucun primary)
    const { data, error } = await supabase
      .from('project_contacts')
      .select('contact_id, contact:contacts ( id, name )')
      .eq('project_id', projectId)
      .eq('role', 'primary')
      .maybeSingle()

    if (error) {
      console.error('[sync-primary]', error)
      return
    }

    type SyncRow = { contact_id: string; contact: { id: string; name: string } | null }
    const row = data as SyncRow | null
    const newClientId = row?.contact_id ?? null
    const newClientName = row?.contact?.name ?? ''

    const { error: updateErr } = await v2
      .from('projects')
      .update({ client_id: newClientId, client_name: newClientName })
      .eq('id', projectId)

    if (updateErr) {
      console.error('[sync-primary-update]', updateErr)
    }
  }, [projectId])

  const fetchContacts = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('project_contacts')
      .select(
        `id, project_id, contact_id, role, notes, created_at, updated_at,
         contact:contacts ( id, name, email, phone, company )`,
      )
      .eq('project_id', projectId)
      .order('role', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[project-contacts-fetch]', error)
      toast.error('Impossible de charger les contacts du projet')
      setLoading(false)
      return
    }
    // Filtre les liens orphelins (contact supprimé entre-temps) avant le cast typé.
    type RawRow = Omit<ProjectContactWithDetails, 'contact'> & {
      contact: ProjectContactWithDetails['contact'] | null
    }
    const rows = (data ?? []) as unknown as RawRow[]
    setContacts(rows.filter((r): r is ProjectContactWithDetails => r.contact !== null))
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const linkContact = useCallback(
    async (contactId: string, role: ProjectContactRole = 'other') => {
      const { error } = await supabase
        .from('project_contacts')
        .insert({ project_id: projectId, contact_id: contactId, role })
      if (error) {
        // Code 23505 = violation unique (already linked OR primary already exists)
        if (error.code === '23505') {
          toast.error(
            role === 'primary'
              ? 'Un contact « Principal » existe déjà pour ce projet'
              : 'Ce contact est déjà lié au projet',
          )
        } else {
          console.error('[project-contacts-link]', error)
          toast.error(`Erreur lors de la liaison : ${error.message}`)
        }
        return false
      }
      toast.success('Contact lié au projet')
      if (role === 'primary') await syncPrimaryToClientId()
      await fetchContacts()
      return true
    },
    [projectId, fetchContacts, syncPrimaryToClientId],
  )

  const createAndLink = useCallback(
    async (
      data: { name: string; email: string; phone?: string | null; company?: string | null },
      role: ProjectContactRole = 'primary',
      customLabel: string | null = null,
    ) => {
      // 1. Créer le contact
      const { data: created, error: createErr } = await supabase
        .from('contacts')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          company: data.company ?? null,
        })
        .select('id')
        .single()

      if (createErr || !created) {
        console.error('[project-contacts-create]', createErr)
        toast.error(`Erreur lors de la création : ${createErr?.message ?? 'inconnue'}`)
        return false
      }

      // 2. Lier au projet (notes = customLabel, utile pour role='other' avec libellé libre)
      const notesValue = role === 'other' && customLabel?.trim() ? customLabel.trim() : null
      const { error: linkErr } = await supabase
        .from('project_contacts')
        .insert({ project_id: projectId, contact_id: created.id, role, notes: notesValue })

      if (linkErr) {
        // Rollback : supprimer le contact orphelin
        await supabase.from('contacts').delete().eq('id', created.id)
        if (linkErr.code === '23505' && role === 'primary') {
          toast.error('Un contact « Principal » existe déjà pour ce projet')
        } else {
          console.error('[project-contacts-link-after-create]', linkErr)
          toast.error('Contact créé puis supprimé : impossible de le lier au projet')
        }
        return false
      }

      toast.success('Contact créé et lié au projet')
      if (role === 'primary') await syncPrimaryToClientId()
      await fetchContacts()
      return true
    },
    [projectId, fetchContacts, syncPrimaryToClientId],
  )

  const unlinkContact = useCallback(
    async (projectContactId: string) => {
      // Vérifier si le contact à délier était primary (pour synchro client_id si oui)
      const wasPrimary = contacts.find((c) => c.id === projectContactId)?.role === 'primary'
      const { error } = await supabase.from('project_contacts').delete().eq('id', projectContactId)
      if (error) {
        console.error('[project-contacts-unlink]', error)
        toast.error(`Erreur lors de la suppression : ${error.message}`)
        return false
      }
      toast.success('Contact retiré du projet')
      if (wasPrimary) await syncPrimaryToClientId()
      await fetchContacts()
      return true
    },
    [contacts, fetchContacts, syncPrimaryToClientId],
  )

  const setRole = useCallback(
    async (
      projectContactId: string,
      role: ProjectContactRole,
      customLabel: string | null = null,
    ) => {
      // Snapshot du rôle avant changement (pour savoir si on touche au primary)
      const previousRole = contacts.find((c) => c.id === projectContactId)?.role
      // Si on quitte 'other', on efface le label custom ; sinon on prend la valeur passée.
      const notesUpdate =
        role === 'other'
          ? customLabel?.trim() || null
          : null
      const { error } = await supabase
        .from('project_contacts')
        .update({ role, notes: notesUpdate })
        .eq('id', projectContactId)
      if (error) {
        if (error.code === '23505' && role === 'primary') {
          toast.error('Un contact « Principal » existe déjà pour ce projet')
        } else {
          console.error('[project-contacts-set-role]', error)
          toast.error(`Erreur lors du changement de rôle : ${error.message}`)
        }
        return false
      }
      toast.success('Rôle mis à jour')
      // Synchro si le primary change (nouveau primary OU ancien primary démoté)
      if (role === 'primary' || previousRole === 'primary') {
        await syncPrimaryToClientId()
      }
      await fetchContacts()
      return true
    },
    [contacts, fetchContacts, syncPrimaryToClientId],
  )

  return { contacts, loading, refetch: fetchContacts, linkContact, createAndLink, unlinkContact, setRole }
}
