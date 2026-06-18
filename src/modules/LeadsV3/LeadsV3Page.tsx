import { useState, useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase, v2 } from '@/lib/supabase'
import { routes } from '@/lib/routes'
import { LeadsV3Header, type LeadsV3Tab } from './components/LeadsV3Header'
import { VariantA_Kanban } from './variants/VariantA_Kanban'
import { useLeadsV3SiteWeb } from './hooks/useLeadsV3SiteWeb'
import { useLeadsV3Erp } from './hooks/useLeadsV3Erp'
import { useLeadsV3Qualification, type QualificationLead } from './hooks/useLeadsV3Qualification'
import { useConvertLeadToProject } from './hooks/useConvertLeadToProject'
import { useConvertQualifLead } from './hooks/useConvertQualifLead'
import { useLeadsV3Cards } from './hooks/useLeadsV3Cards'
import type { LeadCardData } from './components/LeadCardV3'
import { QualificationLeadDetailsSheet } from './components/QualificationLeadDetailsSheet'
import { ConvertLeadModal } from './components/ConvertLeadModal'
import { getProjectAssignees } from '@/modules/ProjectsV3/utils/projectAssignees'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { usePropulspaceDeletion } from '@/modules/EspaceClient/admin/hooks/usePropulspaceDeletion'
import type { LeadSortMode } from './utils/leadAdapters'

type ConvertTarget = { id: string; name: string; type: 'site_web' | 'erp' | 'qualification' }

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
  const [sortMode, setSortMode] = useState<LeadSortMode>('relance_asc')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounced(searchQuery, 300)
  const [users, setUsers] = useState<{ id: string; name: string; email: string | null }[]>([])

  const setTab = (t: LeadsV3Tab) => { setTabRaw(t); window.localStorage.setItem(TAB_KEY, t) }

  const sw = useLeadsV3SiteWeb()
  const erp = useLeadsV3Erp()
  const qualif = useLeadsV3Qualification(tab === 'site_web' ? 'site' : 'erp')
  const { convert } = useConvertLeadToProject()
  const { convert: convertQualif } = useConvertQualifLead()
  const { deleteQualifLead } = usePropulspaceDeletion()
  const [selectedQualif, setSelectedQualif] = useState<QualificationLead | null>(null)
  const [leadToDelete, setLeadToDelete] = useState<LeadCardData | null>(null)
  const [leadToConvert, setLeadToConvert] = useState<ConvertTarget | null>(null)
  const [converting, setConverting] = useState(false)

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
    tab, sw, erp, qualifLeads: qualif.leads, qualifIdSet, filterUserId, debouncedSearch, sortMode,
  })

  const handleLeadClick = (id: string) => {
    const qualifLead = qualif.leads.find(l => l.id === id)
    if (qualifLead) { setSelectedQualif(qualifLead); return }
    if (tab === 'site_web') navigate(routes.clientDetail(id))
    else navigate(routes.crmErpLead(id))
  }

  /** Détermine la source d'une carte (qualif / site web / erp) et ouvre le modal de conversion. */
  const requestConvert = (card: LeadCardData) => {
    const type: ConvertTarget['type'] = qualifIdSet.has(card.id)
      ? 'qualification'
      : tab === 'site_web' ? 'site_web' : 'erp'
    setLeadToConvert({ id: card.id, name: card.company || card.contact || 'Lead sans nom', type })
  }

  const isLeadSigned = (leadId: string): boolean => {
    if (qualifIdSet.has(leadId)) return false
    const status = leadStatus[leadId]
    return status === 'signe' || status === 'signes'
  }

  /**
   * Convertit le lead ciblé en projet via la RPC unifiée SP2, puis le rend
   * ACTIF (statut in_progress) et l'assigne au responsable choisi dans le modal.
   * Conversion non destructive ; le lead quitte le board (filtre converted).
   */
  const confirmConvert = async (assignedToId: string | null) => {
    const target = leadToConvert
    if (!target) return
    setConverting(true)
    try {
      let projectId: string | undefined
      if (target.type === 'qualification') {
        const qlead = qualif.leads.find(l => l.id === target.id)
        if (!qlead) throw new Error('Lead introuvable')
        const res = await convertQualif(qlead)
        if (!res.success || !res.projectId) throw new Error(res.error ?? 'Conversion échouée')
        projectId = res.projectId
      } else {
        const res = await convert({ leadId: target.id, leadType: target.type })
        if (!res.success || !res.projectId) throw new Error(res.error ?? 'Conversion échouée')
        projectId = res.projectId
      }
      // Rendre actif + assigner (best-effort : le projet est créé même si ceci échoue).
      const { error: updErr } = await v2
        .from('projects')
        .update({ status: 'in_progress', assigned_to: assignedToId })
        .eq('id', projectId)
      if (updErr) console.warn('[convert] activation/assignation échouée:', updErr)

      if (target.type === 'qualification') await qualif.refetch()
      else if (target.type === 'site_web') await sw.refetch()
      else await erp.refetch()

      const pid = projectId
      toast.success('Lead converti en projet actif ✓', {
        action: { label: 'Ouvrir le projet', onClick: () => navigate(`/projets-v3-preview/${pid}`) },
      })
      setLeadToConvert(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Conversion échouée')
    } finally {
      setConverting(false)
    }
  }

  const leadToDeleteName = leadToDelete?.company || leadToDelete?.contact || 'Lead sans nom'

  /**
   * Suppression définitive du lead selon sa source : qualif (RPC admin),
   * site web (`contacts`) ou ERP (`crmerp_leads`). Lève en cas d'échec pour
   * que le dialog reste ouvert (le toast d'erreur informe l'utilisateur).
   */
  const confirmDeleteLead = async () => {
    const card = leadToDelete
    if (!card) return
    try {
      if (qualifIdSet.has(card.id)) {
        const res = await deleteQualifLead(card.id)
        if (!res.success) throw new Error(res.error ?? 'Échec de la suppression')
        await qualif.refetch()
      } else if (tab === 'site_web') {
        await sw.deleteLead(card.id)
      } else {
        await erp.deleteLead(card.id)
      }
      toast.success('Lead supprimé')
      setLeadToDelete(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Échec de la suppression')
      throw err
    }
  }

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
        sortMode={sortMode}
        onSortModeChange={setSortMode}
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
          onConvert={requestConvert}
          isLeadSigned={isLeadSigned}
          onDelete={setLeadToDelete}
          onConvertMenu={requestConvert}
        />
      )}

      <QualificationLeadDetailsSheet
        lead={selectedQualif}
        open={selectedQualif !== null}
        onOpenChange={(open) => { if (!open) setSelectedQualif(null) }}
        onActionComplete={() => qualif.refetch()}
        onRequestConvert={(lead) => {
          setSelectedQualif(null)
          setLeadToConvert({
            id: lead.id,
            name: lead.full_name || lead.company_name || lead.email,
            type: 'qualification',
          })
        }}
      />

      <ConvertLeadModal
        open={leadToConvert !== null}
        onOpenChange={(open) => { if (!open) setLeadToConvert(null) }}
        leadName={leadToConvert?.name ?? ''}
        assignees={leadAssignees}
        converting={converting}
        onConfirm={confirmConvert}
      />

      <ConfirmDeleteDialog
        open={leadToDelete !== null}
        onOpenChange={(open) => { if (!open) setLeadToDelete(null) }}
        title="Supprimer ce lead ?"
        description={`« ${leadToDeleteName} » sera supprimé définitivement. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={confirmDeleteLead}
      />
    </div>
  )
}
