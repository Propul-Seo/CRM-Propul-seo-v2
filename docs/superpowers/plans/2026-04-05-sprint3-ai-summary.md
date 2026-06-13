# Sprint 3 — Résumé IA automatique de la fiche client

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un bloc "Résumé IA" dans l'onglet Vue d'ensemble d'une fiche projet V2 — bouton qui appelle Claude Sonnet 4.6 côté serveur, affiche 3 blocs structurés (Situation · Action · Prochain jalon) et persiste le résultat en base.

**Architecture:** Edge Function Supabase (`generate-ai-summary`) collecte les données du projet (activités récentes, checklist en cours) et appelle l'API Anthropic. Le résultat JSONB est persisté dans `projects_v2.ai_summary`. Le composant React lit ce champ depuis le context existant et déclenche la régénération via un hook dédié.

**Tech Stack:** Deno (Edge Function), Anthropic API (`claude-sonnet-4-6`), React 18 + TypeScript, Supabase JS v2, Tailwind CSS, shadcn/ui

---

## Structure des fichiers

| Fichier | Action | Responsabilité |
|---------|--------|----------------|
| `supabase/migrations/20260406_sprint3_ai_summary.sql` | Créer | Colonnes `ai_summary` + `ai_summary_generated_at` sur `projects_v2` |
| `supabase/functions/generate-ai-summary/index.ts` | Créer | Edge Function : collecte données, prompt Claude, persiste résultat |
| `src/types/project-v2.ts` | Modifier | Ajouter `ai_summary` et `ai_summary_generated_at` à `ProjectV2` |
| `src/modules/ProjectDetailsV2/hooks/useAiSummary.ts` | Créer | Hook : appel edge function, état loading/error, refresh du projet |
| `src/modules/ProjectDetailsV2/components/AiSummaryCard.tsx` | Créer | Composant : affichage 3 blocs + bouton Résumer/Régénérer + badge âge |
| `src/modules/ProjectDetailsV2/components/ProjectOverview.tsx` | Modifier | Intégrer `<AiSummaryCard>` dans le layout Vue d'ensemble |

---

## Task 1 : Migration Supabase — colonnes ai_summary

**Files:**
- Create: `supabase/migrations/20260406_sprint3_ai_summary.sql`

- [ ] **Étape 1 : Créer la migration SQL**

```sql
-- Migration Sprint 3 : Résumé IA automatique
-- Structure ai_summary : { situation: string, action: string, milestone: string }
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS ai_summary            JSONB,
  ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ;
```

- [ ] **Étape 2 : Appliquer la migration via Supabase CLI**

```bash
npx supabase db push
```

Résultat attendu : `Applying migration 20260406_sprint3_ai_summary.sql... done`

Si le CLI n'est pas disponible localement, appliquer via le dashboard Supabase SQL Editor (projet `wftozvnvstxzvfplveyz`).

- [ ] **Étape 3 : Vérifier**

Dans le SQL Editor Supabase :
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects_v2'
  AND column_name IN ('ai_summary', 'ai_summary_generated_at');
