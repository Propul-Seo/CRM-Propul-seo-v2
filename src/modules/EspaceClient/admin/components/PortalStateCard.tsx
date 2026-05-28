import { CheckCircle2, AlertTriangle, Clock, Mail, XCircle } from 'lucide-react'
import type { PortalState } from '../hooks/usePortalState'

interface Props {
  state: PortalState
  email: string | null
  lastLoginAt?: string | null
}

interface Display {
  cardClass: string
  iconClass: string
  Icon: typeof CheckCircle2
  labelClass: string
  label: string
  description?: string
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

const DISPLAY: Record<Exclude<PortalState, 'inactive'>, Omit<Display, 'description'>> = {
  active: {
    cardClass: 'bg-emerald-500/10 border-emerald-500/30',
    iconClass: 'text-emerald-400',
    Icon: CheckCircle2,
    labelClass: 'text-emerald-300',
    label: 'Actif',
  },
  invited: {
    cardClass: 'bg-sky-500/10 border-sky-500/30',
    iconClass: 'text-sky-400',
    Icon: Clock,
    labelClass: 'text-sky-300',
    label: 'Invité',
  },
  orphan: {
    cardClass: 'bg-amber-500/10 border-amber-500/30',
    iconClass: 'text-amber-400',
    Icon: AlertTriangle,
    labelClass: 'text-amber-300',
    label: 'À régulariser',
  },
  broken: {
    cardClass: 'bg-red-500/10 border-red-500/30',
    iconClass: 'text-red-400',
    Icon: XCircle,
    labelClass: 'text-red-300',
    label: 'Compte supprimé',
  },
}

const DESCRIPTIONS: Partial<Record<PortalState, string>> = {
  invited: 'Invitation envoyée. En attente de la première connexion du client.',
  orphan:  'Email saisi sans envoi d\'invitation officielle. Désactivez puis réactivez pour envoyer le magic link.',
  broken:  'Invitation envoyée mais le compte a été supprimé. Désactivez puis réactivez pour recréer un compte.',
}

export function PortalStateCard({ state, email, lastLoginAt }: Props) {
  if (state === 'inactive') return null
  const d = DISPLAY[state]
  const description = DESCRIPTIONS[state]
  const relative = state === 'active' ? formatRelative(lastLoginAt ?? null) : null

  return (
    <div className={`px-2.5 py-2 rounded-md border ${d.cardClass}`}>
      <div className="flex items-start gap-2">
        <d.Icon className={`h-4 w-4 shrink-0 mt-0.5 ${d.iconClass}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${d.labelClass}`}>
            {d.label}
            {relative && <span className="ml-1.5 text-[10px] font-normal opacity-70">· vu {relative}</span>}
          </p>
          <p className="text-xs text-[#ede9fe] truncate flex items-center gap-1 mt-0.5">
            <Mail className="h-3 w-3 text-[#9ca3af] shrink-0" />
            <span className="truncate">{email}</span>
          </p>
          {description && (
            <p className={`mt-1 text-[10.5px] leading-snug opacity-80 ${d.labelClass}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
