import { Vault, Search } from 'lucide-react'

interface Props {
  mode: 'no-entries' | 'no-search-results'
  searchQuery?: string
}

export function AgencyVaultEmptyState({ mode, searchQuery }: Props) {
  if (mode === 'no-search-results') {
    return (
      <div className="text-center py-16 text-[#9ca3af]">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Aucun résultat pour « {searchQuery} »</p>
        <p className="text-xs mt-1 opacity-70">Essaie un autre mot-clé ou efface la recherche.</p>
      </div>
    )
  }

  return (
    <div className="text-center py-20 text-[#9ca3af]">
      <Vault className="h-14 w-14 mx-auto mb-4 opacity-30" />
      <p className="text-base text-[#ede9fe] font-medium">Coffre-fort vide</p>
      <p className="text-sm mt-2 opacity-80">Ajoute ton premier accès interne pour commencer.</p>
      <p className="text-xs mt-1 opacity-60">Workspace, Dev, Infra, Finance, Marketing, SaaS…</p>
    </div>
  )
}