```
Résultat attendu : 2 lignes (`jsonb`, `timestamp with time zone`).

- [ ] **Étape 4 : Commit**

```bash
git add supabase/migrations/20260406_sprint3_ai_summary.sql
git commit -m "feat(migration): add ai_summary + ai_summary_generated_at to projects_v2"
```

---

## Task 2 : Edge Function generate-ai-summary

**Files:**
- Create: `supabase/functions/generate-ai-summary/index.ts`

L'edge function reçoit `{ project_id }`, collecte les données du projet, construit le prompt, appelle Claude, persiste le résultat JSONB.

- [ ] **Étape 1 : Créer l'edge function**

```typescript
// supabase/functions/generate-ai-summary/index.ts
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

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { project_id } = await req.json()

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurée' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Charger le projet
    const { data: project, error: projectError } = await supabase
      .from('projects_v2')
      .select('*')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Projet introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Charger les 7 dernières activités
    const { data: activities } = await supabase
      .from('project_activities_v2')
      .select('type, content, created_at')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false })
      .limit(7)

    // 3. Charger les tâches checklist non terminées (max 10)
    const { data: checklist } = await supabase
      .from('checklist_items_v2')
      .select('title, phase, status, priority')
      .eq('project_id', project_id)
      .neq('status', 'done')
      .order('sort_order')
      .limit(10)

    // 4. Construire le prompt
    const activitiesText = (activities ?? [])
      .map((a: { type: string; content: string; created_at: string }) =>
        `- [${a.type}] ${a.content}`)
      .join('\n') || 'Aucune activité enregistrée.'

    const checklistText = (checklist ?? [])
      .map((c: { title: string; phase: string; status: string }) =>
        `- [${c.phase}/${c.status}] ${c.title}`)
      .join('\n') || 'Aucune tâche en cours.'

    const prompt = `Tu es un assistant CRM pour une agence digitale française. Analyse ce projet et génère un résumé structuré en 3 blocs (2-3 phrases max chacun, ton professionnel et direct).

PROJET : ${project.name}
Client : ${project.client_name ?? 'Non renseigné'}
Statut : ${project.status} — Priorité : ${project.priority}
Budget : ${project.budget ? `${project.budget.toLocaleString('fr-FR')} €` : 'Non renseigné'}
Échéance : ${project.end_date ?? 'Non renseignée'}
Score complétude : ${project.completion_score}%
Avancement : ${project.progress}%
Description : ${project.description ?? 'Aucune description.'}
Prochaine action : ${project.next_action_label ?? 'Non définie'}${project.next_action_due ? ` (avant le ${project.next_action_due})` : ''}

JOURNAL RÉCENT :
${activitiesText}

CHECKLIST EN COURS :
${checklistText}

Réponds UNIQUEMENT en JSON strict, sans texte avant ni après :
{
  "situation": "Description factuelle de la situation actuelle du projet (où en est-on, quels jalons franchis).",
  "action": "Ce qui est en cours de traitement ou ce qui doit être fait en priorité.",
  "milestone": "Le prochain jalon clé à atteindre et sa date si disponible."
}`

    // 5. Appel Claude API
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text()
      console.error('[generate-ai-summary] Erreur Claude:', errBody)
      return new Response(
        JSON.stringify({ error: `Erreur API Claude ${claudeRes.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const claudeData = await claudeRes.json()
    const rawText: string = claudeData.content?.[0]?.text ?? ''

    let summary: { situation: string; action: string; milestone: string }
    try {
      summary = JSON.parse(rawText)
    } catch {
      console.error('[generate-ai-summary] JSON invalide:', rawText)
      return new Response(
        JSON.stringify({ error: 'Réponse Claude non parseable', raw: rawText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!summary.situation || !summary.action || !summary.milestone) {
      return new Response(
        JSON.stringify({ error: 'Structure JSON Claude incomplète', raw: summary }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Persister le résumé
    const { error: updateError } = await supabase
      .from('projects_v2')
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq('id', project_id)

    if (updateError) {
      console.error('[generate-ai-summary] Erreur update:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Erreur sauvegarde résumé', detail: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[generate-ai-summary] Résumé généré pour projet ${project_id}`)

    return new Response(
      JSON.stringify({ success: true, summary }),
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

- [ ] **Étape 2 : Déployer l'edge function**

```bash
npx supabase functions deploy generate-ai-summary --project-ref wftozvnvstxzvfplveyz
```

Résultat attendu : `Deployed generate-ai-summary`

- [ ] **Étape 3 : Vérifier que ANTHROPIC_API_KEY est bien définie dans Supabase**

Dans le dashboard Supabase → Settings → Edge Functions → Environment Variables, vérifier que `ANTHROPIC_API_KEY` est présente. Si absente, l'ajouter.

- [ ] **Étape 4 : Tester manuellement l'edge function**

```bash
curl -X POST \
  'https://wftozvnvstxzvfplveyz.supabase.co/functions/v1/generate-ai-summary' \
  -H 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"project_id": "<UN_UUID_PROJET_EXISTANT>"}'
```

Résultat attendu :
```json
{
  "success": true,
  "summary": {
    "situation": "...",
    "action": "...",
    "milestone": "..."
  }
}
```

- [ ] **Étape 5 : Commit**

```bash
git add supabase/functions/generate-ai-summary/index.ts
git commit -m "feat(edge-function): add generate-ai-summary with Claude Sonnet 4.6"
```

---

## Task 3 : Mise à jour du type ProjectV2

**Files:**
- Modify: `src/types/project-v2.ts` (section `ProjectV2` interface)

- [ ] **Étape 1 : Ajouter les nouveaux champs à l'interface `ProjectV2`**

Dans `src/types/project-v2.ts`, ajouter après `company_enriched_at` :

```typescript
  // === RÉSUMÉ IA ===
  ai_summary: { situation: string; action: string; milestone: string } | null
  ai_summary_generated_at: string | null
```

- [ ] **Étape 2 : Vérifier que le build TypeScript passe**

```bash
npm run build 2>&1 | grep -E "error TS|warning"
```

Résultat attendu : aucune erreur TS liée à `ai_summary`.

- [ ] **Étape 3 : Commit**

```bash
git add src/types/project-v2.ts
git commit -m "feat(types): add ai_summary fields to ProjectV2"
```

---

## Task 4 : Hook useAiSummary

**Files:**
- Create: `src/modules/ProjectDetailsV2/hooks/useAiSummary.ts`

- [ ] **Étape 1 : Créer le hook**

```typescript
// src/modules/ProjectDetailsV2/hooks/useAiSummary.ts
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

interface UseAiSummaryResult {
  generating: boolean
  error: string | null
  generate: (projectId: string) => Promise<void>
}

export function useAiSummary(onSuccess: () => void): UseAiSummaryResult {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async (projectId: string) => {
    setGenerating(true)
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-ai-summary', {
        body: { project_id: projectId },
      })

      if (fnError) {
        setError(fnError.message ?? 'Erreur lors de la génération du résumé')
        return
      }

      if (!data?.success) {
        setError(data?.error ?? 'Réponse inattendue')
        return
      }

      onSuccess()
    } catch (err) {
      setError('Erreur réseau — réessayez')
    } finally {
      setGenerating(false)
    }
  }

  return { generating, error, generate }
}
```

- [ ] **Étape 2 : Vérifier le build TypeScript**

```bash
npm run build 2>&1 | grep "error TS"
```

Résultat attendu : aucune erreur.

- [ ] **Étape 3 : Commit**

```bash
git add src/modules/ProjectDetailsV2/hooks/useAiSummary.ts
git commit -m "feat(hook): add useAiSummary for calling generate-ai-summary edge function"
```

---

## Task 5 : Composant AiSummaryCard

**Files:**
- Create: `src/modules/ProjectDetailsV2/components/AiSummaryCard.tsx`

Le composant affiche les 3 blocs du résumé, un badge "Généré il y a Xh", et un bouton Résumer/Régénérer (désactivé si < 24h, avec option de forcer).

- [ ] **Étape 1 : Créer le composant**

```tsx
// src/modules/ProjectDetailsV2/components/AiSummaryCard.tsx
import { useState } from 'react'
import { Sparkles, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import { formatDistanceToNow, parseISO, differenceInHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { useAiSummary } from '../hooks/useAiSummary'
import type { ProjectV2 } from '../../../types/project-v2'

interface AiSummaryCardProps {
  project: ProjectV2
  onRefresh: () => void
}

const BLOCKS = [
  { key: 'situation' as const, label: 'Situation actuelle', color: 'text-blue-400' },
  { key: 'action' as const, label: 'Action en cours', color: 'text-amber-400' },
  { key: 'milestone' as const, label: 'Prochain jalon', color: 'text-green-400' },
]

export function AiSummaryCard({ project, onRefresh }: AiSummaryCardProps) {
  const { generating, error, generate } = useAiSummary(onRefresh)
  const [forceRegen, setForceRegen] = useState(false)

  const summary = project.ai_summary
  const generatedAt = project.ai_summary_generated_at
  const hoursSince = generatedAt ? differenceInHours(new Date(), parseISO(generatedAt)) : null
  const isFresh = hoursSince !== null && hoursSince < 24

  const handleGenerate = () => generate(project.id)

  return (
    <Card className="bg-surface-2 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Résumé IA
          </CardTitle>
          <div className="flex items-center gap-2">
            {generatedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(parseISO(generatedAt), { locale: fr, addSuffix: true })}
              </span>
            )}
            {isFresh && !forceRegen ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-muted-foreground"
                onClick={() => setForceRegen(true)}
              >
                Régénérer
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {summary ? 'Régénérer' : 'Résumer avec IA'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive mb-3 p-2 bg-destructive/10 rounded">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {generating && !summary && (
          <div className="space-y-3 animate-pulse">
            {BLOCKS.map((b) => (
              <div key={b.key}>
                <div className="h-3 w-24 bg-muted rounded mb-1" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-4/5 bg-muted rounded mt-1" />
              </div>
            ))}
          </div>
        )}

        {!generating && !summary && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun résumé généré — cliquez sur "Résumer avec IA" pour démarrer.
          </p>
        )}

        {summary && !generating && (
          <div className="space-y-3">
            {BLOCKS.map((block) => (
              <div key={block.key}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${block.color}`}>
                  {block.label}
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {summary[block.key]}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Étape 2 : Vérifier le build TypeScript**

```bash
npm run build 2>&1 | grep "error TS"
```

Résultat attendu : aucune erreur.

- [ ] **Étape 3 : Commit**

```bash
git add src/modules/ProjectDetailsV2/components/AiSummaryCard.tsx \
        src/modules/ProjectDetailsV2/hooks/useAiSummary.ts
git commit -m "feat(component): add AiSummaryCard with 3-block Claude summary display"
```

---

## Task 6 : Intégration dans ProjectOverview

**Files:**
- Modify: `src/modules/ProjectDetailsV2/components/ProjectOverview.tsx`

- [ ] **Étape 1 : Ajouter l'import et le callback onRefresh**

Modifier `src/modules/ProjectDetailsV2/components/ProjectOverview.tsx` :

Ajouter l'import en haut du fichier, après les imports existants :
```tsx
import { AiSummaryCard } from './AiSummaryCard'
```

Modifier l'interface `ProjectOverviewProps` :
```tsx
interface ProjectOverviewProps {
  project: ProjectV2
  onRefresh?: () => void
}
```

Modifier la signature du composant pour déstructurer `onRefresh` :
```tsx
export function ProjectOverview({ project, onRefresh }: ProjectOverviewProps) {
```

- [ ] **Étape 2 : Ajouter `<AiSummaryCard>` après le bloc `<NextActionCard>`**

À la fin du JSX de `ProjectOverview`, après `<NextActionCard ... />` et avant la fermeture `</div>` :

```tsx
      {/* Résumé IA */}
      <AiSummaryCard project={project} onRefresh={onRefresh ?? (() => {})} />
```

- [ ] **Étape 3 : Vérifier que ProjectDetailsTabsV2 passe bien onRefresh**

Ouvrir `src/modules/ProjectDetailsV2/components/ProjectDetailsTabsV2.tsx` et chercher l'usage de `<ProjectOverview>`. S'assurer que la prop `onRefresh` est transmise depuis le contexte ou le parent. Si `ProjectDetailsTabsV2` n'a pas accès à un `onRefresh`, utiliser `useProjectsV2Context().refetch` :

```tsx
import { useProjectsV2Context } from '../../ProjectsManagerV2/context/ProjectsV2Context'
// ...
const { refetch } = useProjectsV2Context()
// ...
<ProjectOverview project={project} onRefresh={refetch} />
```

- [ ] **Étape 4 : Build final + lint**

```bash
npm run build && npm run lint
```

Résultat attendu : 0 erreur TypeScript, 0 erreur lint.

- [ ] **Étape 5 : Test manuel dans le navigateur**

```bash
npm run dev
```

1. Ouvrir un projet dans ProjectDetailsV2
2. Aller dans l'onglet "Vue d'ensemble"
3. Vérifier que `AiSummaryCard` apparaît en bas
4. Cliquer "Résumer avec IA" — observer le spinner
5. Vérifier que les 3 blocs apparaissent
6. Recharger la page — le résumé doit persister (lu depuis `project.ai_summary`)
7. Vérifier que le badge "il y a X minutes" s'affiche
8. Vérifier que "Régénérer" est grisé avant 24h et nécessite une confirmation

- [ ] **Étape 6 : Commit final + token-saver**

```bash
git add src/modules/ProjectDetailsV2/components/ProjectOverview.tsx \
        src/modules/ProjectDetailsV2/components/ProjectDetailsTabsV2.tsx
git commit -m "feat(sprint3): integrate AiSummaryCard in ProjectOverview"
git push origin main
```

Puis exécuter `/token-saver fin`.

---

## Checklist de review finale

- [ ] L'edge function est POST-only et valide `project_id` avant tout traitement
- [ ] `ANTHROPIC_API_KEY` n'est jamais loguée ni retournée dans les réponses d'erreur
- [ ] Le JSON Claude est parsé avec try/catch et les champs sont validés avant persistence
- [ ] Le composant affiche un état vide explicite (pas de résumé) et un état chargement (skeleton)
- [ ] Le bouton "Régénérer" est protégé contre les appels répétitifs (disabled pendant `generating`)
- [ ] `onRefresh` déclenche bien un rechargement des données via `ProjectsV2Context.refetch`
- [ ] Build TypeScript propre : `npm run build` sans erreur TS
