# Client Portal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refonte complète du portail client (`/portal/:token`) avec un design premium — hero violet avec stats, timeline des phases, checklist redessinée, sidebar contact/infos, et facturation améliorée.

**Architecture:** Deux fichiers touchés uniquement — `useClientPortal.ts` pour enrichir la requête avec `client_id` + données client, et `ClientPortalPage.tsx` pour le rewrite complet du rendu. Les données client (email, téléphone) sont fetchées depuis la table `clients` via une seconde requête anon. Le calcul des phases se fait côté client en groupant les items de checklist par leur champ `phase`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, Supabase anon client, lucide-react

---

## Fichiers

- Modify: `src/modules/ClientPortal/useClientPortal.ts` — ajouter fetch client contact + ai_summary + budget dans la sélection
- Modify: `src/modules/ClientPortal/ClientPortalPage.tsx` — rewrite complet du rendu

---

### Task 1 — Enrichir `useClientPortal` avec contact client et AI summary

**Files:**
- Modify: `src/modules/ClientPortal/useClientPortal.ts`

- [ ] **Step 1 : Ajouter `ClientContact` à l'interface `PortalData`**

Dans `useClientPortal.ts`, ajouter après l'interface `PortalInvoice` :

```typescript
export interface PortalClientContact {
  name: string | null
  email: string | null
  phone: string | null
  city: string | null
  sector: string | null
}
```

Et modifier `PortalData` :

```typescript
export interface PortalData {
  project: Pick<
    ProjectV2,
    | 'id'
    | 'name'
    | 'client_name'
    | 'status'
    | 'progress'
    | 'completion_score'
    | 'next_action_label'
    | 'next_action_due'
    | 'presta_type'
    | 'start_date'
    | 'end_date'
    | 'budget'
    | 'ai_summary'
  >
  checklist: Pick<ChecklistItemV2, 'id' | 'title' | 'phase' | 'status'>[]
  invoices: PortalInvoice[]
  contact: PortalClientContact | null
}
```

- [ ] **Step 2 : Enrichir la requête `projects_v2` et ajouter fetch contact**

Remplacer la fonction `fetchPortalData` dans `useClientPortal.ts` :

```typescript
const fetchPortalData = useCallback(async (token: string) => {
  setLoading(true)
  setError(null)
  setData(null)

  // 1. Projet par token
  const { data: project, error: projectError } = await supabaseAnon
    .from('projects_v2')
    .select('id, name, client_name, client_id, status, progress, completion_score, next_action_label, next_action_due, presta_type, start_date, end_date, budget, ai_summary')
    .eq('portal_token', token)
    .eq('portal_enabled', true)
    .single()

  if (projectError || !project) {
    setError('Lien invalide ou expiré.')
    setLoading(false)
    return
  }

  // 2. Checklist (tâches principales seulement)
  const { data: checklist } = await supabaseAnon
    .from('checklist_items_v2')
    .select('id, title, phase, status')
    .eq('project_id', project.id)
    .is('parent_task_id', null)
    .order('sort_order', { ascending: true })

  // 3. Factures (envoyées, payées, en retard)
  const { data: invoices } = await supabaseAnon
    .from('project_invoices_v2')
    .select('id, label, amount, status, date, due_date')
    .eq('project_id', project.id)
    .in('status', ['sent', 'paid', 'overdue'])
    .order('date', { ascending: false })

  // 4. Contact client (si client_id présent)
  let contact: PortalClientContact | null = null
  if (project.client_id) {
    const { data: clientData } = await supabaseAnon
      .from('clients')
      .select('full_name, email, phone, city, sector')
      .eq('id', project.client_id)
      .single()
    if (clientData) {
      contact = {
        name: clientData.full_name ?? null,
        email: clientData.email ?? null,
        phone: clientData.phone ?? null,
        city: clientData.city ?? null,
        sector: clientData.sector ?? null,
      }
    }
  }

  setData({
    project: project as PortalData['project'],
    checklist: (checklist ?? []) as PortalData['checklist'],
    invoices: (invoices ?? []) as PortalInvoice[],
    contact,
  })
  setLoading(false)
}, [])
```

- [ ] **Step 3 : Vérifier que TypeScript compile sans erreur**

