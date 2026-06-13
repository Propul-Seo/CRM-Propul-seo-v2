# Sprint 1 — Prochaine action Kanban + Automatisations statut

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher une "prochaine action" sur les cartes Kanban et déclencher des automatisations (tâches + journal) lors des changements de statut.

**Architecture:** Deux migrations SQL indépendantes, un service pur (`automationService.ts`) appelé par `useProjectsV2`, un utilitaire de couleur, et deux composants React (card éditable + badge carte).

**Tech Stack:** React 18 · TypeScript · Supabase (direct client) · date-fns · Tailwind CSS · shadcn/ui

---

## Fichiers concernés

| Action | Chemin |
|--------|--------|
| Créer  | `supabase/migrations/20260406_sprint1_next_action_automations.sql` |
| Créer  | `src/utils/nextAction.ts` |
| Créer  | `src/services/automationService.ts` |
| Créer  | `src/modules/ProjectDetailsV2/components/NextActionCard.tsx` |
| Modifier | `src/types/project-v2.ts` |
| Modifier | `src/modules/ProjectDetailsV2/components/ProjectOverview.tsx` |
| Modifier | `src/modules/ProjectsManagerV2/components/ProjectCardV2.tsx` |
| Modifier | `src/modules/ProjectsManagerV2/hooks/useProjectsV2.ts` |

---

## Task 1 : Migration SQL

**Files:**
- Create: `supabase/migrations/20260406_sprint1_next_action_automations.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- Migration Sprint 1 : Prochaine action + Automation logs
-- Feature 2 — champs "prochaine action" sur projects_v2
ALTER TABLE projects_v2 ADD COLUMN IF NOT EXISTS next_action_label TEXT;
ALTER TABLE projects_v2 ADD COLUMN IF NOT EXISTS next_action_due DATE;

-- Feature 5 — table d'audit des automatisations
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects_v2(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL,  -- 'status_change'
  from_value TEXT,
  to_value TEXT,
  actions_executed JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes par projet
CREATE INDEX IF NOT EXISTS automation_logs_project_id_idx ON automation_logs(project_id);
```

- [ ] **Step 2 : Appliquer via MCP Supabase**

Utilise l'outil `mcp__plugin_supabase_supabase__apply_migration` avec le contenu ci-dessus et le nom `20260406_sprint1_next_action_automations`.

- [ ] **Step 3 : Vérifier les colonnes**

Utilise `mcp__plugin_supabase_supabase__execute_sql` :
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects_v2'
  AND column_name IN ('next_action_label', 'next_action_due');
```
Résultat attendu : 2 lignes (`text`, `date`).

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260406_sprint1_next_action_automations.sql
git commit -m "feat(db): add next_action fields + automation_logs table"
```

---

## Task 2 : Mise à jour du type `ProjectV2`

**Files:**
- Modify: `src/types/project-v2.ts:23-46`

- [ ] **Step 1 : Ajouter les deux champs optionnels à `ProjectV2`**

Dans `src/types/project-v2.ts`, ajouter après la ligne `is_archived`:

```typescript
  // Prochaine action (Feature 2)
  next_action_label: string | null
  next_action_due: string | null   // format ISO date "YYYY-MM-DD"
```

L'interface complète devient :

```typescript
export interface ProjectV2 {
  id: string
  user_id: string | null
  client_id: string | null
  client_name?: string | null
  name: string
  description: string | null
  status: ProjectStatusV2
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  assigned_name?: string | null
  start_date: string
  end_date: string | null
  budget: number | null
  progress: number
  category: string
  presta_type: PrestaType[]
  completion_score: number
  last_activity_at: string | null
  completed_at: string | null
  is_archived: boolean
  next_action_label: string | null
  next_action_due: string | null
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main && npx tsc --noEmit 2>&1 | head -20
```

Résultat attendu : aucune erreur liée à `next_action_label` ou `next_action_due`.

- [ ] **Step 3 : Commit**

```bash
git add src/types/project-v2.ts
git commit -m "feat(types): add next_action_label and next_action_due to ProjectV2"
```

---

## Task 3 : Utilitaire `getActionDueColor`

**Files:**
- Create: `src/utils/nextAction.ts`

- [ ] **Step 1 : Créer le fichier**

