# Dashboard V2 — Plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUIS : Utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour implémenter ce plan tâche par tâche. Les étapes utilisent la syntaxe checkbox (`- [ ]`) pour le suivi.

**Objectif :** Créer le module `src/modules/DashboardV2/` — bento grid 2 colonnes avec KPIs live, actions prioritaires, résumés IA, agenda et graphique CA, sans toucher à `src/modules/Dashboard/`.

**Architecture :** Module autonome lazy-loadé dans Layout.tsx. Un seul contexte Realtime (1 WS). Données via hooks existants (`useProjectsV2`, `useSupabaseTasks`, `useSupabaseLeads`, `useSupabaseAccountingEntries`) + requête directe Supabase pour les RDV et les devis.

**Tech Stack :** React 18, TypeScript, Supabase Realtime, Recharts, Framer Motion, shadcn/ui (Skeleton, Badge, Card, Checkbox), Tailwind CSS, sonner (toast).

---

## Vérification préalable (pas de tests unitaires dans ce projet)

Chaque tâche se termine par :
1. `npm run build` — doit passer sans erreur TypeScript
2. `npm run dev` → vérification visuelle dans le navigateur
3. `git commit`

---

## Fichiers créés / modifiés

**Créés :**
- `src/modules/DashboardV2/hooks/useDashboardData.ts`
- `src/modules/DashboardV2/hooks/useDashboardRealtime.ts`
- `src/modules/DashboardV2/components/BentoGrid.tsx`
- `src/modules/DashboardV2/components/right/KpiStatsWidget.tsx`
- `src/modules/DashboardV2/components/right/UpcomingMeetingsWidget.tsx`
- `src/modules/DashboardV2/components/right/QuickTasksWidget.tsx`
- `src/modules/DashboardV2/components/left/AiSummariesWidget.tsx`
- `src/modules/DashboardV2/components/left/PriorityActionsWidget.tsx`
- `src/modules/DashboardV2/components/left/RevenueChartWidget.tsx`
- `src/modules/DashboardV2/index.tsx`

**Modifiés :**
- `src/components/layout/Layout.tsx` — lazy import + case 'dashboard-v2'
- `src/components/layout/Sidebar.tsx` — item dans v2Section

---

## Task 1 : Hook `useDashboardData`

**Fichiers :**
- Créer : `src/modules/DashboardV2/hooks/useDashboardData.ts`

Agrège toutes les données au chargement. Expose des valeurs dérivées prêtes à l'emploi pour chaque widget. Utilise les hooks existants + une requête directe pour les devis en attente.

- [ ] **Étape 1 : Créer le fichier**

