import { User, Plus, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
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
}

function RightSection({
  title,
  action,
  children,
}: {
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

const formatBudget = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

export function ProjectV3RightSidebar({ project, users }: Props) {
  const assignee = users.find((u) => u.id === project.assigned_to)

  return (
    <div className="flex flex-col">
      {/* Contact client */}
      <RightSection
        title="Contact client"
        action={
          <button className="text-[10px] text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-0.5 transition-colors">
            <Plus className="h-3 w-3" /> Ajouter
          </button>
        }
      >
        {project.client_name ? (
          <div className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-full bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center shrink-0">
              <Building2 className="h-3.5 w-3.5 text-[#8B5CF6]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#ede9fe]">{project.client_name}</p>
              <p className="text-[10px] text-[#9ca3af] italic">Coordonnées non renseignées</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#9ca3af] italic">Aucun client renseigné</p>
        )}
      </RightSection>

      {/* Suivi de l'étape du projet */}
      <RightSection title="Suivi de l'étape du projet">
        <div className="space-y-1.5">
          {PROJECT_STATUS_ORDER.map((s) => {
            const conf = getStatusStyle(s)
            const isActive = s === project.status
            return (
              <div
                key={s}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all',
                  isActive
                    ? cn('border font-semibold', conf.badge, 'border-current/30')
                    : 'text-[#9ca3af]',
                )}
              >
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    isActive ? 'bg-current' : 'bg-[rgba(139,92,246,0.2)]',
                  )}
                />
                {PROJECT_STATUS_LABELS[s]}
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

      {/* Statistiques */}
      <RightSection title="Statistiques">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#9ca3af]">Type</span>
            <span className="font-medium text-[#ede9fe]">{formatPresta(project.presta_type)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#9ca3af]">Budget</span>
            <span className="font-medium text-[#ede9fe]">{formatBudget(project.budget)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#9ca3af]">Progression</span>
            <span className="font-medium text-[#ede9fe]">{project.progress ?? 0}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#9ca3af]">Score</span>
            <span className="font-medium text-[#ede9fe]">{project.completion_score ?? 0}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#9ca3af]">Statut</span>
            <span className="font-medium text-[#ede9fe]">{getStatusLabel(project.status)}</span>
          </div>
        </div>
      </RightSection>
    </div>
  )
}
