import { useState } from 'react'
import { Plus, Lock, KeyRound, ChevronDown, ChevronRight } from 'lucide-react'
import { useIsProjectV3Admin } from '../hooks/useIsProjectV3Admin'
import { useProjectAccessesV3, type ProjectAccessV3 } from '../hooks/useProjectAccessesV3'
import { AccessItemV3 } from './access/AccessItemV3'
import { AccessEditModalV3 } from './access/AccessEditModalV3'
import { CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_ICONS } from './access/constants'
import type { ProjectV2, AccessCategory } from '@/types/project-v2'

interface Props {
  project: ProjectV2
}

type EditingState = ProjectAccessV3 | 'new' | null

export function AccessTabV3({ project }: Props) {
  const { isAdmin } = useIsProjectV3Admin()
  const { accesses, loading, error, upsertAccess, deleteAccess } = useProjectAccessesV3(project.id, isAdmin)
  const [collapsed, setCollapsed] = useState<Partial<Record<AccessCategory, boolean>>>({})
  const [editing, setEditing] = useState<EditingState>(null)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  const byCategory = accesses.reduce<Partial<Record<AccessCategory, ProjectAccessV3[]>>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category]!.push(a)
    return acc
  }, {})
  const activeCategories = CATEGORY_ORDER.filter(c => (byCategory[c]?.length ?? 0) > 0)

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {/* Header */}
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

      {/* Bandeau non-admin */}
      {!isAdmin && (
        <div className="flex items-start gap-2 rounded-lg border border-[rgba(139,92,246,0.18)] bg-[rgba(139,92,246,0.08)] p-3">
          <Lock className="h-4 w-4 text-[#A78BFA] shrink-0 mt-0.5" />
          <p className="text-xs text-[#ede9fe]">
            Vue limitée — les identifiants ne sont visibles qu'aux administrateurs.
          </p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs text-red-300">Erreur de chargement : {error}</p>
        </div>
      )}

      {/* Empty */}
      {activeCategories.length === 0 && !error && (
        <div className="text-center py-12 text-[#9ca3af]">
          <KeyRound className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun accès enregistré</p>
          {isAdmin && (
            <p className="text-xs mt-1">Cliquez sur « Ajouter un accès » pour commencer</p>
          )}
        </div>
      )}

      {/* Phases */}
      {activeCategories.map(category => {
        const Icon = CATEGORY_ICONS[category]
        const items = byCategory[category]!
        const isCollapsed = !!collapsed[category]
        return (
          <div key={category} className="space-y-2">
            <button
              onClick={() => setCollapsed(p => ({ ...p, [category]: !p[category] }))}
              className="flex items-center gap-2 w-full text-left hover:bg-[rgba(139,92,246,0.08)] rounded px-1 py-0.5 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-[#9ca3af]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#9ca3af]" />}
              <Icon className="h-4 w-4 text-[#A78BFA]" />
              <span className="text-sm font-medium text-[#ede9fe]">{CATEGORY_LABELS[category]}</span>
              <span className="text-xs text-[#9ca3af]">{items.length}</span>
            </button>
            {!isCollapsed && (
              <div className="space-y-2 pl-1">
                {items.map(a => (
                  <AccessItemV3
                    key={a.id}
                    access={a}
                    isAdmin={isAdmin}
                    onEdit={() => setEditing(a)}
                    onDelete={() => deleteAccess(a.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Modale */}
      {editing !== null && (
        <AccessEditModalV3
          access={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSubmit={upsertAccess}
        />
      )}
    </div>
  )
}
