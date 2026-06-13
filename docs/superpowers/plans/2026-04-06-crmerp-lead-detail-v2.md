# CRM ERP Lead Detail V2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduire le design Figma HubSpot CRM adapté au thème dark violet de Propulseo — 3 colonnes (sidebar gauche, contenu principal avec onglets + timeline, sidebar droite).

**Architecture:** Le `CRMERPLeadDetailsPage` est entièrement réécrit en layout 3 colonnes. Chaque colonne est un composant autonome. La logique de données reste inchangée (hooks existants). Aucune migration DB requise.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, shadcn/ui (Card, Badge, Button, Input), lucide-react, date-fns/fr

**Design de référence :** `docs/preview-lolett-crm.html` + screenshot Figma `zcAzH3d498OynorwG7QqyK` node `1:3892`

---

## File Map

### Fichiers modifiés
- `src/modules/CRMERPLeadDetails/CRMERPLeadDetailsPage.tsx` — layout 3 colonnes, remplace l'actuel
- `src/modules/CRMERPLeadDetails/components/LeadActivities.tsx` — remplacé par ActivityTimeline

### Fichiers créés
- `src/modules/CRMERPLeadDetails/components/LeadLeftSidebar.tsx` — colonne gauche complète
- `src/modules/CRMERPLeadDetails/components/QuickActionBar.tsx` — boutons Note/E-mail/Appel/Tâche/Réunion
- `src/modules/CRMERPLeadDetails/components/ActivityFilterBar.tsx` — search + filtres type/date
- `src/modules/CRMERPLeadDetails/components/ActivityTimeline.tsx` — timeline groupée par date
- `src/modules/CRMERPLeadDetails/components/LeadRightSidebar.tsx` — contacts + pipeline stage

---

## Task 1 : Layout 3 colonnes

**Fichiers :**
- Modifier : `src/modules/CRMERPLeadDetails/CRMERPLeadDetailsPage.tsx`

- [ ] **Réécrire CRMERPLeadDetailsPage avec le layout 3 colonnes**