```typescript
// src/modules/DashboardV2/hooks/useDashboardData.ts
import { useMemo } from 'react'
import { useProjectsV2 } from '../../ProjectsManagerV2/hooks/useProjectsV2'
import { useSupabaseTasks, useSupabaseLeads, useSupabaseAccountingEntries } from '../../../hooks/useSupabaseData'
import { useStore } from '../../../store/useStore'
import type { ProjectV2 } from '../../../types/project-v2'

export interface PriorityActionItem {
  id: string
  type: 'projet' | 'tache' | 'devis'
  label: string
  subLabel?: string
  severity: 'red' | 'orange' | 'yellow'
  projectId?: string
  leadId?: string
}

export interface DashboardKpis {
  activeProjects: number
  activeLeads: number
  todayTasks: number
  monthRevenue: number
}

export function useDashboardData() {
  const { navigateWithContext } = useStore()
  const { projects, loading: projectsLoading } = useProjectsV2()
  const { data: tasks, loading: tasksLoading } = useSupabaseTasks()
  const { count: leadsCount, loading: leadsLoading } = useSupabaseLeads()
  const { data: accountingEntries, loading: accountingLoading } = useSupabaseAccountingEntries()

  const loading = projectsLoading || tasksLoading || leadsLoading || accountingLoading

  // KPIs
  const kpis: DashboardKpis = useMemo(() => {
    const currentMonthKey = new Date().toISOString().slice(0, 7)
    const today = new Date().toISOString().slice(0, 10)

    const activeProjects = projects.filter(
      p => p.status !== 'closed' && !p.is_archived
    ).length

    const todayTasks = (tasks ?? []).filter(
      t => t.deadline === today && (t.status as string) !== 'done'
    ).length

    const monthRevenue = (accountingEntries ?? [])
      .filter(e => (e as any).month_key === currentMonthKey && e.type === 'revenue')
      .reduce((sum, e) => sum + Number((e as any).amount ?? 0), 0)

    return {
      activeProjects,
      activeLeads: leadsCount ?? 0,
      todayTasks,
      monthRevenue,
    }
  }, [projects, tasks, leadsCount, accountingEntries])

  // Résumés IA — projets avec ai_summary
  const aiProjects = useMemo(() =>
    projects
      .filter(p => p.ai_summary !== null && !p.is_archived)
      .slice(0, 6),
    [projects]
  )

  // Tâches du jour assignées à l'utilisateur
  const { currentUser } = useStore()
  const todayTasksList = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return (tasks ?? [])
      .filter(t =>
        t.deadline === today &&
        (t.status as string) !== 'done' &&
        (t.assigned_to === currentUser?.id || !t.assigned_to)
      )
      .slice(0, 8)
  }, [tasks, currentUser])

  // Actions prioritaires
  const priorityActions = useMemo((): PriorityActionItem[] => {
    const items: PriorityActionItem[] = []
    const today = new Date().toISOString().slice(0, 10)

    // Projets avec faible completion_score
    projects
      .filter(p => p.completion_score < 50 && p.status !== 'closed' && !p.is_archived)
      .slice(0, 3)
      .forEach(p => {
        items.push({
          id: `proj-${p.id}`,
          type: 'projet',
          label: p.name,
          subLabel: `Score : ${p.completion_score}%`,
          severity: p.completion_score < 25 ? 'red' : 'orange',
          projectId: p.id,
        })
      })

    // Tâches en retard
    ;(tasks ?? [])
      .filter(t => t.deadline && t.deadline < today && (t.status as string) !== 'done')
      .slice(0, 3)
      .forEach(t => {
        items.push({
          id: `task-${t.id}`,
          type: 'tache',
          label: t.title,
          subLabel: `Deadline : ${t.deadline}`,
          severity: 'red',
        })
      })

    return items
      .sort((a, b) => {
        const order = { red: 0, orange: 1, yellow: 2 }
        return order[a.severity] - order[b.severity]
      })
      .slice(0, 5)
  }, [projects, tasks])

  // Données graphique CA — 12 mois année courante
  const revenueChartData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 12 }, (_, i) => {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`
      const revenue = (accountingEntries ?? [])
        .filter(e => (e as any).month_key === monthKey && e.type === 'revenue')
        .reduce((sum, e) => sum + Number((e as any).amount ?? 0), 0)
      return { monthKey, revenue }
    })
  }, [accountingEntries])

  // Navigation handlers
  const handleNavigateToProject = (id: string) =>
    navigateWithContext('projects-v2', { projectId: id })

  const handleNavigateToLead = (id: string) =>
    navigateWithContext('crm-erp-lead-details', { leadId: id })

  return {
    loading,
    kpis,
    aiProjects,
    todayTasksList,
    priorityActions,
    revenueChartData,
    handleNavigateToProject,
    handleNavigateToLead,
    rawTasks: tasks ?? [],
  }
}
```

- [ ] **Étape 2 : Vérifier le build**

```bash
npm run build
```
Attendu : aucune erreur TypeScript.

- [ ] **Étape 3 : Commit**

```bash
git add src/modules/DashboardV2/hooks/useDashboardData.ts
git commit -m "feat(dashboard-v2): hook useDashboardData — agrégation données"
```

---

## Task 2 : Hook `useDashboardRealtime`

**Fichiers :**
- Créer : `src/modules/DashboardV2/hooks/useDashboardRealtime.ts`

Un seul channel Supabase. Appelle `onRefresh()` à chaque changement sur les 4 tables surveillées.

- [ ] **Étape 1 : Créer le fichier**

```typescript
// src/modules/DashboardV2/hooks/useDashboardRealtime.ts
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

interface DashboardRealtimeContextValue {
  isConnected: boolean
  lastUpdatedAt: Date | null
}

export const DashboardRealtimeContext = createContext<DashboardRealtimeContextValue>({
  isConnected: false,
  lastUpdatedAt: null,
})

