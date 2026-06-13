import { AccessItemView, CategoryGroup, type AccessRecord } from '@/components/v3/access-shared'
import {
  AGENCY_CATEGORY_ORDER,
  AGENCY_CATEGORY_LABELS,
  AGENCY_CATEGORY_ICONS,
  type AgencyCategory,
} from '../constants'
import type { AgencyAccess } from '../hooks/useAgencyAccesses'

interface Props {
  accesses: AgencyAccess[]
  isAdmin: boolean
  onEdit: (access: AgencyAccess) => void
  onDelete: (id: string) => void
  /** Si non-null, affiche tout à plat (résultat de recherche) au lieu du groupement */
  flatMode?: boolean
}

export function AgencyVaultCategories({ accesses, isAdmin, onEdit, onDelete, flatMode = false }: Props) {
  if (flatMode) {
    return (
      <div className="space-y-2">
        {accesses.map(a => {
          const Icon = AGENCY_CATEGORY_ICONS[a.category]
          return (
            <AccessItemView
              key={a.id}
              access={a as unknown as AccessRecord}
              isAdmin={isAdmin}
              categoryIcon={Icon}
              onEdit={() => onEdit(a)}
              onDelete={() => onDelete(a.id)}
            />
          )
        })}
      </div>
    )
  }

  const byCategory = accesses.reduce<Partial<Record<AgencyCategory, AgencyAccess[]>>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category]!.push(a)
    return acc
  }, {})

  const activeCategories = AGENCY_CATEGORY_ORDER.filter(c => (byCategory[c]?.length ?? 0) > 0)

  return (
    <div className="space-y-4">
      {activeCategories.map(category => {
        const Icon = AGENCY_CATEGORY_ICONS[category]
        const items = byCategory[category]!
        return (
          <CategoryGroup
            key={category}
            label={AGENCY_CATEGORY_LABELS[category]}
            icon={Icon}
            count={items.length}
            defaultExpanded
          >
            {items.map(a => (
              <AccessItemView
                key={a.id}
                access={a as unknown as AccessRecord}
                isAdmin={isAdmin}
                categoryIcon={Icon}
                onEdit={() => onEdit(a)}
                onDelete={() => onDelete(a.id)}
              />
            ))}
          </CategoryGroup>
        )
      })}
    </div>
  )
}
