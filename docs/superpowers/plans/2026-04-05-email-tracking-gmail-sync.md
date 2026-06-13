# Email Tracking + Gmail Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connecter Gmail pour synchroniser automatiquement les emails liés à chaque projet dans le suivi du dossier, et tracer les ouvertures d'emails envoyés aux clients via un pixel de tracking.

**Architecture:**
- **Partie A — Gmail Sync** : OAuth2 Google → tokens stockés en base → Edge Function cron qui poll Gmail et crée des `project_activities_v2` de type `email`
- **Partie B — Pixel Tracking** : Edge Function `track-open` qui sert un GIF 1×1 transparent + log l'ouverture → badge "ouvert" dans le suivi du dossier
- Les deux parties sont indépendantes et peuvent être déployées séparément.

**Tech Stack:** Supabase Edge Functions (Deno), Gmail API v1, Google OAuth2, React 18, Supabase Postgres, pg_cron

---

## PARTIE A — Gmail Sync

### Task 1 : Tables Supabase pour Gmail

**Files:**
- Create: `supabase/migrations/20260405_gmail_sync.sql`

- [ ] **Écrire et appliquer la migration SQL**

```sql
-- Connexions Gmail (une par utilisateur)
CREATE TABLE IF NOT EXISTS public.gmail_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  gmail_email     TEXT NOT NULL,
  access_token    TEXT NOT NULL,
  refresh_token   TEXT NOT NULL,
  token_expiry    TIMESTAMPTZ NOT NULL,
  last_sync_at    TIMESTAMPTZ,
  history_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Règles de matching email → projet
CREATE TABLE IF NOT EXISTS public.project_email_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  client_email  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_rules_project ON public.project_email_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_email_rules_email   ON public.project_email_rules(client_email);

ALTER TABLE public.gmail_connections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_email_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dev_gmail_connections"   ON public.gmail_connections   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_email_rules"         ON public.project_email_rules FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.gmail_connections   TO anon, authenticated;
GRANT ALL ON public.project_email_rules TO anon, authenticated;
```

- [ ] **Appliquer via MCP Supabase**
  ```
  mcp__plugin_supabase_supabase__apply_migration(project_id, "gmail_sync", <sql>)
  ```

- [ ] **Commit**
  ```bash
  git add supabase/migrations/20260405_gmail_sync.sql
  git commit -m "feat(gmail): migration tables gmail_connections + project_email_rules"
  ```

---

### Task 2 : Edge Function — OAuth2 Callback

**Files:**
- Create: `supabase/functions/gmail-oauth-callback/index.ts`

Variables d'env requises (à ajouter dans Supabase Dashboard → Settings → Edge Functions) :
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_URL` (ex: `http://localhost:5175`)

- [ ] **Créer la Edge Function**

