# Design — Finalisation Phase 2 : 10 emails transactionnels Brevo + merge main

**Date** : 2026-05-27
**Branche** : `feature/propulspace-phase-2-front` → `main` (PR)
**Objectif** : livrer la Phase 2 Propul'Space à 100% dans la journée, puis merge sur `main` via PR + review.
**Périmètre fixé après brainstorming + audit sub-agent feature-dev:code-reviewer.**

---

## 1. Contexte

Phase 2 livrée à 97%. R-018 (fuite RGPD `projects_v2`) fermée le 2026-05-21. Reste :
- 10 emails transactionnels Brevo à câbler (templates HTML existent dans `public/handoff-preview-v2/emails/`, API Brevo déjà branchée dans `questionnaire-send-emails`).
- R-009 : index `portal_client_email` sur `projects_v2`.
- R-014 : retrait try/catch silencieux dans `handle_new_user`.
- QA E2E + PR vers `main`.

---

## 2. Décisions d'architecture (verrouillées)

| # | Décision | Pourquoi |
|---|---|---|
| 1 | Helper TS partagé `_shared/brevo.ts` (pas d'edge function générique intermédiaire) | Élimine round-trip réseau, problème JWT entre edges, surface d'attaque. Sub-agent N1 + audit indépendant. |
| 2 | Templates HTML en modules TS dans `_shared/email-templates/*.ts` (pas fichiers `.html`) | Bundler Supabase Deploy (esbuild) n'embarque pas les `.html`. R1. |
| 3 | API Brevo `/v3/smtp/email` avec `htmlContent` (pas `templateId`) | Source unique = code. Pas de setup manuel dans dashboard Brevo. Cohérent avec `questionnaire-send-emails`. |
| 4 | Table SQL de déduplication + journal `propulspace.transactional_emails_sent` | Anti-doublon Stripe/DocuSeal retry (R3), traçabilité (R10), gestion 23505 (B2). |
| 5 | Pattern envoi atomique : INSERT pending → POST Brevo → UPDATE sent/failed | Pas de fausse trace en cas d'échec Brevo, debuggable, retryable. |
| 6 | Échappement HTML systématique (`escHtml`) sur tous les `params` | Anti-XSS B3. Une seule fonction, un seul point de contrôle dans le helper. |
| 7 | Emails #30 magic-link et #38 portal-welcome via Supabase Auth dashboard (pas Brevo) | Évite double envoi avec `inviteUserByEmail`. Zéro code. I4. |
| 8 | Email #39 nouveau livrable via bouton manuel CRM (pas trigger DB) | Évite pg_net + JWT (B1), pg_sleep (I3), spam batch upload (R6). Cohérent avec #34. |
| 9 | Emails #33, #34, #39 : boutons manuels CRM → mini-edge `send-portal-email` (façade) | Le front ne peut pas appeler `_shared/brevo.ts` directement (pas de service_role). Mini-edge `--verify-jwt` + check `is_admin()` côté Supabase. |
| 10 | Emails #31, #32, #35, #36, #37 : extension d'edges existantes (import direct du helper) | Pas de nouveau code de routing, on étend ce qui existe. |

---

## 3. Architecture

```
                                         ┌──────────────────────────────┐
                                         │  _shared/brevo.ts (HELPER)   │
                                         │                              │
  edges existantes étendues    ──────►   │  sendTransactional({         │
  (import direct du helper)              │    template_key,             │
                                         │    to,                       │
  ┌─────────────────────────┐            │    params,                   │
  │ questionnaire-send-     │──┐         │    dedupe_key                │
  │ emails (#31 + #32)      │  │         │  })                          │
  └─────────────────────────┘  │         │                              │
                               │         │  1. escHtml(params)          │
  ┌─────────────────────────┐  │         │  2. interpole template       │
  │ stripe-webhook (#35)    │──┤         │  3. INSERT pending           │
  └─────────────────────────┘  │         │  4. POST api.brevo.com       │
                               │         │  5. UPDATE sent OR failed    │
  ┌─────────────────────────┐  │         │                              │
  │ docuseal-webhook (#37)  │──┤         │  Catch 23505 → return        │
  └─────────────────────────┘  │         │    {sent:false, skipped}     │
                               │         └──────▲───────────────────────┘
  ┌─────────────────────────┐  │                │
  │ admin-docuseal-create-  │──┘                │
  │ submission (#36)        │                   │
  └─────────────────────────┘                   │
                                                │
                                                │ import direct
                                                │
  boutons CRM admin ──► front ──invoke──► ┌────┴────────────────────────┐
  ("Envoyer facture",                     │ send-portal-email           │
   "Relancer facture",                    │ (mini-edge --verify-jwt)    │
   "Notifier livrable")                   │                             │
                                          │ if !is_admin → 403          │
                                          │ → call sendTransactional()  │
                                          └─────────────────────────────┘

  Emails Supabase Auth (PAS via notre code) :
  ├─ #30 magic-link    → Auth > Email Templates > Magic Link    (dashboard manuel)
  └─ #38 portal-welcome → Auth > Email Templates > Invite        (dashboard manuel)
```

---

## 4. Composants à créer / modifier

### 4.1 Migration SQL

**Fichier** : `supabase/migrations/264_propulspace_transactional_emails_sent.sql`

```sql
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

CREATE INDEX idx_tx_emails_recipient ON propulspace.transactional_emails_sent(recipient_email);
CREATE INDEX idx_tx_emails_created   ON propulspace.transactional_emails_sent(created_at DESC);
CREATE INDEX idx_tx_emails_status    ON propulspace.transactional_emails_sent(status) WHERE status != 'sent';

ALTER TABLE propulspace.transactional_emails_sent ENABLE ROW LEVEL SECURITY;

-- Service role bypass RLS par défaut (utilisé par le helper).
-- Team peut lire pour future page d'audit (B-004).
CREATE POLICY tx_emails_team_select ON propulspace.transactional_emails_sent
  FOR SELECT TO authenticated USING (public.is_team_member());

COMMENT ON TABLE propulspace.transactional_emails_sent IS
  'Journal + déduplication des emails transactionnels Brevo. UNIQUE(template_key, dedupe_key) garantit l''envoi unique.';
```

### 4.2 Helper TS partagé

**Fichier** : `supabase/functions/_shared/brevo.ts`

API publique :
```ts
type TemplateKey =
  | 'qualif-confirmation'   // #31
  | 'new-lead-alert'        // #32
  | 'invoice-sent'          // #33
  | 'invoice-reminder'      // #34
  | 'payment-received'      // #35
  | 'signature-requested'   // #36
  | 'signature-completed'   // #37
  | 'new-deliverable';      // #39

export async function sendTransactional(opts: {
  templateKey: TemplateKey;
  to: { email: string; name?: string };
  params: Record<string, string | number | null | undefined>;
  dedupeKey: string;
}): Promise<{ ok: boolean; sent: boolean; reason?: string; message_id?: string }>;
```

Comportement (atomicité) :
1. `escHtml(params)` sur toutes les valeurs string
2. Charge `EMAIL_TEMPLATES[templateKey]` (string TS depuis `_shared/email-templates/index.ts`)
3. Interpole `{{ params.X }}` → valeur (regex simple)
4. Extrait `<title>` = subject
5. `INSERT INTO transactional_emails_sent (template_key, dedupe_key, recipient_email, status, params_json) VALUES (..., 'pending', ...)` — si erreur 23505 → return `{sent:false, reason:'duplicate'}`
6. `fetch('https://api.brevo.com/v3/smtp/email', ...)` avec `htmlContent`
7. Si succès → `UPDATE ... SET status='sent', brevo_message_id=...`
8. Si échec → `UPDATE ... SET status='failed', error_message=...` et return `{ok:false}`
9. Fallback gracieux : si `BREVO_API_KEY` absent → return `{ok:true, sent:false, reason:'BREVO_API_KEY not configured'}` (pas d'INSERT en DB)

### 4.3 Templates TS

**Fichier** : `supabase/functions/_shared/email-templates/index.ts`

```ts
export const EMAIL_TEMPLATES: Record<TemplateKey, string> = {
  'qualif-confirmation': `<!DOCTYPE html>...`,  // contenu de 31-qualif-confirmation.brevo.html
  'new-lead-alert':      `<!DOCTYPE html>...`,
  // ...8 templates au total (sans #30 ni #38, gérés via Supabase Auth dashboard)
};
```

Chaque template est une string TS multiline contenant le HTML du `.brevo.html` correspondant, avec variables `{{ params.X }}` préservées (interpolation côté helper).

**Source de vérité** : la version `.ts`. Les `.brevo.html` dans `public/handoff-preview-v2/emails/` restent en place pour preview navigateur — un commentaire HTML en tête de fichier rappelle : `<!-- SOURCE OF TRUTH: supabase/functions/_shared/email-templates/index.ts -->`.

### 4.4 Mini-edge `send-portal-email`

**Fichier** : `supabase/functions/send-portal-email/index.ts`

Façade pour les boutons CRM admin (#33, #34, #39).
- Déployée en `--verify-jwt` (mode par défaut)
- Body : `{ template_key, to, params, dedupe_key }` — typage strict
- Vérifie le JWT user + check `is_admin()` (RPC SQL existante)
- Si OK → appelle `sendTransactional()`
- CORS standard

### 4.5 Extensions d'edges existantes

| Edge | Modification |
|---|---|
| `questionnaire-send-emails` | Ajouter envoi #31 (au lead) en plus du #32 (équipe existant). Migrer le HTML custom #32 vers le template versionné. `dedupe_key` = `qualification_lead_id + '-lead'` pour #31, `qualification_lead_id + '-team'` pour #32 (templates différents donc UNIQUE OK même sans suffixe, suffixe pour clarté debug). |
| `stripe-webhook` | Sur événement `checkout.session.completed` (paiement réussi) → envoyer #35 payment-received. `dedupe_key` = `stripe_event_id`. |
| `docuseal-webhook` | Sur événement `submission.completed` → envoyer #37 signature-completed. `dedupe_key` = `docuseal_submission_id + '-completed'`. |
| `admin-docuseal-create-submission` | Après création réussie de la submission → envoyer #36 signature-requested. `dedupe_key` = `docuseal_submission_id + '-requested'`. |

### 4.6 Boutons CRM

| Bouton | Emplacement | Email | dedupe_key |
|---|---|---|---|
| "Envoyer la facture" | Fiche facture (CRM admin) | #33 invoice-sent | `invoice_id + '-sent'` |
| "Relancer" | Fiche facture | #34 invoice-reminder | `invoice_id + '-reminder-' + ISO_DATE(now)` (1 relance / jour max) |
| "Notifier le client" | Fiche document portail | #39 new-deliverable | `document_id` |

Chaque bouton appelle `supabase.functions.invoke('send-portal-email', { body: {...} })` et affiche toast succès/échec.

### 4.7 Templates Supabase Auth dashboard (manuel Lyes, hors code)

- **Magic Link** : adapter `30-magic-link.brevo.html` → remplacer `{{ params.first_name }}` par `{{ .Email }}` (Supabase Auth ne donne pas le first_name nativement) ou retirer la variable. Remplacer `{{ params.magic_link_url }}` par `{{ .ConfirmationURL }}`. Coller dans **Auth > Email Templates > Magic Link**.
- **Invite (= portal-welcome #38)** : adapter `38-portal-welcome.brevo.html` → `{{ .ConfirmationURL }}` au lieu de `{{ params.portal_url }}`. Coller dans **Auth > Email Templates > Invite**.

### 4.8 R-009 et R-014 (hors Brevo)

**R-009** : migration `265_idx_portal_client_email.sql`
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_v2_portal_client_email
  ON public.projects_v2(portal_client_email)
  WHERE portal_client_email IS NOT NULL;
```

**R-014** : migration `266_handle_new_user_no_silent_catch.sql` — retirer le bloc `EXCEPTION WHEN OTHERS THEN NULL` dans `handle_new_user()`, le remplacer par `RAISE WARNING` (non bloquant) — décision finale : on évite `RAISE EXCEPTION` pour ne pas bloquer la création d'un compte auth si l'INSERT dans `public.users` plante. `RAISE WARNING` met le problème dans les logs Supabase sans casser le flow.

---

## 5. Data flow par email (résumé)

| # | Email | Trigger | dedupe_key | Statut envoi |
|---|---|---|---|---|
| 30 | magic-link | Supabase Auth (login) | géré par Supabase | dashboard |
| 31 | qualif-confirmation | submit `/diagnostic` | `qualification_lead_id + '-lead'` | helper via edge |
| 32 | new-lead-alert | submit `/diagnostic` | `qualification_lead_id + '-team'` | helper via edge |
| 33 | invoice-sent | bouton CRM | `invoice_id + '-sent'` | helper via send-portal-email |
| 34 | invoice-reminder | bouton CRM | `invoice_id + '-reminder-' + date` | helper via send-portal-email |
| 35 | payment-received | webhook Stripe | `stripe_event_id` | helper via stripe-webhook |
| 36 | signature-requested | création submission DocuSeal | `submission_id + '-req'` | helper via admin-docuseal-create-submission |
| 37 | signature-completed | webhook DocuSeal | `submission_id + '-comp'` | helper via docuseal-webhook |
| 38 | portal-welcome | invite portail (Supabase Auth) | géré par Supabase | dashboard |
| 39 | new-deliverable | bouton CRM | `document_id` | helper via send-portal-email |

---

## 6. Gestion d'erreurs

- **`BREVO_API_KEY` absent** : helper retourne `{ok:true, sent:false}` sans crasher. Pattern déjà en place.
- **Brevo répond 5xx** : INSERT statut `failed` + `error_message`. L'edge ou le bouton qui appelle reçoit `{ok:false}` et peut afficher un toast d'erreur. Retry manuel possible (refaire l'action).
- **Doublon détecté (UNIQUE 23505)** : helper catch explicitement → return `{sent:false, reason:'duplicate'}`. Pas une erreur fatale.
- **JWT invalide sur `send-portal-email`** : 401 standard.
- **`is_admin()` retourne false** : 403 + log.
- **Webhook Stripe/DocuSeal retry** : la dedupe via `stripe_event_id` / `docuseal_submission_id` empêche tout doublon. Le webhook répond 200 même si email déjà envoyé.

---

## 7. Tests

QA E2E manuel sur preview branch avant merge `main`. Scenarios :
1. Soumettre `/diagnostic` → réception #31 (lead) + #32 (équipe) en doublon = 0.
2. Stripe test mode : payer une facture → réception #35 unique même si webhook retry.
3. DocuSeal : créer submission → réception #36 ; signer → réception #37.
4. CRM : créer facture, cliquer "Envoyer" → #33 ; cliquer "Relancer" deux fois le même jour → 2e envoi skip ; le lendemain → renvoi OK.
5. CRM : uploader doc, cliquer "Notifier" → #39 ; cliquer 2e fois → skip.
6. Vérifier table `transactional_emails_sent` : 1 ligne par envoi, statuts `sent`, `brevo_message_id` présent.
7. Supabase Auth : tester magic-link + invite portail → rendu correct depuis dashboard.
8. R-009 : `EXPLAIN SELECT * FROM projects_v2 WHERE portal_client_email = '...'` → Index Scan.
9. R-014 : créer un nouveau user → si INSERT `users` plante, logs visibles (plus de silent fail).
10. RLS portail : confirmer aucun régression R-018 (tests `projects_v2_rls.sql` toujours 7/7 PASS).

---

## 8. Hors-périmètre (post-merge)

- R-019 : audit RLS tables liées (`tasks`, `clients`, `project_contacts`).
- R-007 / pgTAP : conversion `projects_v2_rls.sql` en pgTAP + CI.
- Sprint C : vues admin dashboard multi-projets + panel client 6 onglets + AlertDialogs destructifs (partiel via TypedDeleteDialog).
- B-014 / ADR-004 : switcher multi-projets portail.
- B-001 : renommer `EspaceClient/` → `Propulspace/`.
- B-004 : page admin `audit_log` UI.
- Page UI admin pour `transactional_emails_sent` (visualisation journal d'envoi).

---

## 9. Ordre d'exécution prévu (entrée writing-plans)

1. **Préliminaires** (10 min) : `git checkout .githooks/pre-commit` + commit séparé `docs(planning): UX overhaul proposals (matière Phase 3)`.
2. **R-009 + R-014** (20 min) : 2 migrations SQL appliquées + versionnées. Tâches rapides en warm-up.
3. **Migration 264** (15 min) : table `transactional_emails_sent`.
4. **Helper + templates** (1h30) : `_shared/brevo.ts` + `_shared/email-templates/index.ts` (10 templates → 8 utilisés, #30 et #38 hors scope helper).
5. **Mini-edge `send-portal-email`** (45 min) : façade pour boutons CRM admin.
6. **Extensions edges existantes** (2h) : `questionnaire-send-emails`, `stripe-webhook`, `docuseal-webhook`, `admin-docuseal-create-submission`.
7. **Boutons CRM** (1h30) : 3 boutons + toasts + appels invoke.
8. **Templates Supabase Auth** (15 min, parallèle Lyes) : copier-coller 2 HTML adaptés dans dashboard.
9. **QA E2E** (1-2h) : 10 scénarios section 7.
10. **PR + code-review** (30-45 min) : push branche, créer PR vers main, lancer `/code-review`, traiter findings.
11. **Merge main** : après review validée.

**Estimation totale** : 7-9h. Marge confortable sur une journée.

---

## 10. Risques résiduels acceptés

- **Édition wording email** = redéploiement edge function (pas glamour mais acceptable, fréquence ~mensuelle max).
- **Statistiques par template** non disponibles dans dashboard Brevo (pas de templateId utilisé). On a la table `transactional_emails_sent` qui couvre les besoins de debug. Si Lyes veut stats marketing-style, migration future vers templateId Brevo (changement trivial dans helper).
- **Drift potentiel** entre `.brevo.html` (preview) et `.ts` (code) — atténué par commentaire de tête, à automatiser plus tard via script `npm run build:email-templates`.
