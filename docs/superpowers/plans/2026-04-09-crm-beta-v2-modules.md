# CRM Beta V2 — 3 Modules par Prestation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer 3 modules sidebar dédiés (Site Web & SEO, ERP Sur Mesure, Communication) + mettre à jour Dashboard V2 pour agréger les 3 pôles.

**Architecture:** Chaque module est un clone adapté de `ProjectsManagerV2` avec ses colonnes kanban, son brief dynamique et ses templates checklist. Les modules Communication ajoutent un onglet "Suivi mensuel" avec cycles par mois. Tout reste en mocks (pas de Supabase pour l'instant).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, @dnd-kit, Zustand, Lucide icons — suivre exactement les patterns de `src/modules/ProjectsManagerV2/`.

---

## Fichiers créés / modifiés

| Action | Fichier |
|--------|---------|
| Modify | `src/types/project-v2.ts` |
| Create | `src/modules/SiteWebManager/index.tsx` |
| Create | `src/modules/SiteWebManager/mocks/mockSiteWebProjects.ts` |
| Create | `src/modules/SiteWebManager/mocks/mockSiteWebBriefs.ts` |
| Create | `src/modules/SiteWebManager/mocks/mockSiteWebChecklists.ts` |
| Create | `src/modules/SiteWebManager/components/SiteWebKanban.tsx` |
| Create | `src/modules/SiteWebManager/components/SiteWebBriefTab.tsx` |
| Create | `src/modules/SiteWebManager/hooks/useMockSiteWebProjects.ts` |
| Create | `src/modules/ERPManager/index.tsx` |
| Create | `src/modules/ERPManager/mocks/mockERPProjects.ts` |
| Create | `src/modules/ERPManager/mocks/mockERPBriefs.ts` |
| Create | `src/modules/ERPManager/mocks/mockERPChecklists.ts` |
| Create | `src/modules/ERPManager/components/ERPKanban.tsx` |
| Create | `src/modules/ERPManager/components/ERPBriefTab.tsx` |
| Create | `src/modules/ERPManager/hooks/useMockERPProjects.ts` |
| Create | `src/modules/CommunicationManager/index.tsx` |
| Create | `src/modules/CommunicationManager/mocks/mockCommProjects.ts` |
| Create | `src/modules/CommunicationManager/mocks/mockCommBriefs.ts` |
| Create | `src/modules/CommunicationManager/mocks/mockCommChecklists.ts` |
| Create | `src/modules/CommunicationManager/mocks/mockCommCycles.ts` |
| Create | `src/modules/CommunicationManager/components/CommKanban.tsx` |
| Create | `src/modules/CommunicationManager/components/CommBriefTab.tsx` |
| Create | `src/modules/CommunicationManager/components/CommMonthlyCycles.tsx` |
| Create | `src/modules/CommunicationManager/hooks/useMockCommProjects.ts` |
| Create | `src/modules/CommunicationManager/hooks/useMockCommCycles.ts` |
| Modify | `src/components/layout/Sidebar.tsx` |
| Modify | `src/components/layout/Layout.tsx` |
| Modify | `src/modules/DashboardV2/index.tsx` |

---

## Task 1 — Mettre à jour les types

**Files:**
- Modify: `src/types/project-v2.ts`

- [ ] **Étape 1 : Remplacer `PrestaType` et ajouter les types de brief**

Ouvrir `src/types/project-v2.ts` et appliquer les changements suivants :

```typescript
// Remplacer la ligne :
// export type PrestaType = 'web' | 'seo' | 'erp' | 'saas'
// Par :
export type PrestaType = 'web' | 'seo' | 'erp' | 'saas' | 'site_web' | 'erp_v2' | 'communication'

// Ajouter après l'interface ProjectBrief existante :

// ===== BRIEF SITE WEB =====
export type PackSiteWeb = 'starter' | 'professionnel' | 'entreprise' | 'sur_mesure'
export type NiveauSEO = 'basique' | 'avance' | 'premium'

export interface BriefSiteWeb {
  id: string
  project_id: string
  pack: PackSiteWeb
  nb_pages: number | null
  budget: number | null
  niveau_seo: NiveauSEO
  url_site: string | null
  plateforme: string | null
  status: BriefStatus
  created_at: string
  updated_at: string
}

// ===== BRIEF ERP =====
export type ModuleERP =
  | 'gestion_commerciale'
  | 'crm_suivi'
  | 'gestion_projets'
  | 'stocks_logistique'
  | 'suivi_financier'
  | 'multi_utilisateurs'
  | 'tableaux_bord'
  | 'connexions_api'
  | 'sur_mesure'

export interface BriefERP {
  id: string
  project_id: string
  modules: ModuleERP[]
  nb_utilisateurs: number | null
  budget: number | null
  outils_integres: string | null
  url_deploiement: string | null
  status: BriefStatus
  created_at: string
  updated_at: string
}

// ===== BRIEF COMMUNICATION =====
export type TypeContratComm = 'abonnement' | 'branding' | 'photos_videos'
export type PackComm = 'starter' | 'premium' | 'excellence'
export type PlateformeComm = 'instagram' | 'linkedin' | 'multi'

export interface BriefComm {
  id: string
  project_id: string
  type_contrat: TypeContratComm
  pack: PackComm | null
  nb_posts_mois: number | null
  nb_reels_mois: number | null
  nb_templates: number | null
  plateforme: PlateformeComm | null
  date_debut: string | null
  date_renouvellement: string | null
  mrr: number | null
  budget: number | null
  date_livraison: string | null
  status: BriefStatus
  created_at: string
  updated_at: string
}

// ===== CYCLES MENSUELS COMMUNICATION =====
export type CycleStatus = 'en_cours' | 'termine'

export interface CommMonthlyCycle {
  id: string
  project_id: string
  mois: string          // format YYYY-MM-DD (1er du mois)
  label: string         // ex: "Avril 2026"
  status: CycleStatus
  created_at: string
}

export interface CommCycleTask {
  id: string
  cycle_id: string
  project_id: string
  title: string
  done: boolean
  sort_order: number
}

// ===== STATUTS KANBAN PAR MODULE =====
export type StatusSiteWeb =
  | 'prospect'
  | 'devis_envoye'
  | 'signe'
  | 'en_production'
  | 'livre'
  | 'perdu'

export type StatusERP =
  | 'prospect'
  | 'analyse_besoins'
  | 'devis_envoye'
  | 'signe'
  | 'en_developpement'
  | 'recette'
  | 'livre'
  | 'perdu'

export type StatusComm =
  | 'prospect'
  | 'brief_creatif'
  | 'devis_envoye'
  | 'signe'
  | 'en_production'
  | 'actif'
  | 'termine'
  | 'perdu'
```

- [ ] **Étape 2 : Commit**

```bash
git add src/types/project-v2.ts
git commit -m "feat(types): ajouter types BriefSiteWeb, BriefERP, BriefComm, CommMonthlyCycle"
```

---

## Task 2 — Module Site Web & SEO : mocks

**Files:**
- Create: `src/modules/SiteWebManager/mocks/mockSiteWebProjects.ts`
- Create: `src/modules/SiteWebManager/mocks/mockSiteWebBriefs.ts`
- Create: `src/modules/SiteWebManager/mocks/mockSiteWebChecklists.ts`
- Create: `src/modules/SiteWebManager/mocks/index.ts`

- [ ] **Étape 1 : Créer les mocks projets**

`src/modules/SiteWebManager/mocks/mockSiteWebProjects.ts` :
```typescript
import type { ProjectV2 } from '../../../types/project-v2'
import type { StatusSiteWeb } from '../../../types/project-v2'

const now = new Date().toISOString()

export const MOCK_SITEWEB_PROJECTS: (ProjectV2 & { sw_status: StatusSiteWeb })[] = [
  {
    id: 'sw-001', user_id: null, client_id: null,
    client_name: 'Boulangerie Dupont',
    name: 'Site vitrine Boulangerie Dupont',
    description: 'Refonte + SEO local',
    status: 'in_progress', priority: 'high',
    assigned_to: 'user-alice', assigned_name: 'Alice Martin',
    start_date: '2026-03-15', end_date: '2026-04-30',
    budget: 1980, progress: 60, category: 'site_web',
    presta_type: ['site_web'], completion_score: 60,
    last_activity_at: now, completed_at: null,
    is_archived: false, next_action_label: 'Livrer maquette mobile',
    next_action_due: '2026-04-12', siret: null,
    company_data: null, company_enriched_at: null,
    ai_summary: null, ai_summary_generated_at: null,
    portal_token: null, portal_enabled: false,
    created_at: now, updated_at: now,
    sw_status: 'en_production',
  },
  {
    id: 'sw-002', user_id: null, client_id: null,
    client_name: 'Cabinet Legrand',
    name: 'Site + SEO Cabinet Legrand',
    description: 'Pack Entreprise — 10 pages',
    status: 'prospect', priority: 'medium',
    assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre',
    start_date: '2026-04-01', end_date: null,
    budget: 2980, progress: 5, category: 'site_web',
    presta_type: ['site_web'], completion_score: 5,
    last_activity_at: now, completed_at: null,
    is_archived: false, next_action_label: 'Envoyer devis',
    next_action_due: '2026-04-10', siret: null,
    company_data: null, company_enriched_at: null,
    ai_summary: null, ai_summary_generated_at: null,
    portal_token: null, portal_enabled: false,
    created_at: now, updated_at: now,
    sw_status: 'prospect',
  },
  {
    id: 'sw-003', user_id: null, client_id: null,
    client_name: 'Studio Deus',
    name: 'Landing page Studio Deus',
    description: 'Pack Starter — 1 page',
    status: 'delivered', priority: 'low',
    assigned_to: 'user-carol', assigned_name: 'Carol Petit',
    start_date: '2026-02-01', end_date: '2026-03-01',
    budget: 1480, progress: 100, category: 'site_web',
    presta_type: ['site_web'], completion_score: 100,
    last_activity_at: now, completed_at: '2026-03-01',
    is_archived: false, next_action_label: null,
    next_action_due: null, siret: null,
    company_data: null, company_enriched_at: null,
    ai_summary: null, ai_summary_generated_at: null,
    portal_token: null, portal_enabled: false,
    created_at: now, updated_at: now,
    sw_status: 'livre',
  },
]
```

- [ ] **Étape 2 : Créer les mocks briefs**

`src/modules/SiteWebManager/mocks/mockSiteWebBriefs.ts` :
```typescript
import type { BriefSiteWeb } from '../../../types/project-v2'

const now = new Date().toISOString()

export const MOCK_SITEWEB_BRIEFS: Record<string, BriefSiteWeb> = {
  'sw-001': {
    id: 'swb-001', project_id: 'sw-001', status: 'validated',
    pack: 'professionnel', nb_pages: 5, budget: 1980,
    niveau_seo: 'avance', url_site: null,
    plateforme: 'WordPress',
    created_at: now, updated_at: now,
  },
  'sw-002': {
    id: 'swb-002', project_id: 'sw-002', status: 'draft',
    pack: 'entreprise', nb_pages: 10, budget: 2980,
    niveau_seo: 'premium', url_site: null,
    plateforme: null,
    created_at: now, updated_at: now,
  },
  'sw-003': {
    id: 'swb-003', project_id: 'sw-003', status: 'frozen',
    pack: 'starter', nb_pages: 1, budget: 1480,
    niveau_seo: 'basique', url_site: 'https://studio-deus.fr',
    plateforme: 'Webflow',
    created_at: now, updated_at: now,
  },
}
```

- [ ] **Étape 3 : Créer les mocks checklists**

`src/modules/SiteWebManager/mocks/mockSiteWebChecklists.ts` :
```typescript
import type { ChecklistItemV2 } from '../../../types/project-v2'

const now = new Date().toISOString()

// Template pré-rempli pour un projet Site Web
export const SITEWEB_CHECKLIST_TEMPLATE: Omit<ChecklistItemV2, 'id' | 'project_id' | 'created_at' | 'updated_at'>[] = [
  { parent_task_id: null, title: 'Brief client reçu', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 1 },
  { parent_task_id: null, title: 'Maquette créée', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 2 },
  { parent_task_id: null, title: 'Maquette validée client', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 3 },
  { parent_task_id: null, title: 'Développement', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 4 },
  { parent_task_id: null, title: 'SEO technique implémenté', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 5 },
  { parent_task_id: null, title: 'Contenu intégré', phase: 'developpement', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, sort_order: 6 },
  { parent_task_id: null, title: 'Tests responsive & performance', phase: 'recette', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, sort_order: 7 },
  { parent_task_id: null, title: 'Mise en ligne', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 8 },
  { parent_task_id: null, title: 'Formation plateforme de modifications', phase: 'post_livraison', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, sort_order: 9 },
  { parent_task_id: null, title: 'Livraison finale + demande avis client', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 10 },
]

export const MOCK_SITEWEB_CHECKLISTS: Record<string, ChecklistItemV2[]> = {
  'sw-001': [
    { id: 'swck-001a', project_id: 'sw-001', parent_task_id: null, title: 'Brief client reçu', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: null, sort_order: 1, created_at: now, updated_at: now },
    { id: 'swck-001b', project_id: 'sw-001', parent_task_id: null, title: 'Maquette créée', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: null, sort_order: 2, created_at: now, updated_at: now },
    { id: 'swck-001c', project_id: 'sw-001', parent_task_id: null, title: 'Maquette validée client', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: null, sort_order: 3, created_at: now, updated_at: now },
    { id: 'swck-001d', project_id: 'sw-001', parent_task_id: null, title: 'Développement', phase: 'developpement', status: 'in_progress', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: null, sort_order: 4, created_at: now, updated_at: now },
    { id: 'swck-001e', project_id: 'sw-001', parent_task_id: null, title: 'SEO technique implémenté', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 5, created_at: now, updated_at: now },
    { id: 'swck-001f', project_id: 'sw-001', parent_task_id: null, title: 'Contenu intégré', phase: 'developpement', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, sort_order: 6, created_at: now, updated_at: now },
    { id: 'swck-001g', project_id: 'sw-001', parent_task_id: null, title: 'Tests responsive & performance', phase: 'recette', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, sort_order: 7, created_at: now, updated_at: now },
    { id: 'swck-001h', project_id: 'sw-001', parent_task_id: null, title: 'Mise en ligne', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 8, created_at: now, updated_at: now },
    { id: 'swck-001i', project_id: 'sw-001', parent_task_id: null, title: 'Formation plateforme de modifications', phase: 'post_livraison', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, sort_order: 9, created_at: now, updated_at: now },
    { id: 'swck-001j', project_id: 'sw-001', parent_task_id: null, title: 'Livraison finale + demande avis client', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 10, created_at: now, updated_at: now },
  ],
  'sw-002': SITEWEB_CHECKLIST_TEMPLATE.map((t, i) => ({ ...t, id: `swck-002${String.fromCharCode(97+i)}`, project_id: 'sw-002', created_at: now, updated_at: now })),
  'sw-003': SITEWEB_CHECKLIST_TEMPLATE.map((t, i) => ({ ...t, id: `swck-003${String.fromCharCode(97+i)}`, project_id: 'sw-003', status: 'done' as const, created_at: now, updated_at: now })),
}
```

- [ ] **Étape 4 : Créer l'index mocks**

`src/modules/SiteWebManager/mocks/index.ts` :
```typescript
export { MOCK_SITEWEB_PROJECTS } from './mockSiteWebProjects'
export { MOCK_SITEWEB_BRIEFS } from './mockSiteWebBriefs'
export { MOCK_SITEWEB_CHECKLISTS, SITEWEB_CHECKLIST_TEMPLATE } from './mockSiteWebChecklists'
```

- [ ] **Étape 5 : Commit**

```bash
git add src/modules/SiteWebManager/
git commit -m "feat(site-web): mocks projets, briefs, checklists Site Web & SEO"
```

---

## Task 3 — Module Site Web : hook + composants + index

**Files:**
- Create: `src/modules/SiteWebManager/hooks/useMockSiteWebProjects.ts`
- Create: `src/modules/SiteWebManager/components/SiteWebBriefTab.tsx`
- Create: `src/modules/SiteWebManager/index.tsx`

- [ ] **Étape 1 : Créer le hook**

`src/modules/SiteWebManager/hooks/useMockSiteWebProjects.ts` :
```typescript
import { useState, useCallback } from 'react'
import { MOCK_SITEWEB_PROJECTS } from '../mocks'
import type { ProjectV2 } from '../../../types/project-v2'
import type { StatusSiteWeb } from '../../../types/project-v2'

type SiteWebProject = ProjectV2 & { sw_status: StatusSiteWeb }

export function useMockSiteWebProjects() {
  const [projects, setProjects] = useState<SiteWebProject[]>(MOCK_SITEWEB_PROJECTS)

  const updateStatus = useCallback((id: string, status: StatusSiteWeb) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, sw_status: status } : p))
  }, [])

  const addProject = useCallback((data: Omit<SiteWebProject, 'id' | 'created_at' | 'updated_at'>) => {
    const id = `sw-${Date.now()}`
    const now = new Date().toISOString()
    setProjects(prev => [...prev, { ...data, id, created_at: now, updated_at: now }])
    return id
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  return { projects, updateStatus, addProject, deleteProject }
}
```

- [ ] **Étape 2 : Créer SiteWebBriefTab**

`src/modules/SiteWebManager/components/SiteWebBriefTab.tsx` :
```typescript
import React, { useState } from 'react'
import type { BriefSiteWeb, PackSiteWeb, NiveauSEO } from '../../../types/project-v2'
import { MOCK_SITEWEB_BRIEFS } from '../mocks'

const PACK_LABELS: Record<PackSiteWeb, string> = {
  starter: 'Starter — 1 480€',
  professionnel: 'Professionnel — 1 980€',
  entreprise: 'Entreprise — 2 980€',
  sur_mesure: 'Sur mesure — Devis',
}

const PACK_PAGES: Record<PackSiteWeb, number | null> = {
  starter: 1, professionnel: 5, entreprise: 10, sur_mesure: null,
}

const PACK_BUDGET: Record<PackSiteWeb, number | null> = {
  starter: 1480, professionnel: 1980, entreprise: 2980, sur_mesure: null,
}

const SEO_LABELS: Record<NiveauSEO, string> = {
  basique: 'Basique', avance: 'Avancé', premium: 'Premium',
}

interface Props { projectId: string }

export function SiteWebBriefTab({ projectId }: Props) {
  const initial = MOCK_SITEWEB_BRIEFS[projectId] ?? null
  const [brief, setBrief] = useState<BriefSiteWeb | null>(initial)

  if (!brief) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Aucun brief — <button className="text-primary underline" onClick={() => {
          const now = new Date().toISOString()
          setBrief({ id: `swb-${Date.now()}`, project_id: projectId, status: 'draft', pack: 'starter', nb_pages: 1, budget: 1480, niveau_seo: 'basique', url_site: null, plateforme: null, created_at: now, updated_at: now })
        }}>Créer le brief</button>
      </div>
    )
  }

  const handlePackChange = (pack: PackSiteWeb) => {
    setBrief(prev => prev ? { ...prev, pack, nb_pages: PACK_PAGES[pack], budget: PACK_BUDGET[pack] } : prev)
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Brief Site Web & SEO</h3>

      {/* Pack */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Pack</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PACK_LABELS) as PackSiteWeb[]).map(pack => (
            <button key={pack} onClick={() => handlePackChange(pack)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                brief.pack === pack
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface-2 border-border text-muted-foreground hover:border-primary/50'
              }`}>
              {PACK_LABELS[pack]}
            </button>
          ))}
        </div>
      </div>

      {/* Nb pages + Budget (auto) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Nb pages</label>
          <input type="number" value={brief.nb_pages ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, nb_pages: parseInt(e.target.value) || null } : prev)}
            className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Budget (€)</label>
          <input type="number" value={brief.budget ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, budget: parseFloat(e.target.value) || null } : prev)}
            className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
        </div>
      </div>

      {/* Niveau SEO */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Niveau SEO</label>
        <div className="flex gap-2">
          {(Object.keys(SEO_LABELS) as NiveauSEO[]).map(lvl => (
            <button key={lvl} onClick={() => setBrief(prev => prev ? { ...prev, niveau_seo: lvl } : prev)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                brief.niveau_seo === lvl
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface-2 border-border text-muted-foreground hover:border-primary/50'
              }`}>
              {SEO_LABELS[lvl]}
            </button>
          ))}
        </div>
      </div>

      {/* URL site + Plateforme */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">URL site final</label>
          <input type="url" value={brief.url_site ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, url_site: e.target.value || null } : prev)}
            placeholder="https://..." className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Plateforme</label>
          <input type="text" value={brief.plateforme ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, plateforme: e.target.value || null } : prev)}
            placeholder="WordPress, Webflow…" className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Étape 3 : Créer l'index du module Site Web**

`src/modules/SiteWebManager/index.tsx` :

Copier `src/modules/ProjectsManagerV2/index.tsx` et adapter :
- Titre : `"Site Web & SEO"`
- Sous-titre : `"{n} projet(s) · Pack Starter/Pro/Entreprise"`
- Remplacer `useMockProjects` par `useMockSiteWebProjects`
- Remplacer `PrestaType` options par `['site_web']` (fixe, pas de toggle)
- Remplacer les colonnes kanban par les 6 colonnes Site Web :

```typescript
// Colonnes kanban Site Web
const SITEWEB_COLUMNS: { id: StatusSiteWeb; label: string; color: string }[] = [
  { id: 'prospect',      label: 'Prospect',      color: 'bg-slate-500' },
  { id: 'devis_envoye',  label: 'Devis envoyé',  color: 'bg-blue-500' },
  { id: 'signe',         label: 'Signé',          color: 'bg-violet-500' },
  { id: 'en_production', label: 'En production',  color: 'bg-amber-500' },
  { id: 'livre',         label: 'Livré',          color: 'bg-green-500' },
  { id: 'perdu',         label: 'Perdu',          color: 'bg-red-500' },
]
```

- Remplacer `<ProjectKanbanV2>` par un kanban qui groupe `projects` par `sw_status`
- Exporter : `export function SiteWebManager() { ... }`

- [ ] **Étape 4 : Commit**

```bash
git add src/modules/SiteWebManager/
git commit -m "feat(site-web): module SiteWebManager complet — kanban 6 colonnes + brief dynamique"
```

---

## Task 4 — Module ERP Sur Mesure

**Files:**
- Create: `src/modules/ERPManager/mocks/mockERPProjects.ts`
- Create: `src/modules/ERPManager/mocks/mockERPBriefs.ts`
- Create: `src/modules/ERPManager/mocks/mockERPChecklists.ts`
- Create: `src/modules/ERPManager/mocks/index.ts`
- Create: `src/modules/ERPManager/hooks/useMockERPProjects.ts`
- Create: `src/modules/ERPManager/components/ERPBriefTab.tsx`
- Create: `src/modules/ERPManager/index.tsx`

- [ ] **Étape 1 : Mocks ERP**

`src/modules/ERPManager/mocks/mockERPProjects.ts` :
```typescript
import type { ProjectV2 } from '../../../types/project-v2'
import type { StatusERP } from '../../../types/project-v2'

const now = new Date().toISOString()

export const MOCK_ERP_PROJECTS: (ProjectV2 & { erp_status: StatusERP })[] = [
  {
    id: 'erp-001', user_id: null, client_id: null,
    client_name: 'Agence Immo Horizon',
    name: 'ERP gestion mandats immobiliers',
    description: 'CRM + pipeline transactions + commissions',
    status: 'in_progress', priority: 'urgent',
    assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre',
    start_date: '2026-02-15', end_date: '2026-06-30',
    budget: 12000, progress: 40, category: 'erp_v2',
    presta_type: ['erp_v2'], completion_score: 40,
    last_activity_at: now, completed_at: null,
    is_archived: false, next_action_label: 'Sprint 2 — features avancées',
    next_action_due: '2026-04-15', siret: null,
    company_data: null, company_enriched_at: null,
    ai_summary: null, ai_summary_generated_at: null,
    portal_token: null, portal_enabled: false,
    created_at: now, updated_at: now,
    erp_status: 'en_developpement',
  },
  {
    id: 'erp-002', user_id: null, client_id: null,
    client_name: 'Clinique Vétérinaire Morin',
    name: 'ERP gestion clinique vétérinaire',
    description: 'Gestion RDV + stocks + facturation',
    status: 'prospect', priority: 'medium',
    assigned_to: 'user-alice', assigned_name: 'Alice Martin',
    start_date: '2026-04-01', end_date: null,
    budget: null, progress: 0, category: 'erp_v2',
    presta_type: ['erp_v2'], completion_score: 0,
    last_activity_at: now, completed_at: null,
    is_archived: false, next_action_label: 'Audit besoins',
    next_action_due: '2026-04-12', siret: null,
    company_data: null, company_enriched_at: null,
    ai_summary: null, ai_summary_generated_at: null,
    portal_token: null, portal_enabled: false,
    created_at: now, updated_at: now,
    erp_status: 'prospect',
  },
]
```

`src/modules/ERPManager/mocks/mockERPBriefs.ts` :
```typescript
import type { BriefERP } from '../../../types/project-v2'

const now = new Date().toISOString()

export const MOCK_ERP_BRIEFS: Record<string, BriefERP> = {
  'erp-001': {
    id: 'erpb-001', project_id: 'erp-001', status: 'frozen',
    modules: ['crm_suivi', 'gestion_projets', 'suivi_financier', 'multi_utilisateurs', 'tableaux_bord'],
    nb_utilisateurs: 10, budget: 12000,
    outils_integres: 'Stripe, DocuSign',
    url_deploiement: null,
    created_at: now, updated_at: now,
  },
  'erp-002': {
    id: 'erpb-002', project_id: 'erp-002', status: 'draft',
    modules: [], nb_utilisateurs: null, budget: null,
    outils_integres: null, url_deploiement: null,
    created_at: now, updated_at: now,
  },
}
```

`src/modules/ERPManager/mocks/mockERPChecklists.ts` :
```typescript
import type { ChecklistItemV2 } from '../../../types/project-v2'

const now = new Date().toISOString()

export const ERP_CHECKLIST_TEMPLATE: Omit<ChecklistItemV2, 'id' | 'project_id' | 'created_at' | 'updated_at'>[] = [
  { parent_task_id: null, title: 'Audit besoins client', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 1 },
  { parent_task_id: null, title: 'Cahier des charges rédigé', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 2 },
  { parent_task_id: null, title: 'CDC validé client', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 3 },
  { parent_task_id: null, title: 'Maquettes UX validées', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 4 },
  { parent_task_id: null, title: 'Base de données conçue', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 5 },
  { parent_task_id: null, title: 'Modules développés', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 6 },
  { parent_task_id: null, title: 'Intégrations API configurées', phase: 'developpement', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, sort_order: 7 },
  { parent_task_id: null, title: 'Tests & corrections', phase: 'recette', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 8 },
  { parent_task_id: null, title: 'Formation utilisateurs', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 9 },
  { parent_task_id: null, title: 'Déploiement production', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 10 },
  { parent_task_id: null, title: 'Recette signée client', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 11 },
]

export const MOCK_ERP_CHECKLISTS: Record<string, ChecklistItemV2[]> = {
  'erp-001': [
    { id: 'erck-001a', project_id: 'erp-001', parent_task_id: null, title: 'Audit besoins client', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, sort_order: 1, created_at: now, updated_at: now },
    { id: 'erck-001b', project_id: 'erp-001', parent_task_id: null, title: 'Cahier des charges rédigé', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, sort_order: 2, created_at: now, updated_at: now },
    { id: 'erck-001c', project_id: 'erp-001', parent_task_id: null, title: 'CDC validé client', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, sort_order: 3, created_at: now, updated_at: now },
    { id: 'erck-001d', project_id: 'erp-001', parent_task_id: null, title: 'Maquettes UX validées', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, sort_order: 4, created_at: now, updated_at: now },
    { id: 'erck-001e', project_id: 'erp-001', parent_task_id: null, title: 'Base de données conçue', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, sort_order: 5, created_at: now, updated_at: now },
    { id: 'erck-001f', project_id: 'erp-001', parent_task_id: null, title: 'Modules développés', phase: 'developpement', status: 'in_progress', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, sort_order: 6, created_at: now, updated_at: now },
    { id: 'erck-001g', project_id: 'erp-001', parent_task_id: null, title: 'Intégrations API configurées', phase: 'developpement', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, sort_order: 7, created_at: now, updated_at: now },
    { id: 'erck-001h', project_id: 'erp-001', parent_task_id: null, title: 'Tests & corrections', phase: 'recette', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 8, created_at: now, updated_at: now },
    { id: 'erck-001i', project_id: 'erp-001', parent_task_id: null, title: 'Formation utilisateurs', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 9, created_at: now, updated_at: now },
    { id: 'erck-001j', project_id: 'erp-001', parent_task_id: null, title: 'Déploiement production', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 10, created_at: now, updated_at: now },
    { id: 'erck-001k', project_id: 'erp-001', parent_task_id: null, title: 'Recette signée client', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 11, created_at: now, updated_at: now },
  ],
  'erp-002': ERP_CHECKLIST_TEMPLATE.map((t, i) => ({ ...t, id: `erck-002${String.fromCharCode(97+i)}`, project_id: 'erp-002', created_at: now, updated_at: now })),
}
```

`src/modules/ERPManager/mocks/index.ts` :
```typescript
export { MOCK_ERP_PROJECTS } from './mockERPProjects'
export { MOCK_ERP_BRIEFS } from './mockERPBriefs'
export { MOCK_ERP_CHECKLISTS, ERP_CHECKLIST_TEMPLATE } from './mockERPChecklists'
```

- [ ] **Étape 2 : Hook ERP**

`src/modules/ERPManager/hooks/useMockERPProjects.ts` :
```typescript
import { useState, useCallback } from 'react'
import { MOCK_ERP_PROJECTS } from '../mocks'
import type { ProjectV2 } from '../../../types/project-v2'
import type { StatusERP } from '../../../types/project-v2'

type ERPProject = ProjectV2 & { erp_status: StatusERP }

export function useMockERPProjects() {
  const [projects, setProjects] = useState<ERPProject[]>(MOCK_ERP_PROJECTS)

  const updateStatus = useCallback((id: string, status: StatusERP) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, erp_status: status } : p))
  }, [])

  const addProject = useCallback((data: Omit<ERPProject, 'id' | 'created_at' | 'updated_at'>) => {
    const id = `erp-${Date.now()}`
    const now = new Date().toISOString()
    setProjects(prev => [...prev, { ...data, id, created_at: now, updated_at: now }])
    return id
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  return { projects, updateStatus, addProject, deleteProject }
}
```

- [ ] **Étape 3 : ERPBriefTab**

`src/modules/ERPManager/components/ERPBriefTab.tsx` :
```typescript
import React, { useState } from 'react'
import type { BriefERP, ModuleERP } from '../../../types/project-v2'
import { MOCK_ERP_BRIEFS } from '../mocks'

const MODULE_LABELS: Record<ModuleERP, string> = {
  gestion_commerciale: 'Gestion commerciale (devis, facturation)',
  crm_suivi: 'CRM & suivi client',
  gestion_projets: 'Gestion de projets',
  stocks_logistique: 'Stocks & logistique',
  suivi_financier: 'Suivi financier',
  multi_utilisateurs: 'Multi-utilisateurs (rôles & permissions)',
  tableaux_bord: 'Tableaux de bord KPI',
  connexions_api: 'Connexions API (outils externes)',
  sur_mesure: 'Module sur mesure',
}

const ALL_MODULES = Object.keys(MODULE_LABELS) as ModuleERP[]

interface Props { projectId: string }

export function ERPBriefTab({ projectId }: Props) {
  const initial = MOCK_ERP_BRIEFS[projectId] ?? null
  const [brief, setBrief] = useState<BriefERP | null>(initial)

  if (!brief) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Aucun brief — <button className="text-primary underline" onClick={() => {
          const now = new Date().toISOString()
          setBrief({ id: `erpb-${Date.now()}`, project_id: projectId, status: 'draft', modules: [], nb_utilisateurs: null, budget: null, outils_integres: null, url_deploiement: null, created_at: now, updated_at: now })
        }}>Créer le brief</button>
      </div>
    )
  }

  const toggleModule = (mod: ModuleERP) => {
    setBrief(prev => {
      if (!prev) return prev
      const modules = prev.modules.includes(mod)
        ? prev.modules.filter(m => m !== mod)
        : [...prev.modules, mod]
      return { ...prev, modules }
    })
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Brief ERP Sur Mesure</h3>

      {/* Modules */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Modules sélectionnés</label>
        <div className="space-y-1.5">
          {ALL_MODULES.map(mod => (
            <label key={mod} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={brief.modules.includes(mod)} onChange={() => toggleModule(mod)}
                className="rounded border-border text-primary" />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {MODULE_LABELS[mod]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Nb utilisateurs + Budget */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Nb utilisateurs</label>
          <input type="number" value={brief.nb_utilisateurs ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, nb_utilisateurs: parseInt(e.target.value) || null } : prev)}
            className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Budget estimé (€)</label>
          <input type="number" value={brief.budget ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, budget: parseFloat(e.target.value) || null } : prev)}
            className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
        </div>
      </div>

      {/* Outils + URL */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Outils à intégrer</label>
          <input type="text" value={brief.outils_integres ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, outils_integres: e.target.value || null } : prev)}
            placeholder="Stripe, Shopify…" className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">URL déploiement</label>
          <input type="url" value={brief.url_deploiement ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, url_deploiement: e.target.value || null } : prev)}
            placeholder="https://…" className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Étape 4 : Index ERPManager**

