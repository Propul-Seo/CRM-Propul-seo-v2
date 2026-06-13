# Brief Invitation — Création de projet via brief client

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'admin de générer un lien unique à envoyer à un client, qui en le remplissant crée automatiquement un projet dans le CRM.

**Architecture:** Nouvelle table `brief_invitations` (token UUID, company_name, status pending/submitted). Côté client : page publique `/brief-invite/:token` (même glassmorphism que `/brief/:token`, + champ "Nom de l'entreprise"). La soumission passe par une Edge Function `create-project-from-brief` (service role) qui crée le projet + le brief + envoie l'email. Côté admin : modale `BriefInviteModal` + bouton dans `ProjectsManagerV2`.

**Tech Stack:** React 18 + TypeScript + Vite, Supabase (DB + Edge Functions Deno), Framer Motion, Tailwind CSS, shadcn/ui Dialog

---

## Fichiers

| Fichier | Action |
|---------|--------|
| `supabase/migrations/20260411_brief_invitations.sql` | Créer |
| `supabase/functions/create-project-from-brief/index.ts` | Créer |
| `src/modules/ProjectsManagerV2/hooks/useBriefInvitation.ts` | Créer |
| `src/modules/ClientBrief/ClientBriefInvitePage.tsx` | Créer |
| `src/modules/ProjectsManagerV2/components/BriefInviteModal.tsx` | Créer |
| `src/App.tsx` | Modifier — ajouter route `/brief-invite/:token` |
| `src/modules/ProjectsManagerV2/index.tsx` | Modifier — bouton + modale |

---

## Task 1 : Migration SQL — table `brief_invitations`

**Files:**
- Create: `supabase/migrations/20260411_brief_invitations.sql`

- [ ] **Step 1 : Créer le fichier de migration**

```sql
-- supabase/migrations/20260411_brief_invitations.sql

create table brief_invitations (
  id            uuid primary key default gen_random_uuid(),
  token         uuid not null unique default gen_random_uuid(),
  company_name  text,
  status        text not null default 'pending'
                  check (status = any(array['pending'::text, 'submitted'::text])),
  created_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  project_id    uuid references projects_v2(id) on delete set null
);

alter table brief_invitations enable row level security;

-- Anon peut lire les invitations en attente (pour valider le token côté client)
create policy "anon_read_pending" on brief_invitations
  for select
  to anon
  using (status = 'pending');

-- Utilisateurs authentifiés peuvent tout faire (admins CRM)
create policy "auth_all" on brief_invitations
  for all
  to authenticated
  using (true)
  with check (true);
```

- [ ] **Step 2 : Appliquer la migration via MCP Supabase**

Utiliser l'outil MCP `apply_migration` avec project_id `wftozvnvstxzvfplveyz`, name `brief_invitations`, et le SQL ci-dessus.

- [ ] **Step 3 : Commit**

```bash
git add supabase/migrations/20260411_brief_invitations.sql
git commit -m "feat(brief-invite): table brief_invitations + RLS"
```

---

## Task 2 : Edge Function `create-project-from-brief`

**Files:**
- Create: `supabase/functions/create-project-from-brief/index.ts`

Cette Edge Function reçoit `{ token, companyName, fields }`, valide le token, crée le projet + le brief, met à jour l'invitation, et envoie l'email. Elle utilise le service role pour bypasser RLS.

- [ ] **Step 1 : Créer la fonction**

