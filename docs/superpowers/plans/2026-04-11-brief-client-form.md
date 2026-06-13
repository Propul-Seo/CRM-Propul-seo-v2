# Brief Client Form — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'équipe Propulseo d'envoyer un lien unique au lead pour qu'il remplisse le formulaire de brief en ligne, et récupérer automatiquement les réponses dans le CRM.

**Architecture:** Même mécanique que le portail client (`portal_token` → `/portal/:token`). On ajoute `brief_token` + `brief_token_enabled` sur `projects_v2`, une migration pour `submitted_at` sur `project_briefs_v2`, et une page publique `/brief/:token` accessible sans auth. Le CRM affiche un badge "Brief reçu" et les champs passent en lecture seule.

**Tech Stack:** React 18, TypeScript, Supabase (anon client), Tailwind CSS, shadcn/ui, Vite (pas de react-router — routing manuel comme pour `/portal/:token`)

---

## File Map

| Fichier | Action | Rôle |
|---------|--------|------|
| `supabase/migrations/20260411_brief_token.sql` | Créer | Colonnes brief_token sur projects_v2 + submitted_at sur project_briefs_v2 + RLS anon |
| `src/types/project-v2.ts` | Modifier | Ajouter brief_token/brief_token_enabled à ProjectV2, submitted_at à ProjectBrief, 'submitted' à BriefStatus |
| `src/modules/ProjectsManagerV2/hooks/useBriefV2.ts` | Modifier | Ajouter enableBriefToken, disableBriefToken, fetchBriefByToken (anon) |
| `src/modules/ProjectDetailsV2/components/ShareBriefButton.tsx` | Créer | Bouton générer/copier/révoquer le lien brief (pattern SharePortalButton) |
| `src/modules/ProjectDetailsV2/components/ProjectBrief.tsx` | Modifier | Remplacer mock → useBriefV2, ajouter ShareBriefButton + badge soumission |
| `src/modules/ClientBrief/ClientBriefPage.tsx` | Créer | Page publique formulaire brief (style clair, sans auth) |
| `src/App.tsx` | Modifier | Ajouter détection route `/brief/:token` |

---

## Task 1 — Migration Supabase

**Files:**
- Create: `supabase/migrations/20260411_brief_token.sql`

- [ ] **Créer le fichier de migration**

```sql
-- supabase/migrations/20260411_brief_token.sql

-- 1. Colonnes brief_token sur projects_v2
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS brief_token         UUID    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brief_token_enabled BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_v2_brief_token
  ON public.projects_v2 (brief_token)
  WHERE brief_token IS NOT NULL;

-- 2. Colonne submitted_at sur project_briefs_v2
ALTER TABLE public.project_briefs_v2
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. RLS — lecture publique (anon) du projet via brief_token (nom du projet uniquement)
CREATE POLICY "brief_read_project_name"
  ON public.projects_v2
  FOR SELECT
  TO anon
  USING (brief_token IS NOT NULL AND brief_token_enabled = TRUE);

-- 4. RLS — lecture publique du brief via brief_token
CREATE POLICY "brief_read_project_briefs_v2"
  ON public.project_briefs_v2
  FOR SELECT
  TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_token IS NOT NULL AND brief_token_enabled = TRUE
    )
  );

-- 5. RLS — écriture publique (anon) dans project_briefs_v2 via brief_token
--    Le lead soumet le brief sans être authentifié.
CREATE POLICY "brief_insert_project_briefs_v2"
  ON public.project_briefs_v2
  FOR INSERT
  TO anon
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_token IS NOT NULL AND brief_token_enabled = TRUE
    )
  );

CREATE POLICY "brief_update_project_briefs_v2"
  ON public.project_briefs_v2
  FOR UPDATE
  TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_token IS NOT NULL AND brief_token_enabled = TRUE
    )
  );
```

- [ ] **Appliquer la migration**

```bash
# Via Supabase Dashboard → SQL Editor, coller et exécuter le contenu du fichier.
# OU via CLI si configuré :
# supabase db push
```

Vérifier dans le Dashboard que :
- `projects_v2` a les colonnes `brief_token` et `brief_token_enabled`
- `project_briefs_v2` a la colonne `submitted_at`
- Les policies RLS sont listées

- [ ] **Commit**

```bash
git add supabase/migrations/20260411_brief_token.sql
git commit -m "feat(brief): migration brief_token + submitted_at + RLS anon"
```

---

## Task 2 — Types TypeScript