```bash
npm run build 2>&1 | grep -E "ClientPortal|error TS" | head -20
```

Expected : aucune erreur sur `ClientPortal`.

- [ ] **Step 4 : Commit**

```bash
git add src/modules/ClientPortal/useClientPortal.ts
git commit -m "feat(portal): enrichir hook avec contact client, budget, ai_summary"
```

---

### Task 2 — Rewrite complet de `ClientPortalPage.tsx`

**Files:**
- Modify: `src/modules/ClientPortal/ClientPortalPage.tsx`

- [ ] **Step 1 : Remplacer les imports et helpers en haut du fichier**

Remplacer **tout le contenu** de `ClientPortalPage.tsx` par ce qui suit (étapes 2 à 6 décrivent le fichier complet section par section — écrire d'un coup) :

```typescript
// src/modules/ClientPortal/ClientPortalPage.tsx
import React, { useEffect, useMemo } from 'react'
import { AlertCircle, Clock, CheckCircle2, Circle, Timer } from 'lucide-react'
import { useClientPortal } from './useClientPortal'
import type { ChecklistItemV2 } from '@/types/project-v2'
```

- [ ] **Step 2 : Helpers et constantes**

```typescript
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

// Grouper la checklist par phase, calculer done/total par phase
function groupByPhase(checklist: { id: string; title: string; phase: string | null; status: ChecklistItemV2['status'] }[]) {
  const map = new Map<string, { title: string; items: typeof checklist }>()
  for (const item of checklist) {
    const key = item.phase ?? 'Général'
    if (!map.has(key)) map.set(key, { title: key, items: [] })
    map.get(key)!.items.push(item)
  }
  return Array.from(map.values())
}

function phaseStatus(items: { status: ChecklistItemV2['status'] }[]): 'done' | 'active' | 'todo' {
  const done = items.every(i => i.status === 'done')
  if (done) return 'done'
  const started = items.some(i => i.status === 'done' || i.status === 'in_progress')
  return started ? 'active' : 'todo'
}
```

- [ ] **Step 3 : Composant principal — squelette + états loading/error**

```typescript
interface ClientPortalPageProps { token: string }

export function ClientPortalPage({ token }: ClientPortalPageProps) {
  const { data, loading, error, fetchPortalData } = useClientPortal()

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    fetchPortalData(token)
    return () => { document.documentElement.classList.add('dark') }
  }, [token, fetchPortalData])

  const phases = useMemo(
    () => (data ? groupByPhase(data.checklist) : []),
    [data]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Chargement de votre espace projet…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-slate-100">
      <Header project={project} statusStyle={statusStyle} />
      <Hero project={project} doneTasks={doneTasks} totalTasks={checklist.length} daysLeft={daysLeft} />
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
```

- [ ] **Step 4 : Sous-composant `Header`**

```typescript
function Header({
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
        <div className={`flex items-center gap-1.5 ${statusStyle.bg} ${statusStyle.text} border border-current/20 rounded-full px-3 py-1 text-xs font-semibold`}>
          <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {STATUS_LABELS[project.status] ?? project.status}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 5 : Sous-composant `Hero`**

```typescript
function Hero({
  project,
  doneTasks,
  totalTasks,
  daysLeft,
}: {
  project: { name: string; client_name: string | null; progress: number; completion_score: number; start_date: string | null; end_date: string | null }
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
            value={daysLeft !== null ? (daysLeft > 0 ? String(daysLeft) : 'Expiré') : '—'}
            fill={null}
            sub={project.end_date ? `Livraison · ${formatDate(project.end_date, { day: 'numeric', month: 'short' })}` : undefined}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, fill, sub }: { label: string; value: string; fill: number | null; sub?: string }) {
  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
      <p className="text-indigo-200 text-[10px] font-semibold tracking-widest uppercase mb-1">{label}</p>
      <p className="text-white text-3xl font-extrabold leading-none">{value}</p>
      {fill !== null && (
        <div className="mt-2 h-1 bg-white/20 rounded-full">
          <div className="h-full bg-gradient-to-r from-indigo-300 to-white rounded-full transition-all" style={{ width: `${fill}%` }} />
        </div>
      )}
      {sub && <p className="text-indigo-300 text-[11px] mt-2">{sub}</p>}
    </div>
  )
}
```

- [ ] **Step 6 : Sous-composant `LeftColumn` (next action + phases + checklist + factures)**

```typescript
function LeftColumn({
  project,
  phases,
  checklist,
  invoices,
}: {
  project: { next_action_label: string | null; next_action_due: string | null }
  phases: ReturnType<typeof groupByPhase>
  checklist: { id: string; title: string; phase: string | null; status: ChecklistItemV2['status'] }[]
  invoices: import('./useClientPortal').PortalInvoice[]
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
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs z-10 border-2 flex-shrink-0
                        ${st === 'done'   ? 'bg-emerald-100 text-emerald-600 border-emerald-300' : ''}
                        ${st === 'active' ? 'bg-violet-100 text-violet-700 border-violet-400 ring-2 ring-violet-200' : ''}
                        ${st === 'todo'   ? 'bg-slate-50 text-slate-400 border-slate-200' : ''}
                      `}>
                        {st === 'done' ? '✓' : st === 'active' ? '◉' : '○'}
                      </div>
                      {i < phases.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                    </div>
                    <div className={`pb-5 flex-1 ${i === phases.length - 1 ? 'pb-0' : ''}`}>
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
```

- [ ] **Step 7 : Sous-composant `RightSidebar`**

```typescript
function RightSidebar({
  project,
  contact,
}: {
  project: { presta_type: string | null; start_date: string | null; end_date: string | null; budget: number | null; ai_summary: { situation: string; action: string; milestone: string } | null }
  contact: import('./useClientPortal').PortalClientContact | null
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Contact */}
      {contact && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200">
            <p className="text-sm font-bold text-slate-900">{contact.name ?? 'Client'}</p>
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
            {contact.city && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="text-base">📍</span> {contact.city}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Infos projet */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Détails du projet</p>
        <div className="flex flex-col gap-2.5">
          {project.presta_type && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Prestation</span>
              <span className="text-xs font-semibold text-slate-900">{project.presta_type}</span>
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

      {/* Message IA ou équipe */}
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
```

- [ ] **Step 8 : Vérifier le build**

```bash
npm run build 2>&1 | grep -E "error TS|ClientPortal" | head -30
```

Expected : aucune erreur sur `ClientPortal`. Des erreurs TS pre-existantes dans d'autres fichiers (UserSelector, ActivityCard) sont acceptables.

- [ ] **Step 9 : Vérifier dans le navigateur**

Ouvrir : `http://localhost:5173/portal/01059c08-6bd0-4197-b2d1-473af0db4785`

Vérifier :
- Hero violet avec 4 stats
- Prochaine étape visible (si renseignée en BD)
- Phases groupées depuis la checklist
- Checklist avec icônes ✅/⏳/○
- Factures si présentes
- Sidebar contact + infos projet
- Résumé IA si `ai_summary` renseigné

- [ ] **Step 10 : Commit final**

```bash
git add src/modules/ClientPortal/ClientPortalPage.tsx
git commit -m "feat(portal): refonte complète portail client — hero stats, phases, sidebar contact"
```

---

## Self-Review

**Spec coverage :**
- ✅ Hero violet avec 4 stats → `Hero` + `StatCard`
- ✅ Timeline des phases → `LeftColumn` phases section (groupByPhase)
- ✅ Checklist redessinée avec icônes → `LeftColumn` checklist
- ✅ Sidebar contact + infos projet → `RightSidebar`
- ✅ Résumé IA ou message équipe → `RightSidebar` (conditionnel sur `ai_summary`)
- ✅ Facturation → `LeftColumn` invoices
- ✅ Header sticky avec logo Propul'SEO → `Header`

**Placeholder scan :** aucun TBD/TODO.

**Type consistency :**
- `groupByPhase` retourne `{ title: string; items: ChecklistItemV2[] }[]` — utilisé identiquement dans `LeftColumn`
- `PortalClientContact` définie en Task 1 — consommée dans `RightSidebar` via `contact`
- `formatDate` définie une fois, utilisée dans Hero, LeftColumn, RightSidebar
- `phaseStatus` définie une fois, appelée dans LeftColumn phases loop
