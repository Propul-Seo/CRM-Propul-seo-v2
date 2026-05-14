import { CATEGORIES, CATEGORY_ORDER } from './constants'
import type { DocumentCategory } from '@/types/project-v2'

export type FilterValue = DocumentCategory | 'all'

interface Props {
  active: FilterValue
  counts: Record<FilterValue, number>
  onChange: (value: FilterValue) => void
}

export function DocumentFilters({ active, counts, onChange }: Props) {
  const Pill = ({ value, label, count }: { value: FilterValue; label: string; count: number }) => (
    <button
      onClick={() => onChange(value)}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all
        ${active === value
          ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] font-semibold'
          : 'bg-[rgba(139,92,246,0.06)] text-[#9ca3af] border-[rgba(139,92,246,0.18)] hover:bg-[rgba(139,92,246,0.15)] hover:text-[#ede9fe]'}
      `}
    >
      <span>{label}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active === value ? 'bg-white/20' : 'bg-[rgba(139,92,246,0.15)]'}`}>
        {count}
      </span>
    </button>
  )

  return (
    <div className="flex flex-wrap gap-2">
      <Pill value="all" label="Tous" count={counts.all} />
      {CATEGORY_ORDER.map((cat) => (
        <Pill key={cat} value={cat} label={CATEGORIES[cat].label} count={counts[cat] ?? 0} />
      ))}
    </div>
  )
}