**Files:**
- Modify: `src/types/project-v2.ts`

- [ ] **Ajouter `brief_token` et `brief_token_enabled` à `ProjectV2`**

Dans `src/types/project-v2.ts`, après la ligne `portal_enabled: boolean` (ligne ~55) :

```ts
  // === BRIEF TOKEN ===
  brief_token: string | null
  brief_token_enabled: boolean
```

- [ ] **Mettre à jour `BriefStatus` pour ajouter `'submitted'`**

Changer la ligne 173 :
```ts
// Avant :
export type BriefStatus = 'draft' | 'validated' | 'frozen'

// Après :
export type BriefStatus = 'draft' | 'submitted' | 'validated' | 'frozen'
```

- [ ] **Ajouter `submitted_at` à `ProjectBrief`**

Dans l'interface `ProjectBrief` (ligne ~175), après `notes` :

```ts
  submitted_at?: string | null
```

- [ ] **Vérifier que le build TypeScript passe**

```bash
npm run build 2>&1 | head -30
```

Résultat attendu : pas d'erreur TypeScript liée aux types modifiés. Les erreurs éventuelles sur `STATUS_CONFIG` dans `ProjectBrief.tsx` (qui n'a pas encore `'submitted'`) seront corrigées en Task 5.

- [ ] **Commit**

```bash
git add src/types/project-v2.ts
git commit -m "feat(brief): types BriefStatus + ProjectBrief + ProjectV2 brief_token"
```

---

## Task 3 — Hook `useBriefV2.ts` — étendre

**Files:**
- Modify: `src/modules/ProjectsManagerV2/hooks/useBriefV2.ts`

- [ ] **Réécrire le fichier avec les nouvelles fonctions**

```ts
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase, isDemoMode } from '@/lib/supabase'
import type { ProjectBrief } from '../../../types/project-v2'

// Client anon — pour les accès publics (page brief client)
const supabaseAnon = createClient(
  isDemoMode ? 'https://demo.supabase.co' : import.meta.env.VITE_SUPABASE_URL,
  isDemoMode ? 'demo-key' : import.meta.env.VITE_SUPABASE_ANON_KEY
)

interface UseBriefV2Return {
  brief: ProjectBrief | null
  loading: boolean
  saveBrief: (data: Partial<ProjectBrief>) => Promise<void>
  enableBriefToken: (projectId: string) => Promise<string | null>
  disableBriefToken: (projectId: string) => Promise<boolean>
}

export function useBriefV2(projectId: string): UseBriefV2Return {
  const [brief, setBrief] = useState<ProjectBrief | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    supabase
      .from('project_briefs_v2')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error) setBrief(data as ProjectBrief | null)
        setLoading(false)
      })
  }, [projectId])

  const saveBrief = useCallback(async (data: Partial<ProjectBrief>) => {
    if (brief) {
      const { data: updated, error } = await supabase
        .from('project_briefs_v2')
        .update(data)
        .eq('id', brief.id)
        .select()
        .single()
      if (!error && updated) setBrief(updated as ProjectBrief)
    } else {
      const { data: created, error } = await supabase
        .from('project_briefs_v2')
        .insert({ ...data, project_id: projectId })
        .select()
        .single()
      if (!error && created) setBrief(created as ProjectBrief)
    }
  }, [brief, projectId])

  // Génère un brief_token et active le formulaire (utilisateur authentifié)
  const enableBriefToken = useCallback(async (projectId: string): Promise<string | null> => {
    const token = crypto.randomUUID()
    const { error } = await supabase
      .from('projects_v2')
      .update({ brief_token: token, brief_token_enabled: true })
      .eq('id', projectId)
    if (error) return null
    return token
  }, [])

  // Désactive le formulaire et efface le token (utilisateur authentifié)
  const disableBriefToken = useCallback(async (projectId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('projects_v2')
      .update({ brief_token: null, brief_token_enabled: false })
      .eq('id', projectId)
    return !error
  }, [])

  return { brief, loading, saveBrief, enableBriefToken, disableBriefToken }
}

// Hook séparé pour l'accès public (page ClientBriefPage — sans auth)
interface BriefFormData {
  projectName: string
  brief: ProjectBrief | null
}

export function useBriefByToken(token: string) {
  const [data, setData] = useState<BriefFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)

    supabaseAnon
      .from('projects_v2')
      .select('id, name')
      .eq('brief_token', token)
      .eq('brief_token_enabled', true)
      .single()
      .then(async ({ data: project, error: projectError }) => {
        if (projectError || !project) {
          setError('Lien invalide ou désactivé.')
          setLoading(false)
          return
        }

        const { data: brief } = await supabaseAnon
          .from('project_briefs_v2')
          .select('*')
          .eq('project_id', project.id)
          .maybeSingle()

        setData({ projectName: project.name, brief: brief as ProjectBrief | null })
        setLoading(false)
      })
  }, [token])

  // Soumet le brief (upsert anon) — status et submitted_at gérés en interne
  type BriefFields = Pick<ProjectBrief, 'objective' | 'target_audience' | 'pages' | 'techno' | 'design_references' | 'notes'>
  const submitBrief = useCallback(async (fields: BriefFields): Promise<boolean> => {
    if (!data) return false

    // Récupérer le project_id via le token
    const { data: project } = await supabaseAnon
      .from('projects_v2')
      .select('id')
      .eq('brief_token', token)
      .eq('brief_token_enabled', true)
      .single()

    if (!project) return false

    const payload = {
      ...fields,
      project_id: project.id,
      status: 'submitted' as const,
      submitted_at: new Date().toISOString(),
    }

    if (data.brief) {
      const { error } = await supabaseAnon
        .from('project_briefs_v2')
        .update(payload)
        .eq('id', data.brief.id)
      return !error
    } else {
      const { error } = await supabaseAnon
        .from('project_briefs_v2')
        .insert(payload)
      return !error
    }
  }, [data, token])

  return { data, loading, error, submitBrief }
}
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | head -30
```