`src/modules/ERPManager/index.tsx` : Même structure que `SiteWebManager/index.tsx` mais :
- Titre : `"ERP Sur Mesure"`
- Colonnes kanban ERP (8 colonnes) :

```typescript
const ERP_COLUMNS: { id: StatusERP; label: string; color: string }[] = [
  { id: 'prospect',         label: 'Prospect',         color: 'bg-slate-500' },
  { id: 'analyse_besoins',  label: 'Analyse besoins',  color: 'bg-sky-500' },
  { id: 'devis_envoye',     label: 'Devis envoyé',     color: 'bg-blue-500' },
  { id: 'signe',            label: 'Signé',             color: 'bg-violet-500' },
  { id: 'en_developpement', label: 'En développement', color: 'bg-amber-500' },
  { id: 'recette',          label: 'Recette',           color: 'bg-orange-500' },
  { id: 'livre',            label: 'Livré',             color: 'bg-green-500' },
  { id: 'perdu',            label: 'Perdu',             color: 'bg-red-500' },
]
```

- Utilise `useMockERPProjects` et groupe par `erp_status`
- Exporte : `export function ERPManager() { ... }`

- [ ] **Étape 5 : Commit**

```bash
git add src/modules/ERPManager/
git commit -m "feat(erp): module ERPManager complet — kanban 8 colonnes + brief modules multi-select"
```

