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
import { useLeadsV3Qualification, type QualificationLead } from './hooks/useLeadsV3Qualification'
import { useConvertLeadToProject } from './hooks/useConvertLeadToProject'
import { useLeadsV3Cards } from './hooks/useLeadsV3Cards'
import type { LeadCardData } from './components/LeadCardV3'
import { QualificationLeadDetailsSheet } from './components/QualificationLeadDetailsSheet'
import { getProjectAssignees } from '@/modules/ProjectsV3/utils/projectAssignees'

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
  const [users, setUsers] = useState<{ id: string; name: string; email: string | null }[]>([])

  const setTab = (t: LeadsV3Tab) => { setTabRaw(t); window.localStorage.setItem(TAB_KEY, t) }

  const sw = useLeadsV3SiteWeb()
  const erp = useLeadsV3Erp()
  const qualif = useLeadsV3Qualification(tab === 'site_web' ? 'site' : 'erp')
  const { convert } = useConvertLeadToProject()
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [selectedQualif, setSelectedQualif] = useState<QualificationLead | null>(null)

  useEffect(() => {
    supabase.from('users').select('id, name, email').eq('is_active', true).order('name').then(({ data, error }) => {
      if (error) { console.error('[LeadsV3] users fetch failed:', error); return }
      if (data) setUsers(data as { id: string; name: string; email: string | null }[])
    })
  }, [])

  const leadAssignees = useMemo(() => getProjectAssignees(users), [users])

  const loading = (tab === 'site_web' ? sw.loading : erp.loading) || qualif.loading
  const error = tab === 'site_web' ? sw.error : erp.error

  const qualifIdSet = useMemo(() => new Set(qualif.leads.map(l => l.id)), [qualif.leads])

  const { cards, leadStatus, columns, onStatusChange } = useLeadsV3Cards({
    tab, sw, erp, qualifLeads: qualif.leads, qualifIdSet, filterUserId, debouncedSearch,
  })

  const handleLeadClick = (id: string) => {
    const qualifLead = qualif.leads.find(l => l.id === id)
    if (qualifLead) { setSelectedQualif(qualifLead); return }
    if (tab === 'site_web') navigate(routes.clientDetail(id))
    else navigate(routes.crmErpLead(id))
  }

  /**
   * Convertit un lead signé en projet V3 via la RPC unifiée SP2.
   * Le mapping des champs (nom, budget, responsable…) est fait côté serveur
   * depuis la table source. Le lead n'est pas archivé — conversion non destructive.
   */
  const handleConvertLead = async (card: LeadCardData) => {
    setConvertingId(card.id)
    try {
      // L'onglet courant détermine le pipeline source : site_web (contacts)
      // ou erp (crmerp_leads). La RPC lit la bonne table selon ce type.
      const leadType = tab === 'site_web' ? 'site_web' : 'erp'
      const res = await convert({ leadId: card.id, leadType })

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
    if (qualifIdSet.has(leadId)) return false
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
        users={leadAssignees}
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

      <QualificationLeadDetailsSheet
        lead={selectedQualif}
        open={selectedQualif !== null}
        onOpenChange={(open) => { if (!open) setSelectedQualif(null) }}
        onActionComplete={() => qualif.refetch()}
      />
    </div>
  )
}
