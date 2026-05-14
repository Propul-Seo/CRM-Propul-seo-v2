import { Building2, Mail, Phone, User, ArrowUpRight } from 'lucide-react'

export interface LeadCardData {
  id: string
  /** Nom de l'entreprise — ligne d'accroche. */
  company: string | null
  /** Nom du contact (personne). */
  contact: string | null
  email: string | null
  phone: string | null
  /** Couleur (hex) qui représente la colonne / le statut. */
  statusColor: string
  /** Label du statut (utilisé en variante C "inbox"). */
  statusLabel: string
  /** Personne assignée (responsable). */
  assignee: string | null
  /** Source (origine du lead) si dispo. */
  source: string | null
  /** Date d'entrée du lead dans le pipeline. */
  createdAt: string
  /** Montant estimé (€) si dispo. */
  amount: number | null
}

interface Props {
  data: LeadCardData
  onClick?: () => void
  /** En variante C (inbox), on montre le badge statut sur la carte. */
  showStatusBadge?: boolean
  /** Callback pour convertir le lead en projet (affiche le bouton seulement si fourni). */
  onConvert?: (data: LeadCardData) => void
  /** Indique qu'une conversion est déjà en cours pour ce lead (loader). */
  converting?: boolean
}

/**
 * Carte lead V3 — utilisée en variante A (kanban) et C (inbox).
 * Style : fond #070512, accents violets, hover bg #1a1430.
 */
export function LeadCardV3({ data, onClick, showStatusBadge = false, onConvert, converting = false }: Props) {
  const title = data.company || data.contact || 'Lead sans nom'

  const handleConvertClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onConvert || converting) return
    onConvert(data)
  }

  return (
    <article
      onClick={onClick}
      className="group relative bg-[#070512] border border-[rgba(139,92,246,0.18)] rounded-[10px] overflow-hidden cursor-pointer transition-all duration-200 hover:border-[rgba(139,92,246,0.35)] hover:bg-[#1a1430] hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
    >
      {/* Header cartouche */}
      <div className="flex items-center justify-between px-[14px] py-[10px] border-b border-[rgba(139,92,246,0.18)] bg-gradient-to-b from-[rgba(139,92,246,0.15)] to-[rgba(139,92,246,0.05)]">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-3.5 w-3.5 text-[#A78BFA] shrink-0" />
          <div className="text-[13px] font-bold tracking-[0.02em] text-[#ede9fe] leading-tight truncate">
            {title}
          </div>
        </div>
        {showStatusBadge && (
          <span
            className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded"
            style={{
              color: data.statusColor,
              background: `${data.statusColor}1A`,
              border: `1px solid ${data.statusColor}33`,
            }}
          >
            {data.statusLabel}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-[14px] py-[10px] space-y-1.5">
        {data.contact && (
          <Row icon={<User className="h-3 w-3" />} text={data.contact} />
        )}
        {data.email && (
          <Row icon={<Mail className="h-3 w-3" />} text={data.email} />
        )}
        {data.phone && (
          <Row icon={<Phone className="h-3 w-3" />} text={data.phone} />
        )}

        {/* Footer meta */}
        <div className="pt-1.5 mt-1.5 border-t border-[rgba(139,92,246,0.12)] flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#6b7280] truncate">
            {data.assignee ?? 'Non assigné'}
            {data.source ? ` · ${data.source}` : ''}
          </span>
          {data.amount !== null && data.amount > 0 && (
            <span className="text-[11px] font-semibold text-[#10b981] tabular-nums shrink-0">
              {formatEuro(data.amount)}
            </span>
          )}
        </div>

        {onConvert && (
          <button
            type="button"
            onClick={handleConvertClick}
            disabled={converting}
            className="mt-2 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[rgba(16,185,129,0.15)] hover:bg-[rgba(16,185,129,0.25)] border border-[rgba(16,185,129,0.35)] text-[11px] font-semibold text-[#10b981] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Convertir ce lead signé en projet"
          >
            <ArrowUpRight className="h-3 w-3" />
            {converting ? 'Conversion…' : 'Convertir en projet'}
          </button>
        )}
      </div>
    </article>
  )
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af] min-w-0">
      <span className="text-[#6b7280] shrink-0">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  )
}

function formatEuro(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} €`
}
