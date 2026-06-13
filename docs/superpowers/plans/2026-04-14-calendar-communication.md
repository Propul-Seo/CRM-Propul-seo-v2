# Calendrier Communication Premium — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Remplacer `CommCalendarView.tsx` par un `CommTaskBoard` premium à 3 vues (Projets / Mois / Semaine) avec drag & drop, filtres et modal de création/édition.

**Architecture :** Composants custom (pas FullCalendar) pour contrôle total du DnD. `@dnd-kit/core` gère le drag & drop dans les 3 vues. Les données sont mockées (`useState`) en attendant Supabase. Tout vit dans `CommunicationManager/components/CommTaskBoard/`.

**Tech Stack :** React 18, TypeScript, Tailwind CSS, `@dnd-kit/core` ^6, `@dnd-kit/utilities` ^3, shadcn/ui (Dialog, Select), Lucide icons.

---

## Fichiers impactés

| Action | Chemin |
|--------|--------|
| Modifier | `src/types/project-v2.ts` — ajouter `CommTask`, `CommTaskStatus`, `CommTaskPriority` |
| Créer | `src/modules/CommunicationManager/mocks/mockCommTasks.ts` |
| Créer | `src/modules/CommunicationManager/mocks/index.ts` — réexporter tout |
| Créer | `src/modules/CommunicationManager/components/CommTaskBoard/useCommTasks.ts` |
| Créer | `src/modules/CommunicationManager/components/CommTaskBoard/commTaskConfig.ts` |
| Créer | `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskCard.tsx` |
| Créer | `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskChip.tsx` |
| Créer | `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskModal.tsx` |
| Créer | `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskFilters.tsx` |
| Créer | `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskBoardProject.tsx` |
| Créer | `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskBoardMonth.tsx` |
| Créer | `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskBoardWeek.tsx` |
| Créer | `src/modules/CommunicationManager/components/CommTaskBoard/index.tsx` |
| Modifier | `src/modules/CommunicationManager/index.tsx` — remplacer `CommCalendarView` par `CommTaskBoard` |
| Supprimer | `src/modules/CommunicationManager/components/CommCalendarView.tsx` |

---

## Task 1 — Types + mock data

**Files :**
- Modify: `src/types/project-v2.ts`
- Create: `src/modules/CommunicationManager/mocks/mockCommTasks.ts`
- Modify: `src/modules/CommunicationManager/mocks/index.ts`

- [ ] **Step 1 : Ajouter les types `CommTask` dans `src/types/project-v2.ts`**

Ajouter à la fin du fichier (après `StatusComm`) :

```ts
// ===== TÂCHES COMMUNICATION =====

export type CommTaskStatus   = 'todo' | 'in_progress' | 'done'
export type CommTaskPriority = 'faible' | 'moyenne' | 'haute' | 'critique'

export interface CommTask {
  id: string
  title: string
  project_id: string
  project_name: string
  project_color: string
  status: CommTaskStatus
  priority: CommTaskPriority
  due_date: string        // 'YYYY-MM-DD'
  assigned_to?: string
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2 : Créer `src/modules/CommunicationManager/mocks/mockCommTasks.ts`**

```ts
import type { CommTask } from '../../../types/project-v2'

const now = new Date().toISOString()

