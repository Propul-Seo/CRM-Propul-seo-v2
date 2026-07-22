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
 * Tri des leads Site Web en DEUX étages :
 *   1. Les leads AVEC activité (une activité passée `last_activity_at`, ou une
 *      relance planifiée `next_activity_date` = lead pris en charge) passent en
 *      HAUT, triés par urgence : le signal le plus ANCIEN d'abord.
 *   2. Les leads SANS aucune activité tombent TOUT EN BAS (ils ne « polluent »
 *      plus le haut de colonne en se faisant passer pour urgents via un vieux
 *      `created_at`). Entre eux, ordre stable par date de fallback.
 */
export function sortSiteWebLeads(leads: SiteWebLead[]): SiteWebLead[] {
  return [...leads].sort((a, b) => {
    const ha = hasSiteWebActivity(a)
    const hb = hasSiteWebActivity(b)
    if (ha !== hb) return ha ? -1 : 1 // sans activité => en bas
    return getSiteWebActivityTimestamp(a) - getSiteWebActivityTimestamp(b)
  })
}

/**
 * Tri des leads ERP en deux étages : les leads avec `last_activity_at` en haut
 * (activité la plus ancienne d'abord), les leads sans activité tout en bas.
 */
export function sortErpLeads(leads: CRMERPLead[]): CRMERPLead[] {
  return [...leads].sort((a, b) => {
    const ha = hasErpActivity(a)
    const hb = hasErpActivity(b)
    if (ha !== hb) return ha ? -1 : 1 // sans activité => en bas
    return getErpActivityTimestamp(a) - getErpActivityTimestamp(b)
  })
}

/** A une activité = une activité passée journalisée, ou une relance planifiée. */
function hasSiteWebActivity(lead: SiteWebLead): boolean {
  return Boolean(lead.last_activity_at || lead.next_activity_date)
}

/** A une activité = une activité passée journalisée (l'ERP n'a pas de relance planifiée). */
function hasErpActivity(lead: CRMERPLead): boolean {
  return Boolean(lead.last_activity_at)
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
 * Timestamp de tri = le même signal que celui affiché sur la carte
 * (getSiteWebActivityInfo : dernière activité, sinon relance prévue, sinon
 * mise à jour, sinon création). Plus ANCIEN = plus urgent = en haut de colonne.
 */
function getSiteWebActivityTimestamp(lead: SiteWebLead): number {
  return toTimestamp(getSiteWebActivityInfo(lead).date)
}

function getErpActivityTimestamp(lead: CRMERPLead): number {
  return toTimestamp(getErpActivityInfo(lead).date)
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}