```tsx
// src/modules/CRMERPLeadDetails/CRMERPLeadDetailsPage.tsx
import { LeadLeftSidebar } from './components/LeadLeftSidebar'
import { LeadRightSidebar } from './components/LeadRightSidebar'
import { ActivityFilterBar } from './components/ActivityFilterBar'
import { ActivityTimeline } from './components/ActivityTimeline'
import { QuickActionBar } from './components/QuickActionBar'
import { useState } from 'react'
import type { CRMERPLead, CRMERPActivity, ActivityType } from './types'

interface User { id: string; name: string; email: string }

interface Props {
  lead: CRMERPLead
  activities: CRMERPActivity[]
  users: User[]
  onBack: () => void
  onEdit: () => void
  onAssign: (userId: string | null) => void
  onAddActivity: (type: ActivityType, content: string) => Promise<void>
  onUpdateActivity: (id: string, updates: { type?: ActivityType; content?: string }) => Promise<void>
  onDeleteActivity: (id: string) => Promise<void>
}

export function CRMERPLeadDetailsPage({
  lead, activities, users,
  onBack, onEdit, onAssign,
  onAddActivity, onUpdateActivity, onDeleteActivity,
}: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all')

  const filtered = activities.filter(a => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    if (search && !a.content?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col h-screen bg-surface-0 overflow-hidden">
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-surface-1 border-b border-border/50 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Retour
        </button>
        <span className="text-border/60">/</span>
        <span className="text-xs font-medium text-foreground truncate">
          {lead.company_name || lead.contact_name || 'Lead'}
        </span>
      </div>

      {/* 3-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Colonne gauche */}
        <div className="w-[300px] shrink-0 border-r border-border/50 overflow-y-auto bg-surface-1">
          <LeadLeftSidebar lead={lead} users={users} onEdit={onEdit} onAssign={onAssign} />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <QuickActionBar onAdd={onAddActivity} />
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <ActivityFilterBar
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              total={activities.length}
              filtered={filtered.length}
            />
            <ActivityTimeline
              activities={filtered}
              onUpdate={onUpdateActivity}
              onDelete={onDeleteActivity}
            />
          </div>
        </div>

        {/* Colonne droite */}
        <div className="w-[280px] shrink-0 border-l border-border/50 overflow-y-auto bg-surface-1">
          <LeadRightSidebar lead={lead} users={users} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Commit**
```bash
git add src/modules/CRMERPLeadDetails/CRMERPLeadDetailsPage.tsx
git commit -m "refactor(crmerp): layout 3 colonnes — structure de base"
```

---

## Task 2 : LeadLeftSidebar

**Fichiers :**
- Créer : `src/modules/CRMERPLeadDetails/components/LeadLeftSidebar.tsx`

- [ ] **Créer le composant**

```tsx
// src/modules/CRMERPLeadDetails/components/LeadLeftSidebar.tsx
import { Building2, User, Mail, Phone, Globe, Calendar, Tag, UserCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { CRMERPLead, CRMERPStatus } from '../types'
import { CRMERP_STATUS_LABELS, CRMERP_STATUS_COLORS } from '../types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User { id: string; name: string; email: string }

interface Props {
  lead: CRMERPLead
  users: User[]
  onEdit: () => void
  onAssign: (userId: string | null) => void
}

const STATUS_ORDER: CRMERPStatus[] = ['leads_contactes', 'rendez_vous_effectues', 'en_attente', 'signes']

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/40 py-4 px-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={cn('text-xs font-medium mt-0.5', value ? 'text-foreground' : 'text-muted-foreground italic')}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

export function LeadLeftSidebar({ lead, users, onEdit, onAssign }: Props) {
  const statusConf = CRMERP_STATUS_COLORS[lead.status]
  const statusLabel = CRMERP_STATUS_LABELS[lead.status]
  const currentStep = STATUS_ORDER.indexOf(lead.status)

  return (
    <div className="flex flex-col">
      {/* En-tête identité */}
      <div className="px-4 pt-5 pb-4 border-b border-border/40">
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs h-7 text-muted-foreground">
            Modifier
          </Button>
        </div>
        <h2 className="text-sm font-bold text-foreground leading-tight">
          {lead.company_name || lead.contact_name || 'Lead sans nom'}
        </h2>
        {lead.company_name && lead.contact_name && (
          <p className="text-xs text-muted-foreground mt-0.5">{lead.contact_name}</p>
        )}
        <span className={cn('inline-flex mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full', statusConf.badge)}>
          {statusLabel}
        </span>
      </div>

      {/* Pipeline steps */}
      <div className="px-4 py-3 border-b border-border/40">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Étape du pipeline</p>
        <div className="flex gap-1">
          {STATUS_ORDER.map((s, i) => (
            <div
              key={s}
              title={CRMERP_STATUS_LABELS[s]}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all',
                i <= currentStep ? 'bg-primary' : 'bg-border/40'
              )}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">{currentStep + 1}/4 — {statusLabel}</p>
      </div>

      {/* Informations */}
      <SidebarSection title="À propos">
        <InfoRow icon={Mail} label="Email" value={lead.email} />
        <InfoRow icon={Phone} label="Téléphone" value={lead.phone} />
        <InfoRow icon={Globe} label="Source" value={lead.source} />
        <InfoRow icon={Calendar} label="Créé le" value={
          new Date(lead.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        } />
        {lead.last_activity_at && (
          <InfoRow icon={Tag} label="Dernière activité" value={
            formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true, locale: fr })
          } />
        )}
      </SidebarSection>

      {/* Notes */}
      {lead.notes && (
        <SidebarSection title="Notes">
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
        </SidebarSection>
      )}

      {/* Responsable */}
      <SidebarSection title="Responsable">
        <div className="flex items-center gap-2 mb-2">
          <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-foreground font-medium">
            {lead.assignee?.name ?? <span className="italic text-muted-foreground">Non assigné</span>}
          </p>
        </div>
        <Select
          value={lead.assignee_id ?? ''}
          onValueChange={v => onAssign(v || null)}
        >
          <SelectTrigger className="h-7 text-xs bg-surface-2 border-border/50">
            <SelectValue placeholder="Choisir un responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Non assigné</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarSection>
    </div>
  )
}
```

- [ ] **Commit**
```bash
git add src/modules/CRMERPLeadDetails/components/LeadLeftSidebar.tsx
git commit -m "feat(crmerp): LeadLeftSidebar — identité, pipeline steps, infos, responsable"
```

---

## Task 3 : QuickActionBar

**Fichiers :**
- Créer : `src/modules/CRMERPLeadDetails/components/QuickActionBar.tsx`

- [ ] **Créer le composant**

```tsx
// src/modules/CRMERPLeadDetails/components/QuickActionBar.tsx
import { useState } from 'react'
import { FileText, Mail, Phone, CheckSquare, Calendar, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityType } from '../types'
import { ActivityModal } from './modals/ActivityModal'

interface Props {
  onAdd: (type: ActivityType, content: string) => Promise<void>
}

const ACTIONS: { type: ActivityType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'note',    label: 'Note',     icon: FileText,     color: 'hover:text-violet-400 hover:bg-violet-500/10' },
  { type: 'email',   label: 'E-mail',   icon: Mail,         color: 'hover:text-green-400 hover:bg-green-500/10' },
  { type: 'call',    label: 'Appel',    icon: Phone,        color: 'hover:text-blue-400 hover:bg-blue-500/10' },
  { type: 'task',    label: 'Tâche',    icon: CheckSquare,  color: 'hover:text-amber-400 hover:bg-amber-500/10' },
  { type: 'meeting', label: 'Réunion',  icon: Calendar,     color: 'hover:text-pink-400 hover:bg-pink-500/10' },
]

