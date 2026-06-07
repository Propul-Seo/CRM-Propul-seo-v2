import { useState } from 'react'
import { toast } from 'sonner'
import {
  Lock, Unlock, MoreVertical, RefreshCw, Power, Loader2,
} from 'lucide-react'
import { usePortalState } from '../hooks/usePortalState'
import { PortalStateCard } from './PortalStateCard'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { usePortalActivation } from '../hooks/usePortalActivation'
import { ActivatePortalDialog, type ActivatePortalPayload } from './ActivatePortalDialog'
import { DeactivatePortalDialog } from './DeactivatePortalDialog'

interface ProjectLike {
  id: string
  name: string
  portal_client_email: string | null
  portal_previous_client_email?: string | null
  portal_activated_at?: string | null
}

export interface CreateContactInput {
  name: string
  email: string
  phone?: string | null
}

interface Props {
  project: ProjectLike
  isAdmin: boolean
  suggestedEmail?: string | null
  /** Si un contact "Principal" existe déjà sur le projet, on bloque la création
   * d'un doublon depuis le dialog (contrainte unique 23505). */
  primaryContactName?: string | null
  onRefresh: () => void | Promise<void>
  /** Crée et lie un contact au projet (rôle 'primary'). Optionnel : si non fourni,
   * la création de contact est désactivée. Retourne true si OK, false si échec. */
  onCreateContact?: (input: CreateContactInput) => Promise<boolean>
}

// Section sidebar admin "Portail client" : 2 états (inactif / actif).
// Inactif → bouton qui ouvre ActivatePortalDialog.
// Actif   → badge email + dropdown (renvoyer invitation / désactiver).
// Visible uniquement pour les admins (la garde DB existe via le trigger SQL).
export function PortalStatusSection({ project, isAdmin, suggestedEmail, primaryContactName, onRefresh, onCreateContact }: Props) {
  const [activateOpen, setActivateOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const { activatePortal, resendInvite, deactivatePortal, isResending } = usePortalActivation()

  const { data: stateRow, refresh: refreshState } = usePortalState(project.id)

  if (!isAdmin) return null

  // État réel calculé côté DB (vue propulspace_portal_state_v2 joint auth.users).
  // 5 états distincts : inactive | orphan | broken | invited | active.
  const state = stateRow?.state ?? 'inactive'
  const hasEmail = state !== 'inactive'
  const canResend = state === 'active' || state === 'invited'

  async function refreshAll() {
    await Promise.all([onRefresh(), refreshState()])
  }

  async function handleActivate(payload: ActivatePortalPayload) {
    // 1) Création optionnelle du contact si l'admin a rempli prénom/nom/téléphone.
    const fullName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim()
    const hasContactInfo = !!(fullName || payload.phone)
    if (hasContactInfo && onCreateContact) {
      const created = await onCreateContact({
        name: fullName || payload.email,
        email: payload.email,
        phone: payload.phone ?? null,
      })
      if (!created) {
        return { success: false, error: 'Le contact n\'a pas pu être créé. Le portail n\'a pas été activé.' }
      }
    }

    // 2) Activation du portail (envoi de l'invitation).
    const result = await activatePortal(project.id, payload.email)
    if (result.success) {
      toast.success('Portail activé', {
        description: `Le client recevra un email d'invitation à ${payload.email} dans quelques minutes.`,
      })
      await refreshAll()
    }
    return result
  }

  async function handleResend() {
    if (!project.portal_client_email) return
    const result = await resendInvite(project.id)
    if (result.success) {
      toast.success('Lien d\'accès renvoyé', {
        description: `Un nouveau lien a été envoyé à ${project.portal_client_email}.`,
      })
      await refreshAll()
    } else {
      toast.error('Impossible de renvoyer le lien', { description: result.error })
    }
  }

  async function handleDeactivate(reason?: string) {
    const result = await deactivatePortal(project.id, reason)
    if (result.success) {
      toast.success('Portail désactivé', {
        description: 'L\'accès du client expirera au prochain rafraîchissement.',
      })
      await refreshAll()
    }
    return result
  }

  const defaultEmail = project.portal_previous_client_email ?? suggestedEmail ?? ''
  const defaultEmailHint = project.portal_previous_client_email
    ? 'Pré-rempli depuis le dernier email actif sur ce projet.'
    : suggestedEmail
      ? 'Pré-rempli depuis le contact principal du projet.'
      : undefined

  return (
    <div className="border-b border-[rgba(139,92,246,0.15)] py-4 px-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">
          Portail client
        </p>
        {hasEmail && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-6 w-6 flex items-center justify-center rounded text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[rgba(139,92,246,0.15)] transition-colors"
                aria-label="Actions portail"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {canResend && (
                <DropdownMenuItem onClick={handleResend} disabled={isResending}>
                  {isResending
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <RefreshCw className="mr-2 h-4 w-4" />}
                  Renvoyer le lien d'accès
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDeactivateOpen(true)}
                className="text-red-300 focus:text-red-300 focus:bg-red-500/10"
              >
                <Power className="mr-2 h-4 w-4" />
                Désactiver le portail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {hasEmail && stateRow && (
        <PortalStateCard
          state={stateRow.state}
          email={stateRow.portal_client_email}
          lastLoginAt={stateRow.last_login_at}
        />
      )}

      {!hasEmail && (
        <button
          onClick={() => setActivateOpen(true)}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md',
            'bg-gradient-to-r from-[#8B5CF6]/15 to-[#EC4899]/15',
            'border border-[rgba(139,92,246,0.3)] hover:border-[rgba(139,92,246,0.6)]',
            'text-xs font-semibold text-[#A78BFA] hover:text-[#ede9fe]',
            'transition-colors',
          )}
        >
          <Unlock className="h-3.5 w-3.5" />
          Activer le portail client
        </button>
      )}

      <ActivatePortalDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        projectName={project.name}
        defaultEmail={defaultEmail}
        defaultEmailHint={defaultEmailHint}
        primaryContactName={primaryContactName ?? null}
        onConfirm={handleActivate}
      />
      {project.portal_client_email && (
        <DeactivatePortalDialog
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
          projectName={project.name}
          clientEmail={project.portal_client_email}
          onConfirm={handleDeactivate}
        />
      )}
      {!hasEmail && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#9ca3af]">
          <Lock className="h-3 w-3" />
          Aucun accès client externe pour ce projet
        </div>
      )}
    </div>
  )
}
