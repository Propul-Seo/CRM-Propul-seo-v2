import type { ProjectV2 } from '@/types/project-v2'
import { useActiveUserIds } from '@/hooks/useActiveUserIds'
import { getActivePoles, V3_POLE_LABELS, V3_POLE_COLORS, type V3Pole } from '../utils/poleMapping'
import { PortalHealthBadges } from './PortalHealthBadges'
import type { PortalHealth } from '../hooks/usePortalHealth'

interface Props {
  project: ProjectV2
  index: number
  onClick?: () => void
  portalHealth?: PortalHealth
  allowedAssigneeIds?: Set<string>
  assigneeLabelsById?: Map<string, string>
}

export function ProjectCardV3({
  project,
  index,
  onClick,
  portalHealth,
  allowedAssigneeIds,
  assigneeLabelsById,
}: Props) {
  const activeIds = useActiveUserIds()
  const poles = getActivePoles(project.presta_type)
  const progress = Math.max(0, Math.min(100, Math.round(project.progress ?? 0)))
  const projectNumber = String(index + 1).padStart(2, '0')
  // Si le responsable est désactivé (ou supprimé), on masque son nom.
  // activeIds peut être vide au premier render → on n'applique le masque qu'une fois chargé.
  const assignedActive =
    !project.assigned_to || activeIds.size === 0 || activeIds.has(project.assigned_to)
  const assignedAllowed = !project.assigned_to || !allowedAssigneeIds || allowedAssigneeIds.has(project.assigned_to)
  const assignedLabel = assignedActive && assignedAllowed
    ? (project.assigned_to ? assigneeLabelsById?.get(project.assigned_to) ?? project.assigned_name : project.assigned_name)
    : null
  const clientLine = [project.client_name, assignedLabel].filter(Boolean).join(' · ')

  return (
    <article
      onClick={onClick}
      className="group relative bg-[#070512] border border-[rgba(139,92,246,0.18)] rounded-[10px] overflow-hidden cursor-pointer transition-all duration-200 hover:border-[rgba(139,92,246,0.35)] hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
    >
      {/* Header cartouche */}
      <div className="flex items-center justify-between px-[14px] py-[10px] border-b border-[rgba(139,92,246,0.18)] bg-gradient-to-b from-[rgba(139,92,246,0.15)] to-[rgba(139,92,246,0.05)]">
        <div className="text-[13px] font-bold tracking-[0.04em] uppercase text-[#ede9fe] leading-tight truncate pr-2">
          {project.name}
        </div>
        <div className="text-[10px] font-semibold text-[#A78BFA] tabular-nums bg-[rgba(139,92,246,0.15)] px-1.5 py-0.5 rounded shrink-0">
          #{projectNumber}
        </div>
      </div>

      {/* Body */}
      <div className="p-[14px]">
        {clientLine && (
          <div className="text-[11px] text-[#9ca3af] mb-[14px] truncate">{clientLine}</div>
        )}

        {/* Avancement */}
        <div className="flex items-baseline justify-between mb-[6px]">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[#6b7280]">Avancement</span>
          <span className="text-[13px] font-semibold text-[#ede9fe] tabular-nums">{progress}%</span>
        </div>
        <div className="h-1 bg-[#1a1430] rounded-[2px] overflow-hidden mb-[14px]">
          <div
            className="h-full rounded-[2px] bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Pôles actifs */}
        {poles.length > 0 ? (
          <div className="flex items-center gap-[10px] flex-wrap">
            {poles.map(pole => (
              <PoleDot key={pole} pole={pole} />
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-[#6b7280] italic">Aucun pôle actif</div>
        )}

        <PortalHealthBadges health={portalHealth} />
      </div>
    </article>
  )
}

function PoleDot({ pole }: { pole: V3Pole }) {
  const color = V3_POLE_COLORS[pole]
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#ede9fe] font-medium">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      {V3_POLE_LABELS[pole]}
    </span>
  )
}
