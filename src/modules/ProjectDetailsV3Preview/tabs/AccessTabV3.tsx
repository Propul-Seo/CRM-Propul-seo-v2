import { useState, useMemo } from 'react'
import { Plus, Lock, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useIsProjectV3Admin } from '../hooks/useIsProjectV3Admin'
import { useProjectAccessesV3, type ProjectAccessV3 } from '../hooks/useProjectAccessesV3'
import {
  AccessItemView,
  AccessEditModal,
  CategoryGroup,
  type AccessRecord,
  type CategoryConfig,
} from '@/components/v3/access-shared'
import { CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_ICONS } from './access/constants'
import type { ProjectV2, AccessCategory } from '@/types/project-v2'

interface Props {
  project: ProjectV2
}

type EditingState = ProjectAccessV3 | 'new' | null

const PROJECT_CATEGORIES: CategoryConfig[] = CATEGORY_ORDER.map(c => ({
  value: c,
  label: CATEGORY_LABELS[c],
  icon: CATEGORY_ICONS[c],
}))

export function AccessTabV3({ project }: Props) {
  const { isAdmin } = useIsProjectV3Admin()
  const { accesses, loading, error, upsertAccess, deleteAccess } = useProjectAccessesV3(project.id, isAdmin)
  const [editing, setEditing] = useState<EditingState>(null)

  const handleDelete = async (id: string) => {
    try {
      await deleteAccess(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Suppression échouée')
    }
  }

  const byCategory = useMemo(() => {
    return accesses.reduce<Partial<Record<AccessCategory, ProjectAccessV3[]>>>((acc, a) => {
      if (!acc[a.category]) acc[a.category] = []
      acc[a.category]!.push(a)
      return acc
    }, {})
  }, [accesses])

  const activeCategories = CATEGORY_ORDER.filter(c => (byCategory[c]?.length ?? 0) > 0)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#ede9fe]">
            {isAdmin ? 'Coffre-fort' : 'Accès du projet'}
          </p>
          <p className="text-xs text-[#9ca3af] mt-0.5">
            {isAdmin
              ? `${accesses.length} accès stockés (chiffrés)`
              : `${accesses.length} accès — secrets masqués`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 text-sm text-[#A78BFA] hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un accès
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-2 rounded-lg border border-[rgba(139,92,246,0.18)] bg-[rgba(139,92,246,0.08)] p-3">
          <Lock className="h-4 w-4 text-[#A78BFA] shrink-0 mt-0.5" />
          <p className="text-xs text-[#ede9fe]">
            Vue limitée — les identifiants ne sont visibles qu'aux administrateurs.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs text-red-300">Erreur de chargement : {error}</p>
        </div>
      )}

      {activeCategories.length === 0 && !error && (
        <div className="text-center py-12 text-[#9ca3af]">
          <KeyRound className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun accès enregistré</p>
          {isAdmin && (
            <p className="text-xs mt-1">Cliquez sur « Ajouter un accès » pour commencer</p>
          )}
        </div>
      )}

      {activeCategories.map(category => {
        const Icon = CATEGORY_ICONS[category]
        const items = byCategory[category]!
        return (
          <CategoryGroup key={category} label={CATEGORY_LABELS[category]} icon={Icon} count={items.length} defaultExpanded>
            {items.map(a => (
              <AccessItemView
                key={a.id}
                access={a as AccessRecord}
                isAdmin={isAdmin}
                categoryIcon={Icon}
                onEdit={() => setEditing(a)}
                onDelete={() => handleDelete(a.id)}
              />
            ))}
          </CategoryGroup>
        )
      })}

      {editing !== null && (
        <AccessEditModal
          access={editing === 'new' ? null : (editing as AccessRecord)}
          categories={PROJECT_CATEGORIES}
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            await upsertAccess({
              id: values.id,
              category: values.category as AccessCategory,
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
