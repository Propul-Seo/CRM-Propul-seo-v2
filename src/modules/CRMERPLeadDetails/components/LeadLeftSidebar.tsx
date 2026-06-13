// src/modules/CRMERPLeadDetails/components/LeadLeftSidebar.tsx
import { Building2, Mail, Phone, Globe, Calendar, Tag, UserCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { CRMERPLead, CRMERPStatus } from '../types'
import { CRMERP_STATUS_LABELS, CRMERP_STATUS_COLORS } from '../types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User { id: string; name: string; email: string }

interface Props {
  lead: CRMERPLead
  users: User[]
  onEdit: () => void
  onAssign: (userId: string | null) => void
}

const STATUS_ORDER: CRMERPStatus[] = ['leads_contactes', 'rendez_vous_effectues', 'en_attente', 'signes']

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[rgba(139,92,246,0.15)] py-4 px-4">
      <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      <Icon className="h-3.5 w-3.5 text-[#9ca3af] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] text-[#9ca3af]">{label}</p>
        <p className={cn('text-xs font-medium mt-0.5', value ? 'text-[#ede9fe]' : 'text-[#9ca3af] italic')}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

export function LeadLeftSidebar({ lead, users, onEdit, onAssign }: Props) {
  const statusConf = CRMERP_STATUS_COLORS[lead.status]
  const statusLabel = CRMERP_STATUS_LABELS[lead.status]
  const currentStep = STATUS_ORDER.indexOf(lead.status)

  return (
    <div className="flex flex-col">
      {/* En-tête identité */}
      <div className="px-4 pt-5 pb-4 border-b border-[rgba(139,92,246,0.15)]">
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-xl bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-[#8B5CF6]" />
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs h-7 text-[#9ca3af] hover:text-[#ede9fe]">
            Modifier
          </Button>
        </div>
        <h2 className="text-sm font-bold text-[#ede9fe] leading-tight">
          {lead.company_name || lead.contact_name || 'Lead sans nom'}
        </h2>
        {lead.company_name && lead.contact_name && (
          <p className="text-xs text-[#9ca3af] mt-0.5">{lead.contact_name}</p>
        )}
        <span className={cn('inline-flex mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full', statusConf.badge)}>
          {statusLabel}
        </span>
      </div>

      {/* Pipeline steps */}
      <div className="px-4 py-3 border-b border-[rgba(139,92,246,0.15)]">
        <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-2">Étape du pipeline</p>
        <div className="flex gap-1">
          {STATUS_ORDER.map((s, i) => (
            <div
              key={s}
              title={CRMERP_STATUS_LABELS[s]}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all',
                i <= currentStep ? 'bg-[#8B5CF6]' : 'bg-[rgba(139,92,246,0.15)]'
              )}
            />
          ))}
        </div>
        <p className="text-[10px] text-[#9ca3af] mt-1.5">{currentStep + 1}/4 — {statusLabel}</p>
      </div>

      {/* Informations */}
      <SidebarSection title="À propos">
        <InfoRow icon={Mail} label="Email" value={lead.email} />
        <InfoRow icon={Phone} label="Téléphone" value={lead.phone} />
        <InfoRow icon={Globe} label="Source" value={lead.source} />
        <InfoRow icon={Calendar} label="Créé le" value={
          new Date(lead.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        } />
        {lead.last_activity_at && (
          <InfoRow icon={Tag} label="Dernière activité" value={
            formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true, locale: fr })
          } />
        )}
      </SidebarSection>

      {/* Notes */}
      {lead.notes && (
        <SidebarSection title="Notes">
          <p className="text-xs text-[#ede9fe] leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
        </SidebarSection>
      )}

      {/* Responsable */}
      <SidebarSection title="Responsable">
        <div className="flex items-center gap-2 mb-2">
          <UserCheck className="h-3.5 w-3.5 text-[#9ca3af] shrink-0" />
          <p className="text-xs text-[#ede9fe] font-medium">
            {lead.assignee?.name ?? <span className="italic text-[#9ca3af]">Non assigné</span>}
          </p>
        </div>
        <Select
          value={lead.assignee_id ?? '__none__'}
          onValueChange={v => onAssign(v === '__none__' ? null : v)}
        >
          <SelectTrigger className="h-7 text-xs bg-[#0f0b1e] border-[rgba(139,92,246,0.25)]">
            <SelectValue placeholder="Choisir un responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Non assigné</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarSection>
    </div>
  )
}
