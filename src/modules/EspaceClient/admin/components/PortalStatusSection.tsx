import { useState } from 'react'
import { toast } from 'sonner'
import {
  Lock, Unlock, MoreVertical, RefreshCw, Power, Loader2, Mail, Clock,
  CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react'
import { usePortalState, type PortalState } from '../hooks/usePortalState'
import { AdminCard, AdminEmptyState } from '@/modules/EspaceClient/admin/components/kit'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

// Métadonnées d'affichage par état (5 états croisant projects_v2 + auth.users).
// Tokens CRM sombres uniquement (pas de --ps-*).
interface StateDisplay {
  label: string
  Icon: typeof CheckCircle2
  badgeClass: string
  description?: string
}

const STATE_DISPLAY: Record<Exclude<PortalState, 'inactive'>, StateDisplay> = {
  active: {
    label: 'Actif',
    Icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },
  invited: {
    label: 'Invité',
    Icon: Clock,
    badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    description: 'Invitation envoyée. En attente de la première connexion du client.',
  },
  orphan: {
    label: 'À régulariser',
    Icon: AlertTriangle,
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    description: "Email saisi sans envoi d'invitation officielle. Désactivez puis réactivez pour envoyer le lien magique.",
  },
  broken: {
    label: 'Compte supprimé',
    Icon: XCircle,
    badgeClass: 'bg-red-500/10 text-red-300 border-red-500/30',
    description: 'Invitation envoyée mais le compte a été supprimé. Désactivez puis réactivez pour recréer un compte.',
  },
}

function formatRelative(iso: string | null | undefined): string | null {
  if (!iso) return null
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`
  return `il y a ${Math.floor(days / 30)} mois`
}

// Section admin "Portail client" (thème CRM sombre, KIT partagé).
// Inactif → état vide de marque + CTA "Activer le portail".
// Actif   → carte d'état lisible : badge visible + email + dernière connexion + menu d'actions.
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

  const display = hasEmail ? STATE_DISPLAY[state as Exclude<PortalState, 'inactive'>] : null
  const email = stateRow?.portal_client_email ?? project.portal_client_email
  const lastLogin = state === 'active' ? formatRelative(stateRow?.last_login_at) : null

  const dialogs = (
    <>
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
    </>
  )

  // État inactif : aucun accès externe → état vide de marque + CTA violet.
  if (!hasEmail || !display) {
    return (
      <>
        <AdminEmptyState
          icon={Lock}
          title="Aucun accès portail"
          body="Ce projet n'a pas encore d'espace client externe. Activez le portail pour envoyer une invitation par email."
          action={
            <button
              type="button"
              onClick={() => setActivateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
            >
              <Unlock className="h-4 w-4" />
              Activer le portail client
            </button>
          }
        />
        {dialogs}
      </>
    )
  }

  // État actif (active/invited/orphan/broken) : carte lisible + menu d'actions.
  return (
    <>
      <AdminCard className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold ${display.badgeClass}`}
          >
            <display.Icon className="h-3.5 w-3.5" />
            {display.label}
            {lastLogin && (
              <span className="font-normal opacity-70">· vu {lastLogin}</span>
            )}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
                aria-label="Actions portail"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
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
                className="text-red-300 focus:bg-red-500/10 focus:text-red-300"
              >
                <Power className="mr-2 h-4 w-4" />
                Désactiver le portail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {email && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{email}</span>
          </div>
        )}

        {display.description && (
          <p className="text-xs leading-relaxed text-muted-foreground">{display.description}</p>
        )}
      </AdminCard>
      {dialogs}
    </>
  )
}
