import type { SiteWebLead } from '../hooks/useLeadsV3SiteWeb'
import type { CRMERPLead } from '@/modules/CRMERP/types'
import type { LeadCardData } from '../components/LeadCardV3'
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
    assignee: lead.assigned_user?.name ?? lead.assigned_user_name ?? null,
    source: lead.source || null,
    createdAt: lead.created_at,
    amount: lead.project_price,
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
    assignee: lead.assignee?.name ?? null,
    source: lead.source,
    createdAt: lead.created_at,
    amount: null,
  }
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