---

## Task 5 — Module Communication : mocks + cycles

**Files:**
- Create: `src/modules/CommunicationManager/mocks/mockCommProjects.ts`
- Create: `src/modules/CommunicationManager/mocks/mockCommBriefs.ts`
- Create: `src/modules/CommunicationManager/mocks/mockCommChecklists.ts`
- Create: `src/modules/CommunicationManager/mocks/mockCommCycles.ts`
- Create: `src/modules/CommunicationManager/mocks/index.ts`

- [ ] **Étape 1 : Mocks projets Communication**

`src/modules/CommunicationManager/mocks/mockCommProjects.ts` :
```typescript
import type { ProjectV2 } from '../../../types/project-v2'
import type { StatusComm } from '../../../types/project-v2'

const now = new Date().toISOString()

export const MOCK_COMM_PROJECTS: (ProjectV2 & { comm_status: StatusComm })[] = [
  {
    id: 'comm-001', user_id: null, client_id: null,
    client_name: 'Murmure', name: 'Abonnement Instagram Murmure',
    description: 'Pack Excellence — 12 posts/mois',
    status: 'in_progress', priority: 'high',
    assigned_to: 'user-carol', assigned_name: 'Carol Petit',
    start_date: '2026-01-01', end_date: null,
    budget: 1400, progress: 100, category: 'communication',
    presta_type: ['communication'], completion_score: 100,
    last_activity_at: now, completed_at: null,
    is_archived: false, next_action_label: 'Brief Mai 2026',
    next_action_due: '2026-05-01', siret: null,
    company_data: null, company_enriched_at: null,
    ai_summary: null, ai_summary_generated_at: null,
    portal_token: null, portal_enabled: false,
    created_at: now, updated_at: now,
    comm_status: 'actif',
  },
  {
    id: 'comm-002', user_id: null, client_id: null,
    client_name: 'Studio Deus', name: 'Branding Studio Deus',
    description: 'Identité visuelle complète',
    status: 'in_progress', priority: 'medium',
    assigned_to: 'user-alice', assigned_name: 'Alice Martin',
    start_date: '2026-03-20', end_date: '2026-04-20',
    budget: 1500, progress: 60, category: 'communication',
    presta_type: ['communication'], completion_score: 60,
    last_activity_at: now, completed_at: null,
    is_archived: false, next_action_label: 'Validation logo',
    next_action_due: '2026-04-12', siret: null,
    company_data: null, company_enriched_at: null,
    ai_summary: null, ai_summary_generated_at: null,
    portal_token: null, portal_enabled: false,
    created_at: now, updated_at: now,
    comm_status: 'en_production',
  },
  {
    id: 'comm-003', user_id: null, client_id: null,
    client_name: 'Les Récoltants', name: 'Abonnement Instagram Les Récoltants',
    description: 'Pack Premium — 8 posts/mois',
    status: 'prospect', priority: 'medium',
    assigned_to: null, assigned_name: null,
    start_date: '2026-04-09', end_date: null,
    budget: 900, progress: 0, category: 'communication',
    presta_type: ['communication'], completion_score: 0,
    last_activity_at: now, completed_at: null,
    is_archived: false, next_action_label: 'Envoyer devis',
    next_action_due: '2026-04-15', siret: null,
    company_data: null, company_enriched_at: null,
    ai_summary: null, ai_summary_generated_at: null,
    portal_token: null, portal_enabled: false,
    created_at: now, updated_at: now,
    comm_status: 'prospect',
  },
]
```