export const MOCK_COMM_TASKS: CommTask[] = [
  { id: 'ct-001', title: 'Reel Instagram Docadoca', project_id: 'comm-003', project_name: 'Docadoca', project_color: '#818cf8', status: 'in_progress', priority: 'critique', due_date: '2026-04-01', created_at: now, updated_at: now },
  { id: 'ct-002', title: 'Post LinkedIn La Clé', project_id: 'comm-004', project_name: 'La Clé', project_color: '#f87171', status: 'done', priority: 'haute', due_date: '2026-04-03', created_at: now, updated_at: now },
  { id: 'ct-003', title: 'Story Locagame x3', project_id: 'comm-005', project_name: 'Locagame', project_color: '#34d399', status: 'done', priority: 'moyenne', due_date: '2026-04-04', created_at: now, updated_at: now },
  { id: 'ct-004', title: 'Shooting produit Murmure', project_id: 'comm-001', project_name: 'Murmure', project_color: '#e879f9', status: 'in_progress', priority: 'critique', due_date: '2026-04-07', created_at: now, updated_at: now },
  { id: 'ct-005', title: 'Mise à jour bio Instagram', project_id: 'comm-003', project_name: 'Docadoca', project_color: '#818cf8', status: 'todo', priority: 'faible', due_date: '2026-04-07', created_at: now, updated_at: now },
  { id: 'ct-006', title: 'Carousel LinkedIn V2', project_id: 'comm-004', project_name: 'La Clé', project_color: '#f87171', status: 'in_progress', priority: 'haute', due_date: '2026-04-08', created_at: now, updated_at: now },
  { id: 'ct-007', title: 'Brief rédac Etienne', project_id: 'comm-006', project_name: 'Etienne Perso', project_color: '#38bdf8', status: 'in_progress', priority: 'critique', due_date: '2026-04-09', created_at: now, updated_at: now },
  { id: 'ct-008', title: 'Caption x5 semaine', project_id: 'comm-005', project_name: 'Locagame', project_color: '#34d399', status: 'in_progress', priority: 'moyenne', due_date: '2026-04-09', created_at: now, updated_at: now },
  { id: 'ct-009', title: 'Newsletter Avril', project_id: 'comm-005', project_name: 'Locagame', project_color: '#34d399', status: 'in_progress', priority: 'haute', due_date: '2026-04-10', created_at: now, updated_at: now },
  { id: 'ct-010', title: 'Reel viral Etienne', project_id: 'comm-006', project_name: 'Etienne Perso', project_color: '#38bdf8', status: 'todo', priority: 'critique', due_date: '2026-04-14', created_at: now, updated_at: now },
  { id: 'ct-011', title: 'Post promo La Clé', project_id: 'comm-004', project_name: 'La Clé', project_color: '#f87171', status: 'todo', priority: 'haute', due_date: '2026-04-15', created_at: now, updated_at: now },
  { id: 'ct-012', title: 'Audit IG Murmure', project_id: 'comm-001', project_name: 'Murmure', project_color: '#e879f9', status: 'todo', priority: 'faible', due_date: '2026-04-15', created_at: now, updated_at: now },
  { id: 'ct-013', title: 'Livraison pack Mai Locagame', project_id: 'comm-005', project_name: 'Locagame', project_color: '#34d399', status: 'todo', priority: 'critique', due_date: '2026-04-18', created_at: now, updated_at: now },
  { id: 'ct-014', title: 'Reel x2 Murmure', project_id: 'comm-001', project_name: 'Murmure', project_color: '#e879f9', status: 'todo', priority: 'haute', due_date: '2026-04-21', created_at: now, updated_at: now },
  { id: 'ct-015', title: 'Brief visuel Juin', project_id: 'comm-003', project_name: 'Docadoca', project_color: '#818cf8', status: 'todo', priority: 'haute', due_date: '2026-04-25', created_at: now, updated_at: now },
]
```

- [ ] **Step 3 : Mettre à jour `src/modules/CommunicationManager/mocks/index.ts`**

Lire le fichier existant puis ajouter l'export :

```ts
// Ajouter à la fin des exports existants :
export { MOCK_COMM_TASKS } from './mockCommTasks'
```

- [ ] **Step 4 : Commit**

```bash
git add src/types/project-v2.ts src/modules/CommunicationManager/mocks/
git commit -m "feat(comm-calendar): types CommTask + mock data"
```

---

## Task 2 — Hook `useCommTasks`

**Files :**
- Create: `src/modules/CommunicationManager/components/CommTaskBoard/useCommTasks.ts`

- [ ] **Step 1 : Créer le hook**

```ts
import { useState, useCallback, useMemo } from 'react'
import { MOCK_COMM_TASKS } from '../../mocks/mockCommTasks'
import type { CommTask, CommTaskStatus, CommTaskPriority } from '../../../../types/project-v2'

export type CommTaskView = 'project' | 'month' | 'week'

export interface CommTaskFiltersState {
  priorities: CommTaskPriority[]
  statuses: CommTaskStatus[]
  projectIds: string[]
}

