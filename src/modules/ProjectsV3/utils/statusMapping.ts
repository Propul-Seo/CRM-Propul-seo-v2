import type { ProjectStatusV2 } from '@/types/project-v2'

/**
 * Colonnes V3 : 3 statuts agrégés simplifiés.
 */
export type V3Column = 'planification' | 'en_cours' | 'en_pause'

export const V3_COLUMN_ORDER: V3Column[] = ['planification', 'en_cours', 'en_pause']

export const V3_COLUMN_LABELS: Record<V3Column, string> = {
  planification: 'Planification',
  en_cours: 'En cours',
  en_pause: 'En pause',
}

/**
 * Map statut V2 → colonne V3.
 * Les projets archivés (closed) et livrés sont exclus de la vue "en cours".
 * Pour rester aligné avec la V2 actuelle :
 *  - planification : prospect, brief_received, quote_sent
 *  - en_cours      : in_progress, review, delivered, maintenance
 *  - en_pause      : on_hold, closed
 */
export function statusToColumn(status: ProjectStatusV2): V3Column {
  switch (status) {
    case 'prospect':
    case 'brief_received':
    case 'quote_sent':
      return 'planification'
    case 'in_progress':
    case 'review':
    case 'delivered':
    case 'maintenance':
      return 'en_cours'
    case 'on_hold':
    case 'closed':
      return 'en_pause'
    default:
      return 'en_cours'
  }
}

/**
 * Statut V2 par défaut quand on drop dans une colonne V3.
 * (utilisé au drag&drop : il faut bien choisir UN statut V2 quand on change de colonne)
 */
export function columnToDefaultStatus(column: V3Column): ProjectStatusV2 {
  switch (column) {
    case 'planification': return 'brief_received'
    case 'en_cours':      return 'in_progress'
    case 'en_pause':      return 'on_hold'
  }
}