```typescript
// supabase/functions/create-project-from-brief/index.ts
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

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]!)
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, companyName, fields } = await req.json() as {
      token: string;
      companyName: string;
      fields: Record<string, string | null>;
    };

    if (!token || !companyName?.trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: "token et companyName requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Valider le token
    const { data: invitation, error: invErr } = await supabase
      .from("brief_invitations")
      .select("id, status, company_name")
      .eq("token", token)
      .single();

    if (invErr || !invitation) {
      return new Response(
        JSON.stringify({ ok: false, error: "Lien invalide" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invitation.status === "submitted") {
      return new Response(
        JSON.stringify({ ok: false, error: "already_submitted" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Créer le projet
    const { data: project, error: projErr } = await supabase
      .from("projects_v2")
      .insert({
        name: companyName.trim(),
        status: "brief_received",
        priority: "medium",
        presta_type: [],
        client_name: "",
        is_archived: false,
        progress: 0,
        completion_score: 0,
      })
      .select("id")
      .single();

    if (projErr || !project) {
      throw new Error(`Erreur création projet: ${projErr?.message}`);
    }

    // 3. Créer le brief
    const { error: briefErr } = await supabase
      .from("project_briefs_v2")
      .insert({
        project_id: project.id,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        objective: fields.objective ?? null,
        target_audience: fields.target_audience ?? null,
        pages: fields.pages ?? null,
        techno: fields.techno ?? null,
        design_references: fields.design_references ?? null,
        notes: fields.notes ?? null,
      });

    if (briefErr) {
      throw new Error(`Erreur création brief: ${briefErr.message}`);
    }

    // 4. Marquer l'invitation comme soumise
    await supabase
      .from("brief_invitations")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        project_id: project.id,
      })
      .eq("id", invitation.id);

    // 5. Email de notification (best-effort)
    if (resendKey) {
      const { data: extraEmails } = await supabase
        .from("notification_emails")
        .select("email")
        .eq("active", true);

      const to = [
        "lyestriki@gmail.com",
        ...(extraEmails ?? [])
          .map((r: { email: string }) => r.email.trim())
          .filter(isValidEmail),
      ];

      const fieldsHtml = Object.entries(fields)
        .filter(([, val]) => val && val.trim().length > 0)
        .map(([key, val]) => `
          <div style="margin-bottom:16px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">
              ${FIELD_LABELS[key] ?? key}
            </p>
            <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;white-space:pre-wrap;">${escapeHtml(val ?? "")}</p>
          </div>
        `).join("");

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:24px 28px;">
            <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Nouveau projet via brief client</p>
            <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:800;">${escapeHtml(companyName.trim())}</h1>
          </div>
          <div style="padding:24px 28px;background:#fff;">${fieldsHtml}</div>
          <div style="padding:16px 28px;background:#f8fafc;text-align:center;font-size:11px;color:#94a3b8;">
            Propul'SEO · Notification automatique
          </div>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Propul'SEO <onboarding@resend.dev>",
          to,
          subject: `[Nouveau projet] ${companyName.trim()} — brief reçu`,
          html,
        }),
      }).catch(() => {/* silencieux */});
    }

    console.log(`[create-project-from-brief] projet créé: ${project.id} pour "${companyName}"`);

    return new Response(JSON.stringify({ ok: true, projectId: project.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[create-project-from-brief] error:", (err as Error).message);
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2 : Déployer via MCP Supabase**

Utiliser l'outil MCP `deploy_edge_function` avec :
- `name`: `create-project-from-brief`
- `verify_jwt`: `false` (page publique)
- `entrypoint_path`: `index.ts`
- `files`: le contenu du fichier ci-dessus

- [ ] **Step 3 : Commit**

```bash
git add supabase/functions/create-project-from-brief/index.ts
git commit -m "feat(brief-invite): edge function create-project-from-brief"
```

---

## Task 3 : Hook `useBriefInvitation`

**Files:**
- Create: `src/modules/ProjectsManagerV2/hooks/useBriefInvitation.ts`

- [ ] **Step 1 : Créer le hook**

```typescript
// src/modules/ProjectsManagerV2/hooks/useBriefInvitation.ts
import { useState, useEffect, useCallback } from 'react'
import { supabaseAnon } from '@/lib/supabase'

interface InvitationData {
  id: string
  token: string
  company_name: string | null
  status: 'pending' | 'submitted'
}

interface UseBriefInvitationReturn {
  data: InvitationData | null
  loading: boolean
  error: string | null
  submitInvitation: (companyName: string, fields: Record<string, string>) => Promise<boolean>
  alreadySubmitted: boolean
}

