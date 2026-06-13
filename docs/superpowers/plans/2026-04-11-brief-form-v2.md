# Brief Form V2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre l'UI/UX du formulaire public `/brief/:token` en glassmorphism, ajouter les notifications email via Resend (Edge Function), et une modale de gestion des destinataires dans le DashboardV2.

**Architecture:** La refonte UI est isolée dans `ClientBriefPage.tsx` (JSX/CSS uniquement, logique métier inchangée). Les notifications email passent par une nouvelle Edge Function Deno appelée après `submitBrief`. La gestion des destinataires est stockée en Supabase (`notification_emails`) et exposée via un hook + modale dans DashboardV2.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion (déjà installé), Lucide React, Supabase Edge Functions (Deno), Resend API (fetch natif), shadcn/ui Dialog

---

## Fichiers

| Action | Fichier |
|--------|---------|
| Modifier | `src/modules/ClientBrief/ClientBriefPage.tsx` |
| Créer | `supabase/migrations/20260411_notification_emails.sql` |
| Créer | `supabase/functions/send-brief-notification/index.ts` |
| Modifier | `src/modules/ProjectsManagerV2/hooks/useBriefV2.ts` |
| Créer | `src/modules/DashboardV2/hooks/useNotificationEmails.ts` |
| Créer | `src/modules/DashboardV2/components/BriefNotificationsModal.tsx` |
| Modifier | `src/modules/DashboardV2/index.tsx` |

---

## Task 1 — Migration Supabase `notification_emails`

**Files:**
- Create: `supabase/migrations/20260411_notification_emails.sql`

- [ ] **Step 1 : Créer la migration**

```sql
-- supabase/migrations/20260411_notification_emails.sql

create table if not exists notification_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint notification_emails_email_unique unique (email)
);

-- RLS : lecture/écriture réservée aux admins
alter table notification_emails enable row level security;

create policy "admins_all" on notification_emails
  for all
  using (is_admin())
  with check (is_admin());
```

- [ ] **Step 2 : Appliquer la migration via MCP Supabase**

Utiliser l'outil MCP `mcp__plugin_supabase_supabase__apply_migration` avec le contenu ci-dessus sur le projet `wftozvnvstxzvfplveyz`.

- [ ] **Step 3 : Vérifier la table**

Utiliser `mcp__plugin_supabase_supabase__execute_sql` :
```sql
select * from notification_emails limit 1;
```
Résultat attendu : colonnes `id, email, label, active, created_at` visibles, pas d'erreur.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260411_notification_emails.sql
git commit -m "feat(notifications): migration table notification_emails + RLS"
```

---

## Task 2 — Edge Function `send-brief-notification`

**Files:**
- Create: `supabase/functions/send-brief-notification/index.ts`

- [ ] **Step 1 : Créer le dossier et le fichier**

```bash
mkdir -p supabase/functions/send-brief-notification
```

- [ ] **Step 2 : Écrire la Edge Function**

```typescript
// supabase/functions/send-brief-notification/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIELD_LABELS: Record<string, string> = {
  objective: "Objectif du projet",
  target_audience: "Cible / utilisateurs",
  pages: "Pages / Fonctionnalités attendues",
  techno: "Technologie / stack",
  design_references: "Références design",
  notes: "Notes complémentaires",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, fields } = await req.json() as {
      projectName: string;
      fields: Record<string, string | null>;
    };

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY manquante");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les emails supplémentaires actifs
    const { data: extraEmails } = await supabase
      .from("notification_emails")
      .select("email")
      .eq("active", true);

    const to = [
      "lyestriki@gmail.com",
      ...(extraEmails ?? []).map((r: { email: string }) => r.email),
    ];

    // Construire le corps HTML
    const fieldsHtml = Object.entries(fields)
      .filter(([, val]) => val && val.trim().length > 0)
      .map(([key, val]) => `
        <div style="margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">
            ${FIELD_LABELS[key] ?? key}
          </p>
          <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;white-space:pre-wrap;">${val}</p>
        </div>
      `).join("");

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:24px 28px;">
          <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Nouveau brief reçu</p>
          <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:800;">${projectName}</h1>
        </div>
        <div style="padding:24px 28px;background:#fff;">
          ${fieldsHtml}
        </div>
        <div style="padding:16px 28px;background:#f8fafc;text-align:center;font-size:11px;color:#94a3b8;">
          Propul'SEO · Notification automatique
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Propul'SEO <no-reply@propulseo-site.com>",
        to,
        subject: `[Brief] Nouveau brief reçu — ${projectName}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 3 : Déployer la Edge Function**

Utiliser l'outil MCP `mcp__plugin_supabase_supabase__deploy_edge_function` avec :
- `function_name`: `send-brief-notification`
- `project_id`: `wftozvnvstxzvfplveyz`

- [ ] **Step 4 : Définir le secret RESEND_API_KEY**

La clé est dans `supabase/.env`. L'appliquer via MCP `mcp__plugin_supabase_supabase__execute_sql` n'est pas possible pour les secrets — utiliser le terminal :

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main
npx supabase secrets set RESEND_API_KEY=re_7aoh8JYx_HJeE3Pg8c8M6GAjssndAmjhk --project-ref wftozvnvstxzvfplveyz
```