```typescript
// src/utils/nextAction.ts
import { differenceInDays, parseISO } from 'date-fns'

/**
 * Retourne les classes Tailwind pour colorer la date d'échéance.
 * - Rouge  : échéance dépassée ou aujourd'hui
 * - Orange : dans 1-3 jours
 * - Vert   : dans plus de 3 jours
 * - Gris   : pas de date
 */
export function getActionDueColor(due: string | null): string {
  if (!due) return 'text-muted-foreground'
  const days = differenceInDays(parseISO(due), new Date())
  if (days < 0) return 'text-red-400 bg-red-500/10'
  if (days <= 3) return 'text-amber-400 bg-amber-500/10'
  return 'text-green-400 bg-green-500/10'
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main && npx tsc --noEmit 2>&1 | head -10
```

Résultat attendu : 0 erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/utils/nextAction.ts
git commit -m "feat(utils): add getActionDueColor utility"
```

---

## Task 4 : Composant `NextActionCard`

**Files:**
- Create: `src/modules/ProjectDetailsV2/components/NextActionCard.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/modules/ProjectDetailsV2/components/NextActionCard.tsx
import { useState } from 'react'
import { CalendarClock, Pencil, Check, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { getActionDueColor } from '../../../utils/nextAction'
import type { ProjectV2 } from '../../../types/project-v2'

interface NextActionCardProps {
  project: ProjectV2
  onUpdate: (updates: { next_action_label: string | null; next_action_due: string | null }) => Promise<void>
}

export function NextActionCard({ project, onUpdate }: NextActionCardProps) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(project.next_action_label ?? '')
  const [due, setDue] = useState(project.next_action_due ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onUpdate({
      next_action_label: label.trim() || null,
      next_action_due: due || null,
    })
    setSaving(false)
    setEditing(false)
  }

  const handleCancel = () => {
    setLabel(project.next_action_label ?? '')
    setDue(project.next_action_due ?? '')
    setEditing(false)
  }

  const colorClass = getActionDueColor(project.next_action_due)

  return (
    <Card className="bg-surface-2 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            Prochaine action
          </CardTitle>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded hover:bg-surface-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ex : Envoyer maquettes v2"
              className="w-full text-sm bg-surface-3 border border-border rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="date"
              value={due}
              onChange={e => setDue(e.target.value)}
              className="w-full text-sm bg-surface-3 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Check className="h-3 w-3" />
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-surface-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />Annuler
              </button>
            </div>
          </div>
        ) : project.next_action_label ? (
          <div>
            <p className="text-sm text-foreground font-medium">{project.next_action_label}</p>
            {project.next_action_due && (
              <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                {format(parseISO(project.next_action_due), 'd MMM yyyy', { locale: fr })}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">— Aucune action définie</p>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main && npx tsc --noEmit 2>&1 | head -20
```

Résultat attendu : 0 erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/ProjectDetailsV2/components/NextActionCard.tsx
git commit -m "feat(ui): add NextActionCard component"
```

---

## Task 5 : Intégrer `NextActionCard` dans `ProjectOverview`

**Files:**
- Modify: `src/modules/ProjectDetailsV2/components/ProjectOverview.tsx`

- [ ] **Step 1 : Remplacer le placeholder par `NextActionCard`**

Remplacer l'intégralité de `src/modules/ProjectDetailsV2/components/ProjectOverview.tsx` par :

```tsx
import { Euro, User, Calendar, TrendingUp, CheckSquare } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { ProjectStatusBadge } from '../../ProjectsManagerV2/components/ProjectStatusBadge'
import { PrestaList } from '../../ProjectsManagerV2/components/PrestaBadge'
import { CompletionScore } from '../../ProjectsManagerV2/components/CompletionScore'
import { DeadlineBadge } from '../../ProjectsManagerV2/components/DeadlineBadge'
import { NextActionCard } from './NextActionCard'
import { useProjectsV2Context } from '../../ProjectsManagerV2/context/ProjectsV2Context'
import type { ProjectV2 } from '../../../types/project-v2'

interface ProjectOverviewProps {
  project: ProjectV2
}

function MetricCard({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: React.ReactNode
}) {
  return (
    <div className="bg-surface-2 rounded-lg p-3 border border-border">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const { updateProject } = useProjectsV2Context()

  const formatDate = (d: string | null) =>
    d ? format(parseISO(d), 'd MMM yyyy', { locale: fr }) : '—'

  const handleNextActionUpdate = async (updates: {
    next_action_label: string | null
    next_action_due: string | null
  }) => {
    await updateProject(project.id, updates)
  }

  return (
    <div className="space-y-4">
      {/* En-tête projet */}
      <Card className="bg-surface-2 border-border">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-1">{project.name}</h2>
              {project.client_name && (
                <p className="text-sm text-muted-foreground mb-2">{project.client_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <ProjectStatusBadge status={project.status} />
                {project.presta_type.length > 0 && (
                  <PrestaList types={project.presta_type} size="md" />
                )}
              </div>
              {project.description && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
            <CompletionScore score={project.completion_score} size={64} showLabel />
          </div>
        </CardContent>
      </Card>

      {/* Métriques rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={Euro}
          label="Budget"
          value={project.budget ? `${project.budget.toLocaleString('fr-FR')} €` : '—'}
          sub="Budget total"
        />
        <MetricCard
          icon={TrendingUp}
          label="Progression"
          value={`${project.progress}%`}
          sub="Avancement général"
        />
        <MetricCard
          icon={CheckSquare}
          label="Score"
          value={`${project.completion_score}%`}
          sub="Complétude projet"
        />
        <MetricCard
          icon={Calendar}
          label="Échéance"
          value={formatDate(project.end_date)}
          sub={project.end_date ? <DeadlineBadge endDate={project.end_date} /> : '—'}
        />
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-surface-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Équipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {project.assigned_name ?? 'Non assigné'}
                </p>
                <p className="text-xs text-muted-foreground">Responsable</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Début</span>
              <span className="text-foreground font-medium">{formatDate(project.start_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fin prévue</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">{formatDate(project.end_date)}</span>
                {project.end_date && <DeadlineBadge endDate={project.end_date} />}
              </div>
            </div>
            {project.last_activity_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dernière activité</span>
                <span className="text-foreground font-medium">{formatDate(project.last_activity_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prochaine action */}
      <NextActionCard project={project} onUpdate={handleNextActionUpdate} />
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main && npx tsc --noEmit 2>&1 | head -20
```

Résultat attendu : 0 erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/ProjectDetailsV2/components/ProjectOverview.tsx
git commit -m "feat(overview): integrate NextActionCard in ProjectOverview"
```

---

## Task 6 : Badge "Prochaine action" sur `ProjectCardV2`

**Files:**
- Modify: `src/modules/ProjectsManagerV2/components/ProjectCardV2.tsx`

- [ ] **Step 1 : Ajouter l'import et la section dans la carte**

Remplacer l'intégralité de `src/modules/ProjectsManagerV2/components/ProjectCardV2.tsx` par :

```tsx
import { memo } from 'react'
import { GripVertical, Euro, User, Eye, Edit, Trash2 } from 'lucide-react'
import { formatDistanceToNow, parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ProjectV2 } from '../../../types/project-v2'
import { DeadlineBadge } from './DeadlineBadge'
import { PrestaList } from './PrestaBadge'
import { CompletionScore } from './CompletionScore'
import { getActionDueColor } from '../../../utils/nextAction'

interface ProjectCardV2Props {
  project: ProjectV2
  isDragging?: boolean
  onView?: (project: ProjectV2) => void
  onEdit?: (project: ProjectV2) => void
  onDelete?: (project: ProjectV2) => void
}

export const ProjectCardV2 = memo(function ProjectCardV2({
  project, isDragging = false, onView, onEdit, onDelete,
}: ProjectCardV2Props) {
  const lastActivity = project.last_activity_at
    ? formatDistanceToNow(parseISO(project.last_activity_at), { addSuffix: true, locale: fr })
    : null

  const actionDueColor = getActionDueColor(project.next_action_due)

  return (
    <div className={`bg-surface-2 border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-200 group
      ${isDragging ? 'shadow-xl rotate-2 scale-105 opacity-90 ring-1 ring-primary/50' : 'hover:border-border/80 hover:shadow-md'}`}>

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          {project.presta_type.length > 0 && <PrestaList types={project.presta_type} size="sm" />}
        </div>
        <CompletionScore score={project.completion_score} size={32} />
      </div>

      <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 mb-0.5">{project.name}</p>
      {project.client_name && <p className="text-xs text-muted-foreground mb-2 truncate">{project.client_name}</p>}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
        {project.budget !== null && (
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Euro className="h-3 w-3" />{project.budget.toLocaleString('fr-FR')}
          </span>
        )}
        {project.assigned_name && (
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground truncate max-w-[100px]">
            <User className="h-3 w-3 shrink-0" />{project.assigned_name}
          </span>
        )}
        {project.end_date && <DeadlineBadge endDate={project.end_date} />}
      </div>

      {lastActivity && <p className="text-[10px] text-muted-foreground/60 mb-2 truncate">Activité {lastActivity}</p>}

      {/* Prochaine action */}
      <div className="border-t border-border/40 pt-1.5 mt-1">
        {project.next_action_label ? (
          <div className="flex items-center justify-between gap-1">
            <p className="text-[10px] text-muted-foreground truncate flex-1">{project.next_action_label}</p>
            {project.next_action_due && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${actionDueColor}`}>
                {format(parseISO(project.next_action_due), 'd MMM', { locale: fr })}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/40">— Aucune action</p>
        )}
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
        {onView && (
          <button onClick={(e) => { e.stopPropagation(); onView(project) }}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-1 rounded bg-surface-3 hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors">
            <Eye className="h-3 w-3" />Voir
          </button>
        )}
        {onEdit && (
          <button onClick={(e) => { e.stopPropagation(); onEdit(project) }}
            className="flex items-center justify-center p-1 rounded bg-surface-3 hover:bg-blue-500/20 hover:text-blue-300 text-muted-foreground transition-colors">
            <Edit className="h-3 w-3" />
          </button>
        )}
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(project) }}
            className="flex items-center justify-center p-1 rounded bg-surface-3 hover:bg-red-500/20 hover:text-red-300 text-muted-foreground transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
})
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main && npx tsc --noEmit 2>&1 | head -20
```

Résultat attendu : 0 erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/ProjectsManagerV2/components/ProjectCardV2.tsx
git commit -m "feat(kanban): show next_action badge on project cards"
```

---

## Task 7 : Service `automationService`

**Files:**
- Create: `src/services/automationService.ts`

- [ ] **Step 1 : Créer le service**

```typescript
// src/services/automationService.ts
import { supabase } from '../lib/supabase'
import type { ProjectStatusV2 } from '../types/project-v2'

// Règles d'automatisation — correspondance avec les statuts V2 du Kanban
// prospect | brief_received | quote_sent | in_progress | review | delivered | maintenance | on_hold | closed

const AUTOMATION_RULES: Array<{
  from: ProjectStatusV2 | '*'
  to: ProjectStatusV2
  tasks: Array<{ title: string; phase: string; priority: 'low' | 'medium' | 'high' }>
  journal: Array<{ content: string }>
}> = [
  {
    from: 'brief_received', to: 'quote_sent',
    tasks: [{ title: 'Envoyer le devis', phase: 'onboarding', priority: 'high' }],
    journal: [],
  },
  {
    from: 'quote_sent', to: 'in_progress',
    tasks: [{ title: 'Kick-off planifié', phase: 'onboarding', priority: 'high' }],
    journal: [{ content: 'Projet démarré' }],
  },
  {
    from: 'in_progress', to: 'review',
    tasks: [{ title: 'Envoyer livrable pour recette', phase: 'recette', priority: 'high' }],
    journal: [],
  },
  {
    from: 'review', to: 'delivered',
    tasks: [{ title: 'Demander validation écrite', phase: 'post_livraison', priority: 'high' }],
    journal: [{ content: 'Livraison effectuée' }],
  },
  {
    from: 'delivered', to: 'closed',
    tasks: [{ title: "Vérifier l'encaissement", phase: 'post_livraison', priority: 'high' }],
    journal: [{ content: 'Projet clôturé' }],
  },
  {
    from: '*', to: 'on_hold',
    tasks: [],
    journal: [{ content: 'Projet mis en pause' }],
  },
]

export async function triggerStatusAutomations(
  projectId: string,
  fromStatus: ProjectStatusV2,
  toStatus: ProjectStatusV2,
): Promise<void> {
  const matchingRules = AUTOMATION_RULES.filter(
    r => (r.from === fromStatus || r.from === '*') && r.to === toStatus,
  )
  if (matchingRules.length === 0) return

  const actionsExecuted: unknown[] = []

  for (const rule of matchingRules) {
    // Créer les tâches checklist automatiques
    for (const task of rule.tasks) {
      await supabase.from('checklist_items_v2').insert({
        project_id: projectId,
        title: task.title,
        phase: task.phase,
        status: 'todo',
        priority: task.priority,
        parent_task_id: null,
        sort_order: 9999,
      })
      actionsExecuted.push({ type: 'checklist_task', title: task.title })
    }

    // Créer les entrées journal automatiques
    for (const entry of rule.journal) {
      await supabase.from('project_activities_v2').insert({
        project_id: projectId,
        type: 'status',
        content: entry.content,
        is_auto: true,
        metadata: {
          automation: 'status_change',
          from: fromStatus,
          to: toStatus,
        },
      })
      actionsExecuted.push({ type: 'journal_entry', content: entry.content })
    }
  }

  // Enregistrer dans automation_logs pour audit
  await supabase.from('automation_logs').insert({
    project_id: projectId,
    trigger_type: 'status_change',
    from_value: fromStatus,
    to_value: toStatus,
    actions_executed: actionsExecuted,
  })
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main && npx tsc --noEmit 2>&1 | head -20
```

Résultat attendu : 0 erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/services/automationService.ts
git commit -m "feat(service): add triggerStatusAutomations service"
```

---

## Task 8 : Intégrer les automatisations dans `useProjectsV2`

**Files:**
- Modify: `src/modules/ProjectsManagerV2/hooks/useProjectsV2.ts`

- [ ] **Step 1 : Ajouter l'import et appeler `triggerStatusAutomations`**

Remplacer l'intégralité de `src/modules/ProjectsManagerV2/hooks/useProjectsV2.ts` par :

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { triggerStatusAutomations } from '../../../services/automationService'
import type { ProjectV2, ProjectStatusV2 } from '../../../types/project-v2'

interface UseProjectsV2Return {
  projects: ProjectV2[]
  loading: boolean
  updateProjectStatus: (id: string, newStatus: ProjectStatusV2) => Promise<void>
  updateProject: (id: string, updates: Partial<ProjectV2>) => Promise<void>
  addProject: (data: Omit<ProjectV2, 'id' | 'created_at' | 'updated_at'>) => Promise<ProjectV2 | null>
  deleteProject: (id: string) => Promise<void>
  getProjectById: (id: string) => ProjectV2 | undefined
  refetch: () => void
}

export function useProjectsV2(): UseProjectsV2Return {
  const [projects, setProjects] = useState<ProjectV2[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects_v2')
      .select('*')
      .eq('is_archived', false)
      .order('last_activity_at', { ascending: false })
    if (!error && data) setProjects(data as ProjectV2[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const updateProjectStatus = useCallback(async (id: string, newStatus: ProjectStatusV2) => {
    const fromStatus = projects.find(p => p.id === id)?.status
    const { data, error } = await supabase
      .from('projects_v2')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setProjects(prev => prev.map(p => p.id === id ? data as ProjectV2 : p))
      // Déclencher les automatisations en arrière-plan (ne bloque pas l'UI)
      if (fromStatus && fromStatus !== newStatus) {
        triggerStatusAutomations(id, fromStatus, newStatus).catch(err =>
          console.error('[automation] triggerStatusAutomations failed:', err)
        )
      }
    }
  }, [projects])

  const updateProject = useCallback(async (id: string, updates: Partial<ProjectV2>) => {
    const { data, error } = await supabase
      .from('projects_v2')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setProjects(prev => prev.map(p => p.id === id ? data as ProjectV2 : p))
    }
  }, [])

  const addProject = useCallback(async (projectData: Omit<ProjectV2, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectV2 | null> => {
    const { data, error } = await supabase
      .from('projects_v2')
      .insert(projectData)
      .select()
      .single()
    if (error) {
      console.error('[addProject] Supabase error:', error)
      return null
    }
    if (data) {
      setProjects(prev => [data as ProjectV2, ...prev])
      return data as ProjectV2
    }
    return null
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.from('projects_v2').delete().eq('id', id)
    if (!error) setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  const getProjectById = useCallback((id: string) => {
    return projects.find(p => p.id === id)
  }, [projects])

  return {
    projects, loading,
    updateProjectStatus, updateProject, addProject, deleteProject, getProjectById,
    refetch: fetchProjects,
  }
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main && npx tsc --noEmit 2>&1 | head -20
```

Résultat attendu : 0 erreur.

- [ ] **Step 3 : Build complet**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main && npm run build 2>&1 | tail -20
```

Résultat attendu : `✓ built in Xs` sans erreur.

- [ ] **Step 4 : Commit final**

```bash
git add src/modules/ProjectsManagerV2/hooks/useProjectsV2.ts
git commit -m "feat(automation): trigger status automations on kanban drag & drop"
```

---

## Récapitulatif

| Feature | Tâches | Statut |
|---------|--------|--------|
| F2 — Prochaine action | Tasks 1-6 | — |
| F5 — Automatisations statut | Tasks 1 (migration), 7-8 | — |

**Vérification manuelle après implémentation :**
1. Ouvrir un projet → onglet Vue d'ensemble → cliquer l'icône crayon → saisir une action + date → Enregistrer
2. Vérifier que la carte Kanban affiche l'action avec la bonne couleur (vert/orange/rouge)
3. Glisser-déposer une carte de `brief_received` vers `quote_sent` → vérifier dans l'onglet Checklist qu'une tâche "Envoyer le devis" est apparue
4. Glisser vers `on_hold` → vérifier dans l'onglet Journal qu'une entrée "Projet mis en pause" est présente avec `is_auto = true`
