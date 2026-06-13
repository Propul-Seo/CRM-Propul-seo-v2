import { User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CRMERPLead } from '../types'
import { CRMERP_STATUS_LABELS, CRMERP_STATUS_COLORS, CRMERP_STATUSES } from '../types'

interface TeamUser { id: string; name: string; email: string }

interface Props {
  lead: CRMERPLead
  users: TeamUser[]
}

function RightSection({ title, action, children }: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[rgba(139,92,246,0.15)] py-4 px-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

export function LeadRightSidebar({ lead }: Props) {
  const assignee = lead.assignee

  return (
    <div className="flex flex-col">
      {/* Contact associé */}
      <RightSection
        title="Contact"
        action={
          <button className="text-[10px] text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-0.5 transition-colors">
            <Plus className="h-3 w-3" /> Ajouter
          </button>
        }
      >
        {lead.contact_name ? (
          <div className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-full bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center shrink-0">
              <User className="h-3.5 w-3.5 text-[#8B5CF6]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#ede9fe]">{lead.contact_name}</p>
              {lead.email && <p className="text-[10px] text-[#9ca3af] truncate">{lead.email}</p>}
              {lead.phone && <p className="text-[10px] text-[#9ca3af]">{lead.phone}</p>}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#9ca3af] italic">Aucun contact renseigné</p>
        )}
      </RightSection>

      {/* Étape du pipeline */}
      <RightSection title="Suivi de l'étape du lead">
        <div className="space-y-1.5">
          {CRMERP_STATUSES.map(s => {
            const conf = CRMERP_STATUS_COLORS[s]
            const isActive = s === lead.status
            return (
              <div
                key={s}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all',
                  isActive
                    ? cn('border font-semibold', conf.badge, 'border-current/30')
                    : 'text-[#9ca3af]'
                )}
              >
                <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? 'bg-current' : 'bg-[rgba(139,92,246,0.2)]')} />
                {CRMERP_STATUS_LABELS[s]}
                {isActive && <span className="ml-auto text-[10px]">● Actuel</span>}
              </div>
            )
          })}
        </div>
      </RightSection>

      {/* Responsable */}
      {assignee && (
        <RightSection title="Responsable">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-[#171030] border border-[rgba(139,92,246,0.2)] flex items-center justify-center shrink-0">
              <User className="h-3 w-3 text-[#9ca3af]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#ede9fe]">{assignee.name}</p>
              <p className="text-[10px] text-[#9ca3af]">{assignee.email}</p>
            </div>
          </div>
        </RightSection>
      )}

      {/* Stats rapides */}
      <RightSection title="Statistiques">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#9ca3af]">Source</span>
            <span className="font-medium text-[#ede9fe]">{lead.source || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#9ca3af]">Statut</span>
            <span className="font-medium text-[#ede9fe]">{CRMERP_STATUS_LABELS[lead.status]}</span>
          </div>
        </div>
      </RightSection>
    </div>
  )
}
