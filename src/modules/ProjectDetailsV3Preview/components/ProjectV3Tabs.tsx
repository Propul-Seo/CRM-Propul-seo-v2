import { useSearchParams } from 'react-router-dom'
import { BarChart3, Hammer, ClipboardList, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SyntheseTabV3 } from '../tabs/SyntheseTabV3'
import { ProductionTabV3 } from '../tabs/ProductionTabV3'
import { BriefTabV3 } from '../tabs/BriefTabV3'
import { DocumentsTabV3 } from '../tabs/DocumentsTabV3'
import { useProjectTabCounts } from '../hooks/useProjectTabCounts'
import { useV3Keyboard } from '../hooks/useV3Keyboard'
import type { ProjectV2 } from '@/types/project-v2'

type TabId = 'synthese' | 'production' | 'brief' | 'documents'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'synthese',   label: 'Synthèse',   icon: BarChart3 },
  { id: 'production', label: 'Production', icon: Hammer },
  { id: 'brief',      label: 'Brief',      icon: ClipboardList },
  { id: 'documents',  label: 'Documents',  icon: Folder },
]

interface Props {
  project: ProjectV2
}

export function ProjectV3Tabs({ project }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as TabId) || 'synthese'
  const counts = useProjectTabCounts(project.id)

  const handleTabChange = (id: TabId) => {
    const next = new URLSearchParams(searchParams)
    if (id === 'synthese') next.delete('tab')
    else next.set('tab', id)
    setSearchParams(next, { replace: true })
  }

  useV3Keyboard({
    onSwitchTab: (direction) => {
      const currentIdx = TABS.findIndex((t) => t.id === activeTab)
      const nextIdx = (currentIdx + direction + TABS.length) % TABS.length
      handleTabChange(TABS[nextIdx].id)
    },
  })

  const badgeFor = (id: TabId): React.ReactNode => {
    if (id === 'synthese' && counts.activities > 0) return counts.activities
    if (id === 'production' && counts.tasks > 0) return counts.tasks
    if (id === 'documents' && counts.documents > 0) return counts.documents
    if (id === 'brief' && counts.briefFilled) return '●'
    return null
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab nav */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[rgba(139,92,246,0.18)] bg-[#070512] shrink-0">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          const badge = badgeFor(id)
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[rgba(139,92,246,0.1)]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {badge !== null && (
                <span
                  className={cn(
                    'ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[rgba(139,92,246,0.18)] text-[#A78BFA]',
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'synthese' && <SyntheseTabV3 project={project} />}
        {activeTab === 'production' && <ProductionTabV3 project={project} />}
        {activeTab === 'brief' && <BriefTabV3 project={project} />}
        {activeTab === 'documents' && <DocumentsTabV3 project={project} />}
      </div>
    </div>
  )
}
