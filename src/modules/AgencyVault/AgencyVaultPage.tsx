import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUsers } from '@/hooks/useUsers'
import { AccessEditModal, type AccessRecord } from '@/components/v3/access-shared'
import { useAgencyAccesses, type AgencyAccess } from './hooks/useAgencyAccesses'
import { AgencyVaultHeader } from './components/AgencyVaultHeader'
import { AgencyVaultCategories } from './components/AgencyVaultCategories'
import { AgencyVaultEmptyState } from './components/AgencyVaultEmptyState'
import { AGENCY_CATEGORIES_CONFIG, type AgencyCategory } from './constants'

type EditingState = AgencyAccess | 'new' | null

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function AgencyVaultPage() {
  const { user } = useAuth()
  const { getUserByAuthId } = useUsers()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 300)
  const [editing, setEditing] = useState<EditingState>(null)

  useEffect(() => {
    const run = async () => {
      if (!user) { setIsAdmin(false); return }
      try {
        const data = await getUserByAuthId(user.id)
        setIsAdmin(data?.role === 'admin')
      } catch {
        setIsAdmin(false)
      }
    }
    void run()
  }, [user, getUserByAuthId])

  const { accesses, loading, error, upsertAccess, deleteAccess } = useAgencyAccesses(isAdmin)

  const filteredAccesses = useMemo(() => {
    if (!debouncedSearch.trim()) return accesses
    const q = debouncedSearch.toLowerCase()
    return accesses.filter(a =>
      a.label.toLowerCase().includes(q) ||
      (a.login ?? '').toLowerCase().includes(q) ||
      (a.notes ?? '').toLowerCase().includes(q),
    )
  }, [accesses, debouncedSearch])

  const handleDelete = async (id: string) => {
    try {
      await deleteAccess(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Suppression échouée')
    }
  }

  if (isAdmin === null || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#A78BFA]" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0a0814] text-[#ede9fe]">
      <AgencyVaultHeader
        count={accesses.length}
        searchQuery={search}
        onSearchChange={setSearch}
        onAddClick={() => setEditing('new')}
        isAdmin={isAdmin}
      />

      <div className="px-6 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-xs text-red-300">Erreur de chargement : {error}</p>
          </div>
        )}

        {accesses.length === 0 && !error && (
          <AgencyVaultEmptyState mode="no-entries" />
        )}

        {accesses.length > 0 && filteredAccesses.length === 0 && (
          <AgencyVaultEmptyState mode="no-search-results" searchQuery={debouncedSearch} />
        )}

        {filteredAccesses.length > 0 && (
          <AgencyVaultCategories
            accesses={filteredAccesses}
            isAdmin={isAdmin}
            onEdit={(a) => setEditing(a)}
            onDelete={handleDelete}
            flatMode={Boolean(debouncedSearch.trim())}
          />
        )}
      </div>

      {editing !== null && (
        <AccessEditModal
          access={editing === 'new' ? null : (editing as unknown as AccessRecord)}
          categories={AGENCY_CATEGORIES_CONFIG}
          title={editing === 'new' ? 'Nouvel accès agence' : 'Modifier l\'accès agence'}
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            await upsertAccess({
              id: values.id,
              category: values.category as AgencyCategory,
              label: values.label,
              url: values.url,
              login: values.login,
              password: values.password,
              notes: values.notes,
              status: values.status,
              provided_by: values.provided_by,
              expires_at: values.expires_at,
            })
          }}
        />
      )}
    </div>
  )
}
