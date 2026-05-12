import { useState } from 'react'
import { Folder, Calendar, Tag, UserCheck, Wallet, Target, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProjectV2, ProjectStatusV2 } from '@/types/project-v2'
import { formatPresta } from '../statusConfig'
import { PipelineSelect } from './pipeline-previews/PipelineSelect'

interface TeamUser { id: string; name: string; email: string }

interface Props {
  project: ProjectV2
  users: TeamUser[]
  onEdit: () => void
  onAssign: (userId: string | null) => void
  onStatusChange?: (status: ProjectStatusV2) => void | Promise<void>
}

function SidebarSection({
  title,
  children,
  collapsible,
  storageKey,
  defaultCollapsed = false,
}: {
  title: string
  children: React.ReactNode
  collapsible?: boolean
  storageKey?: string
  defaultCollapsed?: boolean
}) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (!collapsible || !storageKey) return defaultCollapsed
    try {
      const stored = localStorage.getItem(`v3-sidebar-section:${storageKey}`)
      if (stored === 'true') return true
      if (stored === 'false') return false
    } catch {
      // ignore
    }
    return defaultCollapsed
  })

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    if (collapsible && storageKey) {
      try {
        localStorage.setItem(`v3-sidebar-section:${storageKey}`, String(next))
      } catch {
        // ignore
      }
    }
  }

  if (!collapsible) {
    return (
      <div className="border-b border-[rgba(139,92,246,0.15)] py-4 px-4">
        <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-3">{title}</p>
        {children}
      </div>
    )
  }

  return (
    <div className="border-b border-[rgba(139,92,246,0.15)] py-4 px-4">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full mb-3 text-left group"
      >
        <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest group-hover:text-[#ede9fe] transition-colors">
          {title}
        </p>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-[#9ca3af] transition-transform group-hover:text-[#ede9fe]',
            collapsed && '-rotate-90',
          )}
        />
      </button>
      {!collapsed && children}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  emptyAction,
  onEmptyClick,
}: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
  emptyAction?: string
  onEmptyClick?: () => void
}) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      <Icon className="h-3.5 w-3.5 text-[#9ca3af] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] text-[#9ca3af]">{label}</p>
        {value ? (
          <p className="text-xs font-medium mt-0.5 text-[#ede9fe]">{value}</p>
        ) : emptyAction && onEmptyClick ? (
          <button
            onClick={onEmptyClick}
            className="text-xs font-medium mt-0.5 text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
          >
            + {emptyAction}
          </button>
        ) : (
          <p className="text-xs font-medium mt-0.5 text-[#9ca3af] italic">—</p>
        )}
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

export function ProjectV3LeftSidebar({ project, users, onEdit, onAssign, onStatusChange }: Props) {

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
            title="Modifier les informations du projet"
          >
            Modifier le projet
          </Button>
        </div>
        <h2 className="text-xl font-bold text-[#ede9fe] leading-tight tracking-tight">{project.name}</h2>
        {project.client_name && (
          <p className="text-xs text-[#9ca3af] mt-1">{project.client_name}</p>
        )}
        {project.presta_type && project.presta_type.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#A78BFA]">
              {formatPresta(project.presta_type)}
            </span>
          </div>
        )}
      </div>

      {/* Pipeline (format Select validé) */}
      <div className="border-b border-[rgba(139,92,246,0.15)] py-3 px-4">
        <PipelineSelect status={project.status} onChange={onStatusChange} />
      </div>

      {/* À propos */}
      <SidebarSection title="À propos" collapsible storageKey="about">
        <InfoRow icon={Calendar} label="Début" value={formatDate(project.start_date)} />
        <InfoRow
          icon={Calendar}
          label="Fin prévue"
          value={formatDate(project.end_date)}
          emptyAction="Définir une échéance"
          onEmptyClick={onEdit}
        />
        <InfoRow
          icon={Wallet}
          label="Budget"
          value={formatBudget(project.budget)}
          emptyAction="Ajouter un budget"
          onEmptyClick={onEdit}
        />
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
        <SidebarSection title="Notes" collapsible storageKey="notes">
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
