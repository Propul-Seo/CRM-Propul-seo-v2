# Sprint 4 — Mini-portail client lecture seule

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un client de consulter l'avancement de son projet via une URL publique partageable (`/portal/:token`), sans authentification.

**Architecture:** On ajoute `portal_token` (UUID) et `portal_enabled` (boolean) sur `projects_v2`. L'app détecte le préfixe `/portal/` dans `window.location.pathname` dès App.tsx et rend une page dédiée sans passer par le Layout authentifié. Le client Supabase anon lit les données via RLS.

**Tech Stack:** React 18 + TypeScript, Supabase (anon client + RLS), Tailwind + shadcn/ui, Vite (pas de react-router — détection pathname manuelle).

---

## Fichiers concernés

| Action | Fichier |
|--------|---------|
| Créer | `supabase/migrations/20260406_add_portal_token.sql` |
| Modifier | `src/types/project-v2.ts` |
| Modifier | `src/App.tsx` |
| Créer | `src/modules/ClientPortal/useClientPortal.ts` |
| Créer | `src/modules/ClientPortal/ClientPortalPage.tsx` |
| Créer | `src/modules/ProjectDetailsV2/components/SharePortalButton.tsx` |
| Modifier | `src/modules/ProjectDetailsV2/components/ProjectOverview.tsx` |

---

## Task 1 : Migration Supabase — colonnes portal_token + portal_enabled

**Files:**
- Create: `supabase/migrations/20260406_add_portal_token.sql`

- [ ] **Step 1 : Créer la migration**

```sql
-- supabase/migrations/20260406_add_portal_token.sql

-- 1. Colonnes
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS portal_token  UUID    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT FALSE;

-- 2. Index unique (lookup rapide + contrainte d'unicité)
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_v2_portal_token
  ON public.projects_v2 (portal_token)
  WHERE portal_token IS NOT NULL;

-- 3. Politique RLS pour lecture publique (anon) via portal_token
--    Fonctionne en dev (les policies "dev_all_*" coexistent)
--    et sera la seule policy valide en prod quand les "dev_all_*" seront retirées.
CREATE POLICY "portal_read_projects_v2"
  ON public.projects_v2
  FOR SELECT
  TO anon
  USING (portal_token IS NOT NULL AND portal_enabled = TRUE);

CREATE POLICY "portal_read_checklist_v2"
  ON public.checklist_items_v2
  FOR SELECT
  TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE portal_token IS NOT NULL AND portal_enabled = TRUE
    )
  );

CREATE POLICY "portal_read_invoices_v2"
  ON public.project_invoices_v2
  FOR SELECT
  TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE portal_token IS NOT NULL AND portal_enabled = TRUE
    )
  );
```

- [ ] **Step 2 : Appliquer la migration via le dashboard Supabase**

  Aller dans Supabase Dashboard → SQL Editor → coller le contenu du fichier → Run.
  
  Vérification : dans Table Editor → `projects_v2`, les colonnes `portal_token` et `portal_enabled` doivent apparaître.

- [ ] **Step 3 : Commit**

```bash
git add supabase/migrations/20260406_add_portal_token.sql
git commit -m "feat(db): add portal_token + portal_enabled to projects_v2 + RLS anon policies"
```

---

## Task 2 : Mise à jour des types TypeScript

**Files:**
- Modify: `src/types/project-v2.ts`

- [ ] **Step 1 : Ajouter les champs à l'interface `ProjectV2`**

Dans `src/types/project-v2.ts`, après la ligne `ai_summary_generated_at: string | null`, ajouter :

```typescript
  // === PORTAIL CLIENT ===
  portal_token: string | null
  portal_enabled: boolean
```

Résultat attendu dans l'interface :

```typescript
export interface ProjectV2 {
  // ... champs existants ...
  ai_summary: { situation: string; action: string; milestone: string } | null
  ai_summary_generated_at: string | null
  // === PORTAIL CLIENT ===
  portal_token: string | null
  portal_enabled: boolean
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npm run build 2>&1 | head -30
```

Expected : aucune erreur liée à `portal_token` ou `portal_enabled`.

- [ ] **Step 3 : Commit**

```bash
git add src/types/project-v2.ts
git commit -m "feat(types): add portal_token + portal_enabled to ProjectV2"
```

---

## Task 3 : Routing public dans App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1 : Ajouter la détection de route portail**

Remplacer le contenu de `src/App.tsx` par :