export function useDashboardRealtime(onRefresh: () => void) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-v2-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects_v2' }, () => {
        onRefreshRef.current()
        setLastUpdatedAt(new Date())
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        onRefreshRef.current()
        setLastUpdatedAt(new Date())
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        onRefreshRef.current()
        setLastUpdatedAt(new Date())
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_activities_v2' }, () => {
        onRefreshRef.current()
        setLastUpdatedAt(new Date())
      })
      .subscribe(status => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { isConnected, lastUpdatedAt }
}
```

- [ ] **Étape 2 : Vérifier le build**

```bash
npm run build
```
Attendu : aucune erreur TypeScript.

- [ ] **Étape 3 : Commit**

```bash
git add src/modules/DashboardV2/hooks/useDashboardRealtime.ts
git commit -m "feat(dashboard-v2): hook useDashboardRealtime — 1 canal WS, 4 tables"
```

---

## Task 3 : `KpiStatsWidget`

**Fichiers :**
- Créer : `src/modules/DashboardV2/components/right/KpiStatsWidget.tsx`

4 tuiles KPI avec animation Framer Motion AnimatePresence à chaque changement de valeur.

- [ ] **Étape 1 : Créer le fichier**

```typescript
// src/modules/DashboardV2/components/right/KpiStatsWidget.tsx
import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, Users, ListChecks, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '../../../../components/ui/card'
import { Skeleton } from '../../../../components/ui/skeleton'
import type { DashboardKpis } from '../../hooks/useDashboardData'

interface KpiStatsWidgetProps {
  kpis: DashboardKpis
  loading: boolean
}

const KPI_CONFIG = [
  {
    key: 'activeProjects' as const,
    label: 'Projets actifs',
    icon: Briefcase,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    key: 'activeLeads' as const,
    label: 'Leads en cours',
    icon: Users,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    key: 'todayTasks' as const,
    label: "Tâches du jour",
    icon: ListChecks,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    key: 'monthRevenue' as const,
    label: 'CA du mois',
    icon: TrendingUp,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    format: (v: number) => `${v.toLocaleString('fr-FR')} €`,
  },
]