Résultat attendu : `Secrets updated.`

- [ ] **Step 5 : Commit**

```bash
git add supabase/functions/send-brief-notification/
git commit -m "feat(notifications): edge function send-brief-notification via Resend"
```

---

## Task 3 — Appel Edge Function dans `useBriefByToken`

**Files:**
- Modify: `src/modules/ProjectsManagerV2/hooks/useBriefV2.ts`

- [ ] **Step 1 : Modifier `submitBrief` pour appeler l'Edge Function après succès**

Dans `useBriefByToken`, remplacer le `return !error` final par un bloc qui appelle la Edge Function :

```typescript
// src/modules/ProjectsManagerV2/hooks/useBriefV2.ts
// Modifier la fonction submitBrief — remplacer le contenu existant par :

const submitBrief = useCallback(async (fields: BriefFields): Promise<boolean> => {
  if (!data) return false

  const payload = {
    ...fields,
    project_id: data.projectId,
    status: 'submitted' as const,
    submitted_at: new Date().toISOString(),
  }

  let error: unknown
  if (data.brief) {
    const result = await supabaseAnon
      .from('project_briefs_v2')
      .update(payload)
      .eq('id', data.brief.id)
    error = result.error
  } else {
    const result = await supabaseAnon
      .from('project_briefs_v2')
      .insert(payload)
    error = result.error
  }

  if (error) return false

  // Appel Edge Function — fire-and-forget (on n'attend pas, pas bloquant)
  fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-brief-notification`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        projectName: data.projectName,
        fields: {
          objective: fields.objective,
          target_audience: fields.target_audience,
          pages: fields.pages,
          techno: fields.techno,
          design_references: fields.design_references,
          notes: fields.notes,
        },
      }),
    }
  ).catch(() => {/* silencieux — l'email est best-effort */})

  return true
}, [data])
```

- [ ] **Step 2 : Vérifier que le build passe**

```bash
npm run build
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/ProjectsManagerV2/hooks/useBriefV2.ts
git commit -m "feat(notifications): appel edge function après soumission brief"
```

---

## Task 4 — Hook `useNotificationEmails`

**Files:**
- Create: `src/modules/DashboardV2/hooks/useNotificationEmails.ts`

- [ ] **Step 1 : Créer le hook**

```typescript
// src/modules/DashboardV2/hooks/useNotificationEmails.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface NotificationEmail {
  id: string
  email: string
  label: string | null
  active: boolean
  created_at: string
}