```typescript
// supabase/functions/gmail-oauth-callback/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const userId = url.searchParams.get('state') // on passe user_id en state

  if (!code || !userId) {
    return new Response('Missing code or state', { status: 400 })
  }

  const clientId     = Deno.env.get('GOOGLE_CLIENT_ID')!
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!
  const appUrl       = Deno.env.get('APP_URL')!
  const redirectUri  = `${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-oauth-callback`

  // Échange du code contre les tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: redirectUri, grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenRes.json()
  if (!tokens.access_token) {
    return new Response('Token exchange failed: ' + JSON.stringify(tokens), { status: 500 })
  }

  // Récupérer l'email Gmail
  const userRes  = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const userInfo = await userRes.json()

  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  // Sauvegarder en base
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  await supabase.from('gmail_connections').upsert({
    user_id: userId,
    gmail_email: userInfo.email,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: expiry,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // Rediriger vers l'app
  return Response.redirect(`${appUrl}?gmail_connected=1`, 302)
})
```

- [ ] **Déployer**
  ```bash
  npx supabase functions deploy gmail-oauth-callback --project-ref wftozvnvstxzvfplveyz
  ```

- [ ] **Commit**
  ```bash
  git add supabase/functions/gmail-oauth-callback/
  git commit -m "feat(gmail): edge function oauth2 callback"
  ```

---

### Task 3 : Edge Function — Gmail Sync (cron)

**Files:**
- Create: `supabase/functions/gmail-sync/index.ts`

- [ ] **Créer la Edge Function**

```typescript
// supabase/functions/gmail-sync/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token
}

async function getEmailDetails(token: string, messageId: string) {
  const res = await fetch(`${GMAIL_API}/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Récupérer toutes les connexions Gmail actives
  const { data: connections } = await supabase.from('gmail_connections').select('*')
  if (!connections?.length) return new Response('No connections', { status: 200 })

  // Récupérer toutes les règles de matching
  const { data: rules } = await supabase.from('project_email_rules').select('*')
  if (!rules?.length) return new Response('No rules', { status: 200 })

  const emailToProjects: Record<string, string[]> = {}
  for (const rule of rules) {
    const key = rule.client_email.toLowerCase()
    if (!emailToProjects[key]) emailToProjects[key] = []
    emailToProjects[key].push(rule.project_id)
  }

  for (const conn of connections) {
    try {
      // Rafraîchir le token si expiré
      let token = conn.access_token
      if (new Date(conn.token_expiry) <= new Date()) {
        token = await refreshAccessToken(conn.refresh_token)
        await supabase.from('gmail_connections').update({
          access_token: token,
          token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
        }).eq('id', conn.id)
      }

      // Chercher les emails depuis le dernier sync
      const since = conn.last_sync_at
        ? Math.floor(new Date(conn.last_sync_at).getTime() / 1000)
        : Math.floor(Date.now() / 1000) - 7 * 24 * 3600 // 7 jours par défaut

      const query = `after:${since}`
      const listRes = await fetch(`${GMAIL_API}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const listData = await listRes.json()
      const messages = listData.messages ?? []

      for (const msg of messages) {
        const detail = await getEmailDetails(token, msg.id)
        const headers = detail.payload?.headers ?? []
        const from    = headers.find((h: any) => h.name === 'From')?.value ?? ''
        const subject = headers.find((h: any) => h.name === 'Subject')?.value ?? '(Sans objet)'
        const date    = headers.find((h: any) => h.name === 'Date')?.value ?? new Date().toISOString()

        // Extraire l'email de l'expéditeur
        const match = from.match(/<(.+?)>/) ?? from.match(/(\S+@\S+)/)
        const senderEmail = (match?.[1] ?? from).toLowerCase()

        const projectIds = emailToProjects[senderEmail] ?? []
        for (const projectId of projectIds) {
          // Éviter les doublons (même message_id)
          const { data: existing } = await supabase
            .from('project_activities_v2')
            .select('id')
            .eq('project_id', projectId)
            .eq('metadata->>gmail_message_id', msg.id)
            .maybeSingle()

          if (!existing) {
            await supabase.from('project_activities_v2').insert({
              project_id: projectId,
              author_name: from,
              type: 'email',
              content: `Email reçu : ${subject}`,
              is_auto: true,
              metadata: { gmail_message_id: msg.id, from, subject, date },
              created_at: new Date(date).toISOString(),
            })
          }
        }
      }

      await supabase.from('gmail_connections').update({
        last_sync_at: new Date().toISOString(),
      }).eq('id', conn.id)

    } catch (err) {
      console.error(`Sync error for ${conn.gmail_email}:`, err)
    }
  }

  return new Response('Sync done', { status: 200 })
})
```

- [ ] **Déployer**
  ```bash
  npx supabase functions deploy gmail-sync --project-ref wftozvnvstxzvfplveyz
  ```

- [ ] **Activer le cron (toutes les 15 min) via SQL Supabase**
  ```sql
  SELECT cron.schedule(
    'gmail-sync-cron',
    '*/15 * * * *',
    $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/gmail-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    )
    $$
  );
  ```

- [ ] **Commit**
  ```bash
  git add supabase/functions/gmail-sync/
  git commit -m "feat(gmail): edge function sync cron toutes les 15min"
  ```

---

### Task 4 : Frontend — Bouton "Connecter Gmail" + gestion des règles

**Files:**
- Create: `src/modules/ProjectDetailsV2/components/ProjectEmailRules.tsx`
- Modify: `src/modules/ProjectDetailsV2/components/ProjectDetailsTabsV2.tsx`

- [ ] **Créer le composant ProjectEmailRules**

```tsx
// src/modules/ProjectDetailsV2/components/ProjectEmailRules.tsx
import { useState, useEffect } from 'react'
import { Mail, Plus, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'

interface Props { projectId: string }

interface EmailRule {
  id: string
  project_id: string
  client_email: string
  created_at: string
}

export function ProjectEmailRules({ projectId }: Props) {
  const [rules, setRules] = useState<EmailRule[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [gmailConnected, setGmailConnected] = useState(false)

  useEffect(() => {
    supabase.from('project_email_rules').select('*').eq('project_id', projectId)
      .then(({ data }) => { if (data) setRules(data) })
    supabase.from('gmail_connections').select('id').limit(1)
      .then(({ data }) => { setGmailConnected(!!data?.length) })
  }, [projectId])

  const connectGmail = () => {
    const clientId   = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const redirectUri = `${supabaseUrl}/functions/v1/gmail-oauth-callback`
    const scope = 'https://www.googleapis.com/auth/gmail.readonly'
    const state = 'dev-user' // remplacer par l'ID utilisateur réel
    const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&access_type=offline&prompt=consent`
    window.location.href = url
  }

  const addRule = async () => {
    if (!newEmail.includes('@')) { toast.error('Email invalide'); return }
    const { data, error } = await supabase.from('project_email_rules').insert({
      project_id: projectId, client_email: newEmail.toLowerCase().trim()
    }).select().single()
    if (!error && data) {
      setRules(prev => [...prev, data])
      setNewEmail('')
      toast.success('Email de tracking ajouté')
    }
  }

  const deleteRule = async (id: string) => {
    await supabase.from('project_email_rules').delete().eq('id', id)
    setRules(prev => prev.filter(r => r.id !== id))
    toast.success('Règle supprimée')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Sync Gmail</h3>
        {!gmailConnected && (
          <button onClick={connectGmail}
            className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors font-medium">
            <ExternalLink className="h-3.5 w-3.5" />
            Connecter Gmail
          </button>
        )}
        {gmailConnected && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
            Gmail connecté
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Les emails reçus depuis ces adresses seront automatiquement ajoutés au journal d'activité.
      </p>

      <div className="flex gap-2">
        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addRule()}
          placeholder="email@client.com"
          className="flex-1 bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button onClick={addRule}
          className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {rules.map(rule => (
          <div key={rule.id} className="flex items-center justify-between bg-surface-2 border border-border rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground">{rule.client_email}</span>
            </div>
            <button onClick={() => deleteRule(rule.id)}
              className="text-muted-foreground hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {rules.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Aucune adresse email configurée.
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Ajouter la variable d'env**
  Dans `.env` :
  ```
  VITE_GOOGLE_CLIENT_ID=your-google-client-id
  ```

- [ ] **Intégrer dans l'onglet Timeline (ou créer un 9ème onglet "Gmail")**
  Dans `ProjectDetailsTabsV2.tsx`, ajouter :
  ```tsx
  import { ProjectEmailRules } from './ProjectEmailRules'
  // Dans le switch/cases :
  case 'gmail': return <ProjectEmailRules projectId={projectId} />
  ```
  Et ajouter `{ id: 'gmail', label: 'Gmail' }` dans le tableau des onglets.

- [ ] **Commit**
  ```bash
  git add src/modules/ProjectDetailsV2/components/ProjectEmailRules.tsx
  git add src/modules/ProjectDetailsV2/components/ProjectDetailsTabsV2.tsx
  git commit -m "feat(gmail): UI connexion gmail + règles de matching par projet"
  ```

---

## PARTIE B — Pixel Tracking (ouvertures d'emails)

### Task 5 : Table email_tracking + Edge Function pixel

**Files:**
- Create: `supabase/migrations/20260405_email_tracking.sql`
- Create: `supabase/functions/track-open/index.ts`

- [ ] **Migration SQL**

```sql
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  follow_up_id    UUID,
  token           TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  subject         TEXT,
  recipient_email TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at       TIMESTAMPTZ,
  open_count      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_email_tracking_token   ON public.email_tracking(token);
CREATE INDEX IF NOT EXISTS idx_email_tracking_project ON public.email_tracking(project_id);

ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_email_tracking" ON public.email_tracking FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.email_tracking TO anon, authenticated;
```

- [ ] **Appliquer via MCP**

- [ ] **Edge Function track-open**

```typescript
// supabase/functions/track-open/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// GIF 1x1 transparent (base64)
const PIXEL_B64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const PIXEL = Uint8Array.from(atob(PIXEL_B64), c => c.charCodeAt(0))

Deno.serve(async (req) => {
  const url   = new URL(req.url)
  const token = url.searchParams.get('t')

  if (token) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const now = new Date().toISOString()
    // Mettre à jour opened_at (première ouverture) et incrémenter open_count
    const { data } = await supabase
      .from('email_tracking')
      .select('open_count, opened_at')
      .eq('token', token)
      .maybeSingle()

    if (data) {
      await supabase.from('email_tracking').update({
        opened_at: data.opened_at ?? now,
        open_count: data.open_count + 1,
      }).eq('token', token)
    }
  }

  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
})
```

- [ ] **Déployer**
  ```bash
  npx supabase functions deploy track-open --project-ref wftozvnvstxzvfplveyz
  ```

- [ ] **Commit**
  ```bash
  git add supabase/migrations/20260405_email_tracking.sql supabase/functions/track-open/
  git commit -m "feat(tracking): migration email_tracking + edge function pixel"
  ```

---

### Task 6 : Hook + UI — Générer pixel et afficher statut d'ouverture

**Files:**
- Create: `src/modules/ProjectsManagerV2/hooks/useEmailTracking.ts`
- Modify: `src/modules/ProjectDetailsV2/components/ProjectFollowUp.tsx`

- [ ] **Créer le hook useEmailTracking**

```typescript
// src/modules/ProjectsManagerV2/hooks/useEmailTracking.ts
import { useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export interface TrackingResult {
  token: string
  pixelUrl: string
  pixelHtml: string
}

export function useEmailTracking(projectId: string) {
  const createTracking = useCallback(async (subject: string, recipientEmail?: string): Promise<TrackingResult | null> => {
    const { data, error } = await supabase
      .from('email_tracking')
      .insert({ project_id: projectId, subject, recipient_email: recipientEmail ?? null })
      .select()
      .single()

    if (error || !data) return null

    const pixelUrl  = `${SUPABASE_URL}/functions/v1/track-open?t=${data.token}`
    const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none" />`

    return { token: data.token, pixelUrl, pixelHtml }
  }, [projectId])

  const getTrackingStatus = useCallback(async (token: string) => {
    const { data } = await supabase
      .from('email_tracking')
      .select('opened_at, open_count')
      .eq('token', token)
      .maybeSingle()
    return data
  }, [])

  return { createTracking, getTrackingStatus }
}
```

- [ ] **Modifier ProjectFollowUp — ajouter le bouton "Tracking" dans le formulaire email**

Dans `ProjectFollowUp.tsx`, quand le type sélectionné est `email` :
```tsx
import { useEmailTracking } from '../../ProjectsManagerV2/hooks/useEmailTracking'
import { Copy } from 'lucide-react'

// Dans le composant :
const { createTracking } = useEmailTracking(projectId)
const [pixelHtml, setPixelHtml] = useState<string | null>(null)

const handleGeneratePixel = async () => {
  const result = await createTracking(form.summary || 'Email suivi')
  if (result) {
    setPixelHtml(result.pixelHtml)
    await navigator.clipboard.writeText(result.pixelHtml)
    toast.success('Pixel copié — colle-le dans ton email avant d\'envoyer')
  }
}

// Dans le JSX, sous le champ "Résumé" quand type === 'email' :
{form.type === 'email' && (
  <button type="button" onClick={handleGeneratePixel}
    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
    <Copy className="h-3.5 w-3.5" />
    Générer pixel de tracking
  </button>
)}
{pixelHtml && (
  <p className="text-[10px] text-muted-foreground bg-surface-3 px-2 py-1 rounded font-mono truncate">
    {pixelHtml}
  </p>
)}
```

- [ ] **Afficher le statut "ouvert" dans les cartes follow-up**

Dans le rendu de chaque `entry` de type `email`, ajouter une query au chargement :
```tsx
// Ajouter dans l'état du composant :
const [openStatus, setOpenStatus] = useState<Record<string, { opened_at: string; open_count: number } | null>>({})

// Au chargement des followUps, pour ceux de type email avec un token en metadata :
useEffect(() => {
  const emailEntries = entries.filter(e => e.type === 'email' && e.metadata?.tracking_token)
  emailEntries.forEach(async (e) => {
    const { data } = await supabase.from('email_tracking')
      .select('opened_at, open_count').eq('token', e.metadata.tracking_token).maybeSingle()
    if (data) setOpenStatus(prev => ({ ...prev, [e.id]: data }))
  })
}, [entries])

// Dans le JSX de la carte entry, après le badge de type :
{openStatus[entry.id] && (
  <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">
    Ouvert {openStatus[entry.id]!.open_count}× · {openStatus[entry.id]!.opened_at?.split('T')[0]}
  </span>
)}
{entry.type === 'email' && !openStatus[entry.id] && (
  <span className="text-[10px] bg-gray-500/10 text-gray-500 px-1.5 py-0.5 rounded">
    Non ouvert
  </span>
)}
```

- [ ] **Commit**
  ```bash
  git add src/modules/ProjectsManagerV2/hooks/useEmailTracking.ts
  git add src/modules/ProjectDetailsV2/components/ProjectFollowUp.tsx
  git commit -m "feat(tracking): hook useEmailTracking + UI pixel + badge ouverture"
  ```

---

## Prérequis Google Cloud

Avant de commencer la Partie A, créer les credentials Google :

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créer un projet ou utiliser un existant
3. Activer **Gmail API**
4. Créer des credentials OAuth2 :
   - Type : **Web application**
   - Authorized redirect URIs : `https://wftozvnvstxzvfplveyz.supabase.co/functions/v1/gmail-oauth-callback`
5. Copier `Client ID` → `VITE_GOOGLE_CLIENT_ID` dans `.env`
6. Copier `Client Secret` → `GOOGLE_CLIENT_SECRET` dans les secrets Supabase Edge Functions

---

## Variables d'environnement récapitulatif

| Variable | Où | Usage |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | `.env` (frontend) | Initier OAuth flow |
| `GOOGLE_CLIENT_ID` | Supabase Edge Functions secrets | OAuth callback |
| `GOOGLE_CLIENT_SECRET` | Supabase Edge Functions secrets | OAuth callback + refresh |
| `APP_URL` | Supabase Edge Functions secrets | Redirect post-auth |