- [ ] **Étape 2 : Mocks briefs Communication**

`src/modules/CommunicationManager/mocks/mockCommBriefs.ts` :
```typescript
import type { BriefComm } from '../../../types/project-v2'

const now = new Date().toISOString()

export const MOCK_COMM_BRIEFS: Record<string, BriefComm> = {
  'comm-001': {
    id: 'commb-001', project_id: 'comm-001', status: 'validated',
    type_contrat: 'abonnement', pack: 'excellence',
    nb_posts_mois: 12, nb_reels_mois: 2, nb_templates: 4,
    plateforme: 'instagram', date_debut: '2026-01-01',
    date_renouvellement: '2026-05-01', mrr: 1400,
    budget: null, date_livraison: null,
    created_at: now, updated_at: now,
  },
  'comm-002': {
    id: 'commb-002', project_id: 'comm-002', status: 'validated',
    type_contrat: 'branding', pack: null,
    nb_posts_mois: null, nb_reels_mois: null, nb_templates: null,
    plateforme: null, date_debut: '2026-03-20',
    date_renouvellement: null, mrr: null,
    budget: 1500, date_livraison: '2026-04-20',
    created_at: now, updated_at: now,
  },
  'comm-003': {
    id: 'commb-003', project_id: 'comm-003', status: 'draft',
    type_contrat: 'abonnement', pack: 'premium',
    nb_posts_mois: 8, nb_reels_mois: 1, nb_templates: 2,
    plateforme: 'instagram', date_debut: null,
    date_renouvellement: null, mrr: 900,
    budget: null, date_livraison: null,
    created_at: now, updated_at: now,
  },
}
```

