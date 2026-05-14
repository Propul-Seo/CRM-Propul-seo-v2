import { Plus, Search, Vault } from 'lucide-react'

interface Props {
  count: number
  searchQuery: string
  onSearchChange: (value: string) => void
  onAddClick: () => void
  isAdmin: boolean
}

export function AgencyVaultHeader({ count, searchQuery, onSearchChange, onAddClick, isAdmin }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-[#0a0814]/80 backdrop-blur-md border-b border-[rgba(139,92,246,0.18)] px-6 py-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
            <Vault className="h-5 w-5 text-[#A78BFA]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#ede9fe]">Coffre-fort agence</h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              {count} accès interne{count > 1 ? 's' : ''} • chiffrement PGP
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Rechercher un accès (label, login, notes)..."
          className="w-full bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] rounded-md pl-9 pr-3 py-2 text-sm text-[#ede9fe] placeholder:text-[#6b7280] focus:outline-none focus:border-[#8B5CF6]"
        />
      </div>
    </div>
  )
}