Attendu : pas d'erreur sur `useBriefV2.ts`.

- [ ] **Commit**

```bash
git add src/modules/ProjectsManagerV2/hooks/useBriefV2.ts
git commit -m "feat(brief): useBriefV2 + useBriefByToken — token management + public submit"
```

---

## Task 4 — `ShareBriefButton.tsx`

**Files:**
- Create: `src/modules/ProjectDetailsV2/components/ShareBriefButton.tsx`

- [ ] **Créer le composant**

```tsx
// src/modules/ProjectDetailsV2/components/ShareBriefButton.tsx
import { useState, useEffect } from 'react'
import { Link2, Link2Off, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useBriefV2 } from '@/modules/ProjectsManagerV2/hooks/useBriefV2'
import type { ProjectV2 } from '@/types/project-v2'

interface ShareBriefButtonProps {
  project: ProjectV2
  onRefresh: () => void
}

export function ShareBriefButton({ project, onRefresh }: ShareBriefButtonProps) {
  const { enableBriefToken, disableBriefToken } = useBriefV2(project.id)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const briefUrl = project.brief_token && project.brief_token_enabled
    ? `${window.location.origin}/brief/${project.brief_token}`
    : null

  const handleGenerate = async () => {
    setLoading(true)
    const token = await enableBriefToken(project.id)
    setLoading(false)
    if (token) {
      toast.success('Lien de brief généré')
      onRefresh()
    } else {
      toast.error('Erreur lors de la génération du lien')
    }
  }

  const handleRevoke = async () => {
    setLoading(true)
    const ok = await disableBriefToken(project.id)
    setLoading(false)
    if (ok) {
      toast.success('Lien désactivé')
      onRefresh()
    } else {
      toast.error('Erreur lors de la désactivation')
    }
  }

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    if (!briefUrl) return
    try {
      await navigator.clipboard.writeText(briefUrl)
      setCopied(true)
      toast.success('Lien copié !')
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Chargement…
      </Button>
    )
  }

  if (briefUrl) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="flex items-center gap-2">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copié !' : 'Copier le lien'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRevoke}
          className="text-red-400 hover:text-red-300"
          title="Désactiver le lien de brief"
        >
          <Link2Off className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={handleGenerate} className="flex items-center gap-2">
      <Link2 className="w-4 h-4" />
      Partager le formulaire
    </Button>
  )
}
```

- [ ] **Commit**

```bash
git add src/modules/ProjectDetailsV2/components/ShareBriefButton.tsx
git commit -m "feat(brief): ShareBriefButton — générer/copier/révoquer le lien brief"
```

---

## Task 5 — Modifier `ProjectBrief.tsx`

**Files:**
- Modify: `src/modules/ProjectDetailsV2/components/ProjectBrief.tsx`

- [ ] **Réécrire le composant complet**

