import type { ProjectStatusV2 } from '@/types/project-v2'

/**
 * Colonnes V3 simplifiées (board « Projets actifs ») : 3 buckets.
 *  - actifs    : projets réellement en production
 *  - inactifs  : pas encore démarrés (planification) OU en pause
 *  - propulseo : projets internes Propul'SEO
 */
export type V3Column = 'actifs' | 'inactifs' | 'propulseo'

export const V3_COLUMN_ORDER: V3Column[] = ['actifs', 'inactifs', 'propulseo']

export const V3_COLUMN_LABELS: Record<V3Column, string> = {
  actifs: 'Actifs',
  inactifs: 'Inactifs',
  propulseo: 'Projets Propulseo',
}

/**
 * Map statut V2 → colonne V3.
 *  - actifs   : in_progress, review, delivered, maintenance (en production)
 *  - inactifs : prospect, brief_received, quote_sent (planification) + on_hold (pause)
 *  - propulseo: propulseo_internal
 * Note : `closed` est exclu du board (vue « Projets terminés ») ; on le range dans
 * `inactifs` par défaut au cas où il transiterait.
 */
export function statusToColumn(status: ProjectStatusV2): V3Column {
  switch (status) {
    case 'in_progress':
    case 'review':
    case 'delivered':
    case 'maintenance':
      return 'actifs'
    case 'prospect':
    case 'brief_received':
    case 'quote_sent':
    case 'on_hold':
    case 'closed':
      return 'inactifs'
    case 'propulseo_internal':
      return 'propulseo'
    default:
      return 'actifs'
  }
}

/**
 * Statut V2 par défaut quand on drop dans une colonne V3.
 * (utilisé au drag&drop : il faut bien choisir UN statut V2 quand on change de colonne)
 */
export function columnToDefaultStatus(column: V3Column): ProjectStatusV2 {
  switch (column) {
    case 'actifs':    return 'in_progress'
    case 'inactifs':  return 'on_hold'
    case 'propulseo': return 'propulseo_internal'
  }
}
