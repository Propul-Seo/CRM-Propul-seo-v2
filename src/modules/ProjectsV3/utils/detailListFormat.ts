import type { ProjectV2 } from '@/types/project-v2'

/** Colonnes triables du tableau « Liste détaillée ». */
export type DetailSortKey =
  | 'name'
  | 'status'
  | 'completion'
  | 'budget'
  | 'end_date'
  | 'last_activity'

export type SortDir = 'asc' | 'desc'

export interface DetailSort {
  key: DetailSortKey
  dir: SortDir
}

const EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/** Budget en euros FR (ex. « 7 500 € »), « — » si null. */
export function formatBudget(budget: number | null): string {
  if (budget === null || Number.isNaN(budget)) return '—'
  return EUR.format(budget)
}

/** Date courte FR (ex. « 8 juin 2026 »), « — » si null. */
export function formatShortDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Avancement borné [0, 100] arrondi. */
export function clampScore(score: number | null | undefined): number {
  return Math.max(0, Math.min(100, Math.round(score ?? 0)))
}

/**
 * Valeur comparable pour le tri client-side d'une colonne donnée.
 * Renvoie soit un nombre (scores, budgets, dates en ms) soit une chaîne.
 */
function sortValue(project: ProjectV2, key: DetailSortKey): number | string {
  switch (key) {
    case 'name':
      return project.name.toLowerCase()
    case 'status':
      return project.status
    case 'completion':
      return clampScore(project.progress)
    case 'budget':
      return project.budget ?? -1
    case 'end_date':
      return project.end_date ? new Date(project.end_date).getTime() : -Infinity
    case 'last_activity':
      return project.last_activity_at ? new Date(project.last_activity_at).getTime() : -Infinity
  }
}

/** Trie une copie des projets selon la colonne et le sens demandés. */
export function sortProjects(projects: ProjectV2[], sort: DetailSort): ProjectV2[] {
  const factor = sort.dir === 'asc' ? 1 : -1
  return [...projects].sort((a, b) => {
    const va = sortValue(a, sort.key)
    const vb = sortValue(b, sort.key)
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * factor
    }
    return String(va).localeCompare(String(vb), 'fr') * factor
  })
}
