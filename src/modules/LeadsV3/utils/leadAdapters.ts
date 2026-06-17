import type { SiteWebLead } from '../hooks/useLeadsV3SiteWeb'
import type { CRMERPLead } from '@/modules/CRMERPLeadDetails/types'
import type { LeadCardData } from '../components/LeadCardV3'
import type { QualificationLead } from '../hooks/useLeadsV3Qualification'
import {
  SITE_WEB_STATUS_COLORS,
  SITE_WEB_STATUS_LABELS,
  ERP_STATUS_COLORS,
  ERP_STATUS_LABELS,
  normalizeErpStatus,
} from './leadStatusMapping'

/** Convertit un lead Site web en LeadCardData pour les composants UI. */
export function siteWebToCard(lead: SiteWebLead): LeadCardData {
  const activity = getSiteWebActivityInfo(lead)

  return {
    id: lead.id,
    company: lead.company || null,
    contact: lead.name || null,
    email: lead.email || null,
    phone: lead.phone,
    statusColor: SITE_WEB_STATUS_COLORS[lead.normalized_status],
    statusLabel: SITE_WEB_STATUS_LABELS[lead.normalized_status],
    assignee: lead.assigned_user?.is_active === false ? null : (lead.assigned_user?.name ?? lead.assigned_user_name ?? null),
    source: lead.source || null,
    createdAt: lead.created_at,
    lastActivityAt: activity.date,
    lastActivityLabel: activity.label,
    amount: lead.project_price,
  }
}

/**
 * Convertit un lead qualif (questionnaire `/diagnostic` soumis) en LeadCardData.
 * Status virtuel = `questionnaire_complete` (col en tête du Kanban).
 */
export function qualifToCard(lead: QualificationLead): LeadCardData {
  const submittedAt = lead.submitted_at ?? lead.created_at

  return {
    id: lead.id,
    company: lead.company_name,
    contact: lead.full_name,
    email: lead.email || null,
    phone: lead.phone,
    statusColor: SITE_WEB_STATUS_COLORS.questionnaire_complete,
    statusLabel: SITE_WEB_STATUS_LABELS.questionnaire_complete,
    assignee: null,
    source: 'Diagnostic en ligne',
    createdAt: submittedAt,
    lastActivityAt: submittedAt,
    lastActivityLabel: 'Formulaire reçu',
    amount: null,
  }
}

/** Convertit un lead ERP en LeadCardData. */
export function erpToCard(lead: CRMERPLead): LeadCardData {
  // Guard runtime : si le statut BDD est inconnu (typo, statut futur), on
  // retombe sur `leads_contactes` pour éviter undefined dans les Records.
  const status = normalizeErpStatus(lead.status)
  const activity = getErpActivityInfo(lead)

  return {
    id: lead.id,
    company: lead.company_name,
    contact: lead.contact_name,
    email: lead.email,
    phone: lead.phone,
    statusColor: ERP_STATUS_COLORS[status],
    statusLabel: ERP_STATUS_LABELS[status],
    assignee: lead.assignee?.is_active === false ? null : (lead.assignee?.name ?? null),
    source: lead.source,
    createdAt: lead.created_at,
    lastActivityAt: activity.date,
    lastActivityLabel: activity.label,
    amount: null,
  }
}

/**
 * Mode de tri des leads dans le board.
 * - `relance_asc`  : par dernière relance, **les plus anciens / jamais relancés d'abord** (défaut).
 * - `relance_desc` : par dernière relance, les plus récents d'abord.
 * - `created_desc` : par date de création, les plus récents d'abord.
 */
export type LeadSortMode = 'relance_asc' | 'relance_desc' | 'created_desc'

export const LEAD_SORT_LABELS: Record<LeadSortMode, string> = {
  relance_asc: 'Dernière relance (anciens d’abord)',
  relance_desc: 'Dernière relance (récents d’abord)',
  created_desc: 'Date de création (récents d’abord)',
}

export const LEAD_SORT_ORDER: LeadSortMode[] = ['relance_asc', 'relance_desc', 'created_desc']

/** Tri des leads Site Web selon le mode choisi. */
export function sortSiteWebLeads(leads: SiteWebLead[], mode: LeadSortMode = 'relance_asc'): SiteWebLead[] {
  return sortByMode(leads, mode, getSiteWebRelanceTimestamp, (l) => toTimestamp(l.created_at))
}

/** Tri des leads ERP selon le mode choisi. */
export function sortErpLeads(leads: CRMERPLead[], mode: LeadSortMode = 'relance_asc'): CRMERPLead[] {
  return sortByMode(leads, mode, getErpRelanceTimestamp, (l) => toTimestamp(l.created_at))
}

function sortByMode<T>(
  leads: T[],
  mode: LeadSortMode,
  activityTs: (lead: T) => number,
  createdTs: (lead: T) => number,
): T[] {
  const arr = [...leads]
  if (mode === 'created_desc') return arr.sort((a, b) => createdTs(b) - createdTs(a))
  if (mode === 'relance_desc') return arr.sort((a, b) => activityTs(b) - activityTs(a))
  // relance_asc : les leads jamais relancés (timestamp 0) ou relancés il y a
  // longtemps remontent en tête — ce sont les plus urgents à recontacter.
  return arr.sort((a, b) => activityTs(a) - activityTs(b))
}

/** Recherche texte commune (case-insensitive). */
export function matchesQuery(data: LeadCardData, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  return (
    (data.company ?? '').toLowerCase().includes(needle) ||
    (data.contact ?? '').toLowerCase().includes(needle) ||
    (data.email ?? '').toLowerCase().includes(needle)
  )
}

function getSiteWebActivityInfo(lead: SiteWebLead): { date: string; label: string } {
  if (lead.last_activity_at) {
    return {
      date: lead.last_activity_at,
      label: lead.last_activity_type === 'follow_up' ? 'Dernière relance' : 'Dernière activité',
    }
  }

  if (lead.next_activity_date) {
    return { date: lead.next_activity_date, label: 'Relance prévue' }
  }

  if (lead.updated_at) {
    return { date: lead.updated_at, label: 'Dernière mise à jour' }
  }

  return { date: lead.created_at, label: 'Créé le' }
}

function getErpActivityInfo(lead: CRMERPLead): { date: string; label: string } {
  if (lead.last_activity_at) return { date: lead.last_activity_at, label: 'Dernière activité' }
  if (lead.updated_at) return { date: lead.updated_at, label: 'Dernière mise à jour' }
  return { date: lead.created_at, label: 'Créé le' }
}

/**
 * Timestamp de tri « dernière relance » : on ne regarde QUE `last_activity_at`
 * (le vrai signal de relance), pas les fallbacks d'affichage (next_activity_date
 * future, updated_at, created_at). Un lead jamais relancé → 0 → remonte en tête
 * en mode `relance_asc` (« pas appelé depuis longtemps en premier »).
 */
function getSiteWebRelanceTimestamp(lead: SiteWebLead): number {
  return toTimestamp(lead.last_activity_at)
}

function getErpRelanceTimestamp(lead: CRMERPLead): number {
  return toTimestamp(lead.last_activity_at)
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}
