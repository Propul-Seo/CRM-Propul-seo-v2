import type { ProjectV2 } from '@/types/project-v2'
import { getActivePoles, V3_POLE_COLORS } from '../utils/poleMapping'
import { statusToColumn, type V3Column } from '../utils/statusMapping'

interface Props {
  project: ProjectV2
  index: number
  onClick?: () => void
}

const COLUMN_BORDER_COLORS: Record<V3Column, string> = {
  planification: '#8B5CF6',
  en_cours: '#10b981',
  en_pause: '#f59e0b',
  propulseo: '#ec4899',
}

/**
 * Carte compacte (variante B "ligne plate") :
 *  - filet vertical coloré par statut à gauche
 *  - numéro projet + nom + pastilles pôles + % avancement, tout sur 1 ligne
 *  - ~30px de hauteur pour permettre de voir 15-20 cartes sans scroll
 */
export function ProjectCardV3Compact({ project, index, onClick }: Props) {
  const poles = getActivePoles(project.presta_type)
  const progress = Math.max(0, Math.min(100, Math.round(project.progress ?? 0)))
  const projectNumber = String(index + 1).padStart(2, '0')
  const column = statusToColumn(project.status)
  const borderColor = COLUMN_BORDER_COLORS[column]

  return (
    <article
      onClick={onClick}
      className="relative flex items-center gap-2 pl-3 pr-2 py-1.5 bg-[#070512] border border-[rgba(139,92,246,0.18)] rounded-[5px] cursor-pointer transition-all duration-150 hover:border-[rgba(139,92,246,0.35)] hover:bg-[#1a1430] overflow-hidden min-h-[30px]"
    >
      {/* Filet vertical coloré */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: borderColor }}
      />

      {/* Numéro projet */}
      <span className="text-[9px] font-semibold text-[#A78BFA] tabular-nums bg-[rgba(139,92,246,0.15)] px-1 py-px rounded shrink-0">
        #{projectNumber}
      </span>

      {/* Nom projet */}
      <span className="text-[11px] font-semibold text-[#ede9fe] flex-1 min-w-0 truncate">
        {project.name}
      </span>

      {/* Pastilles pôles */}
      {poles.length > 0 && (
        <span className="flex gap-1 shrink-0">
          {poles.map(pole => (
            <span
              key={pole}
              className="w-[5px] h-[5px] rounded-full"
              style={{
                background: V3_POLE_COLORS[pole],
                boxShadow: `0 0 4px ${V3_POLE_COLORS[pole]}`,
              }}
            />
          ))}
        </span>
      )}

      {/* Avancement */}
      <span className="text-[10px] font-semibold text-[#9ca3af] tabular-nums shrink-0">
        {progress}%
      </span>
    </article>
  )
}