```tsx
import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useStore } from './store/useStore';

const ClientPortalPage = lazy(() =>
  import('./modules/ClientPortal/ClientPortalPage').then(m => ({ default: m.ClientPortalPage }))
);

// Détection de la route publique avant tout rendu
const pathname = window.location.pathname;
const portalMatch = pathname.match(/^\/portal\/([a-f0-9-]{36})$/i);

function App() {
  const { setCurrentUser } = useStore();

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
    // Utilisateur admin injecté directement (auth désactivée)
    setCurrentUser({
      id: 'dev-user',
      email: 'team@propulseo-site.com',
      name: 'Dev Admin',
      role: 'admin',
    });
  }, []);

  // Route publique — ne pas passer par le Layout authentifié
  if (portalMatch) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Chargement...</div>}>
          <ClientPortalPage token={portalMatch[1]} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-surface-1">
        <Layout />
        <Toaster position="top-right" />
      </div>
    </ErrorBoundary>
  );
}

export default App;
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npm run build 2>&1 | head -30
```

Expected : build OK (ClientPortalPage n'existe pas encore → erreur de module manquant. Normal à ce stade — on continue).

- [ ] **Step 3 : Commit**

```bash
git add src/App.tsx
git commit -m "feat(routing): add public /portal/:token route detection in App.tsx"
```

---

## Task 4 : Hook useClientPortal

**Files:**
- Create: `src/modules/ClientPortal/useClientPortal.ts`

Ce hook a deux responsabilités :
- **Côté public (anon)** : `fetchPortalData(token)` — lit le projet + checklist + factures sans auth
- **Côté admin (authenticated)** : `generateToken(projectId)` + `revokeToken(projectId)` — écrit le token

- [ ] **Step 1 : Créer le hook**

```typescript
// src/modules/ClientPortal/useClientPortal.ts
import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { ProjectV2, ChecklistItemV2 } from '@/types/project-v2'

// Client anon explicite — pas de session utilisateur
const supabaseAnon = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export interface PortalInvoice {
  id: string
  label: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  date: string | null
  due_date: string | null
}

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
  >
  checklist: Pick<ChecklistItemV2, 'id' | 'title' | 'phase' | 'status'>[]
  invoices: PortalInvoice[]
}

export function useClientPortal() {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lecture publique via token (client anon)
  const fetchPortalData = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)

    // 1. Récupérer le projet par token
    const { data: project, error: projectError } = await supabaseAnon
      .from('projects_v2')
      .select('id, name, client_name, status, progress, completion_score, next_action_label, next_action_due, presta_type, start_date, end_date')
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

    // 3. Factures (envoyées et payées uniquement)
    const { data: invoices } = await supabaseAnon
      .from('project_invoices_v2')
      .select('id, label, amount, status, date, due_date')
      .eq('project_id', project.id)
      .in('status', ['sent', 'paid', 'overdue'])
      .order('date', { ascending: false })

    setData({
      project: project as PortalData['project'],
      checklist: (checklist ?? []) as PortalData['checklist'],
      invoices: (invoices ?? []) as PortalInvoice[],
    })
    setLoading(false)
  }, [])

  // Génère un token et active le portail (client authentifié)
  const generateToken = useCallback(async (projectId: string): Promise<string | null> => {
    const token = crypto.randomUUID()
    const { error } = await supabase
      .from('projects_v2')
      .update({ portal_token: token, portal_enabled: true })
      .eq('id', projectId)

    if (error) return null
    return token
  }, [])

  // Désactive le portail et efface le token (client authentifié)
  const revokeToken = useCallback(async (projectId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('projects_v2')
      .update({ portal_token: null, portal_enabled: false })
      .eq('id', projectId)

    return !error
  }, [])

  return { data, loading, error, fetchPortalData, generateToken, revokeToken }
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected : aucune erreur liée à `useClientPortal`.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/ClientPortal/useClientPortal.ts
git commit -m "feat(hook): add useClientPortal — fetch public portal data + generate/revoke token"
```

---

## Task 5 : ClientPortalPage — page publique lecture seule

**Files:**
- Create: `src/modules/ClientPortal/ClientPortalPage.tsx`

- [ ] **Step 1 : Créer la page**

```tsx
// src/modules/ClientPortal/ClientPortalPage.tsx
import { useEffect } from 'react'
import { CheckCircle2, Circle, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import { useClientPortal } from './useClientPortal'
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

const STATUS_COLORS: Record<string, string> = {
  prospect: 'bg-gray-500',
  brief_received: 'bg-blue-500',
  quote_sent: 'bg-yellow-500',
  in_progress: 'bg-indigo-500',
  review: 'bg-purple-500',
  delivered: 'bg-green-500',
  maintenance: 'bg-teal-500',
  on_hold: 'bg-orange-500',
  closed: 'bg-gray-400',
}

const CHECKLIST_STATUS_ICON = {
  done: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  in_progress: <Clock className="w-4 h-4 text-yellow-400" />,
  todo: <Circle className="w-4 h-4 text-gray-500" />,
}

const INVOICE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  sent: { label: 'Envoyée', color: 'text-blue-400' },
  paid: { label: 'Payée', color: 'text-green-400' },
  overdue: { label: 'En retard', color: 'text-red-400' },
}

interface ClientPortalPageProps {
  token: string
}

export function ClientPortalPage({ token }: ClientPortalPageProps) {
  const { data, loading, error, fetchPortalData } = useClientPortal()

  useEffect(() => {
    // Light mode pour le portail client (pas de dark forcé)
    document.documentElement.classList.remove('dark')
    fetchPortalData(token)
    return () => {
      document.documentElement.classList.add('dark')
    }
  }, [token, fetchPortalData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>Chargement de votre espace projet…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Lien invalide</h1>
          <p className="text-gray-500">{error ?? 'Ce lien est invalide ou a été désactivé.'}</p>
        </div>
      </div>
    )
  }

  const { project, checklist, invoices } = data
  const doneTasks = checklist.filter(c => c.status === 'done').length
  const totalTasks = checklist.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Espace client</p>
            <h1 className="text-lg font-bold text-gray-900">{project.name}</h1>
            {project.client_name && (
              <p className="text-sm text-gray-500">{project.client_name}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${STATUS_COLORS[project.status] ?? 'bg-gray-500'}`}>
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Progression */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Avancement</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progression globale</span>
                <span className="font-semibold">{project.progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Score de complétude</span>
                <span className="font-semibold">{project.completion_score}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${project.completion_score}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Prochaine action */}
        {project.next_action_label && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-indigo-700 mb-1">Prochaine étape</h2>
            <p className="text-gray-800 font-medium">{project.next_action_label}</p>
            {project.next_action_due && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Avant le {new Date(project.next_action_due).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        )}

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Checklist projet</h2>
              <span className="text-xs text-gray-400">{doneTasks}/{totalTasks} tâches</span>
            </div>
            <ul className="space-y-2">
              {checklist.map(item => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  {CHECKLIST_STATUS_ICON[item.status]}
                  <span className={item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}>
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Factures */}
        {invoices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Factures</h2>
            <ul className="space-y-3">
              {invoices.map(inv => (
                <li key={inv.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{inv.label}</p>
                    {inv.date && (
                      <p className="text-xs text-gray-400">
                        {new Date(inv.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">
                      {inv.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className={`text-xs font-medium ${INVOICE_STATUS_LABELS[inv.status]?.color ?? 'text-gray-400'}`}>
                      {INVOICE_STATUS_LABELS[inv.status]?.label ?? inv.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Vue partagée en lecture seule · Propul'SEO
        </p>
      </main>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected : build OK.

- [ ] **Step 3 : Tester manuellement**

```bash
npm run dev
```

Ouvrir `http://localhost:5173/portal/00000000-0000-0000-0000-000000000000`
Expected : page "Lien invalide" avec icône AlertCircle.

- [ ] **Step 4 : Commit**

```bash
git add src/modules/ClientPortal/ClientPortalPage.tsx
git commit -m "feat(portal): add public ClientPortalPage — status, progress, checklist, invoices"
```

---

## Task 6 : SharePortalButton — bouton de partage dans ProjectOverview

**Files:**
- Create: `src/modules/ProjectDetailsV2/components/SharePortalButton.tsx`
- Modify: `src/modules/ProjectDetailsV2/components/ProjectOverview.tsx`

### 6a — Créer SharePortalButton

- [ ] **Step 1 : Créer le composant**

```tsx
// src/modules/ProjectDetailsV2/components/SharePortalButton.tsx
import { useState } from 'react'
import { Link2, LinkOff, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useClientPortal } from '@/modules/ClientPortal/useClientPortal'
import type { ProjectV2 } from '@/types/project-v2'

interface SharePortalButtonProps {
  project: ProjectV2
  onRefresh: () => void
}

export function SharePortalButton({ project, onRefresh }: SharePortalButtonProps) {
  const { generateToken, revokeToken } = useClientPortal()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const portalUrl = project.portal_token && project.portal_enabled
    ? `${window.location.origin}/portal/${project.portal_token}`
    : null

  const handleGenerate = async () => {
    setLoading(true)
    const token = await generateToken(project.id)
    setLoading(false)
    if (token) {
      toast.success('Lien client généré')
      onRefresh()
    } else {
      toast.error('Erreur lors de la génération du lien')
    }
  }

  const handleRevoke = async () => {
    setLoading(true)
    const ok = await revokeToken(project.id)
    setLoading(false)
    if (ok) {
      toast.success('Lien désactivé')
      onRefresh()
    } else {
      toast.error('Erreur lors de la désactivation')
    }
  }

  const handleCopy = async () => {
    if (!portalUrl) return
    await navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Lien copié !')
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Chargement…
      </Button>
    )
  }

  if (portalUrl) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copié !' : 'Copier le lien'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRevoke}
          className="text-red-400 hover:text-red-300"
          title="Désactiver le lien client"
        >
          <LinkOff className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      className="flex items-center gap-2"
    >
      <Link2 className="w-4 h-4" />
      Partager avec le client
    </Button>
  )
}
```

### 6b — Intégrer dans ProjectOverview

- [ ] **Step 2 : Lire ProjectOverview.tsx pour trouver où insérer le bouton**

Ouvrir `src/modules/ProjectDetailsV2/components/ProjectOverview.tsx` et repérer l'en-tête ou la section actions (chercher les boutons existants comme "Résumer avec IA").

- [ ] **Step 3 : Ajouter l'import et le composant**

En haut du fichier, ajouter l'import :
```tsx
import { SharePortalButton } from './SharePortalButton'
```

Dans le JSX, à côté du bouton "Résumer avec IA" (ou dans la section actions en haut de la carte), ajouter :
```tsx
<SharePortalButton project={project} onRefresh={onRefresh} />
```

- [ ] **Step 4 : Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected : build OK sans erreurs TS.

- [ ] **Step 5 : Tester le flux complet**

```bash
npm run dev
```

1. Ouvrir un projet → onglet Vue d'ensemble
2. Vérifier que le bouton "Partager avec le client" apparaît
3. Cliquer → toast "Lien client généré", le bouton se transforme en "Copier le lien"
4. Cliquer "Copier le lien" → toast "Lien copié !"
5. Coller l'URL dans un nouvel onglet → la ClientPortalPage s'affiche avec les données du projet
6. Vérifier : statut, progression, checklist, factures visibles
7. Cliquer l'icône rouge (désactiver) → toast "Lien désactivé"
8. Recharger l'URL copiée → page "Lien invalide"

- [ ] **Step 6 : Commit**

```bash
git add src/modules/ProjectDetailsV2/components/SharePortalButton.tsx
git add src/modules/ProjectDetailsV2/components/ProjectOverview.tsx
git commit -m "feat(portal): add SharePortalButton — generate, copy and revoke client portal link"
```

---

## Récapitulatif des commits attendus

```
feat(db): add portal_token + portal_enabled to projects_v2 + RLS anon policies
feat(types): add portal_token + portal_enabled to ProjectV2
feat(routing): add public /portal/:token route detection in App.tsx
feat(hook): add useClientPortal — fetch public portal data + generate/revoke token
feat(portal): add public ClientPortalPage — status, progress, checklist, invoices
feat(portal): add SharePortalButton — generate, copy and revoke client portal link
```

---

## Blockers connus

- La migration doit être appliquée manuellement via le dashboard Supabase (pas de CLI disponible — permission 403).
- `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` doivent être présentes dans `.env` (déjà configurées).

---

## Vérification finale

- [ ] URL `/portal/<token-valide>` → page publique avec données du projet ✓
- [ ] URL `/portal/<token-invalide>` → page "Lien invalide" ✓
- [ ] Bouton désactiver → URL devient invalide immédiatement ✓
- [ ] L'app principale (non-portal) s'affiche toujours normalement ✓
- [ ] Le portail n'expose pas : accès/mots de passe, données internes, journal interne ✓