- [ ] **Étape 3 : Templates checklists Communication**

`src/modules/CommunicationManager/mocks/mockCommChecklists.ts` :
```typescript
import type { ChecklistItemV2 } from '../../../types/project-v2'

const now = new Date().toISOString()

export const COMM_CHECKLIST_ABONNEMENT: Omit<ChecklistItemV2, 'id' | 'project_id' | 'created_at' | 'updated_at'>[] = [
  { parent_task_id: null, title: 'Brief mensuel reçu', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 1 },
  { parent_task_id: null, title: 'Calendrier éditorial validé', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 2 },
  { parent_task_id: null, title: 'Visuels créés', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 3 },
  { parent_task_id: null, title: 'Textes rédigés', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 4 },
  { parent_task_id: null, title: 'Validation client', phase: 'recette', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 5 },
  { parent_task_id: null, title: 'Programmation des posts', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 6 },
  { parent_task_id: null, title: 'Rapport de performance envoyé', phase: 'post_livraison', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, sort_order: 7 },
]

export const COMM_CHECKLIST_BRANDING: Omit<ChecklistItemV2, 'id' | 'project_id' | 'created_at' | 'updated_at'>[] = [
  { parent_task_id: null, title: 'Brief identité reçu', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 1 },
  { parent_task_id: null, title: 'Propositions logo x3', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 2 },
  { parent_task_id: null, title: 'Logo validé client', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 3 },
  { parent_task_id: null, title: 'Charte graphique (couleurs, typographies)', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 4 },
  { parent_task_id: null, title: 'Déclinaisons livrées', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 5 },
  { parent_task_id: null, title: 'Livraison fichiers sources', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 6 },
]

export const COMM_CHECKLIST_PHOTOS: Omit<ChecklistItemV2, 'id' | 'project_id' | 'created_at' | 'updated_at'>[] = [
  { parent_task_id: null, title: 'Brief tournage reçu', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 1 },
  { parent_task_id: null, title: 'Date tournage confirmée', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 2 },
  { parent_task_id: null, title: 'Tournage réalisé', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 3 },
  { parent_task_id: null, title: 'Sélection photos/vidéos', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 4 },
  { parent_task_id: null, title: 'Retouches', phase: 'recette', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, sort_order: 5 },
  { parent_task_id: null, title: 'Livraison base média client', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, sort_order: 6 },
]
```

- [ ] **Étape 4 : Mocks cycles mensuels**

