import { useMemo } from 'react'
import type { LeadsV3Tab } from '../components/LeadsV3Header'
import type { LeadCardData } from '../components/LeadCardV3'
import { siteWebToCard, erpToCard, qualifToCard, matchesQuery, sortSiteWebLeads, sortErpLeads } from '../utils/leadAdapters'
import {
  SITE_WEB_STATUS_ORDER, SITE_WEB_STATUS_LABELS, SITE_WEB_STATUS_COLORS,
  ERP_STATUS_ORDER, ERP_STATUS_LABELS, ERP_STATUS_COLORS,
  isSiteWebStatus, isErpStatus, normalizeErpStatus,
  type SiteWebStatus, type ErpStatus,
} from '../utils/leadStatusMapping'
// Imports `type` uniquement : on extrait ReturnType<> de ces hooks pour typer
// les paramètres du hook (sw/erp), sans embarquer leur implémentation.
import type { useLeadsV3SiteWeb } from './useLeadsV3SiteWeb'
import type { useLeadsV3Erp } from './useLeadsV3Erp'
import type { QualificationLead } from './useLeadsV3Qualification'

interface ColumnDef { id: string; label: string; color: string }
interface CardsResult {
  cards: LeadCardData[]
  leadStatus: Record<string, string>
  columns: ColumnDef[]
  onStatusChange: (id: string, newStatus: string) => Promise<void>
}

interface UseLeadsV3CardsArgs {
  tab: LeadsV3Tab
  sw: ReturnType<typeof useLeadsV3SiteWeb>
  erp: ReturnType<typeof useLeadsV3Erp>
  qualifLeads: QualificationLead[]
  qualifIdSet: Set<string>
  filterUserId: string
  debouncedSearch: string
}

/**
 * Construit les `cards`, `leadStatus`, `columns` et `onStatusChange` selon l'onglet
 * actif (site_web | erp), avec merge des leads qualifiés en tête.
 *
 * Les leads qualif ont un status virtuel `questionnaire_complete` et ne peuvent
 * pas être déplacés via drag-drop vers les colonnes contacts (no-op dans updater).
 */
export function useLeadsV3Cards({
  tab, sw, erp, qualifLeads, qualifIdSet, filterUserId, debouncedSearch,
}: UseLeadsV3CardsArgs): CardsResult {
  return useMemo(() => {
    const qualifCards = qualifLeads.map(qualifToCard).filter(c => matchesQuery(c, debouncedSearch))
    const qualifStatusMap: Record<string, string> = {}
    for (const q of qualifLeads) qualifStatusMap[q.id] = 'questionnaire_complete'

    if (tab === 'site_web') {
      const filtered = sortSiteWebLeads(sw.leads.filter(l => !filterUserId || l.assigned_to === filterUserId))
      const baseCards = filtered.map(siteWebToCard).filter(c => matchesQuery(c, debouncedSearch))
      const statusMap: Record<string, string> = { ...qualifStatusMap }
      for (const l of filtered) statusMap[l.id] = l.normalized_status
      const cols = SITE_WEB_STATUS_ORDER.map(s => ({
        id: s, label: SITE_WEB_STATUS_LABELS[s], color: SITE_WEB_STATUS_COLORS[s],
      }))
      const updater = async (id: string, newStatus: string) => {
        if (!isSiteWebStatus(newStatus)) return
        if (qualifIdSet.has(id)) return
        await sw.updateStatus(id, newStatus as SiteWebStatus)
      }
      return { cards: [...qualifCards, ...baseCards], leadStatus: statusMap, columns: cols, onStatusChange: updater }
    }

    const filtered = sortErpLeads(erp.leads.filter(l => !filterUserId || l.assignee_id === filterUserId))
    const baseCards = filtered.map(erpToCard).filter(c => matchesQuery(c, debouncedSearch))
    const statusMap: Record<string, string> = { ...qualifStatusMap }
    for (const l of filtered) statusMap[l.id] = normalizeErpStatus(l.status)
    const cols = ERP_STATUS_ORDER.map(s => ({
      id: s, label: ERP_STATUS_LABELS[s], color: ERP_STATUS_COLORS[s],
    }))
    const updater = async (id: string, newStatus: string) => {
      if (!isErpStatus(newStatus)) return
      if (qualifIdSet.has(id)) return
      await erp.updateStatus(id, newStatus as ErpStatus)
    }
    return { cards: [...qualifCards, ...baseCards], leadStatus: statusMap, columns: cols, onStatusChange: updater }
  }, [tab, sw, erp, qualifLeads, qualifIdSet, filterUserId, debouncedSearch])
}
