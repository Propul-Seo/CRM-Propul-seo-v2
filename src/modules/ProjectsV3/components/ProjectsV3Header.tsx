import { Plus, Search, LayoutGrid, Rows3 } from 'lucide-react'
import { V3_POLE_ORDER, V3_POLE_LABELS, V3_POLE_COLORS, type V3Pole } from '../utils/poleMapping'
import { ProjectAssigneeButtons } from './ProjectAssigneeButtons'

interface UserOption {
  id: string
  name: string
}

export type V3ViewMode = 'normal' | 'compact'

interface Props {
  projectCount: number
  filterUserId: string
  onFilterUserChange: (id: string) => void
  users: UserOption[]
  activePoles: Set<V3Pole>
  onTogglePole: (pole: V3Pole) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  onNewProject: () => void
  viewMode: V3ViewMode
  onViewModeChange: (mode: V3ViewMode) => void
}

export function ProjectsV3Header({
  projectCount,
  filterUserId,
  onFilterUserChange,
  users,
  activePoles,
  onTogglePole,
  searchQuery,
  onSearchChange,
  onNewProject,
  viewMode,
  onViewModeChange,
}: Props) {
  return (
    <>
      {/* Row 1 : titre + count + bouton */}
      <header className="mb-5">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A78BFA] mb-1.5">
              ✦ V2 Beta
            </div>
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#ede9fe] leading-none mb-1.5">
              Projets en cours
            </h1>
            <div className="flex items-center gap-3 text-[13px] text-[#9ca3af]">
              <strong className="font-semibold text-[#ede9fe]">
                {projectCount} projet{projectCount !== 1 ? 's' : ''}
              </strong>
              <span className="text-[#6b7280]">·</span>
              <span>Glissez-déposez pour changer le statut</span>
            </div>
          </div>
          <button
            onClick={onNewProject}
            className="inline-flex items-center gap-2 h-[38px] px-4 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-lg text-[13px] font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau projet
          </button>
        </div>
      </header>

      {/* Row 2 : filtres */}
      <div className="sticky top-0 z-40 -mx-8 mb-6 border-y border-[rgba(139,92,246,0.16)] bg-[#0a0814]/88 px-8 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3 rounded-[10px] border border-[rgba(139,92,246,0.18)] bg-[#0f0b1e]/92 px-4 py-3 shadow-[0_18px_45px_rgba(3,0,12,0.28)]">
          <span className="text-[11px] uppercase tracking-[0.08em] text-[#6b7280] font-semibold">
            Responsable
          </span>
          <ProjectAssigneeButtons
            users={users}
            value={filterUserId}
            onChange={onFilterUserChange}
            allowToggleOff
            layout="segmented"
            size="sm"
          />

        <div className="w-px h-5 bg-[rgba(139,92,246,0.18)]" />

        <span className="text-[11px] uppercase tracking-[0.08em] text-[#6b7280] font-semibold">
          Pôles
        </span>
        <div className="flex gap-1.5">
          {V3_POLE_ORDER.map(pole => {
            const active = activePoles.has(pole)
            const color = V3_POLE_COLORS[pole]
            return (
              <button
                key={pole}
                onClick={() => onTogglePole(pole)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-semibold tracking-[0.02em] cursor-pointer transition-all duration-150 border"
                style={{
                  color,
                  borderColor: active ? color : 'transparent',
                  background: active ? `${color}1A` : 'transparent',
                  opacity: active ? 1 : 0.7,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: color,
                    boxShadow: active ? `0 0 8px ${color}` : 'none',
                  }}
                />
                {V3_POLE_LABELS[pole]}
              </button>
            )
          })}
        </div>

        {/* Toggle vue normale / compacte */}
        <div className="ml-auto flex items-center gap-px bg-[#070512] border border-[rgba(139,92,246,0.18)] rounded-md p-px">
          <button
            type="button"
            onClick={() => onViewModeChange('normal')}
            title="Vue normale (cartes détaillées)"
            aria-pressed={viewMode === 'normal'}
            className="h-[28px] w-[30px] flex items-center justify-center rounded transition-colors duration-150"
            style={{
              background: viewMode === 'normal' ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
              color: viewMode === 'normal' ? '#A78BFA' : '#6b7280',
            }}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('compact')}
            title="Vue compacte (tout d'un coup)"
            aria-pressed={viewMode === 'compact'}
            className="h-[28px] w-[30px] flex items-center justify-center rounded transition-colors duration-150"
            style={{
              background: viewMode === 'compact' ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
              color: viewMode === 'compact' ? '#A78BFA' : '#6b7280',
            }}
          >
            <Rows3 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Recherche */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b7280] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Rechercher un projet ou client..."
            className="w-full h-8 pl-[34px] pr-3 bg-[#070512] border border-[rgba(139,92,246,0.18)] rounded-md text-[#ede9fe] text-[12px] placeholder:text-[#6b7280] focus:outline-none focus:border-[#8B5CF6] transition-colors"
          />
        </div>
      </div>
      </div>
    </>
  )
}