export function KpiStatsWidget({ kpis, loading }: KpiStatsWidgetProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {KPI_CONFIG.map(k => (
          <Skeleton key={k.key} className="h-20 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {KPI_CONFIG.map(({ key, label, icon: Icon, color, bg, border, format }) => (
        <Card
          key={key}
          className="rounded-2xl border bg-surface-2/50 border-border/50 hover:border-border transition-colors"
        >
          <CardContent className="p-3">
            <div className={`inline-flex p-1.5 rounded-lg ${bg} border ${border} mb-2`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={kpis[key]}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="text-xl font-bold text-white leading-none"
              >
                {format ? format(kpis[key] as number) : kpis[key]}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier le build**

```bash
npm run build
```
Attendu : aucune erreur TypeScript.

- [ ] **Étape 3 : Commit**

```bash
git add src/modules/DashboardV2/components/right/KpiStatsWidget.tsx
git commit -m "feat(dashboard-v2): KpiStatsWidget — 4 KPIs avec animation"
```

---

## Task 4 : `UpcomingMeetingsWidget`

**Fichiers :**
- Créer : `src/modules/DashboardV2/components/right/UpcomingMeetingsWidget.tsx`

Refactorisation de `UpcomingMeetingsCard` en version compacte. Filtre J+7. Clic → `onNavigateToProject`.

- [ ] **Étape 1 : Créer le fichier**

```typescript
// src/modules/DashboardV2/components/right/UpcomingMeetingsWidget.tsx
import { useEffect, useState } from 'react'
import { Calendar, Clock, Video, Users, AlertTriangle, RefreshCw } from 'lucide-react'
import { format, parseISO, isAfter, addDays, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../../../../lib/supabase'
import { Skeleton } from '../../../../components/ui/skeleton'

interface Meeting {
  id: string
  content: string
  project_id: string | null
  metadata: {
    start?: string
    end?: string
    location?: string
    attendees?: string[]
  }
}

interface UpcomingMeetingsWidgetProps {
  onNavigateToProject: (id: string) => void
}

export function UpcomingMeetingsWidget({ onNavigateToProject }: UpcomingMeetingsWidgetProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeetings = async () => {
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('project_activities_v2')
        .select('id, content, project_id, metadata')
        .eq('type', 'meeting')
        .order('created_at', { ascending: false })
        .limit(30)

      if (fetchError) throw fetchError

      const now = startOfDay(new Date())
      const limit = addDays(now, 7)

      const upcoming = ((data ?? []) as Meeting[])
        .filter(m => {
          if (!m.metadata?.start) return false
          const d = parseISO(m.metadata.start)
          return isAfter(d, now) && d <= limit
        })
        .sort((a, b) =>
          parseISO(a.metadata.start!).getTime() - parseISO(b.metadata.start!).getTime()
        )
        .slice(0, 5)

      setMeetings(upcoming)
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMeetings() }, [])

  if (loading) return <Skeleton className="h-32 rounded-2xl" />

  return (
    <div className="rounded-2xl bg-gradient-to-br from-surface-2 to-surface-2/50 border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Calendar className="h-4 w-4 text-violet-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Prochains RDV</h3>
        <span className="ml-auto text-xs text-muted-foreground">{meetings.length} cette semaine</span>
      </div>

      {error && (
        <div className="flex items-center justify-between text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Erreur de chargement</span>
          <button onClick={fetchMeetings} className="hover:underline flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />Réessayer
          </button>
        </div>
      )}

      {!error && meetings.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Aucun RDV cette semaine</p>
      )}

      <div className="space-y-2">
        {meetings.map(m => {
          const start = m.metadata.start ? parseISO(m.metadata.start) : null
          const end = m.metadata.end ? parseISO(m.metadata.end) : null
          const isGoogleMeet = m.metadata.location?.includes('meet.google')
          const attendeesCount = m.metadata.attendees?.length ?? 0

          return (
            <button
              key={m.id}
              onClick={() => m.project_id && onNavigateToProject(m.project_id)}
              disabled={!m.project_id}
              className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl bg-surface-1/50 border border-border/30 hover:border-border transition-colors disabled:cursor-default"
            >
              <div className="shrink-0 text-center min-w-[36px]">
                {start && (
                  <>
                    <p className="text-[10px] text-muted-foreground uppercase">{format(start, 'EEE', { locale: fr })}</p>
                    <p className="text-base font-bold text-white leading-none">{format(start, 'd')}</p>
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{m.content}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {start && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {format(start, 'HH:mm')}{end && ` – ${format(end, 'HH:mm')}`}
                    </span>
                  )}
                  {attendeesCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="h-2.5 w-2.5" />{attendeesCount}
                    </span>
                  )}
                  {isGoogleMeet && (
                    <span className="flex items-center gap-1 text-[10px] text-blue-400">
                      <Video className="h-2.5 w-2.5" />Meet
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier le build**

```bash
npm run build
```
Attendu : aucune erreur TypeScript.

- [ ] **Étape 3 : Commit**

```bash
git add src/modules/DashboardV2/components/right/UpcomingMeetingsWidget.tsx
git commit -m "feat(dashboard-v2): UpcomingMeetingsWidget — RDV J+7 compacts"
```

---

## Task 5 : `QuickTasksWidget`

**Fichiers :**
- Créer : `src/modules/DashboardV2/components/right/QuickTasksWidget.tsx`

Tâches du jour. Checkbox inline → `updateTask({ status: 'done' })` immédiat. Optimistic update avec rollback si erreur.

- [ ] **Étape 1 : Créer le fichier**

```typescript
// src/modules/DashboardV2/components/right/QuickTasksWidget.tsx
import { useState } from 'react'
import { CheckSquare, AlertTriangle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '../../../../components/ui/checkbox'
import { Skeleton } from '../../../../components/ui/skeleton'
import { useTasksCRUD } from '../../../../hooks/useSupabaseData'
import { cn } from '../../../../lib/utils'

interface Task {
  id: string
  title: string
  priority?: string
  status: string
  deadline?: string | null
  assigned_to?: string | null
}

interface QuickTasksWidgetProps {
  tasks: Task[]
  loading: boolean
}

export function QuickTasksWidget({ tasks, loading }: QuickTasksWidgetProps) {
  const { updateTask } = useTasksCRUD()
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const handleCheck = async (task: Task) => {
    if (doneIds.has(task.id) || pendingIds.has(task.id)) return

    // Optimistic update
    setDoneIds(prev => new Set(prev).add(task.id))
    setPendingIds(prev => new Set(prev).add(task.id))

    const result = await updateTask(task.id, { status: 'done' })

    setPendingIds(prev => {
      const next = new Set(prev)
      next.delete(task.id)
      return next
    })

    if (!result.success) {
      // Rollback
      setDoneIds(prev => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
      toast.error('Erreur lors de la mise à jour de la tâche')
    }
  }

  if (loading) return <Skeleton className="h-40 rounded-2xl" />

  return (
    <div className="rounded-2xl bg-gradient-to-br from-surface-2 to-surface-2/50 border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckSquare className="h-4 w-4 text-green-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Tâches du jour</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {tasks.filter(t => !doneIds.has(t.id)).length} restante(s)
        </span>
      </div>

      {tasks.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Aucune tâche pour aujourd'hui</p>
      )}

      <div className="space-y-2">
        {tasks.map(task => {
          const isDone = doneIds.has(task.id) || task.status === 'done'
          const isPending = pendingIds.has(task.id)

          return (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-xl border transition-all',
                isDone
                  ? 'bg-surface-1/20 border-border/20 opacity-50'
                  : 'bg-surface-1/50 border-border/30 hover:border-border'
              )}
            >
              <Checkbox
                checked={isDone}
                onCheckedChange={() => handleCheck(task)}
                disabled={isPending || isDone}
                className="shrink-0"
              />
              <span className={cn(
                'text-xs flex-1 text-white',
                isDone && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </span>
              {task.priority === 'urgent' && !isDone && (
                <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
              )}
              {isPending && (
                <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier le build**

```bash
npm run build
```
Attendu : aucune erreur TypeScript.

- [ ] **Étape 3 : Commit**

```bash
git add src/modules/DashboardV2/components/right/QuickTasksWidget.tsx
git commit -m "feat(dashboard-v2): QuickTasksWidget — checkbox inline + optimistic update"
```

---

## Task 6 : `AiSummariesWidget`

**Fichiers :**
- Créer : `src/modules/DashboardV2/components/left/AiSummariesWidget.tsx`

Refactorisation de `AiSummariesSection` en widget autonome. Ajoute indicateur couleur basé sur `completion_score`.

- [ ] **Étape 1 : Créer le fichier**

```typescript
// src/modules/DashboardV2/components/left/AiSummariesWidget.tsx
import { Sparkles, Clock, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '../../../../lib/utils'
import { Skeleton } from '../../../../components/ui/skeleton'
import type { ProjectV2 } from '../../../../types/project-v2'

interface AiSummariesWidgetProps {
  projects: ProjectV2[]
  loading: boolean
  onNavigateToProject: (id: string) => void
}

const BLOCKS = [
  { key: 'situation' as const, label: 'Situation', color: 'text-blue-400' },
  { key: 'action' as const, label: 'En cours', color: 'text-amber-400' },
  { key: 'milestone' as const, label: 'Jalon', color: 'text-green-400' },
]

function scoreColor(score: number) {
  if (score >= 70) return 'bg-green-500/20 border-green-500/30'
  if (score >= 40) return 'bg-amber-500/20 border-amber-500/30'
  return 'bg-red-500/20 border-red-500/30'
}

function scoreTextColor(score: number) {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

export function AiSummariesWidget({ projects, loading, onNavigateToProject }: AiSummariesWidgetProps) {
  const withSummary = projects.filter(p => p.ai_summary !== null)

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-white">Résumés IA</h2>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (withSummary.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-white">Résumés IA — projets actifs</h2>
        <span className="text-xs text-muted-foreground">({withSummary.length})</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {withSummary.map(project => (
          <button
            key={project.id}
            onClick={() => onNavigateToProject(project.id)}
            className="group text-left rounded-2xl bg-gradient-to-br from-surface-2 to-surface-2/50 border border-border/50 p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-semibold text-white truncate pr-2">{project.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full border',
                  scoreColor(project.completion_score),
                  scoreTextColor(project.completion_score)
                )}>
                  {project.completion_score}%
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {project.ai_summary_generated_at && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-2">
                <Clock className="h-2.5 w-2.5" />
                {formatDistanceToNow(parseISO(project.ai_summary_generated_at), { locale: fr, addSuffix: true })}
              </p>
            )}

            <div className="space-y-1.5">
              {BLOCKS.map(block => (
                <div key={block.key}>
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wide', block.color)}>
                    {block.label}
                  </span>
                  <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2 mt-0.5">
                    {project.ai_summary![block.key]}
                  </p>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier le build**

```bash
npm run build
```
Attendu : aucune erreur TypeScript.

- [ ] **Étape 3 : Commit**

```bash
git add src/modules/DashboardV2/components/left/AiSummariesWidget.tsx
git commit -m "feat(dashboard-v2): AiSummariesWidget — résumés IA + indicateur completion_score"
```

---

## Task 7 : `PriorityActionsWidget`

**Fichiers :**
- Créer : `src/modules/DashboardV2/components/left/PriorityActionsWidget.tsx`

Liste d'actions urgentes triées par criticité. Badge type. Bouton action inline.

- [ ] **Étape 1 : Créer le fichier**

```typescript
// src/modules/DashboardV2/components/left/PriorityActionsWidget.tsx
import { AlertTriangle, Briefcase, CheckCircle, FileText, ChevronRight } from 'lucide-react'
import { Badge } from '../../../../components/ui/badge'
import { Skeleton } from '../../../../components/ui/skeleton'
import { cn } from '../../../../lib/utils'
import type { PriorityActionItem } from '../../hooks/useDashboardData'

interface PriorityActionsWidgetProps {
  items: PriorityActionItem[]
  loading: boolean
  onNavigateToProject: (id: string) => void
  onNavigateToLead: (id: string) => void
}

const SEVERITY_STYLES = {
  red: { bar: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-500' },
  orange: { bar: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-500' },
  yellow: { bar: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-500' },
}

const TYPE_CONFIG = {
  projet: { label: 'Projet', icon: Briefcase },
  tache: { label: 'Tâche', icon: CheckCircle },
  devis: { label: 'Devis', icon: FileText },
}

export function PriorityActionsWidget({
  items,
  loading,
  onNavigateToProject,
  onNavigateToLead,
}: PriorityActionsWidgetProps) {
  if (loading) return <Skeleton className="h-48 rounded-2xl" />

  const handleAction = (item: PriorityActionItem) => {
    if (item.projectId) onNavigateToProject(item.projectId)
    else if (item.leadId) onNavigateToLead(item.leadId)
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-surface-2 to-surface-2/50 border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Actions prioritaires</h3>
        <span className="ml-auto text-xs text-muted-foreground">{items.length} item(s)</span>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Aucune action urgente — beau travail !</p>
      )}

      <div className="space-y-2">
        {items.map(item => {
          const styles = SEVERITY_STYLES[item.severity]
          const typeConfig = TYPE_CONFIG[item.type]
          const TypeIcon = typeConfig.icon
          const isActionable = !!(item.projectId || item.leadId)

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl bg-surface-1/50 border border-border/30',
                'relative overflow-hidden'
              )}
            >
              {/* Barre de sévérité */}
              <div className={cn('absolute left-0 top-0 bottom-0 w-1', styles.bar)} />

              <div className={cn('p-1.5 rounded-lg border shrink-0', styles.badge)}>
                <TypeIcon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{item.label}</p>
                {item.subLabel && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.subLabel}</p>
                )}
              </div>

              <Badge
                variant="outline"
                className={cn('text-[10px] shrink-0 border', styles.badge)}
              >
                {typeConfig.label}
              </Badge>

              {isActionable && (
                <button
                  onClick={() => handleAction(item)}
                  className="shrink-0 p-1 rounded-lg hover:bg-surface-1 transition-colors"
                  aria-label={`Aller à ${item.label}`}
                >
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier le build**

```bash
npm run build
```
Attendu : aucune erreur TypeScript.

- [ ] **Étape 3 : Commit**

```bash
git add src/modules/DashboardV2/components/left/PriorityActionsWidget.tsx
git commit -m "feat(dashboard-v2): PriorityActionsWidget — actions urgentes triées par sévérité"
```

---

## Task 8 : `RevenueChartWidget`

**Fichiers :**
- Créer : `src/modules/DashboardV2/components/left/RevenueChartWidget.tsx`

Graphique CA mensuel (Recharts, ligne). Caché sur mobile (`hidden md:block`). Réutilise la logique de `RevenueChart.tsx`.

- [ ] **Étape 1 : Créer le fichier**

```typescript
// src/modules/DashboardV2/components/left/RevenueChartWidget.tsx
import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Skeleton } from '../../../../components/ui/skeleton'

interface RevenueDataPoint {
  monthKey: string
  revenue: number
}

interface RevenueChartWidgetProps {
  data: RevenueDataPoint[]
  loading: boolean
}

export function RevenueChartWidget({ data, loading }: RevenueChartWidgetProps) {
  const chartData = useMemo(() =>
    data.map(d => ({
      month: format(new Date(d.monthKey + '-01'), 'MMM', { locale: fr }),
      fullMonth: format(new Date(d.monthKey + '-01'), 'MMMM yyyy', { locale: fr }),
      revenue: d.revenue,
    })),
    [data]
  )

  if (loading) return <Skeleton className="hidden md:block h-48 rounded-2xl" />

  return (
    <div className="hidden md:block rounded-2xl bg-gradient-to-br from-surface-2 to-surface-2/50 border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <TrendingUp className="h-4 w-4 text-violet-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">CA mensuel</h3>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}k€`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
            formatter={(v: number) => [`${v.toLocaleString('fr-FR')} €`, 'CA']}
            labelFormatter={(_: string, payload: { payload?: { fullMonth: string } }[]) =>
              payload?.[0]?.payload?.fullMonth ?? ''
            }
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#9334e9"
            strokeWidth={2.5}
            dot={{ fill: '#9334e9', r: 3 }}
            activeDot={{ r: 5, fill: '#9334e9' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier le build**

```bash
npm run build
```
Attendu : aucune erreur TypeScript.

- [ ] **Étape 3 : Commit**

```bash
git add src/modules/DashboardV2/components/left/RevenueChartWidget.tsx
git commit -m "feat(dashboard-v2): RevenueChartWidget — graphique CA mensuel Recharts"
```

---

## Task 9 : `BentoGrid` + `index.tsx`

**Fichiers :**
- Créer : `src/modules/DashboardV2/components/BentoGrid.tsx`
- Créer : `src/modules/DashboardV2/index.tsx`

Assemble tous les widgets. Gère le bandeau de déconnexion realtime et le skeleton global.

- [ ] **Étape 1 : Créer `BentoGrid.tsx`**

```typescript
// src/modules/DashboardV2/components/BentoGrid.tsx
import { cn } from '../../../lib/utils'

interface BentoGridProps {
  left: React.ReactNode
  right: React.ReactNode
}

export function BentoGrid({ left, right }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 h-full">
      {/* Mobile : droite en premier */}
      <div className="md:hidden flex flex-col gap-4">{right}</div>
      {/* Colonne gauche */}
      <div className="flex flex-col gap-4">{left}</div>
      {/* Colonne droite — cachée sur mobile (déjà affichée en haut) */}
      <div className="hidden md:flex flex-col gap-4">{right}</div>
    </div>
  )
}
```

- [ ] **Étape 2 : Créer `index.tsx`**

```typescript
// src/modules/DashboardV2/index.tsx
import { useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Zap } from 'lucide-react'
import { BentoGrid } from './components/BentoGrid'
import { KpiStatsWidget } from './components/right/KpiStatsWidget'
import { UpcomingMeetingsWidget } from './components/right/UpcomingMeetingsWidget'
import { QuickTasksWidget } from './components/right/QuickTasksWidget'
import { AiSummariesWidget } from './components/left/AiSummariesWidget'
import { PriorityActionsWidget } from './components/left/PriorityActionsWidget'
import { RevenueChartWidget } from './components/left/RevenueChartWidget'
import { useDashboardData } from './hooks/useDashboardData'
import { useDashboardRealtime } from './hooks/useDashboardRealtime'

export function DashboardV2() {
  const data = useDashboardData()

  const onRefresh = useCallback(() => {
    // Les hooks React Query / Supabase se rechargent au prochain rendu
    // Si un refetch explicite est nécessaire, l'ajouter ici
  }, [])

  const { isConnected, lastUpdatedAt } = useDashboardRealtime(onRefresh)

  const leftColumn = (
    <>
      <PriorityActionsWidget
        items={data.priorityActions}
        loading={data.loading}
        onNavigateToProject={data.handleNavigateToProject}
        onNavigateToLead={data.handleNavigateToLead}
      />
      <AiSummariesWidget
        projects={data.aiProjects}
        loading={data.loading}
        onNavigateToProject={data.handleNavigateToProject}
      />
      <RevenueChartWidget
        data={data.revenueChartData}
        loading={data.loading}
      />
    </>
  )

  const rightColumn = (
    <>
      <KpiStatsWidget kpis={data.kpis} loading={data.loading} />
      <UpcomingMeetingsWidget onNavigateToProject={data.handleNavigateToProject} />
      <QuickTasksWidget tasks={data.todayTasksList as any[]} loading={data.loading} />
    </>
  )

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 h-full overflow-auto">
      {/* Bandeau realtime déconnecté */}
      {!isConnected && lastUpdatedAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-2 border border-border/50 rounded-xl px-3 py-2">
          <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>
            Données en temps réel indisponibles — dernière mise à jour{' '}
            {formatDistanceToNow(lastUpdatedAt, { locale: fr, addSuffix: true })}
          </span>
        </div>
      )}

      <BentoGrid left={leftColumn} right={rightColumn} />
    </div>
  )
}
```

- [ ] **Étape 3 : Vérifier le build**

```bash
npm run build
```
Attendu : aucune erreur TypeScript.

- [ ] **Étape 4 : Commit**

```bash
git add src/modules/DashboardV2/
git commit -m "feat(dashboard-v2): BentoGrid + index.tsx — assemblage complet du module"
```

---

## Task 10 : Intégration dans Layout + Sidebar

**Fichiers :**
- Modifier : `src/components/layout/Layout.tsx`
- Modifier : `src/components/layout/Sidebar.tsx`

- [ ] **Étape 1 : Ajouter l'import lazy dans `Layout.tsx`**

Ajouter après la ligne `const ProjectsManagerV2 = lazy(...)` (ligne ~29) :

```typescript
const DashboardV2 = lazy(() => import('../../modules/DashboardV2').then(m => ({ default: m.DashboardV2 })))
```

- [ ] **Étape 2 : Ajouter le `case` dans le switch de Layout.tsx**

Dans le switch `activeModule` (après `case 'projects-v2':`) :

```typescript
case 'dashboard-v2':
  return <DashboardV2 />
```

- [ ] **Étape 3 : Ajouter la permission dans la map de permissions (Layout.tsx)**

Dans l'objet `modulePermissions` (ligne ~100) :

```typescript
'dashboard-v2': 'can_view_dashboard',
```

Et dans le tableau des modules autorisés (ligne ~115) :

```typescript
'dashboard-v2',
```

- [ ] **Étape 4 : Ajouter le lien dans la Sidebar**

Dans `v2Section.items` (après `projects-v2`) :

```typescript
{ id: 'dashboard-v2', label: 'Dashboard V2', icon: LayoutDashboard, permission: 'can_view_dashboard' },
```

Ajouter `LayoutDashboard` aux imports lucide si nécessaire :
```typescript
import { ..., LayoutDashboard } from 'lucide-react'
```

- [ ] **Étape 5 : Vérifier le build**

```bash
npm run build
```
Attendu : aucune erreur TypeScript.

- [ ] **Étape 6 : Vérifier visuellement**

```bash
npm run dev
```

Ouvrir `http://localhost:5173`, cliquer sur "Dashboard V2" dans la sidebar :
- [ ] Bento grid s'affiche (2 colonnes desktop, 1 colonne mobile)
- [ ] KPIs affichent des valeurs (ou skeleton pendant le chargement)
- [ ] Pas d'erreur dans la console

- [ ] **Étape 7 : Commit final**

```bash
git add src/components/layout/Layout.tsx src/components/layout/Sidebar.tsx
git commit -m "feat(dashboard-v2): intégration Layout + Sidebar — module accessible via navigation"
```

---

## Vérification finale (Self-Review)

### Couverture du spec

| Exigence spec | Tâche |
|---|---|
| Bento grid `grid-cols-[2fr_1fr]` | Task 9 — BentoGrid.tsx |
| Mobile : colonne droite en premier | Task 9 — BentoGrid.tsx (ordre DOM) |
| `useDashboardRealtime` 1 seul WS | Task 2 |
| `KpiStatsWidget` 4 KPIs + Framer Motion | Task 3 |
| `UpcomingMeetingsWidget` J+7 | Task 4 |
| `QuickTasksWidget` checkbox + optimistic | Task 5 |
| `AiSummariesWidget` completion_score couleur | Task 6 |
| `PriorityActionsWidget` completion_score < 50 + overdue | Task 7 |
| `RevenueChartWidget` caché mobile | Task 8 |
| Skeleton par widget | Tasks 3-8 (chaque widget a son Skeleton) |
| Bandeau realtime déconnecté | Task 9 — index.tsx |
| Optimistic update + rollback + toast | Task 5 |
| Navigation `handleNavigateToProject` | Task 1 |
| Navigation `handleNavigateToLead` | Task 1 |
| Module autonome (pas toucher Dashboard/) | Toutes tâches — import séparés |
| Layout integration | Task 10 |

### Points d'attention

- `useProjectsV2` est dans `src/modules/ProjectsManagerV2/hooks/` — import cross-module intentionnel, conforme au spec
- `useSupabaseTasks()` retourne `data` qui peut être `null` — protégé avec `?? []`
- `useSupabaseLeads()` expose `count` directement (pas `data.length`)
- L'`AccountingEntry.amount` peut être string ou number selon la DB — protégé avec `Number(...)`
- Le `case 'dashboard-v2'` doit aussi être dans les modules permittés du Layout (tableau ligne ~115)