`src/modules/CommunicationManager/mocks/mockCommCycles.ts` :
```typescript
import type { CommMonthlyCycle, CommCycleTask } from '../../../types/project-v2'

const now = new Date().toISOString()

export const MOCK_COMM_CYCLES: Record<string, CommMonthlyCycle[]> = {
  'comm-001': [
    { id: 'cyc-001-jan', project_id: 'comm-001', mois: '2026-01-01', label: 'Janvier 2026', status: 'termine', created_at: now },
    { id: 'cyc-001-feb', project_id: 'comm-001', mois: '2026-02-01', label: 'Février 2026', status: 'termine', created_at: now },
    { id: 'cyc-001-mar', project_id: 'comm-001', mois: '2026-03-01', label: 'Mars 2026', status: 'termine', created_at: now },
    { id: 'cyc-001-apr', project_id: 'comm-001', mois: '2026-04-01', label: 'Avril 2026', status: 'en_cours', created_at: now },
  ],
}

export const MOCK_COMM_CYCLE_TASKS: Record<string, CommCycleTask[]> = {
  'cyc-001-jan': [
    { id: 'ct-jan-1', cycle_id: 'cyc-001-jan', project_id: 'comm-001', title: 'Brief mensuel reçu', done: true, sort_order: 1 },
    { id: 'ct-jan-2', cycle_id: 'cyc-001-jan', project_id: 'comm-001', title: 'Calendrier éditorial validé', done: true, sort_order: 2 },
    { id: 'ct-jan-3', cycle_id: 'cyc-001-jan', project_id: 'comm-001', title: 'Visuels créés', done: true, sort_order: 3 },
    { id: 'ct-jan-4', cycle_id: 'cyc-001-jan', project_id: 'comm-001', title: 'Textes rédigés', done: true, sort_order: 4 },
    { id: 'ct-jan-5', cycle_id: 'cyc-001-jan', project_id: 'comm-001', title: 'Validation client', done: true, sort_order: 5 },
    { id: 'ct-jan-6', cycle_id: 'cyc-001-jan', project_id: 'comm-001', title: 'Programmation des posts', done: true, sort_order: 6 },
    { id: 'ct-jan-7', cycle_id: 'cyc-001-jan', project_id: 'comm-001', title: 'Rapport de performance envoyé', done: true, sort_order: 7 },
  ],
  'cyc-001-apr': [
    { id: 'ct-apr-1', cycle_id: 'cyc-001-apr', project_id: 'comm-001', title: 'Brief mensuel reçu', done: true, sort_order: 1 },
    { id: 'ct-apr-2', cycle_id: 'cyc-001-apr', project_id: 'comm-001', title: 'Calendrier éditorial validé', done: true, sort_order: 2 },
    { id: 'ct-apr-3', cycle_id: 'cyc-001-apr', project_id: 'comm-001', title: 'Visuels créés', done: false, sort_order: 3 },
    { id: 'ct-apr-4', cycle_id: 'cyc-001-apr', project_id: 'comm-001', title: 'Textes rédigés', done: false, sort_order: 4 },
    { id: 'ct-apr-5', cycle_id: 'cyc-001-apr', project_id: 'comm-001', title: 'Validation client', done: false, sort_order: 5 },
    { id: 'ct-apr-6', cycle_id: 'cyc-001-apr', project_id: 'comm-001', title: 'Programmation des posts', done: false, sort_order: 6 },
    { id: 'ct-apr-7', cycle_id: 'cyc-001-apr', project_id: 'comm-001', title: 'Rapport de performance envoyé', done: false, sort_order: 7 },
  ],
}
```

`src/modules/CommunicationManager/mocks/index.ts` :
```typescript
export { MOCK_COMM_PROJECTS } from './mockCommProjects'
export { MOCK_COMM_BRIEFS } from './mockCommBriefs'
export { COMM_CHECKLIST_ABONNEMENT, COMM_CHECKLIST_BRANDING, COMM_CHECKLIST_PHOTOS } from './mockCommChecklists'
export { MOCK_COMM_CYCLES, MOCK_COMM_CYCLE_TASKS } from './mockCommCycles'
```

- [ ] **Étape 5 : Commit**

```bash
git add src/modules/CommunicationManager/mocks/
git commit -m "feat(comm): mocks Communication — projets, briefs, checklists, cycles mensuels"
```

---

## Task 6 — Module Communication : hooks + composants + index

**Files:**
- Create: `src/modules/CommunicationManager/hooks/useMockCommProjects.ts`
- Create: `src/modules/CommunicationManager/hooks/useMockCommCycles.ts`
- Create: `src/modules/CommunicationManager/components/CommBriefTab.tsx`
- Create: `src/modules/CommunicationManager/components/CommMonthlyCycles.tsx`
- Create: `src/modules/CommunicationManager/index.tsx`

- [ ] **Étape 1 : Hook projets Communication**

`src/modules/CommunicationManager/hooks/useMockCommProjects.ts` :
```typescript
import { useState, useCallback } from 'react'
import { MOCK_COMM_PROJECTS } from '../mocks'
import type { ProjectV2 } from '../../../types/project-v2'
import type { StatusComm } from '../../../types/project-v2'

type CommProject = ProjectV2 & { comm_status: StatusComm }

export function useMockCommProjects() {
  const [projects, setProjects] = useState<CommProject[]>(MOCK_COMM_PROJECTS)

  const updateStatus = useCallback((id: string, status: StatusComm) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, comm_status: status } : p))
  }, [])

  const addProject = useCallback((data: Omit<CommProject, 'id' | 'created_at' | 'updated_at'>) => {
    const id = `comm-${Date.now()}`
    const now = new Date().toISOString()
    setProjects(prev => [...prev, { ...data, id, created_at: now, updated_at: now }])
    return id
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  return { projects, updateStatus, addProject, deleteProject }
}
```

- [ ] **Étape 2 : Hook cycles mensuels**

`src/modules/CommunicationManager/hooks/useMockCommCycles.ts` :
```typescript
import { useState, useCallback } from 'react'
import { MOCK_COMM_CYCLES, MOCK_COMM_CYCLE_TASKS } from '../mocks'
import { COMM_CHECKLIST_ABONNEMENT } from '../mocks'
import type { CommMonthlyCycle, CommCycleTask } from '../../../types/project-v2'

export function useMockCommCycles(projectId: string) {
  const [cycles, setCycles] = useState<CommMonthlyCycle[]>(MOCK_COMM_CYCLES[projectId] ?? [])
  const [tasks, setTasks] = useState<Record<string, CommCycleTask[]>>(MOCK_COMM_CYCLE_TASKS)

  const addCycle = useCallback(() => {
    const now = new Date()
    // Trouver le mois suivant le dernier cycle existant
    const lastCycle = cycles[cycles.length - 1]
    const nextDate = lastCycle
      ? new Date(new Date(lastCycle.mois).setMonth(new Date(lastCycle.mois).getMonth() + 1))
      : now
    nextDate.setDate(1)
    const mois = nextDate.toISOString().split('T')[0]
    const label = nextDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      .replace(/^\w/, c => c.toUpperCase())
    const cycleId = `cyc-${projectId}-${Date.now()}`

    const newCycle: CommMonthlyCycle = {
      id: cycleId, project_id: projectId, mois, label,
      status: 'en_cours', created_at: now.toISOString(),
    }

    const newTasks: CommCycleTask[] = COMM_CHECKLIST_ABONNEMENT.map((t, i) => ({
      id: `ct-${cycleId}-${i}`,
      cycle_id: cycleId,
      project_id: projectId,
      title: t.title,
      done: false,
      sort_order: t.sort_order,
    }))

    setCycles(prev => [...prev, newCycle])
    setTasks(prev => ({ ...prev, [cycleId]: newTasks }))
  }, [cycles, projectId])

  const toggleTask = useCallback((cycleId: string, taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [cycleId]: (prev[cycleId] ?? []).map(t =>
        t.id === taskId ? { ...t, done: !t.done } : t
      ),
    }))
    // Auto-marquer cycle comme terminé si toutes les tâches sont done
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c
      const cycleTasks = tasks[cycleId] ?? []
      const allDone = cycleTasks.every(t => t.id === taskId ? !t.done : t.done)
      return allDone ? { ...c, status: 'termine' } : c
    }))
  }, [tasks])

  const addTask = useCallback((cycleId: string, title: string) => {
    const cycleTasks = tasks[cycleId] ?? []
    const newTask: CommCycleTask = {
      id: `ct-custom-${Date.now()}`,
      cycle_id: cycleId,
      project_id: projectId,
      title,
      done: false,
      sort_order: cycleTasks.length + 1,
    }
    setTasks(prev => ({ ...prev, [cycleId]: [...(prev[cycleId] ?? []), newTask] }))
  }, [tasks, projectId])

  return { cycles, tasks, addCycle, toggleTask, addTask }
}
```

- [ ] **Étape 3 : CommBriefTab**

