# Sprint 2 — SIRET Pappers + Dashboard Mois en cours

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter l'enrichissement SIRET via Pappers dans le formulaire projet, et créer un nouveau module "Mois en cours" avec 4 métriques CA + listes projets urgents/inactifs.

**Architecture:**
- F4 (SIRET) : Edge Function Supabase `enrich-siret` → appel Pappers API → stockage JSONB `company_data` sur `projects_v2`. Champ SIRET dans `EditProjectModal` avec bouton "Enrichir".
- F6 (Dashboard) : Nouveau module `MonthlyDashboard` lazy-loadé dans Layout, lisant `projects_v2` et `project_invoices_v2` côté client, avec `setInterval` 5 min pour le refresh auto.
- Migration SQL : colonnes `siret`, `company_data` (JSONB), `company_enriched_at` sur `projects_v2`.

**Tech Stack:** React 18 + TypeScript, Supabase Edge Functions (Deno), Tailwind CSS, shadcn/ui Cards, date-fns

---

## Fichiers créés / modifiés

| Fichier | Action | Rôle |
|---------|--------|------|
| `supabase/migrations/20260406_sprint2_siret_dashboard.sql` | Créer | Colonnes SIRET sur projects_v2 |
| `supabase/functions/enrich-siret/index.ts` | Créer | Edge Function appel Pappers API |
| `src/types/project-v2.ts` | Modifier | Ajouter champs siret, company_data, company_enriched_at |
| `src/modules/ProjectsManagerV2/components/EditProjectModal.tsx` | Modifier | Champ SIRET + bouton Enrichir |
| `src/modules/MonthlyDashboard/index.tsx` | Créer | Module principal "Mois en cours" |
| `src/modules/MonthlyDashboard/hooks/useMonthlyData.ts` | Créer | Hook données CA + projets |
| `src/modules/MonthlyDashboard/components/MetricCard.tsx` | Créer | Carte métrique réutilisable |
| `src/modules/MonthlyDashboard/components/ProjectList.tsx` | Créer | Liste projets urgents/inactifs |
| `src/components/layout/Layout.tsx` | Modifier | Lazy-load MonthlyDashboard + case switch |
| `src/components/layout/Sidebar.tsx` | Modifier | Item navigation "Mois en cours" |

---

## Task 1 : Migration Supabase — colonnes SIRET

**Files:**
- Create: `supabase/migrations/20260406_sprint2_siret_dashboard.sql`

- [ ] **Step 1 : Créer le fichier de migration**

```sql
-- Migration Sprint 2 : Enrichissement SIRET Pappers
ALTER TABLE projects_v2
  ADD COLUMN IF NOT EXISTS siret VARCHAR(14),
  ADD COLUMN IF NOT EXISTS company_data JSONB,
  ADD COLUMN IF NOT EXISTS company_enriched_at TIMESTAMPTZ;

-- Index pour recherche par SIRET
CREATE INDEX IF NOT EXISTS projects_v2_siret_idx ON projects_v2(siret) WHERE siret IS NOT NULL;
```

- [ ] **Step 2 : Appliquer la migration via MCP Supabase**

Utiliser l'outil `mcp__plugin_supabase_supabase__apply_migration` avec le contenu ci-dessus.
Projet : `wftozvnvstxzvfplveyz`

- [ ] **Step 3 : Vérifier les colonnes**

Utiliser `mcp__plugin_supabase_supabase__execute_sql` :
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects_v2'
  AND column_name IN ('siret', 'company_data', 'company_enriched_at');
```
Résultat attendu : 3 lignes.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260406_sprint2_siret_dashboard.sql
git commit -m "feat(migration): add siret + company_data columns to projects_v2"
```

---

## Task 2 : Mettre à jour le type TypeScript ProjectV2

**Files:**
- Modify: `src/types/project-v2.ts` (lignes 23–48, interface `ProjectV2`)

- [ ] **Step 1 : Ajouter les 3 champs dans l'interface**

