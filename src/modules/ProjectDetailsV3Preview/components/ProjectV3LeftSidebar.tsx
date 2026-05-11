import { Folder, Calendar, Tag, UserCheck, Wallet, Target } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProjectV2 } from '@/types/project-v2'
import {
  PROJECT_STATUS_ORDER,
  PROJECT_STATUS_LABELS,
  getStatusStyle,
  getStatusLabel,
  formatPresta,
} from '../statusConfig'

interface TeamUser { id: string; name: string; email: string }

interface Props {
  project: ProjectV2
  users: TeamUser[]
  onEdit: () => void
  onAssign: (userId: string | null) => void
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[rgba(139,92,246,0.15)] py-4 px-4">
      <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
}) {
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

const formatDate = (iso: string | null | undefined): string | null => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatBudget = (amount: number | null | undefined): string | null => {
  if (amount === null || amount === undefined) return null
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

export function ProjectV3LeftSidebar({ project, users, onEdit, onAssign }: Props) {
  const statusConf = getStatusStyle(project.status)
  const statusLabel = getStatusLabel(project.status)
  const currentStep = PROJECT_STATUS_ORDER.indexOf(project.status)
  const totalSteps = PROJECT_STATUS_ORDER.length

  return (
    <div className="flex flex-col">
      {/* En-tête identité */}
      <div className="px-4 pt-5 pb-4 border-b border-[rgba(139,92,246,0.15)]">
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-xl bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center shrink-0">
            <Folder className="h-5 w-5 text-[#8B5CF6]" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-xs h-7 text-[#9ca3af] hover:text-[#ede9fe]"
          >
            Modifier
          </Button>
        </div>
        <h2 className="text-sm font-bold text-[#ede9fe] leading-tight">{project.name}</h2>
        {project.client_name && (
          <p className="text-xs text-[#9ca3af] mt-0.5">{project.client_name}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className={cn('inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full', statusConf.badge)}>
            {statusLabel}
          </span>
          {project.presta_type && project.presta_type.length > 0 && (
            <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#A78BFA]">
              {formatPresta(project.presta_type)}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="px-4 py-3 border-b border-[rgba(139,92,246,0.15)]">
        <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-2">Étape du pipeline</p>
        <div className="flex gap-1">
          {PROJECT_STATUS_ORDER.map((s, i) => (
            <div
              key={s}
              title={PROJECT_STATUS_LABELS[s]}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all',
                i <= currentStep ? 'bg-[#8B5CF6]' : 'bg-[rgba(139,92,246,0.15)]',
              )}
            />
          ))}
        </div>
        <p className="text-[10px] text-[#9ca3af] mt-1.5">
          {currentStep + 1}/{totalSteps} — {statusLabel}
        </p>
      </div>

      {/* À propos */}
      <SidebarSection title="À propos">
        <InfoRow icon={Calendar} label="Début" value={formatDate(project.start_date)} />
        <InfoRow icon={Calendar} label="Fin prévue" value={formatDate(project.end_date)} />
        <InfoRow icon={Wallet} label="Budget" value={formatBudget(project.budget)} />
        <InfoRow icon={Target} label="Progression" value={`${project.progress ?? 0}%`} />
        {project.last_activity_at && (
          <InfoRow
            icon={Tag}
            label="Dernière activité"
            value={formatDistanceToNow(new Date(project.last_activity_at), { addSuffix: true, locale: fr })}
          />
        )}
      </SidebarSection>

      {/* Description / Notes */}
      {project.description && (
        <SidebarSection title="Notes">
          <p className="text-xs text-[#ede9fe] leading-relaxed whitespace-pre-wrap">{project.description}</p>
        </SidebarSection>
      )}

      {/* Responsable */}
      <SidebarSection title="Responsable">
        <div className="flex items-center gap-2 mb-2">
          <UserCheck className="h-3.5 w-3.5 text-[#9ca3af] shrink-0" />
          <p className="text-xs text-[#ede9fe] font-medium">
            {project.assigned_name ?? <span className="italic text-[#9ca3af]">Non assigné</span>}
          </p>
        </div>
        <Select
          value={project.assigned_to ?? '__none__'}
          onValueChange={(v) => onAssign(v === '__none__' ? null : v)}
        >
          <SelectTrigger className="h-7 text-xs bg-[#0f0b1e] border-[rgba(139,92,246,0.25)]">
            <SelectValue placeholder="Choisir un responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Non assigné</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarSection>
    </div>
  )
}
