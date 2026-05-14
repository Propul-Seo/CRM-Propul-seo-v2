/**
 * Mapping centralisé des statuts pour Leads V3.
 * Site web et ERP ont des statuts différents : on garde deux jeux distincts
 * mais une API commune pour les composants UI.
 */

// ===== Site web (table `contacts`) =====
export type SiteWebStatus =
  | 'prospect'
  | 'presentation_envoyee'
  | 'meeting_booke'
  | 'offre_envoyee'
  | 'en_attente'
  | 'signe'

export const SITE_WEB_STATUS_ORDER: SiteWebStatus[] = [
  'prospect',
  'presentation_envoyee',
  'meeting_booke',
  'offre_envoyee',
  'en_attente',
  'signe',
]

export const SITE_WEB_STATUS_LABELS: Record<SiteWebStatus, string> = {
  prospect: 'Prospects',
  presentation_envoyee: 'Présentation envoyée',
  meeting_booke: 'Meeting booké',
  offre_envoyee: 'Offre envoyée',
  en_attente: 'En attente',
  signe: 'Signés',
}

export const SITE_WEB_STATUS_COLORS: Record<SiteWebStatus, string> = {
  prospect: '#8B5CF6',
  presentation_envoyee: '#60a5fa',
  meeting_booke: '#f59e0b',
  offre_envoyee: '#ec4899',
  en_attente: '#9ca3af',
  signe: '#10b981',
}

export function isSiteWebStatus(s: string): s is SiteWebStatus {
  return (SITE_WEB_STATUS_ORDER as string[]).includes(s)
}

export function normalizeSiteWebStatus(raw: string | null | undefined): SiteWebStatus {
  if (!raw) return 'prospect'
  return isSiteWebStatus(raw) ? raw : 'prospect'
}

// ===== ERP (table `crmerp_leads`) =====
export type ErpStatus = 'leads_contactes' | 'rendez_vous_effectues' | 'en_attente' | 'signes'

export const ERP_STATUS_ORDER: ErpStatus[] = [
  'leads_contactes',
  'rendez_vous_effectues',
  'en_attente',
  'signes',
]

export const ERP_STATUS_LABELS: Record<ErpStatus, string> = {
  leads_contactes: 'Leads contactés',
  rendez_vous_effectues: 'RDV effectués',
  en_attente: 'En attente',
  signes: 'Signés',
}

export const ERP_STATUS_COLORS: Record<ErpStatus, string> = {
  leads_contactes: '#60a5fa',
  rendez_vous_effectues: '#f59e0b',
  en_attente: '#9ca3af',
  signes: '#10b981',
}

export function isErpStatus(s: string): s is ErpStatus {
  return (ERP_STATUS_ORDER as string[]).includes(s)
}

/** Fallback runtime pour les statuts ERP inconnus (typos BDD, statuts futurs). */
export function normalizeErpStatus(raw: string | null | undefined): ErpStatus {
  if (!raw) return 'leads_contactes'
  return isErpStatus(raw) ? raw : 'leads_contactes'
}
