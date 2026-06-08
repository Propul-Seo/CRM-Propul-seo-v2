import type { ProjectV2 } from '@/types/project-v2'
import { getStatusLabel, getStatusStyle } from '@/modules/ProjectDetailsV3Preview/statusConfig'
import { formatRelativeDate } from '@/utils/frenchDateUtils'
import { getActivePoles, V3_POLE_LABELS, V3_POLE_COLORS } from '../utils/poleMapping'
import type { PortalHealth } from '../hooks/usePortalHealth'
import { PortalHealthBadges } from './PortalHealthBadges'
import { formatBudget, formatShortDate, clampScore } from '../utils/detailListFormat'

interface Props {
  project: ProjectV2
  portalHealth: PortalHealth | undefined
  assigneeLabel: string | null
  onRowClick: (id: string) => void
}

const CELL = 'px-3 py-2.5 align-middle'

export function ProjectsV3DetailRow({ project, portalHealth, assigneeLabel, onRowClick }: Props) {
  const poles = getActivePoles(project.presta_type)
  const score = clampScore(project.completion_score)
  const statusClass = getStatusStyle(project.status).badge

  return (
    <tr
      onClick={() => onRowClick(project.id)}
      className="cursor-pointer border-b border-[rgba(139,92,246,0.1)] transition-colors hover:bg-[rgba(139,92,246,0.06)]"
    >
      {/* Projet */}
      <td className={`${CELL} max-w-[260px]`}>
        <div className="truncate text-[13px] font-semibold text-[#ede9fe]">{project.name}</div>
        {project.client_name && (
          <div className="truncate text-[11px] text-[#9ca3af]">{project.client_name}</div>
        )}
      </td>

      {/* Statut */}
      <td className={CELL}>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass}`}
        >
          {getStatusLabel(project.status)}
        </span>
      </td>

      {/* Pôles */}
      <td className={CELL}>
        {poles.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {poles.map((pole) => (
              <span
                key={pole}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#ede9fe]"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: V3_POLE_COLORS[pole] }}
                />
                {V3_POLE_LABELS[pole]}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] italic text-[#6b7280]">—</span>
        )}
      </td>

      {/* Responsable */}
      <td className={`${CELL} text-[12px] text-[#d1cdf0]`}>{assigneeLabel ?? '—'}</td>

      {/* Avancement */}
      <td className={`${CELL} min-w-[120px]`}>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#1a1430]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]"
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-[12px] font-semibold tabular-nums text-[#ede9fe]">{score}%</span>
        </div>
      </td>

      {/* Budget */}
      <td className={`${CELL} text-[12px] tabular-nums text-[#ede9fe]`}>
        {formatBudget(project.budget)}
      </td>

      {/* Échéance */}
      <td className={`${CELL} whitespace-nowrap text-[12px] text-[#d1cdf0]`}>
        {formatShortDate(project.end_date)}
      </td>

      {/* Dernière activité */}
      <td className={`${CELL} whitespace-nowrap text-[12px] text-[#9ca3af]`}>
        {project.last_activity_at ? formatRelativeDate(project.last_activity_at) : '—'}
      </td>

      {/* Santé portail */}
      <td className={CELL}>
        {portalHealth ? (
          <PortalHealthBadges health={portalHealth} />
        ) : (
          <span className="text-[11px] text-[#6b7280]">—</span>
        )}
      </td>
    </tr>
  )
}