export function useNotificationEmails() {
  const [emails, setEmails] = useState<NotificationEmail[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notification_emails')
      .select('*')
      .order('created_at', { ascending: true })
    setEmails((data as NotificationEmail[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addEmail = useCallback(async (email: string, label: string) => {
    const { error } = await supabase
      .from('notification_emails')
      .insert({ email: email.trim().toLowerCase(), label: label.trim() || null })
    if (!error) await fetch()
    return !error
  }, [fetch])

  const toggleEmail = useCallback(async (id: string, active: boolean) => {
    await supabase
      .from('notification_emails')
      .update({ active })
      .eq('id', id)
    setEmails(prev => prev.map(e => e.id === id ? { ...e, active } : e))
  }, [])

  const deleteEmail = useCallback(async (id: string) => {
    await supabase
      .from('notification_emails')
      .delete()
      .eq('id', id)
    setEmails(prev => prev.filter(e => e.id !== id))
  }, [])

  return { emails, loading, addEmail, toggleEmail, deleteEmail, refresh: fetch }
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
npm run build
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/DashboardV2/hooks/useNotificationEmails.ts
git commit -m "feat(notifications): hook useNotificationEmails CRUD"
```

---

## Task 5 — Modale `BriefNotificationsModal`

**Files:**
- Create: `src/modules/DashboardV2/components/BriefNotificationsModal.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/modules/DashboardV2/components/BriefNotificationsModal.tsx
import { useState } from 'react'
import { Mail, Plus, Trash2, Power, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNotificationEmails } from '../hooks/useNotificationEmails'

interface BriefNotificationsModalProps {
  open: boolean
  onClose: () => void
}

export function BriefNotificationsModal({ open, onClose }: BriefNotificationsModalProps) {
  const { emails, loading, addEmail, toggleEmail, deleteEmail } = useNotificationEmails()
  const [newEmail, setNewEmail] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!newEmail.trim()) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      setError('Adresse email invalide.')
      return
    }
    setAdding(true)
    setError(null)
    const ok = await addEmail(newEmail, newLabel)
    setAdding(false)
    if (ok) {
      setNewEmail('')
      setNewLabel('')
    } else {
      setError('Cette adresse est déjà enregistrée ou une erreur est survenue.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Mail className="w-4 h-4 text-indigo-500" />
            Notifications brief
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Adresse fixe */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Adresse principale
            </p>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
              <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-sm font-medium text-indigo-700 flex-1">lyestriki@gmail.com</span>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-100 px-2 py-0.5 rounded-full">
                Toujours notifié
              </span>
            </div>
          </div>

          {/* Emails supplémentaires */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Destinataires supplémentaires
            </p>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Chargement…
              </div>
            ) : emails.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">Aucun destinataire supplémentaire.</p>
            ) : (
              <div className="space-y-2">
                {emails.map(e => (
                  <div
                    key={e.id}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
                      e.active
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{e.email}</p>
                      {e.label && (
                        <p className="text-[10px] text-slate-400">{e.label}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleEmail(e.id, !e.active)}
                      className={`p-1 rounded-lg transition-colors ${
                        e.active
                          ? 'text-emerald-500 hover:bg-emerald-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={e.active ? 'Désactiver' : 'Activer'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteEmail(e.id)}
                      className="p-1 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulaire ajout */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Ajouter un destinataire
            </p>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="email@exemple.fr"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Nom / libellé (optionnel)"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
            <button
              onClick={handleAdd}
              disabled={adding || !newEmail.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {adding
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Plus className="w-3.5 h-3.5" />
              }
              Ajouter
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
npm run build
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/modules/DashboardV2/components/BriefNotificationsModal.tsx
git commit -m "feat(notifications): modale BriefNotificationsModal"
```

---

## Task 6 — Bouton ⚙️ dans DashboardV2

**Files:**
- Modify: `src/modules/DashboardV2/index.tsx`

- [ ] **Step 1 : Ajouter les imports**

En haut de `src/modules/DashboardV2/index.tsx`, ajouter :

```typescript
import { useState } from 'react'
import { Settings } from 'lucide-react'
import { BriefNotificationsModal } from './components/BriefNotificationsModal'
```

Le `useCallback` et `useMemo` sont déjà importés depuis `react`.

- [ ] **Step 2 : Ajouter l'état modal et le bouton dans le JSX**

Après la ligne `const { isConnected, lastUpdatedAt } = useDashboardRealtime(onRefresh)`, ajouter :

```typescript
const [showNotifModal, setShowNotifModal] = useState(false)
```

- [ ] **Step 3 : Ajouter le bouton et la modale dans le return**

Remplacer le premier `<div className="flex flex-col gap-4 p-4 md:p-6 h-full overflow-auto">` par :

```tsx
<div className="flex flex-col gap-4 p-4 md:p-6 h-full overflow-auto">
  {/* Bouton paramètres notifications + modale */}
  <div className="flex justify-end">
    <button
      onClick={() => setShowNotifModal(true)}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-2"
      title="Paramètres notifications brief"
    >
      <Settings className="w-3.5 h-3.5" />
      Notifications brief
    </button>
  </div>
  <BriefNotificationsModal
    open={showNotifModal}
    onClose={() => setShowNotifModal(false)}
  />
```

Et fermer ce `div` avant la fermeture du `div` racine existant (juste avant le dernier `</div>`).

- [ ] **Step 4 : Vérifier le build**

```bash
npm run build
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 5 : Commit**

```bash
git add src/modules/DashboardV2/index.tsx
git commit -m "feat(notifications): bouton paramètres brief dans DashboardV2"
```

---

## Task 7 — Refonte UI `ClientBriefPage.tsx`

**Files:**
- Modify: `src/modules/ClientBrief/ClientBriefPage.tsx`

- [ ] **Step 1 : Réécrire le fichier complet**

La logique métier (hook `useBriefByToken`, state `fields`, `submitting`, `submitted`, `validationError`, handlers) est identique. Seul le JSX change.

```typescript
// src/modules/ClientBrief/ClientBriefPage.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Send, Loader2 } from 'lucide-react'
import { useBriefByToken } from '@/modules/ProjectsManagerV2/hooks/useBriefV2'
import type { BriefFields } from '@/modules/ProjectsManagerV2/hooks/useBriefV2'

const LOGO_URL = 'https://lh3.googleusercontent.com/pw/AP1GczN1Fx4MCRF05ZyLZ8eE7yq6l3O04S9H5NUlRQng3NGehC4bVTl4SA0EdX8yJ4cEgMGjbPkELigm1WxcMBR8QCh4QSMgDVikjqv8mizSPn2r-zv-pKbMK10JVMTK4Fo1kd4VUXASX_owtWiT6X6cRao=w590-h423-s-no-gm?authuser=0'

interface FieldDef {
  key: keyof BriefFields
  label: string
  placeholder: string
  required?: boolean
  rows: number
}

const FIELDS: FieldDef[] = [
  { key: 'objective',         label: 'Objectif du projet',                 placeholder: "Quel est l'objectif principal du projet ?",        required: true, rows: 4 },
  { key: 'target_audience',   label: 'Cible / utilisateurs',               placeholder: 'Qui sont les utilisateurs cibles ?',                rows: 3 },
  { key: 'pages',             label: 'Pages / Fonctionnalités attendues',  placeholder: 'Listez les pages ou fonctionnalités souhaitées…',   rows: 4 },
  { key: 'techno',            label: 'Technologie / stack',                placeholder: 'Stack technique ou préférences technologiques…',    rows: 2 },
  { key: 'design_references', label: 'Références design',                  placeholder: 'URLs, inspirations visuelles, exemples de sites…', rows: 3 },
  { key: 'notes',             label: 'Notes complémentaires',              placeholder: "Toute information utile pour l'équipe…",           rows: 3 },
]

// Auto-resize textarea helper
function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return ref
}

interface FieldCardProps {
  field: FieldDef
  index: number
  value: string
  onChange: (v: string) => void
}

function FieldCard({ field, index, value, onChange }: FieldCardProps) {
  const [focused, setFocused] = useState(false)
  const ref = useAutoResize(value)
  const filled = value.trim().length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1.5px solid ${focused ? '#a5b4fc' : filled ? 'rgba(167,243,208,0.8)' : 'rgba(255,255,255,0.95)'}`,
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: focused
          ? '0 6px 24px rgba(99,102,241,0.18)'
          : filled
          ? '0 2px 12px rgba(34,197,94,0.08)'
          : '0 2px 16px rgba(99,102,241,0.07)',
        transition: 'all 0.25s ease',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      {/* Badge numéro / check */}
      <AnimatePresence mode="wait">
        {filled ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginTop: 1,
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 800,
            }}
          >
            ✓
          </motion.div>
        ) : (
          <motion.div
            key="num"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginTop: 1,
              background: 'linear-gradient(135deg,#6366f1,#a855f7)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 10, fontWeight: 800,
            }}
          >
            {index + 1}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4c1d95', marginBottom: 6 }}>
          {field.label}
          {field.required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
        </label>
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={field.placeholder}
          rows={field.rows}
          style={{
            width: '100%', fontSize: 11, color: '#374151',
            lineHeight: 1.7, resize: 'none', outline: 'none',
            background: 'transparent', border: 'none', fontFamily: 'inherit',
          }}
        />
      </div>
    </motion.div>
  )
}

interface ClientBriefPageProps {
  token: string
}

export function ClientBriefPage({ token }: ClientBriefPageProps) {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
    document.body.style.background = '#ffffff'
    return () => {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
      document.body.style.background = ''
    }
  }, [])

  const { data, loading, error, submitBrief } = useBriefByToken(token)
  const [fields, setFields] = useState<Record<keyof BriefFields, string>>({
    objective: '', target_audience: '', pages: '', techno: '', design_references: '', notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const alreadySubmitted = data?.brief?.submitted_at != null

  const filledCount = Object.values(fields).filter(v => v.trim().length > 0).length

  const handleChange = useCallback((key: keyof BriefFields, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fields.objective.trim()) {
      setValidationError('Le champ "Objectif du projet" est obligatoire.')
      return
    }
    setValidationError(null)
    setSubmitting(true)
    const ok = await submitBrief({
      objective:         fields.objective.trim()         || null,
      target_audience:   fields.target_audience.trim()   || null,
      pages:             fields.pages.trim()             || null,
      techno:            fields.techno.trim()            || null,
      design_references: fields.design_references.trim() || null,
      notes:             fields.notes.trim()             || null,
    })
    setSubmitting(false)
    if (ok) setSubmitted(true)
    else setValidationError('Une erreur est survenue. Veuillez réessayer.')
  }

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #ede9fe 0%, #f0f9ff 50%, #fdf4ff 100%)',
    backgroundAttachment: 'fixed',
  }

  const headerStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 20,
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.9)',
    height: 60, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 20px',
  }

  const Header = (
    <header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src={LOGO_URL} alt="Propul'SEO" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8 }} />
        <span style={{
          fontSize: 13, fontWeight: 800,
          background: 'linear-gradient(135deg,#6366f1,#a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Propul'SEO
        </span>
      </div>
      {data && (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e1b4b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.projectName}
        </span>
      )}
    </header>
  )

  const Footer = (
    <footer style={{ textAlign: 'center', padding: '12px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 10, color: '#94a3b8' }}>
      <img src={LOGO_URL} alt="" style={{ width: 14, height: 14, objectFit: 'contain', borderRadius: 3, opacity: 0.6 }} />
      <span style={{ color: '#6366f1', fontWeight: 700 }}>Propul'SEO</span>
      <span>·</span>
      <span>🔒 Accès par lien unique</span>
    </footer>
  )

  // --- États loading / error ---
  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Header}
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <Loader2 style={{ width: 28, height: 28, margin: '0 auto 10px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13 }}>Chargement du formulaire…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {Header}
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <AlertCircle style={{ width: 48, height: 48, color: '#f87171', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b', marginBottom: 8 }}>Lien invalide</h1>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{error ?? 'Ce lien est invalide ou a été désactivé.'}</p>
        </div>
      </div>
    )
  }

  // --- Écran de confirmation (Version B — Récap) ---
  if (submitted || alreadySubmitted) {
    const submittedDate = data.brief?.submitted_at
      ? new Date(data.brief.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    return (
      <div style={pageStyle}>
        {Header}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px 40px' }}
        >
          {/* Top */}
          <div style={{ textAlign: 'center', padding: '28px 0 20px', borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, margin: '0 auto 12px',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff', boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
            }}>✓</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>
              {alreadySubmitted && !submitted ? 'Brief déjà transmis' : 'Brief transmis !'}
            </h1>
            <p style={{ fontSize: 11, color: '#64748b' }}>
              {alreadySubmitted && !submitted
                ? `Transmis${submittedDate ? ` le ${submittedDate}` : ''}. L'équipe Propul'SEO l'a bien reçu.`
                : 'Voici un récapitulatif de vos réponses'}
            </p>
          </div>

          {/* Récap */}
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Vos réponses</p>
            {FIELDS.map(f => {
              const val = submitted
                ? fields[f.key]
                : (data.brief?.[f.key as keyof typeof data.brief] as string | null | undefined)
              if (!val?.trim()) return null
              return (
                <div key={f.key} style={{
                  background: 'rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(167,243,208,0.8)',
                  borderRadius: 12, padding: '10px 14px',
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                    {f.label}
                  </p>
                  <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{val}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
        {Footer}
      </div>
    )
  }

  // --- Formulaire principal ---
  return (
    <div style={pageStyle}>
      {Header}

      {/* Progression */}
      <div style={{ padding: '12px 20px 0', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {FIELDS.map((_, i) => (
            <div key={i} style={{
              height: 4, flex: 1, borderRadius: 4,
              background: i < filledCount
                ? 'linear-gradient(to right,#6366f1,#a855f7)'
                : i === filledCount
                ? 'linear-gradient(to right,#6366f1,#a855f7)'
                : 'rgba(99,102,241,0.12)',
              opacity: i === filledCount && filledCount < FIELDS.length ? 0.35 : 1,
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
        <p style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, marginTop: 6, letterSpacing: 0.3 }}>
          {filledCount} / {FIELDS.length} champs remplis
        </p>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 20px 16px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e1b4b', marginBottom: 5, lineHeight: 1.2 }}>
          {data.projectName}
        </h2>
        <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          Merci de remplir ce formulaire pour nous aider à bien comprendre votre projet. Seul le champ Objectif est obligatoire.
        </p>
      </div>

      {/* Champs */}
      <form onSubmit={handleSubmit} style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FIELDS.map((field, i) => (
            <FieldCard
              key={field.key}
              field={field}
              index={i}
              value={fields[field.key]}
              onChange={v => handleChange(field.key, v)}
            />
          ))}
        </div>

        {validationError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: 12, color: '#ef4444',
              background: 'rgba(254,242,242,0.9)', border: '1px solid #fecaca',
              borderRadius: 12, padding: '10px 14px', marginTop: 10,
            }}
          >
            {validationError}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%', marginTop: 14,
            background: submitting ? 'rgba(99,102,241,0.6)' : 'linear-gradient(135deg,#6366f1,#a855f7)',
            color: '#fff', border: 'none', borderRadius: 14, padding: 14,
            fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 20px rgba(99,102,241,0.38)',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {submitting
            ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Envoi en cours…</>
            : <><Send style={{ width: 14, height: 14 }} /> Envoyer le brief</>
          }
        </button>
      </form>

      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {Footer}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Ajouter le keyframe `spin` dans le CSS global** (si pas déjà présent)

Vérifier `src/index.css` — si `@keyframes spin` n'existe pas, l'ajouter :

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build
```

Résultat attendu : aucune erreur TypeScript ni Vite.

- [ ] **Step 4 : Tester dans le navigateur**

```bash
npm run dev
```

Naviguer vers `/brief/<un-token-valide>` et vérifier :
- Fond dégradé violet/bleu visible
- Header glassmorphism avec logo + nom projet
- 6 segments de progression mis à jour en temps réel
- Cards glassmorphism avec badge violet → ✓ vert quand rempli
- Bordure violette au focus de la card
- Textarea qui s'agrandit automatiquement
- Animation en cascade à l'apparition
- Bouton envoi fonctionnel → écran récapitulatif

- [ ] **Step 5 : Commit**

```bash
git add src/modules/ClientBrief/ClientBriefPage.tsx src/index.css
git commit -m "feat(brief-ui): refonte glassmorphism ClientBriefPage v2"
```

---

## Task 8 — Commit final & vérification globale

- [ ] **Step 1 : Build final**

```bash
npm run build
```

Résultat attendu : 0 erreur, bundle généré.

- [ ] **Step 2 : Test email**

Soumettre un brief de test via `/brief/<token>` et vérifier la réception de l'email sur `lyestriki@gmail.com`.

- [ ] **Step 3 : Test modale DashboardV2**

Aller sur DashboardV2, cliquer sur "Notifications brief" → modale ouverte → ajouter un email → vérifier en base via Supabase.

- [ ] **Step 4 : Commit de clôture**

```bash
git add -A
git commit -m "feat(brief-v2): formulaire glassmorphism + notifications email Resend"
```