Dans `src/types/project-v2.ts`, ajouter après `next_action_due`:
```typescript
  siret: string | null
  company_data: Record<string, unknown> | null
  company_enriched_at: string | null
```

L'interface `ProjectV2` complète (section modifiée) :
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
  siret: string | null
  company_data: Record<string, unknown> | null
  company_enriched_at: string | null
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2 : Vérifier que le build compile**

```bash
npm run build 2>&1 | tail -20
```
Attendu : 0 erreurs TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/types/project-v2.ts
git commit -m "feat(types): add siret, company_data, company_enriched_at to ProjectV2"
```

---

## Task 3 : Edge Function `enrich-siret`

**Files:**
- Create: `supabase/functions/enrich-siret/index.ts`

- [ ] **Step 1 : Créer la Edge Function**

```typescript
// supabase/functions/enrich-siret/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { project_id, siret } = await req.json()

    if (!project_id || !siret) {
      return new Response(
        JSON.stringify({ error: 'project_id et siret sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validation format SIRET : 14 chiffres
    const cleanSiret = siret.replace(/\s/g, '')
    if (!/^\d{14}$/.test(cleanSiret)) {
      return new Response(
        JSON.stringify({ error: 'SIRET invalide — doit contenir 14 chiffres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pappersKey = Deno.env.get('PAPPERS_API_KEY')
    if (!pappersKey) {
      return new Response(
        JSON.stringify({ error: 'PAPPERS_API_KEY non configurée' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Appel API Pappers
    const pappersUrl = `https://api.pappers.fr/v2/entreprise?siret=${cleanSiret}&api_token=${pappersKey}`
    const pappersRes = await fetch(pappersUrl)

    if (!pappersRes.ok) {
      const errBody = await pappersRes.text()
      return new Response(
        JSON.stringify({ error: `Pappers API error ${pappersRes.status}`, detail: errBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const companyData = await pappersRes.json()

    // Persister dans Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: updateError } = await supabase
      .from('projects_v2')
      .update({
        siret: cleanSiret,
        company_data: companyData,
        company_enriched_at: new Date().toISOString(),
      })
      .eq('id', project_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Erreur mise à jour base', detail: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        company_name: companyData.nom_entreprise ?? companyData.denomination,
        siret: cleanSiret,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erreur interne', detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2 : Déployer via MCP Supabase**

Utiliser `mcp__plugin_supabase_supabase__deploy_edge_function` :
- `function_name`: `enrich-siret`
- `entrypoint_path`: `supabase/functions/enrich-siret/index.ts`

- [ ] **Step 3 : Commit**

```bash
git add supabase/functions/enrich-siret/index.ts
git commit -m "feat(edge-fn): add enrich-siret Pappers API edge function"
```

---

## Task 4 : Champ SIRET dans EditProjectModal

**Files:**
- Modify: `src/modules/ProjectsManagerV2/components/EditProjectModal.tsx`

- [ ] **Step 1 : Ajouter le champ siret à l'état du formulaire**

Dans `EditProjectModal.tsx`, modifier l'initialisation du state `form` (ligne ~13) :
```typescript
const [form, setForm] = useState({
  name:        project.name,
  description: project.description ?? '',
  status:      project.status,
  priority:    project.priority,
  presta_type: project.presta_type,
  assigned_to: project.assigned_to,
  budget:      project.budget != null ? String(project.budget) : '',
  end_date:    project.end_date ?? '',
  client_name: project.client_name ?? '',
  siret:       project.siret ?? '',
})
```

- [ ] **Step 2 : Ajouter l'état d'enrichissement et les imports**

Ajouter après la déclaration du state `form` :
```typescript
const [enriching, setEnriching] = useState(false)
const [enrichedName, setEnrichedName] = useState<string | null>(
  project.company_enriched_at ? (project.company_data as any)?.nom_entreprise ?? null : null
)
```

Ajouter l'import `supabase` en haut du fichier :
```typescript
import { supabase } from '../../../lib/supabase'
```

- [ ] **Step 3 : Ajouter la fonction d'enrichissement**

Juste avant `handleSubmit` :
```typescript
const handleEnrich = async () => {
  const cleanSiret = form.siret.replace(/\s/g, '')
  if (!/^\d{14}$/.test(cleanSiret)) {
    alert('SIRET invalide — 14 chiffres requis')
    return
  }
  setEnriching(true)
  try {
    const { data, error } = await supabase.functions.invoke('enrich-siret', {
      body: { project_id: project.id, siret: cleanSiret },
    })
    if (error) throw error
    setEnrichedName(data.company_name ?? null)
    // Rafraîchir le projet via onSave partiel
    onSave({ siret: cleanSiret })
  } catch (err) {
    alert('Erreur enrichissement Pappers')
    console.error('[enrich-siret]', err)
  } finally {
    setEnriching(false)
  }
}
```

- [ ] **Step 4 : Ajouter le champ SIRET dans le JSX**

Après le champ "Échéance" et avant les boutons de soumission, insérer :
```tsx
<div>
  <label className="block text-sm font-medium text-muted-foreground mb-1">SIRET</label>
  <div className="flex gap-2">
    <input
      type="text"
      value={form.siret}
      onChange={e => setForm({ ...form, siret: e.target.value })}
      placeholder="12345678901234"
      maxLength={14}
      className="flex-1 p-2 border border-border rounded-md bg-surface-2 text-foreground text-sm font-mono"
    />
    <button
      type="button"
      onClick={handleEnrich}
      disabled={enriching || form.siret.replace(/\s/g, '').length !== 14}
      className="px-3 py-2 text-xs rounded-md border border-primary text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {enriching ? '...' : 'Enrichir'}
    </button>
  </div>
  {enrichedName && (
    <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
      <span>✓</span> Données enrichies via Pappers : <strong>{enrichedName}</strong>
    </p>
  )}
</div>
```

- [ ] **Step 5 : Inclure siret dans handleSubmit**

Dans `onSave({...})`, ajouter `siret: form.siret.trim() || null` :
```typescript
onSave({
  name:          form.name.trim(),
  description:   form.description.trim() || null,
  status:        form.status as ProjectStatusV2,
  priority:      form.priority as ProjectV2['priority'],
  presta_type:   form.presta_type,
  assigned_to:   form.assigned_to,
  assigned_name: user?.name ?? null,
  budget:        form.budget ? parseFloat(form.budget) : null,
  end_date:      form.end_date || null,
  client_name:   form.client_name.trim() || null,
  category:      form.presta_type[0] ?? project.category,
  siret:         form.siret.trim() || null,
})
```

- [ ] **Step 6 : Vérifier le build**

```bash
npm run build 2>&1 | tail -20
```
Attendu : 0 erreurs TypeScript.

- [ ] **Step 7 : Commit**

```bash
git add src/modules/ProjectsManagerV2/components/EditProjectModal.tsx
git commit -m "feat(siret): add SIRET field + Pappers enrichment button to EditProjectModal"
```

---

## Task 5 : Hook `useMonthlyData`

**Files:**
- Create: `src/modules/MonthlyDashboard/hooks/useMonthlyData.ts`

- [ ] **Step 1 : Créer le hook**

```typescript
// src/modules/MonthlyDashboard/hooks/useMonthlyData.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { startOfMonth, endOfMonth, subDays, addDays, isAfter, isBefore, parseISO } from 'date-fns'
import type { ProjectV2 } from '../../../types/project-v2'
import type { InvoiceV2 } from '../../ProjectsManagerV2/hooks/useBillingV2'

export interface MonthlyMetrics {
  caEncaisse: number        // Factures status='paid' du mois en cours
  caEnAttente: number       // Factures status='sent' ou 'overdue'
  projetsUrgents: ProjectV2[]  // priority='urgent' ou 'high' + status actif
  projetsInactifs: ProjectV2[] // last_activity_at > 7j et status actif
  aLivrerBientot: ProjectV2[]  // end_date dans les 14 prochains jours
  loading: boolean
}

const ACTIVE_STATUSES = ['in_progress', 'review', 'maintenance'] as const

export function useMonthlyData(): MonthlyMetrics & { refetch: () => void } {
  const [metrics, setMetrics] = useState<MonthlyMetrics>({
    caEncaisse: 0,
    caEnAttente: 0,
    projetsUrgents: [],
    projetsInactifs: [],
    aLivrerBientot: [],
    loading: true,
  })

  const fetchData = useCallback(async () => {
    setMetrics(prev => ({ ...prev, loading: true }))

    const now = new Date()
    const monthStart = startOfMonth(now).toISOString()
    const monthEnd = endOfMonth(now).toISOString()
    const inactivityThreshold = subDays(now, 7).toISOString()
    const in14days = addDays(now, 14).toISOString()

    // Projets actifs
    const { data: projects } = await supabase
      .from('projects_v2')
      .select('*')
      .eq('is_archived', false)
      .in('status', ACTIVE_STATUSES)
      .order('last_activity_at', { ascending: false })

    // Factures du mois (payées ou en attente)
    const { data: invoices } = await supabase
      .from('project_invoices_v2')
      .select('amount, status, date')
      .or(`status.eq.paid,status.eq.sent,status.eq.overdue`)

    const activeProjects = (projects ?? []) as ProjectV2[]
    const allInvoices = (invoices ?? []) as Pick<InvoiceV2, 'amount' | 'status' | 'date'>[]

    // CA encaissé : factures paid dans le mois en cours
    const caEncaisse = allInvoices
      .filter(inv => inv.status === 'paid' && inv.date && inv.date >= monthStart && inv.date <= monthEnd)
      .reduce((sum, inv) => sum + (inv.amount ?? 0), 0)

    // CA en attente : toutes factures sent ou overdue
    const caEnAttente = allInvoices
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.amount ?? 0), 0)

    // Projets urgents : priority urgent ou high
    const projetsUrgents = activeProjects.filter(
      p => p.priority === 'urgent' || p.priority === 'high'
    )

    // Projets inactifs : last_activity_at vide ou > 7j
    const projetsInactifs = activeProjects.filter(p =>
      !p.last_activity_at || p.last_activity_at < inactivityThreshold
    )

    // À livrer dans 14j : end_date entre maintenant et +14j
    const aLivrerBientot = activeProjects.filter(p =>
      p.end_date && p.end_date >= now.toISOString().slice(0, 10) && p.end_date <= in14days.slice(0, 10)
    )

    setMetrics({
      caEncaisse,
      caEnAttente,
      projetsUrgents,
      projetsInactifs,
      aLivrerBientot,
      loading: false,
    })
  }, [])

  useEffect(() => {
    fetchData()
    // Refresh auto toutes les 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { ...metrics, refetch: fetchData }
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
npm run build 2>&1 | tail -20
```
Attendu : 0 erreurs TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/MonthlyDashboard/hooks/useMonthlyData.ts
git commit -m "feat(monthly-dashboard): add useMonthlyData hook with 5min auto-refresh"
```

---

## Task 6 : Composants MetricCard et ProjectList

**Files:**
- Create: `src/modules/MonthlyDashboard/components/MetricCard.tsx`
- Create: `src/modules/MonthlyDashboard/components/ProjectList.tsx`

- [ ] **Step 1 : Créer MetricCard**

```tsx
// src/modules/MonthlyDashboard/components/MetricCard.tsx
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  color?: 'default' | 'green' | 'amber' | 'red'
}

const colorMap = {
  default: 'text-foreground',
  green:   'text-emerald-400',
  amber:   'text-amber-400',
  red:     'text-red-400',
}

export function MetricCard({ icon: Icon, label, value, sub, color = 'default' }: MetricCardProps) {
  return (
    <div className="bg-surface-2 rounded-xl p-4 border border-border flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
```

- [ ] **Step 2 : Créer ProjectList**

```tsx
// src/modules/MonthlyDashboard/components/ProjectList.tsx
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ProjectV2 } from '../../../types/project-v2'
import { ProjectStatusBadge } from '../../ProjectsManagerV2/components/ProjectStatusBadge'

interface ProjectListProps {
  title: string
  projects: ProjectV2[]
  emptyLabel: string
  onSelect: (project: ProjectV2) => void
}

export function ProjectList({ title, projects, emptyLabel, onSelect }: ProjectListProps) {
  return (
    <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          {title}
          <span className="ml-2 text-xs text-muted-foreground font-normal">({projects.length})</span>
        </h3>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground px-4 py-6 text-center">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-border">
          {projects.map(p => (
            <li
              key={p.id}
              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-1 cursor-pointer transition-colors"
              onClick={() => onSelect(p)}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                {p.client_name && (
                  <p className="text-xs text-muted-foreground truncate">{p.client_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ProjectStatusBadge status={p.status} />
                {p.end_date && (
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(p.end_date), 'd MMM', { locale: fr })}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build 2>&1 | tail -20
```
Attendu : 0 erreurs TypeScript.

- [ ] **Step 4 : Commit**

```bash
git add src/modules/MonthlyDashboard/components/MetricCard.tsx src/modules/MonthlyDashboard/components/ProjectList.tsx
git commit -m "feat(monthly-dashboard): add MetricCard and ProjectList components"
```

---

## Task 7 : Module principal MonthlyDashboard

**Files:**
- Create: `src/modules/MonthlyDashboard/index.tsx`

- [ ] **Step 1 : Créer le module principal**

```tsx
// src/modules/MonthlyDashboard/index.tsx
import { Euro, Clock, AlertTriangle, Wifi } from 'lucide-react'
import { useMonthlyData } from './hooks/useMonthlyData'
import { MetricCard } from './components/MetricCard'
import { ProjectList } from './components/ProjectList'
import { useStore } from '../../store'
import type { ProjectV2 } from '../../types/project-v2'

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

export function MonthlyDashboard() {
  const {
    caEncaisse,
    caEnAttente,
    projetsUrgents,
    projetsInactifs,
    aLivrerBientot,
    loading,
    refetch,
  } = useMonthlyData()

  const { setActiveModule, setSelectedProjectId } = useStore()

  const handleProjectSelect = (project: ProjectV2) => {
    setSelectedProjectId(project.id)
    setActiveModule('projects-v2')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm animate-pulse">Chargement du tableau de bord...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mois en cours</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Actualisation automatique toutes les 5 min</p>
        </div>
        <button
          onClick={refetch}
          className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {/* 4 métriques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Euro}
          label="CA encaissé"
          value={formatEuro(caEncaisse)}
          sub="Factures payées ce mois"
          color="green"
        />
        <MetricCard
          icon={Clock}
          label="CA en attente"
          value={formatEuro(caEnAttente)}
          sub="Factures envoyées/échues"
          color="amber"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Projets urgents"
          value={String(projetsUrgents.length)}
          sub="Priorité haute ou urgente"
          color={projetsUrgents.length > 0 ? 'red' : 'default'}
        />
        <MetricCard
          icon={Wifi}
          label="Projets inactifs"
          value={String(projetsInactifs.length)}
          sub="Sans activité depuis 7j+"
          color={projetsInactifs.length > 0 ? 'amber' : 'default'}
        />
      </div>

      {/* Listes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectList
          title="À livrer dans 14 jours"
          projects={aLivrerBientot}
          emptyLabel="Aucune livraison prévue dans les 14 prochains jours"
          onSelect={handleProjectSelect}
        />
        <ProjectList
          title="Sans activité depuis 7j+"
          projects={projetsInactifs}
          emptyLabel="Tous les projets ont eu de l'activité récemment"
          onSelect={handleProjectSelect}
        />
      </div>

      {/* Liste urgents */}
      {projetsUrgents.length > 0 && (
        <ProjectList
          title="Projets urgents / haute priorité"
          projects={projetsUrgents}
          emptyLabel=""
          onSelect={handleProjectSelect}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier `setSelectedProjectId` dans le store**

```bash
grep -n "setSelectedProjectId\|selectedProjectId" src/store/slices/projectsSlice.ts src/store/useStore.ts 2>/dev/null | head -10
```

Si `setSelectedProjectId` n'existe pas dans le store, remplacer `handleProjectSelect` par :
```typescript
const handleProjectSelect = (_project: ProjectV2) => {
  setActiveModule('projects-v2')
}
```

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build 2>&1 | tail -20
```
Attendu : 0 erreurs TypeScript.

- [ ] **Step 4 : Commit**

```bash
git add src/modules/MonthlyDashboard/index.tsx
git commit -m "feat(monthly-dashboard): add MonthlyDashboard module with metrics and project lists"
```

---

## Task 8 : Enregistrer MonthlyDashboard dans Layout et Sidebar

**Files:**
- Modify: `src/components/layout/Layout.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1 : Ajouter l'import lazy dans Layout.tsx**

Après la ligne `const ProjectsManagerV2 = lazy(...)` (ligne ~29), ajouter :
```typescript
const MonthlyDashboard = lazy(() => import('../../modules/MonthlyDashboard').then(m => ({ default: m.MonthlyDashboard })))
```

- [ ] **Step 2 : Ajouter le case dans renderModule()**

Dans le `switch (activeModule)`, avant le `default`, ajouter :
```typescript
case 'monthly-dashboard':
  return wrappedComponent(MonthlyDashboard);
```

- [ ] **Step 3 : Ajouter les permissions dans modulePermissions**

Dans les deux objets `modulePermissions` (lignes ~99 et ~137), ajouter :
```typescript
'monthly-dashboard': 'can_view_projects',
```

- [ ] **Step 4 : Ajouter l'item dans Sidebar.tsx**

Trouver le tableau d'items de navigation dans `Sidebar.tsx` et ajouter après `projects-v2` :
```typescript
{ id: 'monthly-dashboard', label: 'Mois en cours', icon: BarChart3, permission: 'can_view_projects' },
```

Vérifier que `BarChart3` est importé depuis `lucide-react` en haut du fichier. S'il ne l'est pas, l'ajouter à la liste d'imports.

- [ ] **Step 5 : Vérifier le build**

```bash
npm run build 2>&1 | tail -20
```
Attendu : 0 erreurs TypeScript, 0 warnings d'import.

- [ ] **Step 6 : Commit final**

```bash
git add src/components/layout/Layout.tsx src/components/layout/Sidebar.tsx
git commit -m "feat(nav): register MonthlyDashboard in Layout and Sidebar"
```

---

## Vérification finale

- [ ] `npm run build` sans erreur
- [ ] Le module "Mois en cours" apparaît dans la sidebar
- [ ] Les 4 métriques s'affichent (même à 0€ / 0 projets)
- [ ] Cliquer sur un projet navigue vers projects-v2
- [ ] `EditProjectModal` contient le champ SIRET avec le bouton "Enrichir"
- [ ] Le bouton "Enrichir" est désactivé si le SIRET n'a pas 14 chiffres
- [ ] Le badge "Données enrichies via Pappers" apparaît après succès
- [ ] La migration SQL contient les 3 colonnes attendues

---

## Checklist spec coverage

| Spec | Tâche couvrant |
|------|---------------|
| Champ SIRET dans formulaire | Task 4 |
| Auto-fill via Pappers côté serveur | Task 3 (Edge Function) |
| Badge "Données enrichies via Pappers" | Task 4 (step 4) |
| Colonnes siret, company_data, company_enriched_at | Task 1 + Task 2 |
| 4 metric cards CA/projets | Task 5 + Task 7 |
| Liste "À livrer dans 14j" | Task 5 + Task 6 + Task 7 |
| Liste "Sans activité depuis 7j" | Task 5 + Task 6 + Task 7 |
| Refresh auto 5 min | Task 5 (setInterval) |
| Nouveau module navigation | Task 8 |
