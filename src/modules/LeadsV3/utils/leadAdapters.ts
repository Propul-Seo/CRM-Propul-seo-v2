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
 * Tri des leads Site Web autour de la RELANCE PROGRAMMÉE (`next_activity_date`) :
 *   1. En HAUT, les leads qui ont une prochaine relance planifiée — la plus proche
 *      / la plus en retard d'abord (file de travail : ce qui est dû en premier).
 *   2. En BAS, les leads SANS relance programmée, même s'ils ont une activité
 *      passée (`last_activity_at`) : un lead appelé mais sans prochaine action
 *      planifiée ne monopolise plus le haut de colonne. Entre eux, activité la
 *      plus récente d'abord.
 */
export function sortSiteWebLeads(leads: SiteWebLead[]): SiteWebLead[] {
  return [...leads].sort((a, b) => {
    const sa = hasScheduledRelance(a)
    const sb = hasScheduledRelance(b)
    if (sa !== sb) return sa ? -1 : 1 // sans relance programmée => en bas
    if (sa) {
      // Haut : la relance la plus proche / la plus en retard d'abord.
      return toTimestamp(a.next_activity_date) - toTimestamp(b.next_activity_date)
    }
    // Bas : backlog non programmé, activité la plus récente d'abord.
    return getSiteWebActivityTimestamp(b) - getSiteWebActivityTimestamp(a)
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

/** A une relance PROGRAMMÉE = une prochaine activité planifiée (`next_activity_date`). */
function hasScheduledRelance(lead: SiteWebLead): boolean {
  return Boolean(lead.next_activity_date)
}

/**
 * Côté ERP il n'existe pas de champ « prochaine relance » (`crmerp_leads` n'a pas
 * de `next_activity_date`) : on retombe sur « a une activité passée » comme signal.
 */
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
