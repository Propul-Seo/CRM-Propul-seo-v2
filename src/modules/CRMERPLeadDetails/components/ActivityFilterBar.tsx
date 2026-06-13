import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityType } from '../types'
import { ACTIVITY_TYPES } from '../types'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  typeFilter: ActivityType | 'all'
  onTypeFilterChange: (v: ActivityType | 'all') => void
  total: number
  filtered: number
}

const TYPE_COLORS: Record<ActivityType, string> = {
  call:    'bg-blue-500/15 text-blue-400 border-blue-500/25',
  email:   'bg-green-500/15 text-green-400 border-green-500/25',
  meeting: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  note:    'bg-violet-500/15 text-violet-400 border-violet-500/25',
  task:    'bg-teal-500/15 text-teal-400 border-teal-500/25',
}

export function ActivityFilterBar({
  search, onSearchChange,
  typeFilter, onTypeFilterChange,
  total, filtered,
}: Props) {
  const isFiltered = typeFilter !== 'all' || search.length > 0

  return (
    <div className="bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] rounded-xl p-3 mb-4">
      <div className="flex items-center gap-3 mb-2.5">
        <div className="flex items-center gap-2 bg-[#171030] border border-[rgba(139,92,246,0.18)] rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-[#9ca3af] shrink-0" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Rechercher des activités"
            className="bg-transparent text-xs text-[#ede9fe] placeholder:text-[#9ca3af] outline-none w-full"
          />
          {search && (
            <button onClick={() => onSearchChange('')}>
              <X className="h-3 w-3 text-[#9ca3af] hover:text-[#ede9fe]" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-[#9ca3af] ml-auto">
          {isFiltered ? `${filtered}/${total}` : `${total}`} activité{total !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onTypeFilterChange('all')}
          className={cn(
            'text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all',
            typeFilter === 'all'
              ? 'bg-[rgba(139,92,246,0.2)] text-[#A78BFA] border-[rgba(139,92,246,0.3)]'
              : 'bg-transparent text-[#9ca3af] border-[rgba(139,92,246,0.15)] hover:border-[rgba(139,92,246,0.4)] hover:text-[#ede9fe]'
          )}
        >
          Toutes
        </button>
        {ACTIVITY_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onTypeFilterChange(typeFilter === value ? 'all' : value)}
            className={cn(
              'text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all',
              typeFilter === value
                ? TYPE_COLORS[value]
                : 'bg-transparent text-[#9ca3af] border-[rgba(139,92,246,0.15)] hover:border-[rgba(139,92,246,0.4)] hover:text-[#ede9fe]'
            )}
          >
            {label}
          </button>
        ))}
        {isFiltered && (
          <button
            onClick={() => { onSearchChange(''); onTypeFilterChange('all') }}
            className="text-[10px] text-red-400 hover:text-red-300 ml-auto transition-colors"
          >
            Tout réinitialiser
          </button>
        )}
      </div>
    </div>
  )
}