export function useBriefInvitation(token: string): UseBriefInvitationReturn {
  const [data, setData] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    if (!token) return
    setError(null)
    setData(null)
    setAlreadySubmitted(false)
    setLoading(true)

    supabaseAnon
      .from('brief_invitations')
      .select('id, token, company_name, status')
      .eq('token', token)
      .single()
      .then(({ data: inv, error: err }) => {
        if (err || !inv) {
          setError('Lien invalide ou expiré.')
        } else if (inv.status === 'submitted') {
          setAlreadySubmitted(true)
        } else {
          setData(inv as InvitationData)
        }
        setLoading(false)
      })
  }, [token])

  const submitInvitation = useCallback(async (
    companyName: string,
    fields: Record<string, string>
  ): Promise<boolean> => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-project-from-brief`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ token, companyName, fields }),
        }
      )
      const json = await res.json()
      return json.ok === true
    } catch {
      return false
    }
  }, [token])

  return { data, loading, error, submitInvitation, alreadySubmitted }
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built in`

- [ ] **Step 3 : Commit**

```bash
git add src/modules/ProjectsManagerV2/hooks/useBriefInvitation.ts
git commit -m "feat(brief-invite): hook useBriefInvitation"
```

---

## Task 4 : Page publique `ClientBriefInvitePage`

**Files:**
- Create: `src/modules/ClientBrief/ClientBriefInvitePage.tsx`

Même style glassmorphism que `ClientBriefPage.tsx`, avec un champ "Nom de votre entreprise / projet" en tête (obligatoire), et les 6 champs habituels.

- [ ] **Step 1 : Créer la page**

```typescript
// src/modules/ClientBrief/ClientBriefInvitePage.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Send, Loader2, Building2 } from 'lucide-react'
import { useBriefInvitation } from '@/modules/ProjectsManagerV2/hooks/useBriefInvitation'

const LOGO_URL = 'https://lh3.googleusercontent.com/pw/AP1GczN1Fx4MCRF05ZyLZ8eE7yq6l3O04S9H5NUlRQng3NGehC4bVTl4SA0EdX8yJ4cEgMGjbPkELigm1WxcMBR8QCh4QSMgDVikjqv8mizSPn2r-zv-pKbMK10JVMTK4Fo1kd4VUXASX_owtWiT6X6cRao=w590-h423-s-no-gm?authuser=0'

interface FieldDef {
  key: string
  label: string
  placeholder: string
  required?: boolean
  rows: number
}

const FIELDS: FieldDef[] = [
  { key: 'objective',         label: 'Objectif du projet',                placeholder: "Quel est l'objectif principal du projet ?",        required: true, rows: 4 },
  { key: 'target_audience',   label: 'Cible / utilisateurs',              placeholder: 'Qui sont les utilisateurs cibles ?',                rows: 3 },
  { key: 'pages',             label: 'Pages / Fonctionnalités attendues', placeholder: 'Listez les pages ou fonctionnalités souhaitées…',   rows: 4 },
  { key: 'techno',            label: 'Technologie / stack',               placeholder: 'Stack technique ou préférences technologiques…',    rows: 2 },
  { key: 'design_references', label: 'Références design',                 placeholder: 'URLs, inspirations visuelles, exemples de sites…', rows: 3 },
  { key: 'notes',             label: 'Notes complémentaires',             placeholder: "Toute information utile pour l'équipe…",           rows: 3 },
]

const RECAP_LABELS: Record<string, string> = {
  objective: 'Objectif du projet',
  target_audience: 'Cible / utilisateurs',
  pages: 'Pages / Fonctionnalités attendues',
  techno: 'Technologie / stack',
  design_references: 'Références design',
  notes: 'Notes complémentaires',
}

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
      <AnimatePresence mode="wait">
        {filled ? (
          <motion.div key="check"
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ width: 24, height: 24, borderRadius: 8, background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, boxShadow: '0 2px 8px rgba(34,197,94,0.3)' }}
          >✓</motion.div>
        ) : (
          <motion.div key="num"
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ width: 24, height: 24, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}
          >{index + 1}</motion.div>
        )}
      </AnimatePresence>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4c1d95', marginBottom: 5 }}>
          {field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={field.placeholder}
          rows={field.rows}
          style={{ fontSize: 11, color: '#374151', width: '100%', resize: 'none', outline: 'none', background: 'transparent', border: 'none', lineHeight: 1.7 }}
        />
      </div>
    </motion.div>
  )
}

const PAGE_BG: React.CSSProperties = {
  background: 'linear-gradient(160deg,#ede9fe 0%,#f0f9ff 50%,#fdf4ff 100%)',
  minHeight: '100vh',
  backgroundAttachment: 'fixed',
}

const HEADER_STYLE: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 10,
  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  background: 'rgba(255,255,255,0.75)',
  borderBottom: '1px solid rgba(255,255,255,0.9)',
  height: 60, display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', padding: '0 20px',
}

interface ClientBriefInvitePageProps {
  token: string
}

export function ClientBriefInvitePage({ token }: ClientBriefInvitePageProps) {
  const { data, loading, error, submitInvitation, alreadySubmitted } = useBriefInvitation(token)
  const [companyName, setCompanyName] = useState('')
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map(f => [f.key, '']))
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (data?.company_name) setCompanyName(data.company_name)
  }, [data])

  const filledCount = FIELDS.filter(f => values[f.key]?.trim()).length
  const companyFilled = companyName.trim().length > 0

  const handleSubmit = useCallback(async () => {
    if (!companyFilled) return
    setSubmitting(true)
    const ok = await submitInvitation(companyName.trim(), values)
    setSubmitting(false)
    if (ok) setSubmitted(true)
  }, [companyName, companyFilled, values, submitInvitation])

  const Header = () => (
    <div style={HEADER_STYLE}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src={LOGO_URL} alt="Propul'SEO" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8 }} />
        <span style={{ fontSize: 13, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Propul'SEO</span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e1b4b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {companyName || 'Nouveau projet'}
      </span>
    </div>
  )

  const Footer = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 20px 18px', fontSize: 10, color: '#94a3b8' }}>
      <img src={LOGO_URL} alt="" style={{ width: 14, height: 14, objectFit: 'contain', borderRadius: 3, opacity: 0.6 }} />
      <span style={{ fontWeight: 700, color: '#6366f1' }}>Propul'SEO</span>
      <span>·</span>
      <span>🔒 Lien unique sécurisé</span>
    </div>
  )

  if (loading) {
    return (
      <div style={{ ...PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 32, height: 32, color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={PAGE_BG}>
        <Header />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', gap: 12, padding: 24 }}>
          <AlertCircle style={{ width: 40, height: 40, color: '#ef4444' }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Lien invalide ou expiré</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (alreadySubmitted || submitted) {
    return (
      <div style={PAGE_BG}>
        <Header />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(34,197,94,0.25)', fontSize: 24 }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b4b', margin: '0 0 6px' }}>
              {alreadySubmitted ? 'Brief déjà transmis !' : 'Brief transmis !'}
            </h2>
            <p style={{ fontSize: 12, color: '#64748b' }}>Votre projet a été créé. Notre équipe vous contactera bientôt.</p>
          </div>
          {submitted && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Vos réponses</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1.5px solid rgba(167,243,208,0.8)', borderRadius: 14, padding: '12px 16px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Entreprise / Projet</div>
                  <div style={{ fontSize: 11, color: '#374151' }}>{companyName}</div>
                </div>
                {FIELDS.map(f => values[f.key]?.trim() ? (
                  <div key={f.key} style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1.5px solid rgba(167,243,208,0.8)', borderRadius: 14, padding: '12px 16px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{RECAP_LABELS[f.key]}</div>
                    <div style={{ fontSize: 11, color: '#374151', whiteSpace: 'pre-wrap' }}>{values[f.key]}</div>
                  </div>
                ) : null)}
              </div>
            </>
          )}
        </motion.div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={PAGE_BG}>
      <Header />

      {/* Barre de progression */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {FIELDS.map((f, i) => (
            <div key={f.key} style={{
              height: 4, flex: 1, borderRadius: 4,
              background: i < filledCount
                ? 'linear-gradient(to right,#6366f1,#a855f7)'
                : i === filledCount
                ? 'linear-gradient(to right,#6366f1,#a855f7)'
                : 'rgba(99,102,241,0.12)',
              opacity: i === filledCount ? 0.35 : 1,
            }} />
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, marginTop: 6 }}>
          {filledCount} / {FIELDS.length} champs remplis
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '20px 20px 16px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e1b4b', marginBottom: 5 }}>Parlez-nous de votre projet</h2>
        <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>Remplissez ce formulaire pour nous aider à bien comprendre votre besoin. Seul le nom de l'entreprise et l'objectif sont obligatoires.</p>
      </div>

      {/* Champ entreprise */}
      <div style={{ padding: '0 16px 10px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: `1.5px solid ${companyFilled ? 'rgba(167,243,208,0.8)' : '#a5b4fc'}`,
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: companyFilled ? '0 2px 12px rgba(34,197,94,0.08)' : '0 6px 24px rgba(99,102,241,0.15)',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ width: 24, height: 24, borderRadius: 8, background: companyFilled ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
            <Building2 style={{ width: 12, height: 12, color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4c1d95', marginBottom: 5 }}>
              Nom de l'entreprise / projet <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Ex: Boulangerie Martin, SaaS RH, Refonte Site…"
              style={{ fontSize: 11, color: '#374151', width: '100%', outline: 'none', background: 'transparent', border: 'none', lineHeight: 1.7 }}
            />
          </div>
        </motion.div>
      </div>

      {/* Champs brief */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FIELDS.map((field, i) => (
          <FieldCard
            key={field.key}
            field={field}
            index={i}
            value={values[field.key]}
            onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
          />
        ))}
      </div>

      {/* Bouton envoyer */}
      <div style={{ padding: '14px 16px' }}>
        <button
          onClick={handleSubmit}
          disabled={submitting || !companyFilled}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg,#6366f1,#a855f7)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: 14,
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: submitting || !companyFilled ? 'not-allowed' : 'pointer',
            opacity: submitting || !companyFilled ? 0.5 : 1,
            boxShadow: '0 6px 20px rgba(99,102,241,0.38)',
            letterSpacing: 0.2,
          }}
        >
          {submitting ? (
            <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send style={{ width: 14, height: 14 }} />
          )}
          {submitting ? 'Envoi en cours…' : 'Envoyer le brief'}
        </button>
      </div>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built in`

- [ ] **Step 3 : Commit**

```bash
git add src/modules/ClientBrief/ClientBriefInvitePage.tsx
git commit -m "feat(brief-invite): page publique ClientBriefInvitePage"
```

---

## Task 5 : Route `/brief-invite/:token` dans App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1 : Ajouter le lazy import et la détection de route**

Dans `src/App.tsx`, après les imports existants :

```typescript
const ClientBriefInvitePage = lazy(() =>
  import('./modules/ClientBrief/ClientBriefInvitePage').then(m => ({ default: m.ClientBriefInvitePage }))
)
```

Et après `const briefMatch = ...` :

```typescript
const briefInviteMatch = pathname.match(/^\/brief-invite\/([a-f0-9-]{36})$/i);
```

- [ ] **Step 2 : Ajouter le bloc de rendu**

Dans la fonction `App`, après le bloc `if (briefMatch) { ... }` :

```typescript
if (briefInviteMatch) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400">Chargement...</div>}>
        <ClientBriefInvitePage token={briefInviteMatch[1]} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built in`

- [ ] **Step 4 : Commit**

```bash
git add src/App.tsx
git commit -m "feat(brief-invite): route /brief-invite/:token dans App.tsx"
```

---

## Task 6 : Modale admin + bouton dans ProjectsManagerV2

**Files:**
- Create: `src/modules/ProjectsManagerV2/components/BriefInviteModal.tsx`
- Modify: `src/modules/ProjectsManagerV2/index.tsx`

### 6a — Modale `BriefInviteModal`

- [ ] **Step 1 : Créer la modale**

```typescript
// src/modules/ProjectsManagerV2/components/BriefInviteModal.tsx
import { useState } from 'react'
import { Copy, Check, Link, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BriefInviteModalProps {
  onClose: () => void
}

export function BriefInviteModal({ onClose }: BriefInviteModalProps) {
  const [companyName, setCompanyName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    const { data, error } = await supabase
      .from('brief_invitations')
      .insert({ company_name: companyName.trim() || null })
      .select('token')
      .single()

    setGenerating(false)
    if (!error && data) {
      const base = window.location.origin
      setLink(`${base}/brief-invite/${data.token}`)
    }
  }

  const handleCopy = () => {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass-surface-static rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Créer via brief client</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!link ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Nom de l'entreprise <span className="text-xs text-muted-foreground/60">(optionnel — pré-rempli pour le client)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Ex: Boulangerie Martin…"
                className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground text-sm"
                onKeyDown={e => e.key === 'Enter' && !generating && handleGenerate()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Un lien unique sera généré. Le client le remplira et un projet sera créé automatiquement dans votre CRM.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
              {generating ? 'Génération…' : 'Générer le lien'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs font-medium text-green-600 mb-2">Lien généré ✓</p>
              <p className="text-xs text-foreground break-all font-mono">{link}</p>
            </div>
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 text-sm font-medium transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>
            <button
              onClick={() => { setLink(null); setCompanyName('') }}
              className="w-full px-4 py-2 border border-border rounded-lg text-muted-foreground text-sm hover:bg-surface-2 transition-colors"
            >
              Générer un autre lien
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 6b — Bouton dans `ProjectsManagerV2/index.tsx`

- [ ] **Step 2 : Modifier `ProjectsManagerV2/index.tsx`**

Ajouter l'import :
```typescript
import { BriefInviteModal } from './components/BriefInviteModal'
```

Ajouter le state (après les autres useState) :
```typescript
const [showBriefInvite, setShowBriefInvite] = useState(false)
```

Ajouter le bouton dans la section des boutons en haut à droite (après `<GmailConnectButton />`), avant le bouton "Nouveau Projet" :
```tsx
<button
  onClick={() => setShowBriefInvite(true)}
  className="flex items-center gap-2 border border-primary/40 text-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors text-sm font-medium"
>
  <Link className="h-4 w-4" />
  Via brief client
</button>
```

Ajouter `Link` aux imports Lucide existants.

Ajouter la modale à la fin du JSX (avant la fermeture du `</div>` principal) :
```tsx
{showBriefInvite && <BriefInviteModal onClose={() => setShowBriefInvite(false)} />}
```

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built in`

- [ ] **Step 4 : Commit et push**

```bash
git add src/modules/ProjectsManagerV2/components/BriefInviteModal.tsx
git add src/modules/ProjectsManagerV2/index.tsx
git commit -m "feat(brief-invite): modale BriefInviteModal + bouton Via brief client"
git push origin main
```

---

## Résumé des fichiers créés/modifiés

| Fichier | Rôle |
|---------|------|
| `supabase/migrations/20260411_brief_invitations.sql` | Table + RLS |
| `supabase/functions/create-project-from-brief/index.ts` | Edge Function — crée projet + brief + email |
| `src/modules/ProjectsManagerV2/hooks/useBriefInvitation.ts` | Hook — fetch token + submit |
| `src/modules/ClientBrief/ClientBriefInvitePage.tsx` | Page publique client |
| `src/modules/ProjectsManagerV2/components/BriefInviteModal.tsx` | Modale admin |
| `src/App.tsx` | Route `/brief-invite/:token` |
| `src/modules/ProjectsManagerV2/index.tsx` | Bouton + modale |