```tsx
// src/modules/ProjectDetailsV2/components/ProjectBrief.tsx
import { useState, useEffect } from 'react'
import { FileSpreadsheet, Save, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { BriefStatus } from '../../../types/project-v2'
import { useBriefV2 } from '../../ProjectsManagerV2/hooks/useBriefV2'
import { ShareBriefButton } from './ShareBriefButton'
import type { ProjectV2 } from '../../../types/project-v2'

const STATUS_CONFIG: Record<BriefStatus, { label: string; color: string }> = {
  draft:     { label: 'Brouillon',  color: 'bg-gray-500/20 text-gray-400' },
  submitted: { label: 'Reçu',       color: 'bg-blue-500/20 text-blue-300' },
  validated: { label: 'Validé',     color: 'bg-green-500/20 text-green-300' },
  frozen:    { label: 'Figé',       color: 'bg-blue-500/20 text-blue-300' },
}

interface BriefField {
  key: string
  label: string
  placeholder: string
  rows?: number
}

const FIELDS: BriefField[] = [
  { key: 'objective',         label: 'Objectif',                  placeholder: 'Quel est l\'objectif principal du projet ?',        rows: 3 },
  { key: 'target_audience',   label: 'Cible',                     placeholder: 'Qui sont les utilisateurs cibles ?',               rows: 2 },
  { key: 'pages',             label: 'Pages / Fonctionnalités',   placeholder: 'Listez les pages ou fonctionnalités attendues...', rows: 3 },
  { key: 'techno',            label: 'Technologie',               placeholder: 'Stack technique retenue...',                      rows: 2 },
  { key: 'design_references', label: 'Références design',         placeholder: 'URLs, inspirations visuelles...',                 rows: 2 },
  { key: 'notes',             label: 'Notes complémentaires',     placeholder: 'Toute information utile...',                      rows: 3 },
]

interface ProjectBriefProps {
  project: ProjectV2
  onRefresh: () => void
}

export function ProjectBrief({ project, onRefresh }: ProjectBriefProps) {
  const { brief, loading, saveBrief } = useBriefV2(project.id)
  const [status, setStatus] = useState<BriefStatus>('draft')
  const [fields, setFields] = useState<Record<string, string>>({
    objective: '', target_audience: '', pages: '', techno: '', design_references: '', notes: '',
  })
  const [forceEdit, setForceEdit] = useState(false)

  useEffect(() => {
    if (!brief) return
    setStatus(brief.status ?? 'draft')
    setFields({
      objective:         brief.objective         ?? '',
      target_audience:   brief.target_audience   ?? '',
      pages:             brief.pages             ?? '',
      techno:            brief.techno             ?? '',
      design_references: brief.design_references ?? '',
      notes:             brief.notes             ?? '',
    })
  }, [brief])

  const handleSave = async () => {
    await saveBrief({ ...fields, status })
    toast.success('Brief sauvegardé')
  }

  const isSubmitted = brief?.status === 'submitted'
  const isReadOnly = (isSubmitted && !forceEdit) || status === 'frozen'
  const statusConf = STATUS_CONFIG[status]

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement…</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Brief & Spécifications</h3>
        <div className="flex items-center gap-2">
          {isSubmitted && !forceEdit && (
            <div className="flex items-center gap-1.5 text-xs text-blue-300">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Reçu le {new Date(brief.submitted_at!).toLocaleDateString('fr-FR')}
            </div>
          )}
          <span className={`text-xs px-2 py-0.5 rounded ${statusConf.color}`}>{statusConf.label}</span>
          {!isSubmitted && (
            <select
              value={status}
              onChange={e => setStatus(e.target.value as BriefStatus)}
              className="bg-surface-2 border border-border rounded-md px-2 py-1 text-xs text-foreground"
            >
              <option value="draft">Brouillon</option>
              <option value="validated">Validé</option>
              <option value="frozen">Figé</option>
            </select>
          )}
          <ShareBriefButton project={project} onRefresh={onRefresh} />
        </div>
      </div>

      <div className="space-y-3">
        {FIELDS.map(field => (
          <div key={field.key} className="bg-surface-2 border border-border rounded-lg p-3">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {field.label}
            </label>
            <textarea
              value={fields[field.key]}
              onChange={e => setFields(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              rows={field.rows ?? 2}
              disabled={isReadOnly}
              className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground/50 resize-none focus:outline-none disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      {isSubmitted && !forceEdit && (
        <button
          onClick={() => setForceEdit(true)}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Modifier quand même
        </button>
      )}

      {(!isSubmitted || forceEdit) && status !== 'frozen' && (
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Save className="h-4 w-4" />
          Sauvegarder le brief
        </button>
      )}

      {status === 'frozen' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-2 border border-border rounded-lg p-3">
          <FileSpreadsheet className="h-4 w-4 shrink-0" />
          Le brief est figé. Changez le statut pour le modifier.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Mettre à jour les consommateurs du composant**

`ProjectBrief` reçoit maintenant `project: ProjectV2` et `onRefresh: () => void` au lieu de `projectId: string`. Trouver les appels existants :

```bash
grep -rn "ProjectBrief" src/ --include="*.tsx"
```

Pour chaque fichier qui importe `ProjectBrief`, passer `project={project}` et `onRefresh={onRefresh}` (ou une fonction vide `() => {}` si pas de refresh disponible).

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | head -40
```

