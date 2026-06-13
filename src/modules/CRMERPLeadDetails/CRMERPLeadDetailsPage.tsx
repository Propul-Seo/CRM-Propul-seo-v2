// src/modules/CRMERPLeadDetails/CRMERPLeadDetailsPage.tsx
import { useState } from 'react'
import { LeadLeftSidebar } from './components/LeadLeftSidebar'
import { LeadRightSidebar } from './components/LeadRightSidebar'
import { ActivityFilterBar } from './components/ActivityFilterBar'
import { ActivityTimeline } from './components/ActivityTimeline'
import { QuickActionBar } from './components/QuickActionBar'
import type { CRMERPLead, CRMERPActivity, ActivityType } from './types'

interface User { id: string; name: string; email: string }

interface Props {
  lead: CRMERPLead
  activities: CRMERPActivity[]
  users: User[]
  onBack: () => void
  onEdit: () => void
  onAssign: (userId: string | null) => void
  onAddActivity: (type: ActivityType, content: string) => Promise<void>
  onUpdateActivity: (id: string, updates: { type?: ActivityType; content?: string }) => Promise<void>
  onDeleteActivity: (id: string) => Promise<void>
}

export function CRMERPLeadDetailsPage({
  lead, activities, users,
  onBack, onEdit, onAssign,
  onAddActivity, onUpdateActivity, onDeleteActivity,
}: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all')

  const filtered = activities.filter(a => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    if (search && !a.content?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col h-screen bg-[#020205] overflow-hidden">
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-[#070512] border-b border-[rgba(139,92,246,0.18)] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#ede9fe] transition-colors"
        >
          ← Retour
        </button>
        <span className="text-[rgba(139,92,246,0.3)]">/</span>
        <span className="text-xs font-medium text-[#ede9fe] truncate">
          {lead.company_name || lead.contact_name || 'Lead'}
        </span>
      </div>

      {/* 3-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Colonne gauche */}
        <div className="w-[300px] shrink-0 border-r border-[rgba(139,92,246,0.18)] overflow-y-auto bg-[#070512]">
          <LeadLeftSidebar lead={lead} users={users} onEdit={onEdit} onAssign={onAssign} />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <QuickActionBar onAdd={onAddActivity} />
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <ActivityFilterBar
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              total={activities.length}
              filtered={filtered.length}
            />
            <ActivityTimeline
              activities={filtered}
              onUpdate={onUpdateActivity}
              onDelete={onDeleteActivity}
            />
          </div>
        </div>

        {/* Colonne droite */}
        <div className="w-[280px] shrink-0 border-l border-[rgba(139,92,246,0.18)] overflow-y-auto bg-[#070512]">
          <LeadRightSidebar lead={lead} users={users} />
        </div>
      </div>
    </div>
  )
}
