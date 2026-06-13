# Finalisation Phase 2 — 10 emails Brevo + merge main — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Câbler les 10 emails transactionnels Brevo (helper TS partagé + table dedupe + mini-edge admin + extensions de 4 edges existantes + 3 boutons CRM + 2 templates Supabase Auth dashboard) et merger la Phase 2 sur `main` via PR.

**Architecture:** Helper TS partagé `_shared/brevo.ts` importé directement par les edges (pas d'edge intermédiaire). Table `propulspace.transactional_emails_sent` pour déduplication atomique + journal. 5 emails automatiques via extension d'edges existantes, 3 emails manuels via mini-edge `send-portal-email` appelée depuis boutons CRM, 2 emails (#30 et #38) personnalisés directement dans Supabase Auth dashboard.

**Tech Stack:** Deno 1.x (edge functions, std@0.168.0), Supabase Postgres 15, React 18 + TypeScript 5 + Vite, Tailwind, shadcn/ui, Brevo API `v3/smtp/email` (`htmlContent` mode).

**Source spec:** `docs/superpowers/specs/2026-05-27-brevo-emails-finalisation-phase-2-design.md`

---

## File Structure

### Nouveaux fichiers (créés)

| Fichier | Responsabilité |
|---|---|
| `supabase/migrations/20260527100000_propulspace_264_transactional_emails_sent.sql` | Table dedupe + index + RLS |
| `supabase/migrations/20260527110000_propulspace_265_idx_portal_client_email.sql` | R-009 : index perf |
| `supabase/migrations/20260527120000_propulspace_266_handle_new_user_no_silent_catch.sql` | R-014 : retrait silent catch |
| `tests/sql/transactional_emails_sent.sql` | Sanity check migration 264 |
| `supabase/functions/_shared/brevo.ts` | Helper `sendTransactional()` |
| `supabase/functions/_shared/email-templates/index.ts` | Map des 8 templates HTML en strings TS |
| `supabase/functions/send-portal-email/index.ts` | Mini-edge admin-only pour les 3 boutons CRM |
| `src/components/propulspace/InvoiceActions.tsx` | Boutons "Envoyer facture" + "Relancer" |
| `src/components/propulspace/DocumentNotifyButton.tsx` | Bouton "Notifier le client" |

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `supabase/functions/questionnaire-send-emails/index.ts` | Migrer envoi équipe vers helper + ajouter envoi client #31 |
| `supabase/functions/stripe-webhook/index.ts` | Envoyer #35 sur `checkout.session.completed` |
| `supabase/functions/docuseal-webhook/index.ts` | Envoyer #37 sur `form.completed` |
| `supabase/functions/admin-docuseal-create-submission/index.ts` | Envoyer #36 après création |
| `.githooks/pre-commit` | Revert (changement de mode seulement) |

### Fichiers placeholder mais ailleurs (config Lyes, hors code)

- Dashboard Supabase Auth > Email Templates > Magic Link : coller HTML adapté de `30-magic-link.brevo.html`
- Dashboard Supabase Auth > Email Templates > Invite : coller HTML adapté de `38-portal-welcome.brevo.html`

---

## Task 0 : Préliminaires git

**Files:**
- Revert: `.githooks/pre-commit`
- Commit: `.planning/UX_OVERHAUL_PROPOSALS.md`

- [ ] **Step 0.1 : Revert le changement de mode pre-commit**

Run :
```bash
git checkout .githooks/pre-commit
git status --short
```
Expected : `.githooks/pre-commit` disparaît du status.

- [ ] **Step 0.2 : Commit séparé du doc UX (matière Phase 3)**

Run :
```bash
git add .planning/UX_OVERHAUL_PROPOSALS.md docs/superpowers/specs/2026-05-27-brevo-emails-finalisation-phase-2-design.md docs/superpowers/plans/2026-05-27-brevo-emails-finalisation-phase-2.md
git commit -m "docs(planning): spec + plan finalisation Phase 2 (Brevo emails) + UX overhaul proposals (matière Phase 3)"
git status --short
```
Expected : tree clean.

---

## Task 1 : R-009 — Index sur `projects_v2.portal_client_email`

**Files:**
- Create: `supabase/migrations/20260527110000_propulspace_265_idx_portal_client_email.sql`

- [ ] **Step 1.1 : Écrire la migration**

Contenu du fichier :
```sql
-- 265 — R-009 : index sur projects_v2.portal_client_email
-- Sans cet index, propulspace.portal_project_id() fait un full scan à chaque
-- appel RLS d'un client. OK aujourd'hui (51 projets), critique à 10k+.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_v2_portal_client_email
  ON public.projects_v2(portal_client_email)
  WHERE portal_client_email IS NOT NULL;

COMMENT ON INDEX public.idx_projects_v2_portal_client_email IS
  'R-009 : accélère propulspace.portal_project_id() v2 (migration 140).';
```

- [ ] **Step 1.2 : Appliquer en prod via MCP Supabase**

Utiliser `mcp__claude_ai_Supabase__apply_migration` avec project_id `tbuqctfgjjxnevmsvucl`, name `propulspace_265_idx_portal_client_email`, query = contenu du fichier.

⚠️ Note : `CREATE INDEX CONCURRENTLY` ne peut pas s'exécuter dans une transaction. Si `apply_migration` enveloppe en transaction → faire en `execute_sql` ou retirer `CONCURRENTLY` (table petite, lock acceptable).

- [ ] **Step 1.3 : Vérifier l'existence**

Utiliser `mcp__claude_ai_Supabase__execute_sql` :
```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'projects_v2' AND indexname = 'idx_projects_v2_portal_client_email';
```
Expected : 1 ligne.

- [ ] **Step 1.4 : Commit**

```bash
git add supabase/migrations/20260527110000_propulspace_265_idx_portal_client_email.sql
git commit -m "feat(perf): R-009 — index sur projects_v2.portal_client_email"
```

---

## Task 2 : R-014 — Retrait silent catch dans `handle_new_user`

**Files:**
- Create: `supabase/migrations/20260527120000_propulspace_266_handle_new_user_no_silent_catch.sql`

- [ ] **Step 2.1 : Inspecter la fonction actuelle**

Utiliser `mcp__claude_ai_Supabase__execute_sql` :
```sql
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user' AND pronamespace = 'public'::regnamespace;
```
Noter le corps actuel. Identifier le bloc `EXCEPTION WHEN OTHERS THEN NULL`.

- [ ] **Step 2.2 : Écrire la migration**

Contenu (à ajuster selon le corps lu en 2.1 — préserver toute la logique métier, ne changer QUE le catch) :
```sql
-- 266 — R-014 : retirer silent catch dans handle_new_user
-- Le bloc EXCEPTION WHEN OTHERS THEN NULL masquait les INSERT failures dans
-- public.users. On le remplace par RAISE WARNING (non bloquant — la création
-- du compte auth doit réussir même si l'INSERT public.users plante).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, propulspace
AS $$
BEGIN
  -- [COPIER LA LOGIQUE EXISTANTE ICI — INSERT public.users + propulspace patch]

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for auth_user_id=%: % (SQLSTATE %)',
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;  -- ne bloque pas la création auth
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'R-014 : silent catch remplacé par RAISE WARNING — les échecs INSERT users sont maintenant visibles dans les logs Supabase.';
```

- [ ] **Step 2.3 : Appliquer en prod via MCP Supabase**

Via `mcp__claude_ai_Supabase__apply_migration`.

- [ ] **Step 2.4 : Vérifier**

```sql
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user' AND pronamespace = 'public'::regnamespace;
```
Expected : contient `RAISE WARNING`, plus de `EXCEPTION WHEN OTHERS THEN NULL`.

- [ ] **Step 2.5 : Commit**

```bash
git add supabase/migrations/20260527120000_propulspace_266_handle_new_user_no_silent_catch.sql
git commit -m "fix(auth): R-014 — retire silent catch dans handle_new_user (WARNING au lieu de NULL)"
```

---

## Task 3 : Migration 264 — Table `transactional_emails_sent`

**Files:**
- Create: `supabase/migrations/20260527100000_propulspace_264_transactional_emails_sent.sql`
- Create: `tests/sql/transactional_emails_sent.sql`

- [ ] **Step 3.1 : Écrire la migration**

Contenu :
```sql
-- 264 — Table de déduplication + journal des emails transactionnels Brevo
-- Pattern : INSERT 'pending' → POST Brevo → UPDATE 'sent'/'failed'.
-- UNIQUE(template_key, dedupe_key) garantit l'envoi unique atomiquement.
-- Catch 23505 dans le helper TS pour gérer les double-clics / webhook replays.

CREATE TABLE IF NOT EXISTS propulspace.transactional_emails_sent (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key    TEXT NOT NULL,
  dedupe_key      TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('pending','sent','failed')),
  brevo_message_id TEXT,
  error_message   TEXT,
  params_json     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_key, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_tx_emails_recipient
  ON propulspace.transactional_emails_sent(recipient_email);
CREATE INDEX IF NOT EXISTS idx_tx_emails_created
  ON propulspace.transactional_emails_sent(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_emails_status
  ON propulspace.transactional_emails_sent(status) WHERE status != 'sent';

-- Trigger updated_at
CREATE OR REPLACE FUNCTION propulspace.tx_emails_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_tx_emails_updated_at ON propulspace.transactional_emails_sent;
CREATE TRIGGER trg_tx_emails_updated_at
  BEFORE UPDATE ON propulspace.transactional_emails_sent
  FOR EACH ROW EXECUTE FUNCTION propulspace.tx_emails_set_updated_at();

-- RLS
ALTER TABLE propulspace.transactional_emails_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY tx_emails_team_select ON propulspace.transactional_emails_sent
  FOR SELECT TO authenticated USING (public.is_team_member());

COMMENT ON TABLE propulspace.transactional_emails_sent IS
  'Journal + déduplication des emails transactionnels Brevo. UNIQUE(template_key, dedupe_key) garantit envoi unique. Service role bypass RLS pour writes.';
```

- [ ] **Step 3.2 : Écrire le test SQL**

Contenu de `tests/sql/transactional_emails_sent.sql` :
```sql
-- Tests sanity migration 264 — à exécuter via mcp__claude_ai_Supabase__execute_sql
-- ou psql en mode développement.

-- T1 : table existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'propulspace' AND table_name = 'transactional_emails_sent'
) AS t1_table_exists;
-- Attendu : t (true)

-- T2 : 3 indexes + 1 trigger
SELECT count(*) AS t2_indexes FROM pg_indexes
WHERE schemaname = 'propulspace' AND tablename = 'transactional_emails_sent';
-- Attendu : 4 (PK + 3 secondaires)

SELECT count(*) AS t2_triggers FROM pg_trigger
WHERE tgrelid = 'propulspace.transactional_emails_sent'::regclass AND NOT tgisinternal;
-- Attendu : 1 (updated_at)

-- T3 : RLS activée + 1 policy
SELECT relrowsecurity AS t3_rls FROM pg_class
WHERE oid = 'propulspace.transactional_emails_sent'::regclass;
-- Attendu : t

SELECT count(*) AS t3_policies FROM pg_policies
WHERE schemaname = 'propulspace' AND tablename = 'transactional_emails_sent';
-- Attendu : 1

-- T4 : contrainte UNIQUE empêche les doublons
INSERT INTO propulspace.transactional_emails_sent
  (template_key, dedupe_key, recipient_email, status)
VALUES ('test', 'dedupe-1', 'test@example.com', 'pending')
RETURNING id;

DO $$
DECLARE conflict_caught BOOLEAN := false;
BEGIN
  BEGIN
    INSERT INTO propulspace.transactional_emails_sent
      (template_key, dedupe_key, recipient_email, status)
    VALUES ('test', 'dedupe-1', 'autre@example.com', 'pending');
  EXCEPTION WHEN unique_violation THEN
    conflict_caught := true;
  END;
  RAISE NOTICE 't4_unique_constraint_works: %', conflict_caught;
END $$;
-- Attendu dans NOTICE : true

-- Cleanup
DELETE FROM propulspace.transactional_emails_sent WHERE template_key = 'test';
```

- [ ] **Step 3.3 : Appliquer la migration**

Via `mcp__claude_ai_Supabase__apply_migration` (project_id `tbuqctfgjjxnevmsvucl`, name `propulspace_264_transactional_emails_sent`).

- [ ] **Step 3.4 : Exécuter les tests**

Via `mcp__claude_ai_Supabase__execute_sql`, lancer chaque requête du fichier test. Vérifier les attendus.

- [ ] **Step 3.5 : Commit**

```bash
git add supabase/migrations/20260527100000_propulspace_264_transactional_emails_sent.sql tests/sql/transactional_emails_sent.sql
git commit -m "feat(brevo): table transactional_emails_sent (264) + tests sanity"
```

---

## Task 4 : Templates TS (8 emails)

**Files:**
- Create: `supabase/functions/_shared/email-templates/index.ts`

- [ ] **Step 4.1 : Créer le fichier avec les 8 templates**

⚠️ Pour chaque template, ouvrir le fichier `public/handoff-preview-v2/emails/NN-name.brevo.html` correspondant et **copier le contenu intégral** dans un template literal (backticks). Préserver les `{{ params.X }}` tels quels (interpolation côté helper).

Squelette du fichier (à compléter avec le HTML réel de chaque template) :
```typescript
// _shared/email-templates/index.ts
// Source de vérité des templates emails transactionnels Brevo.
// Les .brevo.html dans public/handoff-preview-v2/emails/ servent de preview
// navigateur uniquement — toute modif doit être répliquée ici.

export type TemplateKey =
  | 'qualif-confirmation'   // #31 — au client après submit /diagnostic
  | 'new-lead-alert'        // #32 — à l'équipe après submit /diagnostic
  | 'invoice-sent'          // #33 — facture envoyée au client
  | 'invoice-reminder'      // #34 — relance facture impayée
  | 'payment-received'      // #35 — confirmation paiement reçu
  | 'signature-requested'   // #36 — document à signer
  | 'signature-completed'   // #37 — signature complétée
  | 'new-deliverable';      // #39 — nouveau livrable disponible

export const EMAIL_TEMPLATES: Record<TemplateKey, string> = {
  'qualif-confirmation': `<!DOCTYPE html>... [contenu de 31-qualif-confirmation.brevo.html] ...`,
  'new-lead-alert':      `<!DOCTYPE html>... [contenu de 32-new-lead-alert.brevo.html] ...`,
  'invoice-sent':        `<!DOCTYPE html>... [contenu de 33-invoice-sent.brevo.html] ...`,
  'invoice-reminder':    `<!DOCTYPE html>... [contenu de 34-invoice-reminder.brevo.html] ...`,
  'payment-received':    `<!DOCTYPE html>... [contenu de 35-payment-received.brevo.html] ...`,
  'signature-requested': `<!DOCTYPE html>... [contenu de 36-signature-requested.brevo.html] ...`,
  'signature-completed': `<!DOCTYPE html>... [contenu de 37-signature-completed.brevo.html] ...`,
  'new-deliverable':     `<!DOCTYPE html>... [contenu de 39-new-deliverable.brevo.html] ...`,
};

// Extrait le <title>...</title> du HTML (utilisé comme subject)
export function extractSubject(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return (match?.[1] ?? '').trim();
}
```

⚠️ Échappement backticks : si un template HTML contient un backtick `` ` `` ou `${`, l'échapper en `\`` ou `\${`. Vérifier avec un Ctrl+F dans le fichier HTML avant copy.

- [ ] **Step 4.2 : Ajouter le commentaire de source dans chaque .brevo.html**

Pour chaque fichier `public/handoff-preview-v2/emails/NN-name.brevo.html`, ajouter en ligne 2 (après la `<!DOCTYPE html>`) :
```html
<!-- SOURCE OF TRUTH: supabase/functions/_shared/email-templates/index.ts -->
```

- [ ] **Step 4.3 : Vérifier le typage**

Run :
```bash
npx tsc --noEmit supabase/functions/_shared/email-templates/index.ts
```
Expected : aucune erreur (ou warnings de config edge function uniquement, pas d'erreur de syntaxe).

- [ ] **Step 4.4 : Commit**

```bash
git add supabase/functions/_shared/email-templates/index.ts public/handoff-preview-v2/emails/
git commit -m "feat(brevo): 8 templates emails transactionnels en modules TS (source de vérité)"
```

---

## Task 5 : Helper `_shared/brevo.ts`

**Files:**
- Create: `supabase/functions/_shared/brevo.ts`

- [ ] **Step 5.1 : Créer le helper**

Contenu complet :
```typescript
// _shared/brevo.ts — Helper d'envoi d'emails transactionnels Brevo
//
// Pattern atomique :
//   1. escHtml(params) anti-XSS
//   2. INSERT 'pending' (UNIQUE bloque les doublons, catch 23505 → skip)
//   3. POST api.brevo.com/v3/smtp/email avec htmlContent
//   4. UPDATE 'sent' + brevo_message_id, OR 'failed' + error_message
//
// Fallback gracieux si BREVO_API_KEY absent (return sent:false sans INSERT).

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { EMAIL_TEMPLATES, TemplateKey, extractSubject } from './email-templates/index.ts';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') ?? '';
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'lyes.triki@propulseo-site.com';
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') ?? 'Propul\'SEO';

export interface SendOpts {
  templateKey: TemplateKey;
  to: { email: string; name?: string };
  params: Record<string, string | number | null | undefined>;
  dedupeKey: string;
}

export interface SendResult {
  ok: boolean;
  sent: boolean;
  reason?: string;
  message_id?: string;
  error?: string;
}

// Échappe les caractères HTML pour éviter une injection XSS
// depuis les champs libres (noms clients, titres docs, etc.).
function escHtml(s: string | number | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Interpole {{ params.X }} (avec espaces variables autour de X)
function interpolate(html: string, params: Record<string, string>): string {
  return html.replace(/\{\{\s*params\.([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => params[key] ?? '');
}

// Crée un client Supabase admin (service_role) pour écrire dans la table dedupe.
function getAdminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function sendTransactional(opts: SendOpts): Promise<SendResult> {
  const { templateKey, to, params, dedupeKey } = opts;

  // 1. Fallback BREVO_API_KEY absent
  if (!BREVO_API_KEY) {
    console.log(`[brevo] BREVO_API_KEY non configurée — skip envoi (${templateKey})`);
    return { ok: true, sent: false, reason: 'BREVO_API_KEY not configured' };
  }

  // 2. Échappe les params anti-XSS
  const safeParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    safeParams[k] = escHtml(v);
  }

  // 3. Charge le template + interpole + extrait subject
  const template = EMAIL_TEMPLATES[templateKey];
  if (!template) {
    return { ok: false, sent: false, error: `template ${templateKey} not found` };
  }
  const htmlContent = interpolate(template, safeParams);
  const subject = interpolate(extractSubject(template), safeParams);

  // 4. INSERT 'pending' (atomic dedupe via UNIQUE)
  const admin = getAdminClient();
  const { data: inserted, error: insertErr } = await admin
    .schema('propulspace')
    .from('transactional_emails_sent')
    .insert({
      template_key: templateKey,
      dedupe_key: dedupeKey,
      recipient_email: to.email,
      status: 'pending',
      params_json: params,
    })
    .select('id')
    .single();

  if (insertErr) {
    // 23505 = unique_violation → déjà envoyé
    if (insertErr.code === '23505') {
      console.log(`[brevo] dedupe hit ${templateKey}/${dedupeKey} — skip`);
      return { ok: true, sent: false, reason: 'duplicate' };
    }
    console.error(`[brevo] INSERT failed:`, insertErr);
    return { ok: false, sent: false, error: `db insert: ${insertErr.message}` };
  }
  const rowId = inserted.id;

  // 5. POST Brevo
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
        to: [{ email: to.email, name: to.name }],
        subject,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      await admin.schema('propulspace').from('transactional_emails_sent')
        .update({ status: 'failed', error_message: `Brevo ${res.status}: ${errText}` })
        .eq('id', rowId);
      return { ok: false, sent: false, error: `Brevo ${res.status}: ${errText}` };
    }

    const json = await res.json() as { messageId?: string };
    await admin.schema('propulspace').from('transactional_emails_sent')
      .update({ status: 'sent', brevo_message_id: json.messageId ?? null })
      .eq('id', rowId);

    return { ok: true, sent: true, message_id: json.messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin.schema('propulspace').from('transactional_emails_sent')
      .update({ status: 'failed', error_message: msg })
      .eq('id', rowId);
    return { ok: false, sent: false, error: msg };
  }
}
```

- [ ] **Step 5.2 : Vérifier qu'aucune autre dépendance n'est requise**

Le helper utilise uniquement :
- `@supabase/supabase-js@2` (déjà utilisé partout)
- `EMAIL_TEMPLATES` du Task 4

Aucun nouveau package npm/deno. Pas de fichier package.json à modifier.

- [ ] **Step 5.3 : Commit**

```bash
git add supabase/functions/_shared/brevo.ts
git commit -m "feat(brevo): helper sendTransactional() partagé (INSERT pending → Brevo → UPDATE sent/failed)"
```

---

## Task 6 : Mini-edge `send-portal-email`

**Files:**
- Create: `supabase/functions/send-portal-email/index.ts`

- [ ] **Step 6.1 : Créer la mini-edge**

Contenu complet :
```typescript
// send-portal-email — Façade admin pour envoyer des emails transactionnels
// depuis le front (boutons CRM).
//
// JWT verify : ACTIVÉ (admin only).
//
// Body : { template_key, to: { email, name? }, params, dedupe_key }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendTransactional } from '../_shared/brevo.ts';
import type { TemplateKey } from '../_shared/email-templates/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const ADMIN_TEMPLATES: ReadonlySet<TemplateKey> = new Set([
  'invoice-sent',
  'invoice-reminder',
  'new-deliverable',
]);

interface Body {
  template_key: TemplateKey;
  to: { email: string; name?: string };
  params: Record<string, string | number | null | undefined>;
  dedupe_key: string;
}

async function requireAdmin(req: Request): Promise<{ callerId: string } | Response> {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !anonKey) return jsonResponse({ error: 'Supabase env manquant' }, 500);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Auth requise' }, 401);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return jsonResponse({ error: 'JWT invalide' }, 401);

  // Check is_admin via RPC SQL (cohérent avec admin-docuseal-create-submission)
  const { data: isAdmin, error: adminErr } = await userClient.rpc('is_admin');
  if (adminErr || !isAdmin) return jsonResponse({ error: 'Admin requis' }, 403);

  return { callerId: user.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof Response) return adminCheck;

  let body: Body;
  try {
    body = await req.json() as Body;
  } catch {
    return jsonResponse({ error: 'JSON invalide' }, 400);
  }

  if (!body.template_key || !body.to?.email || !body.dedupe_key) {
    return jsonResponse({ error: 'template_key, to.email, dedupe_key requis' }, 400);
  }

  if (!ADMIN_TEMPLATES.has(body.template_key)) {
    return jsonResponse({ error: `template_key ${body.template_key} non autorisé pour cette edge` }, 403);
  }

  const result = await sendTransactional({
    templateKey: body.template_key,
    to: body.to,
    params: body.params ?? {},
    dedupeKey: body.dedupe_key,
  });

  return jsonResponse(result, result.ok ? 200 : 500);
});
```

- [ ] **Step 6.2 : Déployer l'edge (avec verify_jwt par défaut)**

Via `mcp__claude_ai_Supabase__deploy_edge_function` :
- project_id : `tbuqctfgjjxnevmsvucl`
- name : `send-portal-email`
- entrypoint_path : `supabase/functions/send-portal-email/index.ts`
- Inclure aussi les fichiers `_shared/brevo.ts` et `_shared/email-templates/index.ts` dans les `files` du payload.

- [ ] **Step 6.3 : Test curl (sans admin → 401/403)**

Run :
```bash
curl -i -X POST https://tbuqctfgjjxnevmsvucl.supabase.co/functions/v1/send-portal-email \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"template_key":"invoice-sent","to":{"email":"test@example.com"},"params":{},"dedupe_key":"test-1"}'
```
Expected : 401 (pas de user JWT) ou 403 (user non admin).

- [ ] **Step 6.4 : Commit**

```bash
git add supabase/functions/send-portal-email/
git commit -m "feat(brevo): mini-edge send-portal-email (admin-only, façade boutons CRM)"
```

---

## Task 7 : Extension `questionnaire-send-emails` — #31 + #32

**Files:**
- Modify: `supabase/functions/questionnaire-send-emails/index.ts`

- [ ] **Step 7.1 : Réécrire le fichier**

Remplacer le contenu actuel par :
```typescript
// questionnaire-send-emails — Sprint B.2 / Phase 2
// Envoie 2 emails après soumission du questionnaire /diagnostic :
//   - #31 qualif-confirmation au lead (client)
//   - #32 new-lead-alert à l'équipe interne
//
// Migration 2026-05-27 : passage au helper _shared/brevo.ts (templates versionnés,
// dedupe via propulspace.transactional_emails_sent).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendTransactional } from '../_shared/brevo.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const TEAM_EMAIL = Deno.env.get('TEAM_EMAIL') ?? 'team@propulseo-site.com';
const CRM_BASE_URL = Deno.env.get('CRM_BASE_URL') ?? 'https://crm.propulseo-site.com';

interface Lead {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  business_sector: string | null;
  project_type: string | null;
  budget_range: string | null;
  desired_timeline: string | null;
  main_goal: string | null;
  preferred_contact_method: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const body = (await req.json()) as { lead_id?: string };
    if (!body.lead_id) {
      return new Response(JSON.stringify({ error: 'lead_id required' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: lead, error: fetchErr } = await supa
      .from('qualification_leads_v2')
      .select('id, full_name, email, phone, company_name, business_sector, project_type, budget_range, desired_timeline, main_goal, preferred_contact_method')
      .eq('id', body.lead_id)
      .single();

    if (fetchErr || !lead) {
      return new Response(JSON.stringify({ error: 'lead not found', detail: fetchErr?.message }), {
        status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const l = lead as Lead;
    const firstName = (l.full_name ?? '').split(' ')[0] || 'bonjour';

    // #31 qualif-confirmation → client
    const clientResult = await sendTransactional({
      templateKey: 'qualif-confirmation',
      to: { email: l.email, name: l.full_name ?? undefined },
      params: {
        first_name: firstName,
        preferred_contact_method: l.preferred_contact_method ?? 'email',
      },
      dedupeKey: `${l.id}-lead`,
    });

    // #32 new-lead-alert → équipe (sans quality_score pour l'instant, à brancher si présent en DB)
    const teamResult = await sendTransactional({
      templateKey: 'new-lead-alert',
      to: { email: TEAM_EMAIL, name: 'Équipe Propul\'SEO' },
      params: {
        company_name: l.company_name ?? '(sans nom)',
        first_name: l.full_name ?? '',
        sector: l.business_sector ?? '',
        budget: l.budget_range ?? '',
        timeline: l.desired_timeline ?? '',
        quality_score: '',
        lead_id: l.id,
        admin_url: `${CRM_BASE_URL}/leads-v3`,
      },
      dedupeKey: `${l.id}-team`,
    });

    return new Response(JSON.stringify({
      ok: clientResult.ok && teamResult.ok,
      client: clientResult,
      team: teamResult,
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[questionnaire-send-emails] exception:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 7.2 : Déployer**

Via `mcp__claude_ai_Supabase__deploy_edge_function`, inclure `_shared/brevo.ts` et `_shared/email-templates/index.ts` dans les `files`.

- [ ] **Step 7.3 : Commit**

```bash
git add supabase/functions/questionnaire-send-emails/index.ts
git commit -m "feat(brevo): questionnaire-send-emails envoie #31 (client) + #32 (équipe) via helper"
```

---

## Task 8 : Extension `stripe-webhook` — #35 payment-received

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts`

- [ ] **Step 8.1 : Lire le fichier actuel pour localiser le point d'insertion**

Run :
```bash
grep -n "checkout.session.completed\|markInvoicePaid\|markInstallmentPaid" supabase/functions/stripe-webhook/index.ts
```
Identifier la branche `case 'checkout.session.completed':` et le bloc qui suit le `markInvoicePaid` réussi.

- [ ] **Step 8.2 : Ajouter l'import du helper**

En haut du fichier, après les imports existants :
```typescript
import { sendTransactional } from '../_shared/brevo.ts'
```

- [ ] **Step 8.3 : Après `markInvoicePaid` ou `markInstallmentPaid` réussi, envoyer #35**

Localiser le point dans le handler `checkout.session.completed` où on a confirmé le paiement (après `markInvoicePaid` OK). Y ajouter (avant la réponse 200) :
```typescript
// Récupère les infos pour l'email
const { data: invoice } = await supabaseAdmin
  .schema('propulspace')
  .from('invoices')
  .select('id, invoice_number, total_amount_cents, paid_at, project_id, projects:project_id(portal_client_email, client_first_name)')
  .eq('id', invoiceId)
  .single() as any

if (invoice && invoice.projects?.portal_client_email) {
  await sendTransactional({
    templateKey: 'payment-received',
    to: { email: invoice.projects.portal_client_email, name: invoice.projects.client_first_name ?? undefined },
    params: {
      first_name: invoice.projects.client_first_name ?? '',
      invoice_number: invoice.invoice_number ?? '',
      amount: (invoice.total_amount_cents / 100).toFixed(2),
      paid_at: new Date(invoice.paid_at ?? Date.now()).toLocaleDateString('fr-FR'),
      receipt_url: `${Deno.env.get('PORTAL_BASE_URL') ?? 'https://espace.propulseo-site.com'}/factures/${invoice.id}`,
    },
    dedupeKey: event.id,  // stripe_event_id garantit unicité même en cas de retry
  })
}
```

⚠️ Adapter le select selon le schéma réel (`total_amount_cents` ou `amount_cents`, `portal_client_email` confirmé dans projects_v2). En cas de doute, lancer `mcp__claude_ai_Supabase__execute_sql` pour vérifier les colonnes de `propulspace.invoices`.

- [ ] **Step 8.4 : Déployer**

Via `mcp__claude_ai_Supabase__deploy_edge_function` (include `_shared/`).

- [ ] **Step 8.5 : Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "feat(brevo): stripe-webhook envoie #35 payment-received sur paiement réussi"
```

---

## Task 9 : Extension `docuseal-webhook` — #37 signature-completed

**Files:**
- Modify: `supabase/functions/docuseal-webhook/index.ts`

- [ ] **Step 9.1 : Ajouter l'import**

```typescript
import { sendTransactional } from '../_shared/brevo.ts'
```

- [ ] **Step 9.2 : Dans `handleEvent`, après `form.completed` traité**

Localiser le bloc qui met `status = 'signed'` sur la signature. Juste après, ajouter :
```typescript
// #37 signature-completed
const { data: sigFull } = await admin
  .schema('propulspace')
  .from('signatures')
  .select('id, name, signature_type, signed_at, project_id, projects:project_id(portal_client_email, client_first_name)')
  .eq('id', sig.id)
  .single() as any

if (sigFull?.projects?.portal_client_email) {
  await sendTransactional({
    templateKey: 'signature-completed',
    to: { email: sigFull.projects.portal_client_email, name: sigFull.projects.client_first_name ?? undefined },
    params: {
      first_name: sigFull.projects.client_first_name ?? '',
      doc_title: sigFull.name ?? '',
      signed_at: new Date(sigFull.signed_at ?? Date.now()).toLocaleDateString('fr-FR'),
      portal_url: `${Deno.env.get('PORTAL_BASE_URL') ?? 'https://espace.propulseo-site.com'}`,
    },
    dedupeKey: `${submissionId}-completed`,
  })
}
```

- [ ] **Step 9.3 : Déployer + commit**

```bash
git add supabase/functions/docuseal-webhook/index.ts
git commit -m "feat(brevo): docuseal-webhook envoie #37 signature-completed sur form.completed"
```

---

## Task 10 : Extension `admin-docuseal-create-submission` — #36 signature-requested

**Files:**
- Modify: `supabase/functions/admin-docuseal-create-submission/index.ts`

- [ ] **Step 10.1 : Ajouter l'import**

```typescript
import { sendTransactional } from '../_shared/brevo.ts'
```

- [ ] **Step 10.2 : Après création réussie de la submission**

Localiser le bloc qui INSERT la ligne dans `propulspace.signatures` (post-création DocuSeal). Juste après cet INSERT réussi :
```typescript
// #36 signature-requested — envoyé uniquement si send_email !== false
// (par défaut DocuSeal envoie son propre mail ; ici on remplace par notre template)
if (body.send_email !== false) {
  await sendTransactional({
    templateKey: 'signature-requested',
    to: { email: body.signer_email, name: body.signer_name },
    params: {
      first_name: (body.signer_name ?? '').split(' ')[0] || '',
      doc_title: body.name,
      doc_type: body.signature_type,
      expires_at: '',  // DocuSeal gère l'expiration, à enrichir si besoin
      sign_url: signingUrl,  // variable retournée par l'appel DocuSeal — adapter au nom local
    },
    dedupeKey: `${docusealSubmissionId}-requested`,
  })
}
```

⚠️ Vérifier le nom de la variable locale qui contient l'URL de signature (probablement `signingUrl` ou `signing_url`, à confirmer dans le code) et le `docusealSubmissionId`.

- [ ] **Step 10.3 : Note importante sur le double envoi DocuSeal**

DocuSeal envoie son propre email automatiquement quand `send_email: true` côté API. Pour éviter le double envoi :
- **Option A (recommandée)** : passer `send_email: false` à l'API DocuSeal et envoyer UNIQUEMENT notre template Brevo.
- **Option B** : laisser DocuSeal envoyer et SAUTER notre #36 (commenter le bloc ci-dessus).

Décision plan : **Option A**. Modifier l'appel DocuSeal pour forcer `send_email: false` dans le payload envoyé à `api.docuseal.com`.

- [ ] **Step 10.4 : Déployer + commit**

```bash
git add supabase/functions/admin-docuseal-create-submission/index.ts
git commit -m "feat(brevo): admin-docuseal-create-submission envoie #36 (option A — DocuSeal email désactivé)"
```

---

## Task 11 : Bouton CRM "Envoyer la facture" — #33

**Files:**
- Create: `src/components/propulspace/InvoiceActions.tsx`
- Modify: composant qui affiche la fiche facture (à identifier — probablement dans `src/modules/Accounting/` ou similaire)

- [ ] **Step 11.1 : Identifier l'emplacement de la fiche facture admin**

Run :
```bash
grep -rn "propulspace.invoices\|propulspace/invoices" src/modules/ src/pages/ | head -10
grep -rn "InvoiceDetail\|InvoiceCard\|fiche.*facture" src/ | head -10
```
Noter le fichier qui affiche les détails d'une facture côté admin.

- [ ] **Step 11.2 : Créer `InvoiceActions.tsx`**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, RotateCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface InvoiceActionsProps {
  invoice: {
    id: string;
    invoice_number: string;
    total_amount_cents: number;
    due_date: string | null;
    project: {
      portal_client_email: string | null;
      client_first_name: string | null;
    };
    payment_url?: string | null;
  };
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState<'sent' | 'reminder' | null>(null);

  const sendEmail = async (kind: 'invoice-sent' | 'invoice-reminder') => {
    if (!invoice.project.portal_client_email) {
      toast({ title: 'Email client manquant sur le projet', variant: 'destructive' });
      return;
    }
    setSending(kind === 'invoice-sent' ? 'sent' : 'reminder');

    const todayIso = new Date().toISOString().slice(0, 10);
    const dedupeKey = kind === 'invoice-sent'
      ? `${invoice.id}-sent`
      : `${invoice.id}-reminder-${todayIso}`;

    const params: Record<string, string> = {
      first_name: invoice.project.client_first_name ?? '',
      invoice_number: invoice.invoice_number,
      amount: (invoice.total_amount_cents / 100).toFixed(2),
      payment_url: invoice.payment_url ?? '',
    };

    if (kind === 'invoice-sent') {
      params.due_date = invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString('fr-FR')
        : '';
    } else {
      const due = invoice.due_date ? new Date(invoice.due_date).getTime() : Date.now();
      const daysOverdue = Math.max(0, Math.floor((Date.now() - due) / (1000 * 60 * 60 * 24)));
      params.days_overdue = String(daysOverdue);
      params.contact_url = `mailto:contact@propulseo-site.com?subject=Question%20facture%20${invoice.invoice_number}`;
    }

    const { data, error } = await supabase.functions.invoke('send-portal-email', {
      body: {
        template_key: kind,
        to: { email: invoice.project.portal_client_email, name: invoice.project.client_first_name },
        params,
        dedupe_key: dedupeKey,
      },
    });

    setSending(null);
    if (error || !data?.ok) {
      toast({ title: 'Envoi échoué', description: error?.message ?? data?.error, variant: 'destructive' });
    } else if (!data.sent) {
      toast({ title: 'Email déjà envoyé', description: data.reason ?? 'doublon détecté' });
    } else {
      toast({ title: 'Email envoyé', description: `À ${invoice.project.portal_client_email}` });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        size="sm"
        disabled={sending !== null}
        onClick={() => sendEmail('invoice-sent')}
      >
        <Mail className="mr-2 h-4 w-4" />
        {sending === 'sent' ? 'Envoi…' : 'Envoyer la facture'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={sending !== null}
        onClick={() => sendEmail('invoice-reminder')}
      >
        <RotateCw className="mr-2 h-4 w-4" />
        {sending === 'reminder' ? 'Envoi…' : 'Relancer'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 11.3 : Importer dans la fiche facture admin**

Dans le composant identifié en 11.1, importer et placer `<InvoiceActions invoice={invoice} />` dans la zone d'actions. Adapter le mapping `invoice` au shape attendu (transformer si besoin).

- [ ] **Step 11.4 : Type-check + lint**

```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 11.5 : Commit**

```bash
git add src/components/propulspace/InvoiceActions.tsx
# + le composant fiche facture modifié
git commit -m "feat(brevo): boutons CRM Envoyer/Relancer facture (#33 + #34) via send-portal-email"
```

---

## Task 12 : Bouton CRM "Notifier le client" — #39

**Files:**
- Create: `src/components/propulspace/DocumentNotifyButton.tsx`
- Modify: composant qui affiche les documents portail côté admin

- [ ] **Step 12.1 : Identifier l'emplacement**

Run :
```bash
grep -rn "propulspace.documents\|propulspace_documents" src/ | head -10
```
Identifier la fiche document ou la liste.

- [ ] **Step 12.2 : Créer `DocumentNotifyButton.tsx`**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface Props {
  document: {
    id: string;
    title: string;
    document_type: string;
    project: {
      name: string;
      portal_client_email: string | null;
      client_first_name: string | null;
    };
    public_url?: string | null;
  };
}

export function DocumentNotifyButton({ document }: Props) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!document.project.portal_client_email) {
      toast({ title: 'Email client manquant', variant: 'destructive' });
      return;
    }
    setSending(true);

    const { data, error } = await supabase.functions.invoke('send-portal-email', {
      body: {
        template_key: 'new-deliverable',
        to: {
          email: document.project.portal_client_email,
          name: document.project.client_first_name,
        },
        params: {
          first_name: document.project.client_first_name ?? '',
          doc_title: document.title,
          doc_type: document.document_type,
          project_name: document.project.name,
          download_url: document.public_url ?? '',
        },
        dedupe_key: document.id,
      },
    });

    setSending(false);
    if (error || !data?.ok) {
      toast({ title: 'Envoi échoué', description: error?.message ?? data?.error, variant: 'destructive' });
    } else if (!data.sent) {
      toast({ title: 'Déjà notifié', description: 'Le client a déjà reçu cette notification.' });
    } else {
      toast({ title: 'Client notifié' });
    }
  };

  return (
    <Button variant="secondary" size="sm" disabled={sending} onClick={send}>
      <Bell className="mr-2 h-4 w-4" />
      {sending ? 'Envoi…' : 'Notifier le client'}
    </Button>
  );
}
```

- [ ] **Step 12.3 : Importer dans la fiche document admin**

Placer `<DocumentNotifyButton document={doc} />` dans les actions. Adapter le mapping.

- [ ] **Step 12.4 : Type-check + lint + commit**

```bash
npm run lint && npx tsc --noEmit
git add src/components/propulspace/DocumentNotifyButton.tsx
# + le composant fiche document modifié
git commit -m "feat(brevo): bouton CRM Notifier livrable (#39) via send-portal-email"
```

---

## Task 13 : Templates Supabase Auth dashboard — #30 + #38

**Files:** (config Lyes, hors code) — dashboard Supabase

- [ ] **Step 13.1 : Adapter le HTML de `30-magic-link.brevo.html`**

Ouvrir `public/handoff-preview-v2/emails/30-magic-link.brevo.html`. Remplacer dans une copie :
- `{{ params.first_name }}` → `{{ .Email }}` (Supabase Auth ne donne pas first_name nativement) OU retirer la salutation personnalisée.
- `{{ params.magic_link_url }}` → `{{ .ConfirmationURL }}`

Sauvegarder cette version adaptée comme `public/handoff-preview-v2/emails/30-magic-link.supabase-auth.html` (référence pour Lyes).

- [ ] **Step 13.2 : Adapter le HTML de `38-portal-welcome.brevo.html`**

Idem :
- `{{ params.first_name }}` → `{{ .Email }}` ou retirer
- `{{ params.portal_url }}` → `{{ .ConfirmationURL }}`

Sauvegarder comme `38-portal-welcome.supabase-auth.html`.

- [ ] **Step 13.3 : Doc handoff Lyes**

Créer `docs/runbooks/supabase-auth-templates.md` (ou ajouter à un runbook Brevo existant) :
```markdown
# Templates Supabase Auth — handoff Lyes

## #30 Magic Link
1. Dashboard Supabase > project tbuqctfgjjxnevmsvucl > Authentication > Email Templates > Magic Link
2. Subject : copier le `<title>` du fichier `public/handoff-preview-v2/emails/30-magic-link.supabase-auth.html`
3. Body (HTML) : coller le `<body>` ... `</body>` du même fichier
4. Sauvegarder

## #38 Portal Welcome (= template "Invite")
1. Authentication > Email Templates > Invite User
2. Sujet + body depuis `38-portal-welcome.supabase-auth.html`
3. Sauvegarder

⚠️ Si la SMTP Brevo personnalisée est configurée (Settings > Auth > SMTP), c'est elle qui enverra ces templates.
```

- [ ] **Step 13.4 : Commit**

```bash
git add public/handoff-preview-v2/emails/30-magic-link.supabase-auth.html public/handoff-preview-v2/emails/38-portal-welcome.supabase-auth.html docs/runbooks/supabase-auth-templates.md
git commit -m "docs(brevo): templates #30 + #38 adaptés syntaxe Supabase Auth + runbook handoff Lyes"
```

---

## Task 14 : QA E2E manuelle

**Files:** aucun (vérification manuelle, à dérouler dans l'app preview)

- [ ] **Step 14.1 : Vérifier la table dedupe est vide avant tests**

Via `mcp__claude_ai_Supabase__execute_sql` :
```sql
SELECT count(*) FROM propulspace.transactional_emails_sent WHERE created_at > now() - interval '1 hour';
```

- [ ] **Step 14.2 : Scénario 1 — Soumission `/diagnostic`**

Ouvrir l'app preview, aller sur `/diagnostic`, remplir + submit avec un email de test (ex. `lyes.triki+qa31@yahoo.fr`).

Vérifier :
- Boîte client → reçoit #31 (sujet "qualif-confirmation")
- Boîte équipe → reçoit #32 (sujet "🌟 Nouveau lead diagnostic")
- DB :
```sql
SELECT template_key, dedupe_key, status FROM propulspace.transactional_emails_sent
WHERE created_at > now() - interval '5 minutes' ORDER BY created_at DESC;
```
Expected : 2 lignes statut `sent`, brevo_message_id non null.

- [ ] **Step 14.3 : Scénario 2 — Paiement Stripe test**

En test mode Stripe, payer une facture via le portail client.

Vérifier :
- Boîte client → reçoit #35
- DB : ligne `payment-received` statut `sent`, `dedupe_key` = stripe event_id
- Re-trigger manuel du webhook (depuis Stripe dashboard) → la 2e tentative est skipped (DB log mais pas de 2e email)

- [ ] **Step 14.4 : Scénario 3 — DocuSeal**

Depuis le CRM admin, créer une submission DocuSeal sur un projet test.

Vérifier :
- Boîte signataire → reçoit #36 (notre template Brevo, pas celui de DocuSeal — `send_email: false` côté API)
- Signer le doc dans l'interface DocuSeal
- Boîte signataire → reçoit #37
- DB : 2 lignes (`signature-requested`, `signature-completed`), statut `sent`

- [ ] **Step 14.5 : Scénario 4 — Bouton facture**

Sur la fiche facture admin :
- Cliquer "Envoyer la facture" → toast succès, #33 reçu
- Cliquer 2e fois → toast "Email déjà envoyé"
- Cliquer "Relancer" → toast succès, #34 reçu
- Cliquer "Relancer" 2e fois le même jour → toast "déjà envoyé"
- (Pour test J+1 : modifier `dedupe_key` ou attendre)

- [ ] **Step 14.6 : Scénario 5 — Bouton document**

Sur la fiche document admin :
- Cliquer "Notifier le client" → toast succès, #39 reçu
- Cliquer 2e fois → toast "déjà notifié"

- [ ] **Step 14.7 : Scénario 6 — Templates Supabase Auth**

Magic Link :
- Sur `/login` portail, demander un magic-link sur un email test
- Recevoir l'email → vérifier rendu visuel correct + lien fonctionnel

Invite :
- Depuis CRM admin > bouton "Activer le portail" sur un projet test
- Recevoir le mail → rendu visuel correct + lien d'activation OK

- [ ] **Step 14.8 : Scénario 7 — Non-régression R-018**

Re-lancer les 7 tests RLS de `tests/sql/projects_v2_rls.sql` via `mcp__claude_ai_Supabase__execute_sql`. Tous doivent passer (7/7).

- [ ] **Step 14.9 : Scénario 8 — R-009 perf**

```sql
EXPLAIN (ANALYZE) SELECT * FROM public.projects_v2 WHERE portal_client_email = 'lyes.triki@matera.eu';
```
Expected : `Index Scan using idx_projects_v2_portal_client_email`.

- [ ] **Step 14.10 : Scénario 9 — R-014 warning visible**

Forcer un fail (par ex. INSERT auth.users avec un email qui violerait un UNIQUE dans public.users) et vérifier dans `mcp__claude_ai_Supabase__get_logs` (type `postgres`) qu'un WARNING apparaît au lieu d'un échec silencieux.

⚠️ Skip si trop intrusif. Vérification minimale : grep `RAISE WARNING` dans `pg_proc.prosrc` (déjà fait en Task 2.4).

---

## Task 15 : PR + code-review + merge main

- [ ] **Step 15.1 : Push de la branche**

```bash
git status --short
git log --oneline origin/feature/propulspace-phase-2-front..HEAD
git push origin feature/propulspace-phase-2-front
```

- [ ] **Step 15.2 : Créer la PR vers main**

```bash
gh pr create --base main --head feature/propulspace-phase-2-front --title "feat(propulspace): Phase 2 complète — 10 emails Brevo + R-009 + R-014 + R-018" --body "$(cat <<'EOF'
## Summary
- 10 emails transactionnels Brevo câblés (helper TS partagé + dedupe atomique)
- 5 emails auto (extensions edges existantes) + 3 emails manuels (boutons CRM) + 2 templates Supabase Auth dashboard
- R-009 : index `portal_client_email` (perf RLS)
- R-014 : retrait silent catch dans `handle_new_user` (WARNING visible dans logs)
- R-018 : fuite RGPD `projects_v2` fermée (déjà mergée en amont via commits 259-263 sur cette branche)
- Phase 2 Propul'Space livrée à 100%

## Test plan
- [ ] Soumission `/diagnostic` → #31 client + #32 équipe
- [ ] Paiement Stripe → #35 sans doublon sur webhook retry
- [ ] DocuSeal create → #36 (notre template, pas celui DocuSeal) + signature → #37
- [ ] Bouton CRM "Envoyer facture" → #33 + dedupe sur 2e clic
- [ ] Bouton CRM "Relancer" → #34 + 1 par jour max
- [ ] Bouton CRM "Notifier livrable" → #39 + dedupe sur 2e clic
- [ ] Magic-link et Invite Supabase Auth rendus correctement
- [ ] R-009 : Index Scan confirmé sur EXPLAIN
- [ ] R-014 : pg_proc.prosrc contient RAISE WARNING, plus de silent catch
- [ ] R-018 : tests/sql/projects_v2_rls.sql 7/7 PASS

## Hors-périmètre (post-merge)
- R-019 audit RLS tables liées
- R-007 / pgTAP conversion
- Sprint C (vues admin)
- Switcher multi-projets portail (B-014)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Noter l'URL de la PR retournée.

- [ ] **Step 15.3 : Lancer `/code-review` sur la PR**

Demander à l'utilisateur de lancer `/code-review` sur la PR (skill billing user, ne peut pas être lancé en automatique).

- [ ] **Step 15.4 : Traiter les findings code-review**

Si findings critiques → corriger en commits additionnels sur la branche. Si faux positifs → documenter en commentaire de PR.

- [ ] **Step 15.5 : Merger la PR**

Après review validée, merger via GitHub UI (squash ou merge commit selon préférence — recommandé : merge commit pour préserver l'historique granulaire).

- [ ] **Step 15.6 : Mettre à jour `.planning/SESSION.md` et `.planning/PROGRESS_PROPULSPACE.md`**

Marquer Phase 2 à 100%, R-018 + R-009 + R-014 + Brevo fermés. Cohérent avec le pattern de fin de session.

- [ ] **Step 15.7 : Tag git Phase 2**

```bash
git checkout main
git pull origin main
git tag phase-2-complete -m "Phase 2 Propul'Space livrée — 10 emails Brevo, RLS sécurisée, portail opérationnel"
git push origin phase-2-complete
```

---

## Self-Review du plan (post-rédaction)

**Coverage spec :**
- ✅ Décision 1 (helper TS partagé) → Task 5
- ✅ Décision 2 (templates en .ts) → Task 4
- ✅ Décision 3 (htmlContent direct) → Task 5 (POST `/v3/smtp/email` avec htmlContent)
- ✅ Décision 4 (table dedupe) → Task 3
- ✅ Décision 5 (INSERT pending → Brevo → UPDATE) → Task 5
- ✅ Décision 6 (escHtml systématique) → Task 5 (fonction `escHtml`)
- ✅ Décision 7 (#30 et #38 via Supabase Auth dashboard) → Task 13
- ✅ Décision 8 (#39 bouton manuel) → Task 12
- ✅ Décision 9 (mini-edge admin) → Task 6
- ✅ Décision 10 (extensions edges existantes) → Tasks 7-10
- ✅ R-009 → Task 1
- ✅ R-014 → Task 2
- ✅ QA E2E → Task 14
- ✅ PR main → Task 15

**Placeholders :**
- Task 2.2 : "[COPIER LA LOGIQUE EXISTANTE ICI]" — placeholder volontaire car le corps de la fonction doit être lu en 2.1 avant écriture. Acceptable.
- Task 4.1 : "[contenu de NN-name.brevo.html]" — placeholder volontaire (8 templates, copy-paste mécanique).
- Tasks 11.1, 12.1 : "à identifier via grep" — l'engineer doit faire le grep, normal.

**Types consistency :**
- `TemplateKey` défini en Task 4, importé en Task 5, 6.
- `sendTransactional` signature stable Task 5 → utilisée Tasks 6-10.
- `send-portal-email` body signature stable Task 6 → utilisée Tasks 11, 12.

**Scope check :**
- Toutes les tâches contribuent à Phase 2 finalisation. Pas de scope creep.
- Hors-périmètre listé (R-019, pgTAP, Sprint C).

---

## Risques d'exécution

- **Task 4 (templates TS)** : copier 10 HTML de ~5KB chacun = ~30 min manuels. Vigilance échappement backticks.
- **Task 5 (helper)** : code prêt, mais déploiement edge function ne valide pas les imports relatifs `../_shared/` tant qu'on n'a pas testé une vraie invocation. Si l'import casse → fallback : inliner le helper dans chaque edge (temporairement).
- **Tasks 8-10 (extensions)** : dépendent du schéma DB exact des tables (`invoices.total_amount_cents` vs autre nom). Step 8.3 mentionne le check via `execute_sql` — important.
- **Task 13 (Supabase Auth)** : nécessite intervention Lyes via dashboard. Bloquant pour QA scénario 6.
- **Task 14 (QA)** : nécessite environnement preview opérationnel + comptes test (lead, projet, facture, signature, document). À préparer en amont.
