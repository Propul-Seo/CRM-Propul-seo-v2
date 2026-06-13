// src/modules/ClientPortal/ClientPortalPage.tsx
import { useEffect, useMemo } from 'react'
import { AlertCircle, Clock, CheckCircle2, Circle, Timer } from 'lucide-react'
import { useClientPortal } from './useClientPortal'
import type { PortalInvoice, PortalClientContact } from './useClientPortal'
import type { ChecklistItemV2 } from '@/types/project-v2'

const STATUS_LABELS: Record<string, string> = {
  prospect: 'Prospect',
  brief_received: 'Brief reçu',
  quote_sent: 'Devis envoyé',
  in_progress: 'En cours',
  review: 'En révision',
  delivered: 'Livré',
  maintenance: 'Maintenance',
  on_hold: 'En pause',
  closed: 'Clôturé',
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  prospect:      { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  brief_received:{ bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500' },
  quote_sent:    { bg: 'bg-yellow-50',  text: 'text-yellow-700', dot: 'bg-yellow-500' },
  in_progress:   { bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500' },
  review:        { bg: 'bg-purple-50',  text: 'text-purple-700', dot: 'bg-purple-500' },
  delivered:     { bg: 'bg-teal-50',    text: 'text-teal-700',   dot: 'bg-teal-500' },
  maintenance:   { bg: 'bg-teal-50',    text: 'text-teal-700',   dot: 'bg-teal-400' },
  on_hold:       { bg: 'bg-orange-50',  text: 'text-orange-700', dot: 'bg-orange-500' },
  closed:        { bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400' },
}

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  sent:    { label: 'Envoyée',   cls: 'text-indigo-600' },
  paid:    { label: 'Payée',     cls: 'text-green-600' },
  overdue: { label: 'En retard', cls: 'text-red-600' },
}

function formatDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', opts ?? { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

type ChecklistItem = Pick<ChecklistItemV2, 'id' | 'title' | 'phase' | 'status'>

function groupByPhase(checklist: ChecklistItem[]) {
  const map = new Map<string, { title: string; items: ChecklistItem[] }>()
  for (const item of checklist) {
    const key = item.phase ?? 'Général'
    if (!map.has(key)) map.set(key, { title: key, items: [] })
    map.get(key)!.items.push(item)
  }
  return Array.from(map.values())
}

function phaseStatus(items: { status: ChecklistItemV2['status'] }[]): 'done' | 'active' | 'todo' {
  if (items.every(i => i.status === 'done')) return 'done'
  if (items.some(i => i.status === 'done' || i.status === 'in_progress')) return 'active'
  return 'todo'
}

// ===== PORTAL HEADER =====

function PortalHeader({
  project,
  statusStyle,
}: {
  project: { name: string; status: string }
  statusStyle: { bg: string; text: string; dot: string }
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-md">
            Propul'SEO
          </span>
          <div className="w-px h-5 bg-slate-200" />
          <span className="text-sm font-bold text-slate-900">{project.name}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${statusStyle.bg} ${statusStyle.text} border border-slate-200 rounded-full px-3 py-1 text-xs font-semibold`}>
          <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {STATUS_LABELS[project.status] ?? project.status}
        </div>
      </div>
    </header>
  )
}

// ===== STAT CARD =====

function StatCard({ label, value, fill, sub }: { label: string; value: string; fill: number | null; sub?: string }) {
  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
      <p className="text-indigo-200 text-[10px] font-semibold tracking-widest uppercase mb-1">{label}</p>
      <p className="text-white text-3xl font-extrabold leading-none">{value}</p>
      {fill !== null && (
        <div className="mt-2 h-1 bg-white/20 rounded-full">
          <div className="h-full bg-gradient-to-r from-indigo-300 to-white rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, fill))}%` }} />
        </div>
      )}
      {sub && <p className="text-indigo-300 text-[11px] mt-2">{sub}</p>}
    </div>
  )
}

// ===== PORTAL HERO =====