export function QuickActionBar({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<ActivityType>('note')

  const handleClick = (type: ActivityType) => {
    setDefaultType(type)
    setOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border/50 bg-surface-1 shrink-0">
        {ACTIONS.map(({ type, label, icon: Icon, color }) => (
          <button
            key={type}
            onClick={() => handleClick(type)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-muted-foreground',
              'transition-all text-[10px] font-medium',
              color
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
        <button className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-all text-[10px] font-medium ml-1">
          <MoreHorizontal className="h-4 w-4" />
          Plus
        </button>
      </div>

      <ActivityModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={async (type, content) => { await onAdd(type, content); setOpen(false) }}
        activity={null}
        defaultType={defaultType}
      />
    </>
  )
}
```

- [ ] **Ajouter `defaultType` prop à ActivityModal**

Ouvrir `src/modules/CRMERPLeadDetails/components/modals/ActivityModal.tsx` et ajouter la prop `defaultType?: ActivityType` qui initialise le select du type.

- [ ] **Commit**
```bash
git add src/modules/CRMERPLeadDetails/components/QuickActionBar.tsx
git add src/modules/CRMERPLeadDetails/components/modals/ActivityModal.tsx
git commit -m "feat(crmerp): QuickActionBar — raccourcis Note/Email/Appel/Tâche/Réunion"
```

---

## Task 4 : ActivityFilterBar

**Fichiers :**
- Créer : `src/modules/CRMERPLeadDetails/components/ActivityFilterBar.tsx`

- [ ] **Créer le composant**

```tsx
// src/modules/CRMERPLeadDetails/components/ActivityFilterBar.tsx
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityType } from '../types'
import { ACTIVITY_TYPES } from '../types'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  typeFilter: ActivityType | 'all'
  onTypeFilterChange: (v: ActivityType | 'all') => void
  total: number
  filtered: number
}

const TYPE_COLORS: Record<ActivityType, string> = {
  call:    'bg-blue-500/15 text-blue-400 border-blue-500/25',
  email:   'bg-green-500/15 text-green-400 border-green-500/25',
  meeting: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  note:    'bg-violet-500/15 text-violet-400 border-violet-500/25',
  task:    'bg-teal-500/15 text-teal-400 border-teal-500/25',
}

export function ActivityFilterBar({
  search, onSearchChange,
  typeFilter, onTypeFilterChange,
  total, filtered,
}: Props) {
  const isFiltered = typeFilter !== 'all' || search.length > 0

  return (
    <div className="bg-surface-2 border border-border/50 rounded-xl p-3 mb-4">
      {/* Ligne 1 : search + tout réduire */}
      <div className="flex items-center gap-3 mb-2.5">
        <div className="flex items-center gap-2 bg-surface-3 border border-border/50 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Rechercher des activités"
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
          {search && (
            <button onClick={() => onSearchChange('')}>
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground ml-auto">
          {isFiltered ? `${filtered}/${total}` : `${total}`} activité{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Ligne 2 : filtres par type */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onTypeFilterChange('all')}
          className={cn(
            'text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all',
            typeFilter === 'all'
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-transparent text-muted-foreground border-border/40 hover:border-border hover:text-foreground'
          )}
        >
          Toutes
        </button>
        {ACTIVITY_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onTypeFilterChange(typeFilter === value ? 'all' : value)}
            className={cn(
              'text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all',
              typeFilter === value
                ? TYPE_COLORS[value]
                : 'bg-transparent text-muted-foreground border-border/40 hover:border-border hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
        {isFiltered && (
          <button
            onClick={() => { onSearchChange(''); onTypeFilterChange('all') }}
            className="text-[10px] text-red-400 hover:text-red-300 ml-auto transition-colors"
          >
            Tout réinitialiser
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Commit**
```bash
git add src/modules/CRMERPLeadDetails/components/ActivityFilterBar.tsx
git commit -m "feat(crmerp): ActivityFilterBar — search + filtres par type d'activité"
```

---

## Task 5 : ActivityTimeline

**Fichiers :**
- Créer : `src/modules/CRMERPLeadDetails/components/ActivityTimeline.tsx`

- [ ] **Créer le composant**

```tsx
// src/modules/CRMERPLeadDetails/components/ActivityTimeline.tsx
import { useState } from 'react'
import { Phone, Mail, Calendar, FileText, CheckCircle, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { format, formatDistanceToNow, isThisWeek, isThisMonth, isThisYear } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CRMERPActivity, ActivityType } from '../types'
import { ACTIVITY_TYPES } from '../types'
import { ActivityModal } from './modals/ActivityModal'

const TYPE_ICONS: Record<ActivityType, React.ElementType> = {
  call: Phone, email: Mail, meeting: Calendar, note: FileText, task: CheckCircle,
}

const TYPE_COLORS: Record<ActivityType, { avatar: string; badge: string }> = {
  call:    { avatar: 'bg-blue-500/15 border-blue-500/25 text-blue-400',    badge: 'bg-blue-500/15 text-blue-400' },
  email:   { avatar: 'bg-green-500/15 border-green-500/25 text-green-400', badge: 'bg-green-500/15 text-green-400' },
  meeting: { avatar: 'bg-amber-500/15 border-amber-500/25 text-amber-400', badge: 'bg-amber-500/15 text-amber-400' },
  note:    { avatar: 'bg-violet-500/15 border-violet-500/25 text-violet-400', badge: 'bg-violet-500/15 text-violet-400' },
  task:    { avatar: 'bg-teal-500/15 border-teal-500/25 text-teal-400',    badge: 'bg-teal-500/15 text-teal-400' },
}

function groupActivities(activities: CRMERPActivity[]) {
  const groups: { label: string; items: CRMERPActivity[] }[] = []

  const now = new Date()
  const overdue = activities.filter(a => {
    if (a.type !== 'task') return false
    const d = new Date(a.created_at)
    return d < now
  })

  const byDate = new Map<string, CRMERPActivity[]>()
  activities.forEach(a => {
    const d = new Date(a.created_at)
    const key = format(d, 'MMMM yyyy', { locale: fr })
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(a)
  })

  byDate.forEach((items, label) => {
    const capitalized = label.charAt(0).toUpperCase() + label.slice(1)
    groups.push({ label: capitalized, items })
  })

  return groups
}

function ActivityItem({
  activity,
  onUpdate,
  onDelete,
}: {
  activity: CRMERPActivity
  onUpdate: (id: string, updates: { type?: ActivityType; content?: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const Icon = TYPE_ICONS[activity.type] ?? FileText
  const colors = TYPE_COLORS[activity.type] ?? TYPE_COLORS.note
  const typeLabel = ACTIVITY_TYPES.find(t => t.value === activity.type)?.label ?? activity.type

  return (
    <>
      <div className="flex gap-3 group py-3 px-1">
        {/* Ligne verticale + icône */}
        <div className="flex flex-col items-center">
          <div className={cn('h-8 w-8 rounded-full border flex items-center justify-center shrink-0', colors.avatar)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn('text-[10px] font-semibold px-1.5 py-0', colors.badge)}>
              {typeLabel}
            </Badge>
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[10px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground transition-colors"
            >
              {expanded
                ? <ChevronDown className="h-3 w-3" />
                : <ChevronRight className="h-3 w-3" />
              }
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
            </button>
            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 hover:text-destructive"
                onClick={async () => {
                  if (window.confirm('Supprimer cette activité ?')) await onDelete(activity.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {expanded && activity.content && (
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {activity.content}
            </p>
          )}
          {activity.creator && (
            <p className="text-[10px] text-muted-foreground mt-1">Par {activity.creator.name}</p>
          )}
        </div>
      </div>

      <ActivityModal
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={async (type, content) => {
          await onUpdate(activity.id, { type, content })
          setEditing(false)
        }}
        activity={activity}
      />
    </>
  )
}

interface Props {
  activities: CRMERPActivity[]
  onUpdate: (id: string, updates: { type?: ActivityType; content?: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ActivityTimeline({ activities, onUpdate, onDelete }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Aucune activité — utilisez les boutons ci-dessus pour en créer une.
      </div>
    )
  }

  const groups = groupActivities(activities)

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <div key={group.label}>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {group.label}
          </p>
          <div className="bg-surface-2 border border-border/50 rounded-xl divide-y divide-border/30 px-3">
            {group.items.map(a => (
              <ActivityItem key={a.id} activity={a} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Commit**
```bash
git add src/modules/CRMERPLeadDetails/components/ActivityTimeline.tsx
git commit -m "feat(crmerp): ActivityTimeline — groupée par mois, collapsible, hover actions"
```

---

## Task 6 : LeadRightSidebar

**Fichiers :**
- Créer : `src/modules/CRMERPLeadDetails/components/LeadRightSidebar.tsx`

- [ ] **Créer le composant**

```tsx
// src/modules/CRMERPLeadDetails/components/LeadRightSidebar.tsx
import { User, TrendingUp, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CRMERPLead, CRMERPStatus } from '../types'
import { CRMERP_STATUS_LABELS, CRMERP_STATUS_COLORS, CRMERP_STATUSES } from '../types'

interface User { id: string; name: string; email: string }

interface Props {
  lead: CRMERPLead
  users: User[]
}

function RightSection({ title, action, children }: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border/40 py-4 px-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

export function LeadRightSidebar({ lead, users }: Props) {
  const assignee = lead.assignee

  return (
    <div className="flex flex-col">
      {/* Contact associé */}
      <RightSection
        title="Contact"
        action={
          <button className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
            <Plus className="h-3 w-3" /> Ajouter
          </button>
        }
      >
        {lead.contact_name ? (
          <div className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">{lead.contact_name}</p>
              {lead.email && <p className="text-[10px] text-muted-foreground truncate">{lead.email}</p>}
              {lead.phone && <p className="text-[10px] text-muted-foreground">{lead.phone}</p>}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Aucun contact renseigné</p>
        )}
      </RightSection>

      {/* Étape du pipeline */}
      <RightSection title="Suivi de l'étape du lead">
        <div className="space-y-1.5">
          {CRMERP_STATUSES.map(s => {
            const conf = CRMERP_STATUS_COLORS[s]
            const isActive = s === lead.status
            return (
              <div
                key={s}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all',
                  isActive
                    ? cn('border font-semibold', conf.badge, 'border-current/30')
                    : 'text-muted-foreground'
                )}
              >
                <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? 'bg-current' : 'bg-border/50')} />
                {CRMERP_STATUS_LABELS[s]}
                {isActive && <span className="ml-auto text-[10px]">● Actuel</span>}
              </div>
            )
          })}
        </div>
      </RightSection>

      {/* Responsable */}
      {assignee && (
        <RightSection title="Responsable">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-surface-3 border border-border/50 flex items-center justify-center shrink-0">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{assignee.name}</p>
              <p className="text-[10px] text-muted-foreground">{assignee.email}</p>
            </div>
          </div>
        </RightSection>
      )}

      {/* Statistiques rapides */}
      <RightSection title="Statistiques">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Source</span>
            <span className="font-medium text-foreground">{lead.source || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Statut</span>
            <span className="font-medium text-foreground">{CRMERP_STATUS_LABELS[lead.status]}</span>
          </div>
        </div>
      </RightSection>
    </div>
  )
}
```

- [ ] **Commit**
```bash
git add src/modules/CRMERPLeadDetails/components/LeadRightSidebar.tsx
git commit -m "feat(crmerp): LeadRightSidebar — contact, pipeline étapes, responsable"
```

---

## Task 7 : Mise à jour ActivityModal + suppression LeadActivities obsolète

**Fichiers :**
- Modifier : `src/modules/CRMERPLeadDetails/components/modals/ActivityModal.tsx`
- Supprimer (ou garder en archive) : `src/modules/CRMERPLeadDetails/components/LeadActivities.tsx`

- [ ] **Lire ActivityModal.tsx puis ajouter `defaultType`**

Ajouter `defaultType?: ActivityType` dans les props. L'utiliser pour la valeur initiale du select.

- [ ] **Vérifier que le build passe**
```bash
npm run build
```
Corriger tout import cassé (ex: `LeadActivities`, `LeadHeader`, `LeadInfo`, `LeadAssign` ne sont plus importés dans la page principale).

- [ ] **Commit final**
```bash
git add -A
git commit -m "feat(crmerp): lead detail v2 complet — 3 colonnes style HubSpot"
```

---

## Self-Review Checklist

- [x] **Layout 3 colonnes** couvert par Task 1
- [x] **Sidebar gauche** (avatar, pipeline steps, infos, responsable) : Task 2
- [x] **Quick action bar** (Note/Email/Appel/Tâche/Réunion) : Task 3
- [x] **Barre de filtres** (search + type) : Task 4
- [x] **Timeline groupée par mois** + collapsible + hover actions : Task 5
- [x] **Sidebar droite** (contact, pipeline stage, stats) : Task 6
- [x] **Build propre** et nettoyage des anciens composants : Task 7

**Hors scope délibéré :**
- Onglets Actualité / Vue d'ensemble / Intelligence (peu de données disponibles)
- Transactions / Deals (table non existante en DB)
- Responsive mobile (la page est desktop-first)
