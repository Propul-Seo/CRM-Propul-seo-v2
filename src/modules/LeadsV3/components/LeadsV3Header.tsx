import { Plus, Search } from 'lucide-react'
import { ProjectAssigneeButtons } from '@/modules/ProjectsV3/components/ProjectAssigneeButtons'

export type LeadsV3Tab = 'site_web' | 'erp'

interface UserOption {
  id: string
  name: string
}

interface Props {
  leadCount: number
  tab: LeadsV3Tab
  onTabChange: (tab: LeadsV3Tab) => void
  filterUserId: string
  onFilterUserChange: (id: string) => void
  users: UserOption[]
  searchQuery: string
  onSearchChange: (q: string) => void
  onNewLead: () => void
}

export function LeadsV3Header({
  leadCount,
  tab,
  onTabChange,
  filterUserId,
  onFilterUserChange,
  users,
  searchQuery,
  onSearchChange,
  onNewLead,
}: Props) {
  return (
    <>
      {/* Row 1 : titre + bouton */}
      <header className="mb-5">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A78BFA] mb-1.5">
              ✦ V3 Preview
            </div>
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#ede9fe] leading-none mb-1.5">
              Leads
            </h1>
            <div className="flex items-center gap-3 text-[13px] text-[#9ca3af]">
              <strong className="font-semibold text-[#ede9fe]">
                {leadCount} lead{leadCount !== 1 ? 's' : ''}
              </strong>
              <span className="text-[#6b7280]">·</span>
              <span>Pipeline fusionné Site web + ERP</span>
            </div>
          </div>
          <button
            onClick={onNewLead}
            className="inline-flex items-center gap-2 h-[38px] px-4 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-lg text-[13px] font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau lead
          </button>
        </div>
      </header>

      <div className="sticky top-0 z-40 -mx-8 mb-6 border-y border-[rgba(139,92,246,0.16)] bg-[#0a0814]/88 px-8 py-3 backdrop-blur-xl">
        {/* Row 2 : tabs site web / erp */}
        <div className="flex items-center gap-1 mb-3 border-b border-[rgba(139,92,246,0.18)]">
          <TabButton active={tab === 'site_web'} onClick={() => onTabChange('site_web')} label="Site web" />
          <TabButton active={tab === 'erp'} onClick={() => onTabChange('erp')} label="ERP" />
        </div>

        {/* Row 3 : filtres + variantes */}
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

          {/* Recherche */}
          <div className="ml-auto relative min-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b7280] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Rechercher un lead, une entreprise..."
              className="w-full h-8 pl-[34px] pr-3 bg-[#070512] border border-[rgba(139,92,246,0.18)] rounded-md text-[#ede9fe] text-[12px] placeholder:text-[#6b7280] focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
          </div>
        </div>
      </div>
    </>
  )
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 text-[13px] font-semibold transition-colors duration-150 -mb-px border-b-2"
      style={{
        color: active ? '#A78BFA' : '#9ca3af',
        borderColor: active ? '#8B5CF6' : 'transparent',
      }}
    >
      {label}
    </button>
  )
}
