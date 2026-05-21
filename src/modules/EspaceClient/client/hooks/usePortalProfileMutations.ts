import { useState } from 'react'
import { portalSupabase } from '@/lib/supabase'
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext'

interface MutationResult {
  success: boolean
  error?: string
}

interface ProfileUpdates {
  client_first_name?: string | null
  client_phone?: string | null
  client_company?: string | null
}

/**
 * Hook mutations profil portail client :
 * - updateProfile : édite phone/company/firstName sur projects_v2 (le client
 *   modifie SES infos visibles côté admin agence)
 * - changePassword : utilise supabase.auth.updateUser pour changer le mot de
 *   passe du compte connecté
 *
 * NB : la table projects_v2 a actuellement une policy permissive FOR ALL TO
 *      authenticated USING (true) (R-018 à corriger). On compense côté UI en
 *      filtrant par project.id du contexte portail.
 */
export function usePortalProfileMutations() {
  const { project } = usePortal()
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  const updateProfile = async (updates: ProfileUpdates): Promise<MutationResult> => {
    setSavingProfile(true)
    try {
      const { error } = await portalSupabase
        .from('projects_v2')
        .update(updates)
        .eq('id', project.id)
      if (error) return { success: false, error: error.message }
      return { success: true }
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async (newPassword: string): Promise<MutationResult> => {
    if (newPassword.length < 8) {
      return { success: false, error: 'Le mot de passe doit faire au moins 8 caractères' }
    }
    setChangingPwd(true)
    try {
      const { error } = await portalSupabase.auth.updateUser({ password: newPassword })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } finally {
      setChangingPwd(false)
    }
  }

  return { updateProfile, changePassword, savingProfile, changingPwd }
}