`src/modules/CommunicationManager/components/CommBriefTab.tsx` :
```typescript
import React, { useState } from 'react'
import type { BriefComm, TypeContratComm, PackComm, PlateformeComm } from '../../../types/project-v2'
import { MOCK_COMM_BRIEFS } from '../mocks'

const PACK_CONFIG: Record<PackComm, { label: string; posts: number; reels: number; templates: number; mrr: number }> = {
  starter:    { label: 'Starter — 600€/mois',    posts: 6,  reels: 0, templates: 0, mrr: 600 },
  premium:    { label: 'Premium — 900€/mois',     posts: 8,  reels: 1, templates: 2, mrr: 900 },
  excellence: { label: 'Excellence — 1400€/mois', posts: 12, reels: 2, templates: 4, mrr: 1400 },
}

interface Props { projectId: string }

export function CommBriefTab({ projectId }: Props) {
  const initial = MOCK_COMM_BRIEFS[projectId] ?? null
  const [brief, setBrief] = useState<BriefComm | null>(initial)

  if (!brief) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Aucun brief — <button className="text-primary underline" onClick={() => {
          const now = new Date().toISOString()
          setBrief({ id: `commb-${Date.now()}`, project_id: projectId, status: 'draft', type_contrat: 'abonnement', pack: null, nb_posts_mois: null, nb_reels_mois: null, nb_templates: null, plateforme: null, date_debut: null, date_renouvellement: null, mrr: null, budget: null, date_livraison: null, created_at: now, updated_at: now })
        }}>Créer le brief</button>
      </div>
    )
  }

  const handleContratChange = (type: TypeContratComm) => {
    setBrief(prev => prev ? { ...prev, type_contrat: type, pack: null, nb_posts_mois: null, nb_reels_mois: null, nb_templates: null, mrr: null, budget: type !== 'abonnement' ? 1500 : null } : prev)
  }

  const handlePackChange = (pack: PackComm) => {
    const cfg = PACK_CONFIG[pack]
    setBrief(prev => prev ? { ...prev, pack, nb_posts_mois: cfg.posts, nb_reels_mois: cfg.reels, nb_templates: cfg.templates, mrr: cfg.mrr } : prev)
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Brief Communication</h3>

      {/* Type de contrat */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Type de contrat</label>
        <div className="flex gap-2">
          {(['abonnement', 'branding', 'photos_videos'] as TypeContratComm[]).map(type => (
            <button key={type} onClick={() => handleContratChange(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize ${
                brief.type_contrat === type
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface-2 border-border text-muted-foreground hover:border-primary/50'
              }`}>
              {type === 'abonnement' ? 'Abonnement Instagram' : type === 'branding' ? 'Branding' : 'Photos & Vidéos'}
            </button>
          ))}
        </div>
      </div>

      {/* Abonnement : pack */}
      {brief.type_contrat === 'abonnement' && (
        <>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Pack</label>
            <div className="flex gap-2">
              {(Object.keys(PACK_CONFIG) as PackComm[]).map(pack => (
                <button key={pack} onClick={() => handlePackChange(pack)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    brief.pack === pack
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surface-2 border-border text-muted-foreground hover:border-primary/50'
                  }`}>
                  {PACK_CONFIG[pack].label}
                </button>
              ))}
            </div>
          </div>

          {brief.pack && (
            <div className="grid grid-cols-3 gap-2 bg-surface-2 rounded-lg p-3 text-xs">
              <div><span className="text-muted-foreground">Posts/mois</span><p className="font-semibold text-foreground">{brief.nb_posts_mois}</p></div>
              <div><span className="text-muted-foreground">Réels/mois</span><p className="font-semibold text-foreground">{brief.nb_reels_mois}</p></div>
              <div><span className="text-muted-foreground">MRR</span><p className="font-semibold text-primary">{brief.mrr}€</p></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Plateforme</label>
              <select value={brief.plateforme ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, plateforme: (e.target.value || null) as PlateformeComm | null } : prev)}
                className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground">
                <option value="">Sélectionner</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="multi">Multi-plateformes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date début</label>
              <input type="date" value={brief.date_debut ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, date_debut: e.target.value || null } : prev)}
                className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
            </div>
          </div>
        </>
      )}

      {/* One-shot : budget + date livraison */}
      {brief.type_contrat !== 'abonnement' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Budget (€)</label>
            <input type="number" value={brief.budget ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, budget: parseFloat(e.target.value) || null } : prev)}
              className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Date livraison</label>
            <input type="date" value={brief.date_livraison ?? ''} onChange={e => setBrief(prev => prev ? { ...prev, date_livraison: e.target.value || null } : prev)}
              className="w-full p-2 text-sm border border-border rounded-md bg-surface-2 text-foreground" />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Étape 4 : CommMonthlyCycles**

`src/modules/CommunicationManager/components/CommMonthlyCycles.tsx` :
```typescript
import React, { useState } from 'react'
import { Plus, CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react'
import { useMockCommCycles } from '../hooks/useMockCommCycles'
import type { CommMonthlyCycle } from '../../../types/project-v2'
import { cn } from '../../../lib/utils'

interface Props { projectId: string }

export function CommMonthlyCycles({ projectId }: Props) {
  const { cycles, tasks, addCycle, toggleTask, addTask } = useMockCommCycles(projectId)
  const [expanded, setExpanded] = useState<string | null>(cycles[cycles.length - 1]?.id ?? null)
  const [newTaskInput, setNewTaskInput] = useState<Record<string, string>>({})

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Suivi mensuel</h3>
        <button onClick={addCycle}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Nouveau mois
        </button>
      </div>

      {cycles.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun cycle — cliquez sur "Nouveau mois" pour démarrer.</p>
      )}

      {[...cycles].reverse().map((cycle: CommMonthlyCycle) => {
        const cycleTasks = tasks[cycle.id] ?? []
        const doneCount = cycleTasks.filter(t => t.done).length
        const isExpanded = expanded === cycle.id
        const isPast = cycle.status === 'termine'

        return (
          <div key={cycle.id} className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpanded(isExpanded ? null : cycle.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-surface-2 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm font-medium text-foreground">{cycle.label}</span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', isPast ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400')}>
                  {isPast ? 'Terminé' : 'En cours'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{doneCount}/{cycleTasks.length}</span>
            </button>

            {/* Tasks */}
            {isExpanded && (
              <div className="border-t border-border p-3 space-y-1.5">
                {cycleTasks.map(task => (
                  <label key={task.id} className={cn('flex items-center gap-2 cursor-pointer group', isPast && 'pointer-events-none opacity-60')}>
                    <button onClick={() => toggleTask(cycle.id, task.id)} className="shrink-0">
                      {task.done
                        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                        : <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                    </button>
                    <span className={cn('text-sm text-foreground', task.done && 'line-through text-muted-foreground')}>
                      {task.title}
                    </span>
                  </label>
                ))}

                {/* Ajouter étape custom */}
                {!isPast && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
                    <input
                      type="text"
                      value={newTaskInput[cycle.id] ?? ''}
                      onChange={e => setNewTaskInput(prev => ({ ...prev, [cycle.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newTaskInput[cycle.id]?.trim()) {
                          addTask(cycle.id, newTaskInput[cycle.id].trim())
                          setNewTaskInput(prev => ({ ...prev, [cycle.id]: '' }))
                        }
                      }}
                      placeholder="Ajouter une étape…"
                      className="flex-1 p-1.5 text-xs border border-border rounded-md bg-surface-2 text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={() => {
                        if (newTaskInput[cycle.id]?.trim()) {
                          addTask(cycle.id, newTaskInput[cycle.id].trim())
                          setNewTaskInput(prev => ({ ...prev, [cycle.id]: '' }))
                        }
                      }}
                      className="px-2 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary/90">
                      +
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Étape 5 : Index CommunicationManager**

`src/modules/CommunicationManager/index.tsx` : Même structure que `SiteWebManager/index.tsx` mais :
- Titre : `"Communication"`
- Colonnes kanban (8 colonnes) :

```typescript
const COMM_COLUMNS: { id: StatusComm; label: string; color: string }[] = [
  { id: 'prospect',      label: 'Prospect',      color: 'bg-slate-500' },
  { id: 'brief_creatif', label: 'Brief créatif', color: 'bg-sky-500' },
  { id: 'devis_envoye',  label: 'Devis envoyé',  color: 'bg-blue-500' },
  { id: 'signe',         label: 'Signé',          color: 'bg-violet-500' },
  { id: 'en_production', label: 'En production',  color: 'bg-amber-500' },
  { id: 'actif',         label: 'Actif',          color: 'bg-emerald-500' },
  { id: 'termine',       label: 'Terminé',        color: 'bg-green-500' },
  { id: 'perdu',         label: 'Perdu',          color: 'bg-red-500' },
]
```

- Utilise `useMockCommProjects` et groupe par `comm_status`
- La fiche projet (ProjectDetailsV2) doit afficher `CommMonthlyCycles` dans un onglet "Suivi mensuel" uniquement si `type_contrat === 'abonnement'`
- Exporte : `export function CommunicationManager() { ... }`

- [ ] **Étape 6 : Commit**

```bash
git add src/modules/CommunicationManager/
git commit -m "feat(comm): module CommunicationManager — brief dynamique + cycles mensuels"
```

---

## Task 7 — Wiring Sidebar + Layout

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Layout.tsx`

- [ ] **Étape 1 : Ajouter les 3 modules dans Sidebar**

Dans `src/components/layout/Sidebar.tsx`, trouver `const v2Section: NavSection` (ligne ~97) et modifier :

```typescript
// AVANT :
const v2Section: NavSection = {
  section: 'v2',
  title: '✦ V2 Beta',
  items: [
    { id: 'dashboard-v2', label: 'Dashboard V2', icon: LayoutDashboard, permission: 'can_view_dashboard' },
    { id: 'projects-v2', label: 'Projets V2', icon: Sparkles, permission: 'can_view_projects' },
    { id: 'monthly-dashboard', label: 'Mois en cours', icon: BarChart3, permission: 'can_view_projects' },
  ]
};

// APRÈS :
const v2Section: NavSection = {
  section: 'v2',
  title: '✦ V2 Beta',
  items: [
    { id: 'dashboard-v2',      label: 'Dashboard V2',    icon: LayoutDashboard, permission: 'can_view_dashboard' },
    { id: 'site-web',          label: 'Site Web & SEO',  icon: Globe,           permission: 'can_view_projects' },
    { id: 'erp-manager',       label: 'ERP Sur Mesure',  icon: Settings2,       permission: 'can_view_projects' },
    { id: 'comm-manager',      label: 'Communication',   icon: Megaphone,       permission: 'can_view_projects' },
    { id: 'projects-v2',       label: 'Projets V2',      icon: Sparkles,        permission: 'can_view_projects' },
    { id: 'monthly-dashboard', label: 'Mois en cours',   icon: BarChart3,       permission: 'can_view_projects' },
  ]
};
```

Ajouter les imports manquants en haut du fichier :
```typescript
import { Globe, Settings2, Megaphone } from 'lucide-react'
```

- [ ] **Étape 2 : Enregistrer dans Layout.tsx**

Dans `src/components/layout/Layout.tsx` :

Ajouter les imports lazy (après les imports existants) :
```typescript
const SiteWebManager = lazy(() => import('../../modules/SiteWebManager').then(m => ({ default: m.SiteWebManager })))
const ERPManager = lazy(() => import('../../modules/ERPManager').then(m => ({ default: m.ERPManager })))
const CommunicationManager = lazy(() => import('../../modules/CommunicationManager').then(m => ({ default: m.CommunicationManager })))
```

Ajouter les permissions dans les objets `modulePermissions` et `adminModules` (suivre le pattern des modules existants ligne ~110) :
```typescript
'site-web': 'can_view_projects',
'erp-manager': 'can_view_projects',
'comm-manager': 'can_view_projects',
```

Ajouter dans le switch case (avant `default:`) :
```typescript
case 'site-web':
  return wrappedComponent(SiteWebManager);
case 'erp-manager':
  return wrappedComponent(ERPManager);
case 'comm-manager':
  return wrappedComponent(CommunicationManager);
```

- [ ] **Étape 3 : Vérifier le build**

```bash
npm run build 2>&1 | tail -20
```

Résultat attendu : `✓ built in` sans erreurs TypeScript.

- [ ] **Étape 4 : Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/Layout.tsx
git commit -m "feat(nav): ajouter Site Web, ERP, Communication dans sidebar + Layout"
```

---

## Task 8 — Dashboard V2 : KPIs globaux

**Files:**
- Modify: `src/modules/DashboardV2/index.tsx`

- [ ] **Étape 1 : Lire le fichier actuel**

Lire `src/modules/DashboardV2/index.tsx` pour comprendre la structure existante.

- [ ] **Étape 2 : Ajouter les imports des mocks**

En haut de `src/modules/DashboardV2/index.tsx`, ajouter :
```typescript
import { MOCK_SITEWEB_PROJECTS } from '../SiteWebManager/mocks'
import { MOCK_ERP_PROJECTS } from '../ERPManager/mocks'
import { MOCK_COMM_PROJECTS, MOCK_COMM_BRIEFS } from '../CommunicationManager/mocks'
```

- [ ] **Étape 3 : Calculer les KPIs globaux**

Dans le composant, ajouter avant le return :
```typescript
// KPIs Site Web
const swActive = MOCK_SITEWEB_PROJECTS.filter(p => !['livre', 'perdu'].includes(p.sw_status)).length
const swCA = MOCK_SITEWEB_PROJECTS.filter(p => p.sw_status === 'signe' || p.sw_status === 'en_production' || p.sw_status === 'livre').reduce((sum, p) => sum + (p.budget ?? 0), 0)

// KPIs ERP
const erpActive = MOCK_ERP_PROJECTS.filter(p => !['livre', 'perdu'].includes(p.erp_status)).length
const erpCA = MOCK_ERP_PROJECTS.filter(p => ['signe', 'en_developpement', 'recette', 'livre'].includes(p.erp_status)).reduce((sum, p) => sum + (p.budget ?? 0), 0)

// KPIs Communication
const commActive = MOCK_COMM_PROJECTS.filter(p => p.comm_status === 'actif').length
const mrr = Object.values(MOCK_COMM_BRIEFS).filter(b => b.type_contrat === 'abonnement' && b.mrr).reduce((sum, b) => sum + (b.mrr ?? 0), 0)
const commCAOnShot = MOCK_COMM_PROJECTS.filter(p => ['en_production', 'termine'].includes(p.comm_status)).reduce((sum, p) => sum + (p.budget ?? 0), 0)

const totalCA = swCA + erpCA + commCAOnShot + mrr
```

- [ ] **Étape 4 : Ajouter le bloc KPIs globaux dans le JSX**

Ajouter un bandeau en haut du Dashboard V2 :
```tsx
{/* KPIs globaux */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <div className="glass-card rounded-xl p-4">
    <p className="text-xs text-muted-foreground mb-1">CA Total</p>
    <p className="text-2xl font-bold text-foreground">{totalCA.toLocaleString('fr-FR')}€</p>
  </div>
  <div className="glass-card rounded-xl p-4">
    <p className="text-xs text-muted-foreground mb-1">MRR Communication</p>
    <p className="text-2xl font-bold text-emerald-400">{mrr.toLocaleString('fr-FR')}€/mois</p>
    <p className="text-xs text-muted-foreground mt-1">{commActive} abonnement{commActive !== 1 ? 's' : ''} actif{commActive !== 1 ? 's' : ''}</p>
  </div>
  <div className="glass-card rounded-xl p-4">
    <p className="text-xs text-muted-foreground mb-1">Site Web & SEO</p>
    <p className="text-2xl font-bold text-blue-400">{swCA.toLocaleString('fr-FR')}€</p>
    <p className="text-xs text-muted-foreground mt-1">{swActive} projet{swActive !== 1 ? 's' : ''} actif{swActive !== 1 ? 's' : ''}</p>
  </div>
  <div className="glass-card rounded-xl p-4">
    <p className="text-xs text-muted-foreground mb-1">ERP Sur Mesure</p>
    <p className="text-2xl font-bold text-violet-400">{erpCA.toLocaleString('fr-FR')}€</p>
    <p className="text-xs text-muted-foreground mt-1">{erpActive} projet{erpActive !== 1 ? 's' : ''} actif{erpActive !== 1 ? 's' : ''}</p>
  </div>
</div>
```

- [ ] **Étape 5 : Vérifier build + commit**

```bash
npm run build 2>&1 | tail -10
git add src/modules/DashboardV2/index.tsx
git commit -m "feat(dashboard-v2): KPIs globaux — CA total, MRR, ventilation par pôle"
```

---

## Self-review

**Couverture du spec :**
- ✅ 4 modules sidebar (Dashboard V2, Site Web, ERP, Communication)
- ✅ Kanban colonnes propres à chaque pôle (6/8/8)
- ✅ Brief dynamique par type (pack auto, modules multi-select, type contrat)
- ✅ Checklists pré-remplies par prestation + templates
- ✅ Cycles mensuels Communication avec ajout tâches custom
- ✅ Dashboard V2 avec CA total, MRR, ventilation par pôle
- ✅ Wiring Sidebar + Layout

**Consistance types :**
- `StatusSiteWeb`, `StatusERP`, `StatusComm` définis en Task 1, utilisés dans Tasks 2-6
- `BriefSiteWeb`, `BriefERP`, `BriefComm` définis en Task 1, utilisés dans les BriefTab
- `CommMonthlyCycle`, `CommCycleTask` définis en Task 1, utilisés dans Task 6