export function useCommTasks() {
  const [tasks, setTasks] = useState<CommTask[]>(MOCK_COMM_TASKS)
  const [view, setView] = useState<CommTaskView>('project')
  const [filters, setFilters] = useState<CommTaskFiltersState>({
    priorities: ['faible', 'moyenne', 'haute', 'critique'],
    statuses: ['todo', 'in_progress', 'done'],
    projectIds: [],  // vide = tous les projets
  })
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<CommTask | null>(null)
  const [defaultDate, setDefaultDate] = useState<string>('')

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!filters.priorities.includes(t.priority)) return false
      if (!filters.statuses.includes(t.status)) return false
      if (filters.projectIds.length > 0 && !filters.projectIds.includes(t.project_id)) return false
      return true
    })
  }, [tasks, filters])

  const createTask = useCallback((data: Omit<CommTask, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const task: CommTask = { ...data, id: `ct-${Date.now()}`, created_at: now, updated_at: now }
    setTasks(prev => [...prev, task])
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<CommTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const moveTask = useCallback((id: string, patch: { due_date?: string; project_id?: string; project_name?: string; project_color?: string }) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t))
  }, [])

  const openCreate = useCallback((date?: string) => {
    setEditingTask(null)
    setDefaultDate(date ?? '')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((task: CommTask) => {
    setEditingTask(task)
    setDefaultDate('')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingTask(null)
    setDefaultDate('')
  }, [])

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    view, setView,
    filters, setFilters,
    currentDate, setCurrentDate,
    modalOpen, editingTask, defaultDate,
    createTask, updateTask, deleteTask, moveTask,
    openCreate, openEdit, closeModal,
  }
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/modules/CommunicationManager/components/CommTaskBoard/useCommTasks.ts
git commit -m "feat(comm-calendar): hook useCommTasks avec filtres + CRUD"
```

---

## Task 3 — Config design + composants atomiques

**Files :**
- Create: `src/modules/CommunicationManager/components/CommTaskBoard/commTaskConfig.ts`
- Create: `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskCard.tsx`
- Create: `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskChip.tsx`

- [ ] **Step 1 : Créer `commTaskConfig.ts`**

```ts
import type { CommTaskPriority, CommTaskStatus } from '../../../../types/project-v2'

export const PRIORITY_CONFIG: Record<CommTaskPriority, {
  label: string
  dot: string
  border: string
  bg: string
  badge: string
  badgeBg: string
}> = {
  critique: { label: 'Critique', dot: '#f87171', border: '#f87171', bg: '#1f1515', badge: 'text-red-400',   badgeBg: 'bg-red-950/60 border border-red-900' },
  haute:    { label: 'Haute',    dot: '#fb923c', border: '#fb923c', bg: '#1f1a10', badge: 'text-orange-400', badgeBg: 'bg-orange-950/60 border border-orange-900' },
  moyenne:  { label: 'Moyenne',  dot: '#facc15', border: '#facc15', bg: '#1f1f10', badge: 'text-yellow-400', badgeBg: 'bg-yellow-950/60 border border-yellow-900' },
  faible:   { label: 'Faible',   dot: '#4ade80', border: '#4ade80', bg: '#101f15', badge: 'text-green-400',  badgeBg: 'bg-green-950/60 border border-green-900' },
}

export const STATUS_CONFIG: Record<CommTaskStatus, {
  label: string
  badge: string
  badgeBg: string
  dot: string
}> = {
  todo:        { label: 'À faire',  badge: 'text-slate-400', badgeBg: 'bg-slate-900/60 border border-slate-700', dot: '#64748b' },
  in_progress: { label: 'En cours', badge: 'text-violet-400', badgeBg: 'bg-violet-950/60 border border-violet-800', dot: '#a78bfa' },
  done:        { label: 'Terminé',  badge: 'text-green-400',  badgeBg: 'bg-green-950/60 border border-green-800', dot: '#4ade80' },
}

export function projectAbbr(name: string): string {
  return name.slice(0, 3).toUpperCase()
}
```

- [ ] **Step 2 : Créer `CommTaskCard.tsx`** (carte pour vue Projets)

```tsx
import type { CommTask } from '../../../../types/project-v2'
import { PRIORITY_CONFIG, STATUS_CONFIG } from './commTaskConfig'
import { CalendarDays } from 'lucide-react'

interface CommTaskCardProps {
  task: CommTask
  onClick: (task: CommTask) => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  isDragging?: boolean
  style?: React.CSSProperties
}

export function CommTaskCard({ task, onClick, dragHandleProps, isDragging, style }: CommTaskCardProps) {
  const prio = PRIORITY_CONFIG[task.priority]
  const stat = STATUS_CONFIG[task.status]

  return (
    <div
      onClick={() => onClick(task)}
      style={{ ...style, borderLeft: `3px solid ${prio.border}`, opacity: isDragging ? 0.4 : 1 }}
      className="bg-surface-1 border border-border rounded-lg p-3 cursor-pointer hover:bg-surface-3 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 select-none"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-foreground leading-snug flex-1">{task.title}</p>
        {dragHandleProps && (
          <div {...dragHandleProps} className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing px-0.5" onClick={e => e.stopPropagation()}>
            ⠿
          </div>
        )}
      </div>
      {task.due_date && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
          <CalendarDays className="w-3 h-3" />
          {new Date(task.due_date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-600 ${prio.badgeBg} ${prio.badge}`}>
          {prio.label}
        </span>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] ${stat.badgeBg} ${stat.badge}`}>
          {stat.label}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Créer `CommTaskChip.tsx`** (chip compacte pour vues calendrier)

```tsx
import type { CommTask } from '../../../../types/project-v2'
import { PRIORITY_CONFIG, projectAbbr } from './commTaskConfig'

interface CommTaskChipProps {
  task: CommTask
  onClick: (task: CommTask) => void
  isDragging?: boolean
  style?: React.CSSProperties
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function CommTaskChip({ task, onClick, isDragging, style, dragHandleProps }: CommTaskChipProps) {
  const prio = PRIORITY_CONFIG[task.priority]

  return (
    <div
      onClick={() => onClick(task)}
      style={{
        ...style,
        borderLeftColor: prio.border,
        background: prio.bg,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="flex items-center gap-1 px-1.5 py-0.5 rounded border-l-2 mb-1 cursor-pointer hover:-translate-y-px hover:shadow-md transition-all select-none overflow-hidden"
      {...dragHandleProps}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: prio.dot }} />
      <span className="text-[10px] font-medium text-foreground truncate flex-1 min-w-0">{task.title}</span>
      <span
        className="text-[8px] font-bold px-1 py-px rounded shrink-0"
        style={{ background: task.project_color + '22', color: task.project_color, border: `1px solid ${task.project_color}44` }}
      >
        {projectAbbr(task.project_name)}
      </span>
    </div>
  )
}
```

- [ ] **Step 4 : Commit**

```bash
git add src/modules/CommunicationManager/components/CommTaskBoard/
git commit -m "feat(comm-calendar): config + CommTaskCard + CommTaskChip"
```

---

## Task 4 — Modal création/édition

**Files :**
- Create: `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskModal.tsx`

- [ ] **Step 1 : Créer `CommTaskModal.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CommTask, CommTaskStatus, CommTaskPriority } from '../../../../types/project-v2'
import type { ProjectV2, StatusComm } from '../../../../types/project-v2'

type CommProject = ProjectV2 & { comm_status: StatusComm }

interface CommTaskModalProps {
  open: boolean
  task: CommTask | null
  projects: CommProject[]
  defaultDate?: string
  onSave: (data: Omit<CommTask, 'id' | 'created_at' | 'updated_at'>) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

const PRIORITIES: { value: CommTaskPriority; label: string; color: string }[] = [
  { value: 'faible',   label: 'Faible',   color: '#4ade80' },
  { value: 'moyenne',  label: 'Moyenne',  color: '#facc15' },
  { value: 'haute',    label: 'Haute',    color: '#fb923c' },
  { value: 'critique', label: 'Critique', color: '#f87171' },
]

const STATUSES: { value: CommTaskStatus; label: string }[] = [
  { value: 'todo',        label: 'À faire'  },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done',        label: 'Terminé'  },
]

const PROJECT_COLORS: Record<string, string> = {
  'comm-001': '#e879f9', // Murmure
  'comm-002': '#10b981', // Studio Deus
  'comm-003': '#818cf8', // Docadoca / Les Récoltants
  'comm-004': '#f87171', // La Clé (added)
  'comm-005': '#34d399', // Locagame (added)
  'comm-006': '#38bdf8', // Etienne Perso (added)
}

export function CommTaskModal({ open, task, projects, defaultDate, onSave, onDelete, onClose }: CommTaskModalProps) {
  const [title, setTitle]       = useState('')
  const [projectId, setProjectId] = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [priority, setPriority] = useState<CommTaskPriority>('moyenne')
  const [status, setStatus]     = useState<CommTaskStatus>('todo')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setProjectId(task.project_id)
      setDueDate(task.due_date)
      setPriority(task.priority)
      setStatus(task.status)
    } else {
      setTitle('')
      setProjectId(projects[0]?.id ?? '')
      setDueDate(defaultDate ?? '')
      setPriority('moyenne')
      setStatus('todo')
    }
  }, [task, defaultDate, projects, open])

  if (!open) return null

  const handleSave = () => {
    if (!title.trim()) return
    const proj = projects.find(p => p.id === projectId) ?? projects[0]
    onSave({
      title: title.trim(),
      project_id: proj?.id ?? projectId,
      project_name: proj?.name ?? projectId,
      project_color: PROJECT_COLORS[proj?.id ?? ''] ?? '#6366f1',
      status, priority, due_date: dueDate,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-1 border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-foreground">{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          {/* Titre */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Titre *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Nom de la tâche…"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Projet */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Projet</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Priorité */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Priorité</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    priority === p.value
                      ? 'bg-surface-3 border-current shadow-sm'
                      : 'bg-surface-2 border-border text-muted-foreground hover:border-current'
                  )}
                  style={{ color: p.color, borderColor: priority === p.value ? p.color : undefined }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Statut</label>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    status === s.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-2 border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {task && onDelete && (
              <button
                onClick={() => { onDelete(task.id); onClose() }}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border hover:border-border-subtle transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {task ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/modules/CommunicationManager/components/CommTaskBoard/CommTaskModal.tsx
git commit -m "feat(comm-calendar): CommTaskModal création/édition"
```

---

## Task 5 — Barre de filtres

**Files :**
- Create: `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskFilters.tsx`

- [ ] **Step 1 : Créer `CommTaskFilters.tsx`**

```tsx
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CommTaskFiltersState, CommTaskView } from './useCommTasks'
import type { CommTaskPriority, CommTaskStatus, ProjectV2, StatusComm } from '../../../../types/project-v2'
import { PRIORITY_CONFIG, STATUS_CONFIG } from './commTaskConfig'

type CommProject = ProjectV2 & { comm_status: StatusComm }

interface CommTaskFiltersProps {
  filters: CommTaskFiltersState
  view: CommTaskView
  projects: CommProject[]
  currentDate: Date
  onFiltersChange: (f: CommTaskFiltersState) => void
  onViewChange: (v: CommTaskView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onNewTask: () => void
}

const PROJECT_COLORS: Record<string, string> = {
  'comm-001': '#e879f9',
  'comm-002': '#10b981',
  'comm-003': '#818cf8',
  'comm-004': '#f87171',
  'comm-005': '#34d399',
  'comm-006': '#38bdf8',
}

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

export function CommTaskFilters({
  filters, view, projects, currentDate,
  onFiltersChange, onViewChange, onPrev, onNext, onToday, onNewTask,
}: CommTaskFiltersProps) {
  const periodLabel = view === 'project'
    ? 'Tous projets actifs'
    : view === 'month'
    ? currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : `Sem. du ${getWeekStart(currentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`

  const togglePriority = (p: CommTaskPriority) =>
    onFiltersChange({ ...filters, priorities: toggleItem(filters.priorities, p) })

  const toggleStatus = (s: CommTaskStatus) =>
    onFiltersChange({ ...filters, statuses: toggleItem(filters.statuses, s) })

  const toggleProject = (id: string) =>
    onFiltersChange({ ...filters, projectIds: toggleItem(filters.projectIds, id) })

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-wrap bg-surface-1/50">
      {/* Navigation période */}
      {view !== 'project' && (
        <>
          <button onClick={onPrev} className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-2 border border-border text-muted-foreground hover:text-foreground">←</button>
          <span className="text-xs font-semibold text-foreground px-1 capitalize">{periodLabel}</span>
          <button onClick={onNext} className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-2 border border-border text-muted-foreground hover:text-foreground">→</button>
          <button onClick={onToday} className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-2 border border-border text-muted-foreground hover:text-foreground">Auj.</button>
        </>
      )}
      {view === 'project' && <span className="text-xs font-semibold text-foreground capitalize">{periodLabel}</span>}

      <div className="w-px h-4 bg-border mx-1" />

      {/* Onglets de vue */}
      <div className="flex items-center gap-0.5 bg-surface-2 rounded-lg p-0.5">
        {(['project', 'month', 'week'] as CommTaskView[]).map(v => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              view === v ? 'bg-surface-3 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {v === 'project' ? '🗂️ Projets' : v === 'month' ? '📅 Mois' : '📋 Semaine'}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Filtres priorité */}
      {(['critique', 'haute', 'moyenne', 'faible'] as CommTaskPriority[]).map(p => (
        <button
          key={p}
          onClick={() => togglePriority(p)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
            filters.priorities.includes(p)
              ? 'border-current bg-surface-3'
              : 'border-border bg-surface-2 text-muted-foreground opacity-50'
          )}
          style={{ color: filters.priorities.includes(p) ? PRIORITY_CONFIG[p].dot : undefined }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_CONFIG[p].dot }} />
          {PRIORITY_CONFIG[p].label}
        </button>
      ))}

      <div className="w-px h-4 bg-border mx-1" />

      {/* Filtres statut */}
      {(['todo', 'in_progress', 'done'] as CommTaskStatus[]).map(s => (
        <button
          key={s}
          onClick={() => toggleStatus(s)}
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
            filters.statuses.includes(s)
              ? 'border-primary/50 bg-primary/10 text-primary'
              : 'border-border bg-surface-2 text-muted-foreground opacity-50'
          )}
        >
          {STATUS_CONFIG[s].label}
        </button>
      ))}

      <div className="w-px h-4 bg-border mx-1" />

      {/* Filtres projet */}
      {projects.slice(0, 5).map(p => {
        const color = PROJECT_COLORS[p.id] ?? '#6366f1'
        const active = filters.projectIds.length === 0 || filters.projectIds.includes(p.id)
        return (
          <button
            key={p.id}
            onClick={() => toggleProject(p.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
              active ? 'border-current bg-surface-3' : 'border-border bg-surface-2 text-muted-foreground opacity-40'
            )}
            style={{ color: active ? color : undefined }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {p.name.length > 8 ? p.name.slice(0, 8) + '…' : p.name}
          </button>
        )
      })}

      <button
        onClick={onNewTask}
        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Nouvelle tâche
      </button>
    </div>
  )
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/modules/CommunicationManager/components/CommTaskBoard/CommTaskFilters.tsx
git commit -m "feat(comm-calendar): CommTaskFilters barre filtres"
```

---

## Task 6 — Vue Projets (kanban avec dnd-kit)

**Files :**
- Create: `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskBoardProject.tsx`

- [ ] **Step 1 : Créer `CommTaskBoardProject.tsx`**

```tsx
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { CommTask, ProjectV2, StatusComm } from '../../../../types/project-v2'
import { CommTaskCard } from './CommTaskCard'

type CommProject = ProjectV2 & { comm_status: StatusComm }

interface CommTaskBoardProjectProps {
  tasks: CommTask[]
  projects: CommProject[]
  onMoveTask: (taskId: string, patch: { project_id: string; project_name: string; project_color: string }) => void
  onClickTask: (task: CommTask) => void
  onAddTask: (projectId: string) => void
}

const PROJECT_COLORS: Record<string, string> = {
  'comm-001': '#e879f9',
  'comm-002': '#10b981',
  'comm-003': '#818cf8',
  'comm-004': '#f87171',
  'comm-005': '#34d399',
  'comm-006': '#38bdf8',
}

// --- Draggable card wrapper ---
function DraggableCard({ task, onClickTask }: { task: CommTask; onClickTask: (t: CommTask) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }}>
      <CommTaskCard
        task={task}
        onClick={onClickTask}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// --- Droppable column wrapper ---
function DroppableColumn({ projectId, children }: { projectId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${projectId}` })
  return (
    <div
      ref={setNodeRef}
      className="bg-surface-2 rounded-b-lg border border-t-0 border-border p-2 min-h-32 flex flex-col gap-2 transition-colors"
      style={{ background: isOver ? 'rgba(99,102,241,0.08)' : undefined, outline: isOver ? '2px dashed #6366f1' : undefined }}
    >
      {children}
    </div>
  )
}

export function CommTaskBoardProject({ tasks, projects, onMoveTask, onClickTask, onAddTask }: CommTaskBoardProjectProps) {
  const [activeTask, setActiveTask] = useState<CommTask | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask(e.active.data.current?.task as CommTask)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = e
    if (!over) return
    const task = active.data.current?.task as CommTask
    const colId = over.id as string // "col-{projectId}"
    const projectId = colId.replace('col-', '')
    if (task.project_id === projectId) return
    const proj = projects.find(p => p.id === projectId)
    if (!proj) return
    onMoveTask(task.id, {
      project_id: proj.id,
      project_name: proj.name,
      project_color: PROJECT_COLORS[proj.id] ?? '#6366f1',
    })
  }

  // Projets comm actifs uniquement (hors perdu/termine)
  const activeProjects = projects.filter(p => !['perdu', 'termine'].includes(p.comm_status))

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4 pb-6">
        {activeProjects.map(proj => {
          const color = PROJECT_COLORS[proj.id] ?? '#6366f1'
          const colTasks = tasks.filter(t => t.project_id === proj.id)
          return (
            <div key={proj.id} className="flex-shrink-0 w-56">
              {/* Header colonne */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-t-lg"
                style={{ background: color + '22', borderBottom: `2px solid ${color}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-bold truncate" style={{ color }}>{proj.name}</span>
                </div>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: color + '33', color }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Corps droppable */}
              <DroppableColumn projectId={proj.id}>
                {colTasks.map(task => (
                  <DraggableCard key={task.id} task={task} onClickTask={onClickTask} />
                ))}
                <button
                  onClick={() => onAddTask(proj.id)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-muted-foreground/40 hover:text-muted-foreground text-xs transition-colors rounded-md hover:bg-surface-3"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </DroppableColumn>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask && <CommTaskCard task={activeTask} onClick={() => {}} isDragging={false} style={{ rotate: '2deg', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }} />}
      </DragOverlay>
    </DndContext>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/modules/CommunicationManager/components/CommTaskBoard/CommTaskBoardProject.tsx
git commit -m "feat(comm-calendar): vue Projets kanban avec dnd-kit"
```

---

## Task 7 — Vue Mois

**Files :**
- Create: `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskBoardMonth.tsx`

- [ ] **Step 1 : Créer `CommTaskBoardMonth.tsx`**

```tsx
import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { CommTask } from '../../../../types/project-v2'
import { CommTaskChip } from './CommTaskChip'

interface CommTaskBoardMonthProps {
  tasks: CommTask[]
  currentDate: Date
  onMoveTask: (taskId: string, patch: { due_date: string }) => void
  onClickTask: (task: CommTask) => void
  onDateClick: (date: string) => void
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // 0=Mon
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function DraggableChip({ task, onClickTask }: { task: CommTask; onClickTask: (t: CommTask) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, data: { task } })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }}>
      <CommTaskChip task={task} onClick={onClickTask} isDragging={isDragging} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function DroppableDay({ dateStr, isToday, isOther, children, onDateClick }: {
  dateStr: string; isToday: boolean; isOther: boolean; children: React.ReactNode; onDateClick: (d: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr })
  return (
    <div
      ref={setNodeRef}
      onClick={() => onDateClick(dateStr)}
      className="border-r border-b border-border min-h-[100px] p-1.5 cursor-pointer transition-colors"
      style={{
        background: isOver ? 'rgba(99,102,241,0.1)' : isToday ? 'rgba(99,102,241,0.04)' : undefined,
        outline: isOver ? '2px dashed #6366f1' : undefined,
        opacity: isOther ? 0.3 : 1,
      }}
    >
      {children}
    </div>
  )
}

const DAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function CommTaskBoardMonth({ tasks, currentDate, onMoveTask, onClickTask, onDateClick }: CommTaskBoardMonthProps) {
  const [activeTask, setActiveTask] = useState<CommTask | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const daysInMonth  = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)
  const prevMonthDays = getDaysInMonth(year, month - 1 < 0 ? 11 : month - 1)

  // Build grid cells
  const cells: { dateStr: string; dayNum: number; isOther: boolean }[] = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    const d = prevMonthDays - firstDayOfMonth + 1 + i
    cells.push({ dateStr: toDateStr(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d), dayNum: d, isOther: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: toDateStr(year, month, d), dayNum: d, isOther: false })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ dateStr: toDateStr(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d), dayNum: d, isOther: true })
  }

  const tasksByDate = tasks.reduce<Record<string, CommTask[]>>((acc, t) => {
    if (!t.due_date) return acc
    acc[t.due_date] = acc[t.due_date] ? [...acc[t.due_date], t] : [t]
    return acc
  }, {})

  const handleDragStart = (e: DragStartEvent) => setActiveTask(e.active.data.current?.task as CommTask)
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = e
    if (!over) return
    const task = active.data.current?.task as CommTask
    const newDate = over.id as string
    if (task.due_date === newDate) return
    onMoveTask(task.id, { due_date: newDate })
  }

  const MAX_VISIBLE = 2

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="border-l border-t border-border">
        {/* Headers */}
        <div className="grid grid-cols-7">
          {DAY_HEADERS.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-700 text-muted-foreground/60 uppercase tracking-wider border-r border-b border-border bg-surface-2/50">
              {d}
            </div>
          ))}
        </div>
        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map(({ dateStr, dayNum, isOther }) => {
            const isToday = dateStr === todayStr
            const dayTasks = tasksByDate[dateStr] ?? []
            const isExpanded = expanded[dateStr]
            const visible = isExpanded ? dayTasks : dayTasks.slice(0, MAX_VISIBLE)
            const hidden = dayTasks.length - MAX_VISIBLE

            return (
              <DroppableDay key={dateStr} dateStr={dateStr} isToday={isToday} isOther={isOther} onDateClick={onDateClick}>
                {/* Numéro du jour */}
                <span
                  className="inline-flex items-center justify-center text-[11px] font-semibold mb-1 w-5 h-5"
                  style={{
                    color: isToday ? '#fff' : '#475569',
                    background: isToday ? '#6366f1' : undefined,
                    borderRadius: isToday ? '50%' : undefined,
                  }}
                >
                  {dayNum}
                </span>
                {/* Chips tâches */}
                {visible.map(task => (
                  <DraggableChip key={task.id} task={task} onClickTask={onClickTask} />
                ))}
                {!isExpanded && hidden > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); setExpanded(p => ({ ...p, [dateStr]: true })) }}
                    className="text-[9px] text-primary font-semibold px-1"
                  >
                    +{hidden} autres
                  </button>
                )}
              </DroppableDay>
            )
          })}
        </div>
      </div>

      <DragOverlay>
        {activeTask && <CommTaskChip task={activeTask} onClick={() => {}} style={{ rotate: '3deg', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />}
      </DragOverlay>
    </DndContext>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/modules/CommunicationManager/components/CommTaskBoard/CommTaskBoardMonth.tsx
git commit -m "feat(comm-calendar): vue Mois grille avec dnd-kit"
```

---

## Task 8 — Vue Semaine

**Files :**
- Create: `src/modules/CommunicationManager/components/CommTaskBoard/CommTaskBoardWeek.tsx`

- [ ] **Step 1 : Créer `CommTaskBoardWeek.tsx`**

```tsx
import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { CommTask } from '../../../../types/project-v2'
import { CommTaskChip } from './CommTaskChip'

interface CommTaskBoardWeekProps {
  tasks: CommTask[]
  currentDate: Date
  onMoveTask: (taskId: string, patch: { due_date: string }) => void
  onClickTask: (task: CommTask) => void
  onDateClick: (date: string) => void
}

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function getWeekDays(date: Date): Date[] {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return Array.from({ length: 6 }, (_, i) => {
    const dd = new Date(d)
    dd.setDate(d.getDate() + i)
    return dd
  })
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function DraggableWeekChip({ task, onClickTask }: { task: CommTask; onClickTask: (t: CommTask) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, data: { task } })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }}>
      <CommTaskChip task={task} onClick={onClickTask} isDragging={isDragging} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function DroppableCell({ id, isToday, children, onDateClick }: { id: string; isToday: boolean; children: React.ReactNode; onDateClick: (d: string) => void }) {
  const dateStr = id.split('_')[0]
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      onClick={() => onDateClick(dateStr)}
      className="border-r border-b border-border min-h-[52px] p-1 cursor-pointer transition-colors"
      style={{
        background: isOver ? 'rgba(99,102,241,0.1)' : isToday ? 'rgba(99,102,241,0.04)' : undefined,
        outline: isOver ? '2px dashed #6366f1' : undefined,
      }}
    >
      {children}
    </div>
  )
}

export function CommTaskBoardWeek({ tasks, currentDate, onMoveTask, onClickTask, onDateClick }: CommTaskBoardWeekProps) {
  const [activeTask, setActiveTask] = useState<CommTask | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const weekDays = getWeekDays(currentDate)
  const today = new Date()
  const todayStr = toDateStr(today)

  const tasksByDate = tasks.reduce<Record<string, CommTask[]>>((acc, t) => {
    if (!t.due_date) return acc
    acc[t.due_date] = acc[t.due_date] ? [...acc[t.due_date], t] : [t]
    return acc
  }, {})

  const handleDragStart = (e: DragStartEvent) => setActiveTask(e.active.data.current?.task as CommTask)
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = e
    if (!over) return
    const task = active.data.current?.task as CommTask
    const dateStr = (over.id as string).split('_')[0]
    if (task.due_date === dateStr) return
    onMoveTask(task.id, { due_date: dateStr })
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="border-l border-t border-border overflow-auto">
        {/* Header jours */}
        <div className="grid sticky top-0 z-10 bg-surface-1" style={{ gridTemplateColumns: '48px repeat(6, 1fr)' }}>
          <div className="border-r border-b border-border bg-surface-2/50" />
          {weekDays.map((d, i) => {
            const isToday = toDateStr(d) === todayStr
            return (
              <div key={i} className="border-r border-b border-border py-2.5 text-center bg-surface-2/50">
                <div className="text-[10px] font-700 text-muted-foreground/60 uppercase tracking-wider">{DAY_NAMES[i]}</div>
                <div
                  className="text-lg font-bold mt-0.5 mx-auto w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: isToday ? '#6366f1' : undefined, color: isToday ? '#fff' : '#e2e8f0' }}
                >
                  {d.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Grille horaire */}
        {HOURS.map(hour => (
          <div key={hour} className="grid" style={{ gridTemplateColumns: '48px repeat(6, 1fr)' }}>
            <div className="border-r border-b border-border flex items-start justify-end pr-2 pt-1 text-[10px] text-muted-foreground/40 bg-surface-2/30">
              {hour}h
            </div>
            {weekDays.map((d, i) => {
              const dateStr = toDateStr(d)
              const cellId = `${dateStr}_${hour}`
              const isToday = dateStr === todayStr
              // Afficher les tâches uniquement dans la cellule 9h de chaque jour
              const dayTasks = hour === 9 ? (tasksByDate[dateStr] ?? []) : []
              return (
                <DroppableCell key={i} id={cellId} isToday={isToday} onDateClick={onDateClick}>
                  {dayTasks.map(task => (
                    <DraggableWeekChip key={task.id} task={task} onClickTask={onClickTask} />
                  ))}
                </DroppableCell>
              )
            })}
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTask && <CommTaskChip task={activeTask} onClick={() => {}} style={{ rotate: '2deg', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />}
      </DragOverlay>
    </DndContext>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/modules/CommunicationManager/components/CommTaskBoard/CommTaskBoardWeek.tsx
git commit -m "feat(comm-calendar): vue Semaine grille horaire avec dnd-kit"
```

---

## Task 9 — Composant racine `CommTaskBoard`

**Files :**
- Create: `src/modules/CommunicationManager/components/CommTaskBoard/index.tsx`

- [ ] **Step 1 : Créer `CommTaskBoard/index.tsx`**

```tsx
import type { ProjectV2, StatusComm } from '../../../../types/project-v2'
import { useCommTasks } from './useCommTasks'
import { CommTaskFilters } from './CommTaskFilters'
import { CommTaskBoardProject } from './CommTaskBoardProject'
import { CommTaskBoardMonth } from './CommTaskBoardMonth'
import { CommTaskBoardWeek } from './CommTaskBoardWeek'
import { CommTaskModal } from './CommTaskModal'

type CommProject = ProjectV2 & { comm_status: StatusComm }

interface CommTaskBoardProps {
  projects: CommProject[]
}

export function CommTaskBoard({ projects }: CommTaskBoardProps) {
  const {
    tasks, view, setView, filters, setFilters,
    currentDate, setCurrentDate,
    modalOpen, editingTask, defaultDate,
    createTask, updateTask, deleteTask, moveTask,
    openCreate, openEdit, closeModal,
  } = useCommTasks()

  const handlePrev = () => {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  return (
    <div className="flex flex-col">
      {/* Barre de filtres */}
      <CommTaskFilters
        filters={filters}
        view={view}
        projects={projects}
        currentDate={currentDate}
        onFiltersChange={setFilters}
        onViewChange={setView}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => setCurrentDate(new Date())}
        onNewTask={() => openCreate()}
      />

      {/* Vues */}
      {view === 'project' && (
        <CommTaskBoardProject
          tasks={tasks}
          projects={projects}
          onMoveTask={(id, patch) => moveTask(id, patch)}
          onClickTask={openEdit}
          onAddTask={(projectId) => openCreate()}
        />
      )}
      {view === 'month' && (
        <CommTaskBoardMonth
          tasks={tasks}
          currentDate={currentDate}
          onMoveTask={(id, patch) => moveTask(id, patch)}
          onClickTask={openEdit}
          onDateClick={(date) => openCreate(date)}
        />
      )}
      {view === 'week' && (
        <CommTaskBoardWeek
          tasks={tasks}
          currentDate={currentDate}
          onMoveTask={(id, patch) => moveTask(id, patch)}
          onClickTask={openEdit}
          onDateClick={(date) => openCreate(date)}
        />
      )}

      {/* Modal */}
      <CommTaskModal
        open={modalOpen}
        task={editingTask}
        projects={projects}
        defaultDate={defaultDate}
        onSave={(data) => {
          if (editingTask) updateTask(editingTask.id, data)
          else createTask(data)
        }}
        onDelete={deleteTask}
        onClose={closeModal}
      />
    </div>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/modules/CommunicationManager/components/CommTaskBoard/index.tsx
git commit -m "feat(comm-calendar): CommTaskBoard composant racine"
```

---

## Task 10 — Intégration finale + nettoyage

**Files :**
- Modify: `src/modules/CommunicationManager/index.tsx`
- Delete: `src/modules/CommunicationManager/components/CommCalendarView.tsx`

- [ ] **Step 1 : Mettre à jour `CommunicationManager/index.tsx`**

Remplacer l'import `CommCalendarView` par `CommTaskBoard`, et remplacer son usage.

Ligne d'import à remplacer :
```ts
// Avant
import { CommCalendarView } from './components/CommCalendarView'

// Après
import { CommTaskBoard } from './components/CommTaskBoard'
```

Usage à remplacer (chercher `<CommCalendarView`) :
```tsx
// Avant
<CommCalendarView projects={projects} onProjectClick={handleProjectClick} />

// Après
<CommTaskBoard projects={projects} />
```

- [ ] **Step 2 : Supprimer l'ancien composant**

```bash
rm src/modules/CommunicationManager/components/CommCalendarView.tsx
```

- [ ] **Step 3 : Vérifier que le build TypeScript passe**

```bash
npx tsc --noEmit 2>&1
```

Résultat attendu : aucune erreur. Si des erreurs apparaissent, les corriger avant de continuer.

- [ ] **Step 4 : Vérification visuelle dans le navigateur**

Ouvrir http://localhost:5173, naviguer vers **Communication** (sidebar "En cours").

Vérifier :
- [ ] La barre de filtres s'affiche en haut
- [ ] La vue **Projets** s'affiche par défaut avec les colonnes par client
- [ ] Cliquer sur **Mois** → grille calendrier avec les tâches
- [ ] Cliquer sur **Semaine** → grille horaire avec les tâches
- [ ] Glisser une tâche d'un jour à l'autre en vue Mois → tâche se déplace
- [ ] Glisser une carte entre deux colonnes en vue Projets → carte change de colonne
- [ ] Cliquer sur **+ Nouvelle tâche** → modal s'ouvre, remplir et valider → tâche apparaît
- [ ] Cliquer sur une tâche existante → modal en mode édition → modifier et sauvegarder
- [ ] Les filtres priorité/statut masquent bien les tâches correspondantes

- [ ] **Step 5 : Commit final**

```bash
git add -A
git commit -m "feat(comm-calendar): intégration CommTaskBoard + suppression CommCalendarView"
```

---

## Récapitulatif des commits

| # | Message |
|---|---------|
| 1 | `feat(comm-calendar): types CommTask + mock data` |
| 2 | `feat(comm-calendar): hook useCommTasks avec filtres + CRUD` |
| 3 | `feat(comm-calendar): config + CommTaskCard + CommTaskChip` |
| 4 | `feat(comm-calendar): CommTaskModal création/édition` |
| 5 | `feat(comm-calendar): CommTaskFilters barre filtres` |
| 6 | `feat(comm-calendar): vue Projets kanban avec dnd-kit` |
| 7 | `feat(comm-calendar): vue Mois grille avec dnd-kit` |
| 8 | `feat(comm-calendar): vue Semaine grille horaire avec dnd-kit` |
| 9 | `feat(comm-calendar): CommTaskBoard composant racine` |
| 10 | `feat(comm-calendar): intégration CommTaskBoard + suppression CommCalendarView` |
