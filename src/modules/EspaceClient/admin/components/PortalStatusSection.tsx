import { useState } from 'react'
import { toast } from 'sonner'
import {
  Lock, Unlock, Mail, MoreVertical, RefreshCw, Power, CheckCircle2, Loader2,
} from 'lucide-react'
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
  onRefresh: () => void | Promise<void>
  /** Crée et lie un contact au projet (rôle 'primary'). Optionnel : si non fourni,
   * la création de contact est désactivée. Retourne true si OK, false si échec. */
  onCreateContact?: (input: CreateContactInput) => Promise<boolean>
}

// Section sidebar admin "Portail client" : 2 états (inactif / actif).
// Inactif → bouton qui ouvre ActivatePortalDialog.
// Actif   → badge email + dropdown (renvoyer invitation / désactiver).
// Visible uniquement pour les admins (la garde DB existe via le trigger SQL).
export function PortalStatusSection({ project, isAdmin, suggestedEmail, onRefresh, onCreateContact }: Props) {
  const [activateOpen, setActivateOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const { activatePortal, resendInvite, deactivatePortal, isResending } = usePortalActivation()

  if (!isAdmin) return null

  const active = !!project.portal_client_email

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
      await onRefresh()
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
      await onRefresh()
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
      await onRefresh()
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
        {active && (
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
              <DropdownMenuItem onClick={handleResend} disabled={isResending}>
                {isResending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <RefreshCw className="mr-2 h-4 w-4" />}
                Renvoyer le lien d'accès
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeactivateOpen(true)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Power className="mr-2 h-4 w-4" />
                Désactiver le portail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {active ? (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
              Actif
            </p>
            <p className="text-xs text-[#ede9fe] truncate flex items-center gap-1 mt-0.5">
              <Mail className="h-3 w-3 text-[#9ca3af] shrink-0" />
              <span className="truncate">{project.portal_client_email}</span>
            </p>
          </div>
        </div>
      ) : (
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
      {!active && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#9ca3af]">
          <Lock className="h-3 w-3" />
          Aucun accès client externe pour ce projet
        </div>
      )}
    </div>
  )
}