function PortalHero({
  project,
  doneTasks,
  totalTasks,
  daysLeft,
}: {
  project: { name: string; client_name?: string | null; progress: number; completion_score: number; start_date?: string | null; end_date: string | null }
  doneTasks: number
  totalTasks: number
  daysLeft: number | null
}) {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 sm:px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-indigo-200 text-[11px] font-semibold tracking-widest uppercase mb-1">Espace client</p>
            <h1 className="text-white text-3xl font-extrabold">{project.name}</h1>
            {project.client_name && (
              <p className="text-indigo-300 text-sm mt-1">{project.client_name}</p>
            )}
          </div>
          <div className="text-right text-sm">
            {project.start_date && (
              <p className="text-indigo-300">Début · {formatDate(project.start_date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
            {project.end_date && (
              <p className="text-white font-semibold mt-0.5">Fin prévue · {formatDate(project.end_date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Avancement" value={`${project.progress}%`} fill={project.progress} />
          <StatCard label="Tâches" value={`${doneTasks}/${totalTasks}`} fill={totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0} />
          <StatCard label="Complétude" value={`${project.completion_score}%`} fill={project.completion_score} />
          <StatCard
            label="Jours restants"
            value={daysLeft !== null ? (daysLeft > 0 ? String(daysLeft) : daysLeft === 0 ? "Aujourd'hui" : 'Livré') : '—'}
            fill={null}
            sub={project.end_date ? `Livraison · ${formatDate(project.end_date, { day: 'numeric', month: 'short' })}` : undefined}
          />
        </div>
      </div>
    </div>
  )
}

// ===== LEFT COLUMN =====

type ProjectForLeft = {
  next_action_label: string | null
  next_action_due: string | null
}

function LeftColumn({
  project,
  phases,
  checklist,
  invoices,
}: {
  project: ProjectForLeft
  phases: ReturnType<typeof groupByPhase>
  checklist: ChecklistItem[]
  invoices: PortalInvoice[]
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Prochaine étape */}
      {project.next_action_label && (
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-violet-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 min-w-[44px] bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
            🎯
          </div>
          <div>
            <p className="text-[10px] font-bold text-violet-600 tracking-widest uppercase mb-1">Prochaine étape</p>
            <p className="text-base font-bold text-slate-800">{project.next_action_label}</p>
            {project.next_action_due && (
              <p className="text-xs text-violet-600 font-medium mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Avant le {formatDate(project.next_action_due)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Phases */}
      {phases.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">📍</div>
            <h2 className="text-sm font-bold text-slate-900">Avancement par phase</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-0">
              {phases.map((phase, i) => {
                const st = phaseStatus(phase.items)
                const done = phase.items.filter(x => x.status === 'done').length
                return (
                  <div key={phase.title} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={[
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs z-10 border-2 flex-shrink-0',
                        st === 'done'   ? 'bg-emerald-100 text-emerald-600 border-emerald-300' : '',
                        st === 'active' ? 'bg-violet-100 text-violet-700 border-violet-400 ring-2 ring-violet-200' : '',
                        st === 'todo'   ? 'bg-slate-50 text-slate-400 border-slate-200' : '',
                      ].join(' ')}>
                        <span className="m-auto">{st === 'done' ? '✓' : st === 'active' ? '◉' : '○'}</span>
                      </div>
                      {i < phases.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1 min-h-[16px]" />}
                    </div>
                    <div className={`pb-5 flex-1 ${i === phases.length - 1 ? 'pb-1' : ''}`}>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${st === 'done' ? 'text-slate-400' : 'text-slate-800'}`}>
                          {phase.title}
                        </p>
                        {st === 'active' && (
                          <span className="bg-violet-100 text-violet-700 text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-md">EN COURS</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{done}/{phase.items.length} tâches</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Checklist */}
      {checklist.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-sm">✅</div>
              <h2 className="text-sm font-bold text-slate-900">Checklist projet</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
              {checklist.filter(c => c.status === 'done').length} / {checklist.length}
            </span>
          </div>
          <ul>
            {checklist.map((item, i) => (
              <li
                key={item.id}
                className={`flex items-center gap-3 px-5 py-2.5 ${i < checklist.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                {item.status === 'done'        && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                {item.status === 'in_progress' && <Timer className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                {item.status === 'todo'        && <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                <span className={`text-sm flex-1 ${item.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {item.title}
                </span>
                {item.status === 'in_progress' && (
                  <span className="text-[10px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded-md">En cours</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Factures */}
      {invoices.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center text-sm">🧾</div>
            <h2 className="text-sm font-bold text-slate-900">Facturation</h2>
          </div>
          <ul>
            {invoices.map((inv, i) => {
              const s = INVOICE_STATUS[inv.status] ?? { label: inv.status, cls: 'text-slate-400' }
              return (
                <li key={inv.id} className={`flex items-center justify-between px-5 py-3.5 ${i < invoices.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📄</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{inv.label}</p>
                      {inv.date && <p className="text-xs text-slate-400 mt-0.5">{formatDate(inv.date)}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">
                      {inv.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className={`text-xs font-semibold mt-0.5 ${s.cls}`}>{s.label}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// ===== RIGHT SIDEBAR =====

type ProjectForSidebar = {
  presta_type: string[] | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  ai_summary: { situation: string; action: string; milestone: string } | null
}

function RightSidebar({
  project,
  contact,
}: {
  project: ProjectForSidebar
  contact: PortalClientContact | null
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Contact */}
      {contact && (contact.name || contact.email || contact.phone) && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200">
            {contact.name && <p className="text-sm font-bold text-slate-900">{contact.name}</p>}
            {contact.sector && <p className="text-xs text-slate-500 mt-0.5">{contact.sector}</p>}
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            {contact.email && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="text-base">📧</span> {contact.email}
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="text-base">📞</span> {contact.phone}
              </div>
            )}
            {contact.address && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="text-base">📍</span> {contact.address}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Infos projet */}
      {(project.presta_type?.length || project.start_date || project.end_date || project.budget) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Détails du projet</p>
          <div className="flex flex-col gap-2.5">
            {project.presta_type && project.presta_type.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Prestation</span>
                <span className="text-xs font-semibold text-slate-900">{project.presta_type.join(', ')}</span>
              </div>
            )}
            {project.start_date && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Démarrage</span>
                <span className="text-xs font-semibold text-slate-900">{formatDate(project.start_date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
            {project.end_date && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Livraison</span>
                <span className="text-xs font-semibold text-slate-900">{formatDate(project.end_date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
            {project.budget != null && project.budget > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Budget</span>
                <span className="text-xs font-semibold text-slate-900">
                  {project.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Résumé IA */}
      {project.ai_summary && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Résumé du projet</p>
          <p className="text-xs text-slate-600 leading-relaxed">{project.ai_summary.situation}</p>
          {project.ai_summary.milestone && (
            <div className="mt-3 bg-violet-50 border border-violet-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wide mb-1">Prochain jalon</p>
              <p className="text-xs text-violet-800 font-medium">{project.ai_summary.milestone}</p>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">P</div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Équipe Propul'SEO</p>
              <p className="text-[10px] text-slate-400">Mis à jour automatiquement</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== MAIN COMPONENT =====

interface ClientPortalPageProps { token: string }

export function ClientPortalPage({ token }: ClientPortalPageProps) {
  const { data, loading, error, fetchPortalData } = useClientPortal()

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
    document.body.style.background = '#ffffff'
    fetchPortalData(token)
    return () => {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
      document.body.style.background = ''
    }
  }, [token, fetchPortalData])

  const phases = useMemo(
    () => (data ? groupByPhase(data.checklist) : []),
    [data?.checklist]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Chargement de votre espace projet…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Lien invalide</h1>
          <p className="text-slate-500">{error ?? 'Ce lien est invalide ou a été désactivé.'}</p>
        </div>
      </div>
    )
  }

  const { project, checklist, invoices, contact } = data
  const doneTasks = checklist.filter(c => c.status === 'done').length
  const statusStyle = STATUS_COLORS[project.status] ?? STATUS_COLORS.in_progress
  const daysLeft = daysUntil(project.end_date)

  return (
    <div className="min-h-screen bg-white">
      <PortalHeader project={project} statusStyle={statusStyle} />
      <PortalHero project={project} doneTasks={doneTasks} totalTasks={checklist.length} daysLeft={daysLeft} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <LeftColumn project={project} phases={phases} checklist={checklist} invoices={invoices} />
        <RightSidebar project={project} contact={contact} />
      </main>
      <footer className="max-w-5xl mx-auto px-6 pb-10 flex items-center justify-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-indigo-600">Propul'SEO</span>
        <span>·</span>
        <span>Vue partagée en lecture seule</span>
        <span>·</span>
        <span>🔒 Accès sécurisé</span>
      </footer>
    </div>
  )
}