Attendu : aucune erreur TypeScript.

- [ ] **Commit**

```bash
git add src/modules/ProjectDetailsV2/components/ProjectBrief.tsx
git commit -m "feat(brief): ProjectBrief — Supabase live, badge soumission, ShareBriefButton"
```

---

## Task 6 — Page publique `ClientBriefPage.tsx`

**Files:**
- Create: `src/modules/ClientBrief/ClientBriefPage.tsx`

- [ ] **Créer le dossier et le fichier**

```bash
mkdir -p src/modules/ClientBrief
```

```tsx
// src/modules/ClientBrief/ClientBriefPage.tsx
import { useState } from 'react'
import { AlertCircle, CheckCircle2, Send } from 'lucide-react'
import { useBriefByToken } from '@/modules/ProjectsManagerV2/hooks/useBriefV2'

interface Field {
  key: string
  label: string
  placeholder: string
  required?: boolean
  rows: number
}

const FIELDS: Field[] = [
  { key: 'objective',         label: 'Objectif du projet',                  placeholder: 'Quel est l\'objectif principal du projet ?',       required: true, rows: 4 },
  { key: 'target_audience',   label: 'Cible / utilisateurs',                placeholder: 'Qui sont les utilisateurs cibles ?',              rows: 3 },
  { key: 'pages',             label: 'Pages / Fonctionnalités attendues',   placeholder: 'Listez les pages ou fonctionnalités souhaitées...', rows: 4 },
  { key: 'techno',            label: 'Technologie / stack',                 placeholder: 'Stack technique ou préférences technologiques...', rows: 2 },
  { key: 'design_references', label: 'Références design',                   placeholder: 'URLs, inspirations visuelles, exemples de sites...', rows: 3 },
  { key: 'notes',             label: 'Notes complémentaires',               placeholder: 'Toute information utile pour l\'équipe...', rows: 3 },
]

interface ClientBriefPageProps {
  token: string
}

export function ClientBriefPage({ token }: ClientBriefPageProps) {
  const { data, loading, error, submitBrief } = useBriefByToken(token)
  const [fields, setFields] = useState<Record<string, string>>({
    objective: '', target_audience: '', pages: '', techno: '', design_references: '', notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Style clair forcé (pas de dark mode)
  const alreadySubmitted = data?.brief?.submitted_at != null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fields.objective.trim()) {
      setValidationError('Le champ "Objectif du projet" est obligatoire.')
      return
    }
    setValidationError(null)
    setSubmitting(true)
    const ok = await submitBrief({
      objective:         fields.objective || null,
      target_audience:   fields.target_audience || null,
      pages:             fields.pages || null,
      techno:            fields.techno || null,
      design_references: fields.design_references || null,
      notes:             fields.notes || null,
    })
    setSubmitting(false)
    if (ok) {
      setSubmitted(true)
    } else {
      setValidationError('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Chargement du formulaire…</p>
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

  if (submitted || alreadySubmitted) {
    const submittedDate = data.brief?.submitted_at
      ? new Date(data.brief.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-slate-800 mb-3">
            {alreadySubmitted && !submitted ? 'Brief déjà transmis' : 'Merci !'}
          </h1>
          <p className="text-slate-500 leading-relaxed">
            {alreadySubmitted && !submitted
              ? `Votre brief a déjà été transmis${submittedDate ? ` le ${submittedDate}` : ''}. L'équipe Propul'SEO l'a bien reçu.`
              : 'Votre brief a bien été transmis à l\'équipe Propul\'SEO. Nous reviendrons vers vous rapidement.'}
          </p>
          {alreadySubmitted && !submitted && data.brief && (
            <div className="mt-8 text-left space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vos réponses</p>
              {FIELDS.map(f => {
                const val = (data.brief as Record<string, unknown>)?.[f.key] as string | null
                if (!val) return null
                return (
                  <div key={f.key} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1">{f.label}</p>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{val}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-md">
            Propul'SEO
          </span>
          <span className="text-sm font-bold text-slate-800">{data.projectName}</span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 py-10 text-center">
        <p className="text-indigo-200 text-[11px] font-semibold tracking-widest uppercase mb-2">Formulaire de brief</p>
        <h1 className="text-white text-2xl font-extrabold">{data.projectName}</h1>
        <p className="text-indigo-200 text-sm mt-2 max-w-md mx-auto">
          Merci de remplir ce formulaire pour nous aider à bien comprendre votre projet. Seul le champ "Objectif" est obligatoire.
        </p>
      </div>

      {/* Formulaire */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {FIELDS.map(field => (
            <div key={field.key} className="bg-white border border-slate-200 rounded-2xl p-5">
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={fields[field.key]}
                onChange={e => setFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={field.rows}
                className="w-full text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none"
              />
            </div>
          ))}

          {validationError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {validationError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3.5 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Envoi…</>
              : <><Send className="w-4 h-4" /> Envoyer le brief</>
            }
          </button>
        </form>
      </main>

      <footer className="max-w-2xl mx-auto px-4 pb-10 flex items-center justify-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-indigo-600">Propul'SEO</span>
        <span>·</span>
        <span>Formulaire sécurisé</span>
        <span>·</span>
        <span>🔒 Accès par lien unique</span>
      </footer>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/modules/ClientBrief/ClientBriefPage.tsx
git commit -m "feat(brief): ClientBriefPage — formulaire public lead"
```

---

## Task 7 — Route dans `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Ajouter l'import lazy et la détection de route**

Dans `src/App.tsx`, après l'import de `ClientPortalPage` (ligne 7), ajouter :

```tsx
const ClientBriefPage = lazy(() =>
  import('./modules/ClientBrief/ClientBriefPage').then(m => ({ default: m.ClientBriefPage }))
);
```

Après la ligne `const portalMatch = pathname.match(...)` (ligne 13), ajouter :

```tsx
const briefMatch = pathname.match(/^\/brief\/([a-f0-9-]{36})$/i);
```

- [ ] **Ajouter le rendu conditionnel de la page brief**

Après le bloc `if (portalMatch)` (ligne 31), ajouter :

```tsx
  if (briefMatch) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400">Chargement...</div>}>
          <ClientBriefPage token={briefMatch[1]} />
        </Suspense>
      </ErrorBoundary>
    );
  }
```

- [ ] **Vérifier le build complet**

```bash
npm run build 2>&1
```

Attendu : build réussi, zéro erreur TypeScript.

- [ ] **Commit**

```bash
git add src/App.tsx
git commit -m "feat(brief): route publique /brief/:token → ClientBriefPage"
```

---

## Task 8 — Vérification manuelle

- [ ] **Lancer le serveur de dev**

```bash
npm run dev
```

- [ ] **Tester depuis le CRM**

1. Aller dans la fiche d'un projet (ProjectDetailsV2)
2. Aller dans l'onglet "Suivi" → sous-onglet "Brief"
3. Cliquer "Partager le formulaire" → un lien est copié
4. Vérifier le badge d'état dans le composant

- [ ] **Tester la page publique**

1. Ouvrir le lien copié dans un onglet en navigation privée (sans session Supabase)
2. Vérifier : nom du projet affiché, formulaire visible
3. Remplir l'objectif (obligatoire) + quelques champs
4. Cliquer "Envoyer le brief" → page de confirmation

- [ ] **Tester le retour dans le CRM**

1. Revenir dans la fiche projet → onglet Brief
2. Vérifier : badge "Reçu le XX/XX", champs remplis par le lead en lecture seule
3. Cliquer "Modifier quand même" → champs éditables à nouveau

- [ ] **Tester le cas token invalide**

Naviguer vers `/brief/00000000-0000-0000-0000-000000000000` → page d'erreur "Lien invalide"

- [ ] **Tester la révocation**

1. Dans le CRM → Brief → cliquer l'icône de révocation
2. Recharger le lien du lead → page d'erreur "Lien désactivé"

- [ ] **Commit final**

```bash
git add .
git commit -m "chore(brief): vérification manuelle OK — brief client form complet"
```
