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
    amount: lead.project_price,
  }
}

/**
 * Convertit un lead qualif (questionnaire `/diagnostic` soumis) en LeadCardData.
 * Status virtuel = `questionnaire_complete` (col en tête du Kanban).
 */
export function qualifToCard(lead: QualificationLead): LeadCardData {
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
    createdAt: lead.submitted_at ?? lead.created_at,
    amount: null,
  }
}

/** Convertit un lead ERP en LeadCardData. */
export function erpToCard(lead: CRMERPLead): LeadCardData {
  // Guard runtime : si le statut BDD est inconnu (typo, statut futur), on
  // retombe sur `leads_contactes` pour éviter undefined dans les Records.
  const status = normalizeErpStatus(lead.status)
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
    amount: null,
  }
}

/**
 * Tri des leads Site Web — reprend la logique du CRM V1 (KanbanDragContext.sortContacts) :
 * 1) leads avec `next_activity_date` en premier, du plus urgent au moins urgent (date asc)
 * 2) leads sans next_activity, triés par `created_at` croissant
 */
export function sortSiteWebLeads(leads: SiteWebLead[]): SiteWebLead[] {
  return [...leads].sort((a, b) => {
    if (a.next_activity_date && b.next_activity_date) {
      return new Date(a.next_activity_date).getTime() - new Date(b.next_activity_date).getTime()
    }
    if (a.next_activity_date && !b.next_activity_date) return -1
    if (!a.next_activity_date && b.next_activity_date) return 1
    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  })
}

/**
 * Tri des leads ERP par dernière activité descendante (la plus récente d'abord).
 * Les leads sans `last_activity_at` retombent en fin de liste, triés par `created_at` desc.
 */
export function sortErpLeads(leads: CRMERPLead[]): CRMERPLead[] {
  return [...leads].sort((a, b) => {
    if (a.last_activity_at && b.last_activity_at) {
      return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
    }
    if (a.last_activity_at && !b.last_activity_at) return -1
    if (!a.last_activity_at && b.last_activity_at) return 1
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })
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
