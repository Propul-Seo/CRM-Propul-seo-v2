import { useState, useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { routes } from '@/lib/routes'
import { LeadsV3Header, type LeadsV3Tab } from './components/LeadsV3Header'
import { VariantA_Kanban } from './variants/VariantA_Kanban'
import { useLeadsV3SiteWeb } from './hooks/useLeadsV3SiteWeb'
import { useLeadsV3Erp } from './hooks/useLeadsV3Erp'
import { useConvertLeadToProject } from './hooks/useConvertLeadToProject'
import { siteWebToCard, erpToCard, matchesQuery } from './utils/leadAdapters'
import type { LeadCardData } from './components/LeadCardV3'
import {
  SITE_WEB_STATUS_ORDER,
  SITE_WEB_STATUS_LABELS,
  SITE_WEB_STATUS_COLORS,
  ERP_STATUS_ORDER,
  ERP_STATUS_LABELS,
  ERP_STATUS_COLORS,
  isSiteWebStatus,
  isErpStatus,
  normalizeErpStatus,
  type SiteWebStatus,
  type ErpStatus,
} from './utils/leadStatusMapping'

const TAB_KEY = 'propulseo:leads-v3:tab'

function loadTab(): LeadsV3Tab {
  if (typeof window === 'undefined') return 'site_web'
  const v = window.localStorage.getItem(TAB_KEY)
  return v === 'erp' ? 'erp' : 'site_web'
}

function useDebounced<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setD(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return d
}

export function LeadsV3Page() {
  const navigate = useNavigate()
  const [tab, setTabRaw] = useState<LeadsV3Tab>(loadTab)
  const [filterUserId, setFilterUserId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounced(searchQuery, 300)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  const setTab = (t: LeadsV3Tab) => { setTabRaw(t); window.localStorage.setItem(TAB_KEY, t) }

  const sw = useLeadsV3SiteWeb()
  const erp = useLeadsV3Erp()
  const { convert } = useConvertLeadToProject()
  const [convertingId, setConvertingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('users').select('id, name').order('name').then(({ data, error }) => {
      if (error) { console.error('[LeadsV3] users fetch failed:', error); return }
      if (data) setUsers(data as { id: string; name: string }[])
    })
  }, [])

  const loading = tab === 'site_web' ? sw.loading : erp.loading
  const error = tab === 'site_web' ? sw.error : erp.error

  // Construction des cards + statusMap selon l'onglet
  const { cards, leadStatus, columns, onStatusChange } = useMemo(() => {
    if (tab === 'site_web') {
      const filtered = sw.leads.filter(l => !filterUserId || l.assigned_to === filterUserId)
      const allCards = filtered.map(siteWebToCard).filter(c => matchesQuery(c, debouncedSearch))
      const statusMap: Record<string, string> = {}
      for (const l of filtered) statusMap[l.id] = l.normalized_status
      const cols = SITE_WEB_STATUS_ORDER.map(s => ({
        id: s, label: SITE_WEB_STATUS_LABELS[s], color: SITE_WEB_STATUS_COLORS[s],
      }))
      const updater = async (id: string, newStatus: string) => {
        if (!isSiteWebStatus(newStatus)) return
        await sw.updateStatus(id, newStatus as SiteWebStatus)
      }
      return { cards: allCards, leadStatus: statusMap, columns: cols, onStatusChange: updater }
    }
    const filtered = erp.leads.filter(l => !filterUserId || l.assignee_id === filterUserId)
    const allCards = filtered.map(erpToCard).filter(c => matchesQuery(c, debouncedSearch))
    const statusMap: Record<string, string> = {}
    for (const l of filtered) statusMap[l.id] = normalizeErpStatus(l.status)
    const cols = ERP_STATUS_ORDER.map(s => ({
      id: s, label: ERP_STATUS_LABELS[s], color: ERP_STATUS_COLORS[s],
    }))
    const updater = async (id: string, newStatus: string) => {
      if (!isErpStatus(newStatus)) return
      await erp.updateStatus(id, newStatus as ErpStatus)
    }
    return { cards: allCards, leadStatus: statusMap, columns: cols, onStatusChange: updater }
  }, [tab, sw, erp, filterUserId, debouncedSearch])

  const handleLeadClick = (id: string) => {
    if (tab === 'site_web') navigate(routes.clientDetail(id))
    else navigate(routes.crmErpLead(id))
  }

  /**
   * Convertit un lead signé en projet V3.
   * Récupère les infos depuis le lead source (budget, responsable) puis crée
   * un `projects_v2` minimal. Le lead n'est pas archivé — conversion non destructive.
   */
  const handleConvertLead = async (card: LeadCardData) => {
    setConvertingId(card.id)
    try {
      const payloadName = card.company || card.contact || 'Nouveau projet'
      let payloadBudget: number | null = card.amount
      let assignedTo: string | null = null
      let assignedName: string | null = card.assignee

      if (tab === 'site_web') {
        const lead = sw.leads.find(l => l.id === card.id)
        if (lead) {
          payloadBudget = lead.project_price ?? card.amount
          assignedTo = lead.assigned_to ?? null
          assignedName = lead.assigned_user?.name ?? lead.assigned_user_name ?? card.assignee
        }
      } else {
        const lead = erp.leads.find(l => l.id === card.id)
        if (lead) {
          assignedTo = lead.assignee_id ?? null
          assignedName = lead.assignee?.name ?? card.assignee
        }
      }

      const res = await convert({
        name: payloadName,
        client_name: card.company || card.contact,
        assigned_to: assignedTo,
        assigned_name: assignedName,
        budget: payloadBudget,
        source: card.source,
      })

      if (res.success && res.projectId) {
        toast.success('Lead converti en projet ✓', {
          action: {
            label: 'Ouvrir le projet',
            onClick: () => navigate(`/projets-v3-preview/${res.projectId}`),
          },
        })
      } else {
        toast.error(`Conversion échouée : ${res.error ?? 'erreur inconnue'}`)
      }
    } finally {
      setConvertingId(null)
    }
  }

  const isLeadSigned = (leadId: string): boolean => {
    const status = leadStatus[leadId]
    return status === 'signe' || status === 'signes'
  }

  const conversionHandler = (card: LeadCardData) => { void handleConvertLead(card) }

  return (
    <div className="min-h-full bg-[#0a0814] text-[#ede9fe] p-8 max-w-[1600px] mx-auto">
      <LeadsV3Header
        leadCount={cards.length}
        tab={tab}
        onTabChange={setTab}
        filterUserId={filterUserId}
        onFilterUserChange={setFilterUserId}
        users={users}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewLead={() => toast.info('Création de lead : à venir en V3')}
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-6 w-6 animate-spin text-[#A78BFA]" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[40vh] text-[13px] text-red-400">
          Erreur de chargement : {error}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <p className="text-[14px] text-[#9ca3af]">Aucun lead pour le moment.</p>
          <p className="text-[12px] text-[#6b7280] mt-1">
            Essayez de retirer les filtres ou de créer un nouveau lead.
          </p>
        </div>
      ) : (
        <VariantA_Kanban
          columns={columns}
          leadStatus={leadStatus}
          leads={cards}
          onLeadClick={handleLeadClick}
          onStatusChange={onStatusChange}
          onConvert={conversionHandler}
          isLeadSigned={isLeadSigned}
          convertingId={convertingId}
        />
      )}
    </div>
  )
}
