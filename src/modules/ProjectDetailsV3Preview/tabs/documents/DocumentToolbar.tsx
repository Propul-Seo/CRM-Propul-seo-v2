import { Search } from 'lucide-react'

export type SortKey = 'date' | 'name' | 'size'

interface Props {
  count: number
  search: string
  sortKey: SortKey
  onSearchChange: (value: string) => void
  onSortChange: (value: SortKey) => void
}

export function DocumentToolbar({ count, search, sortKey, onSearchChange, onSortChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-baseline gap-3">
        <h2 className="text-xl font-bold text-[#ede9fe]">Documents</h2>
        <span className="text-sm text-[#9ca3af]">
          · {count} fichier{count !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b7280] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher…"
            className="w-64 pl-9 pr-3 py-2 bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.18)] rounded-lg text-sm text-[#ede9fe] placeholder:text-[#6b7280] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
        <select
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.18)] rounded-lg px-3 py-2 text-xs text-[#ede9fe] focus:outline-none focus:border-[#8B5CF6]"
        >
          <option value="date">Plus récent</option>
          <option value="name">Nom</option>
          <option value="size">Taille</option>
        </select>
      </div>
    </div>
  )
}
