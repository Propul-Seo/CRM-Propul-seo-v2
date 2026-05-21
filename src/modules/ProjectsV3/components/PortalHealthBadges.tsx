import { Clock, AlertTriangle, PenLine, Wifi, WifiOff } from 'lucide-react'
import type { PortalHealth } from '../hooks/usePortalHealth'

interface Props {
  health: PortalHealth | undefined
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'jamais'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `${days}j`
  if (days < 30) return `${Math.floor(days / 7)}sem`
  return `${Math.floor(days / 30)}m`
}

/**
 * Mini-badges affichés sur ProjectCardV3 pour signaler la santé portail
 * (réservé aux projets dont le portail est activé).
 * Rien n'est rendu si la prop `health` est undefined (projet sans portail).
 */
export function PortalHealthBadges({ health }: Props) {
  if (!health) return null

  const online = health.last_client_login_at !== null
  const overdue = health.invoices_overdue > 0
  const pendingInvoices = health.invoices_pending > 0
  const pendingSig = health.signatures_pending > 0

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <Badge
        tone={online ? 'green' : 'gray'}
        icon={online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        label={online ? `vu ${formatRelative(health.last_client_login_at)}` : 'jamais venu'}
      />
      {overdue && (
        <Badge
          tone="red"
          icon={<AlertTriangle className="h-3 w-3" />}
          label={`${health.invoices_overdue} en retard`}
        />
      )}
      {!overdue && pendingInvoices && (
        <Badge
          tone="amber"
          icon={<Clock className="h-3 w-3" />}
          label={`${health.invoices_pending} à payer`}
        />
      )}
      {pendingSig && (
        <Badge
          tone="violet"
          icon={<PenLine className="h-3 w-3" />}
          label={`${health.signatures_pending} sig.`}
        />
      )}
    </div>
  )
}

type Tone = 'green' | 'amber' | 'red' | 'violet' | 'gray'

const TONE_CLASSES: Record<Tone, string> = {
  green:  'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  amber:  'border-amber-400/30 bg-amber-500/10 text-amber-300',
  red:    'border-red-400/40 bg-red-500/15 text-red-300',
  violet: 'border-violet-400/30 bg-violet-500/10 text-violet-300',
  gray:   'border-white/10 bg-white/5 text-[#9ca3af]',
}

function Badge({ tone, icon, label }: { tone: Tone; icon: React.ReactNode; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${TONE_CLASSES[tone]}`}
    >
      {icon}
      {label}
    </span>
  )
}
