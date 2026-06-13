import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { ProjectV2 } from '@/types/project-v2'
import { statusToColumn } from '../utils/statusMapping'
import type { PortalHealth } from '../hooks/usePortalHealth'
import {
  sortProjects,
  type DetailSort,
  type DetailSortKey,
} from '../utils/detailListFormat'
import { ProjectsV3DetailRow } from './ProjectsV3DetailRow'

interface Props {
  projects: ProjectV2[]
  portalHealthByProjectId: Map<string, PortalHealth>
  assigneeLabelsById: Map<string, string>
  onRowClick: (id: string) => void
}

interface ColumnDef {
  label: string
  sortKey?: DetailSortKey
  align?: 'left' | 'right'
}

const COLUMNS: ColumnDef[] = [
  { label: 'Projet', sortKey: 'name' },
  { label: 'Statut', sortKey: 'status' },
  { label: 'Pôles' },
  { label: 'Responsable' },
  { label: 'Avancement', sortKey: 'completion' },
  { label: 'Budget', sortKey: 'budget' },
  { label: 'Échéance', sortKey: 'end_date' },
  { label: 'Dernière activité', sortKey: 'last_activity' },
  { label: 'Santé portail' },
]

const HEAD_CELL =
  'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]'

export function ProjectsV3DetailList({
  projects,
  portalHealthByProjectId,
  assigneeLabelsById,
  onRowClick,
}: Props) {
  const [sort, setSort] = useState<DetailSort>({ key: 'last_activity', dir: 'desc' })

  // Vue « Liste détaillée » = volontairement les projets ACTIFS uniquement
  // (les colonnes Inactifs/Propulseo ne sont pas listées ici, par design).
  const actifs = useMemo(
    () => projects.filter((p) => statusToColumn(p.status) === 'actifs'),
    [projects],
  )
  const rows = useMemo(() => sortProjects(actifs, sort), [actifs, sort])

  const toggleSort = (key: DetailSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )
  }

  if (actifs.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-[rgba(139,92,246,0.25)] bg-[#0f0b1e]/60 px-6 py-16 text-center">
        <p className="text-[14px] font-semibold text-[#ede9fe]">Aucun projet actif</p>
        <p className="mt-1 text-[12px] text-[#9ca3af]">
          Ajustez les filtres ou faites avancer un projet pour le voir ici.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[10px] border border-[rgba(139,92,246,0.18)] bg-[#0f0b1e]/60">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[rgba(139,92,246,0.18)] bg-[rgba(139,92,246,0.06)]">
            {COLUMNS.map((col) => (
              <th key={col.label} scope="col" className={HEAD_CELL}>
                {col.sortKey ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.sortKey as DetailSortKey)}
                    className="inline-flex items-center gap-1 transition-colors hover:text-[#A78BFA]"
                  >
                    {col.label}
                    <SortIcon active={sort.key === col.sortKey} dir={sort.dir} />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((project) => (
            <ProjectsV3DetailRow
              key={project.id}
              project={project}
              portalHealth={portalHealthByProjectId.get(project.id)}
              assigneeLabel={
                project.assigned_to
                  ? assigneeLabelsById.get(project.assigned_to) ?? project.assigned_name ?? null
                  : project.assigned_name ?? null
              }
              onRowClick={onRowClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 opacity-40" />
  return dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
}
