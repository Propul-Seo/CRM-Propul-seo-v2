import type { ProjectStepStatus } from '@/modules/EspaceClient/shared/types/portal.types'
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData'

/** Contact mailto existant de la page projet (conservé tel quel). */
export const TEAM_MAILTO = 'mailto:team@propulseo-site.com'

// ── Formatage dates ───────────────────────────────────────────────
export function formatLong(iso: string | null): string {
  if (!iso) return 'À planifier'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Jour + mois en toutes lettres (marginalia de la frise, échéances). */
export function formatJour(iso: string | null): string {
  if (!iso) return 'À planifier'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function formatShort(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null
  const ms = new Date(b).getTime() - new Date(a).getTime()
  if (Number.isNaN(ms)) return null
  return Math.max(0, Math.round(ms / 86_400_000))
}

// Clés = valeurs réelles de PrestaType (cf. src/types/project-v2.ts)
export const PRESTA_LABELS: Record<string, string> = {
  web: 'Site web', site_web: 'Site web',
  erp: 'ERP / Outil métier', erp_v2: 'ERP / Outil métier',
  saas: 'SaaS', seo: 'SEO', communication: 'Communication',
}

// ── Statuts de jalon ──────────────────────────────────────────────
/** Narrowing sûr du statut DB (string) vers l'union métier. */
export function toStepStatus(s: string): ProjectStepStatus {
  return s === 'completed' || s === 'in_progress' || s === 'blocked' ? s : 'upcoming'
}

export const STATUT_LIBELLE: Record<ProjectStepStatus, string> = {
  completed: 'Terminé',
  in_progress: 'En cours',
  upcoming: 'Prévu',
  blocked: 'Bloqué',
}

export const STATUT_TEXTE: Record<ProjectStepStatus, string> = {
  completed: 'text-[var(--ps-success-text)]',
  in_progress: 'text-[var(--ps-primary-text)]',
  upcoming: 'text-[var(--ps-fg-secondary)]',
  blocked: 'text-[var(--ps-danger-text)]',
}

/**
 * Date de marginalia d'un jalon : complétion réelle si terminé,
 * sinon échéance prévue, à défaut date de démarrage.
 */
export function stepDate(step: PortalProjectStep): string | null {
  if (toStepStatus(step.status) === 'completed') {
    return step.date_actual_end ?? step.date_planned_end ?? step.date_start
  }
  return step.date_planned_end ?? step.date_start
}
