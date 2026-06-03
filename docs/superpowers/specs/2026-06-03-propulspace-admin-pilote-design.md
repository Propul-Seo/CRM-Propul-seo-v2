# Spec — Back-office admin Propul'Space & lancement pilote — 2026-06-03

> Source : audit `.planning/AUDIT_LANCEMENT_PROPULSPACE_2026-06-03.md`.
> Cadrage validé : pilote 1 client → public en séquence ; cible 2-3 semaines ; **UI admin complète requise (zéro SQL manuel)** ; archi = **espace admin dédié `/admin/propulspace`**, complet d'emblée.

## 1. Objectif

Permettre à l'équipe de **piloter un client de bout en bout depuis l'app** : activer son portail, créer/envoyer ses factures et acomptes, lui demander une signature, lui partager des documents, gérer les jalons de son projet et suivre son activité — sans aucune opération SQL. À l'issue, le pilote (1 vrai client) est activable. L'ouverture publique fait l'objet d'un cycle séparé (§7).

## 2. Périmètre

**Dans le périmètre (pilote)**
- Back-office `/admin/propulspace` : dashboard clients + panneau client à 6 onglets.
- Les 6 capacités admin : Aperçu (infos + activation), Factures+acomptes, Signatures, Documents, Jalons, Activité.
- Durcissement pilote : tests E2E des parcours critiques, tests RLS isolation, ErrorBoundary, auto-lock facture, re-validation serveur du draft qualif, audit log au submit.
- Pose des secrets/webhooks/templates prod (action utilisateur, voir checklist audit §13).

**Hors périmètre (cycle public, §7)** : pages légales + consentement RGPD, anti-spam serveur (rate-limit / anti-doublon / CAPTCHA), quality score, Sentry, export/oubli RGPD, multi-projets (ADR-004).

## 3. Architecture

### 3.1 Routing (extension de l'existant)

`src/modules/EspaceClient/admin/PropulspaceAdminApp.tsx` ne sert aujourd'hui que `/admin/leads`. On ajoute :

```
/admin/propulspace
├── index            → redirect "clients"
├── clients          AdminClientsPage        (dashboard, défaut)
├── clients/:projectId AdminClientPanel       (6 onglets)
└── leads            LeadsQualifiesPage        (existant, inchangé)
```

Garde inchangée : `PropulspaceAdminGuard` (email `team@propulseo-site.com` / `is_admin()`).

### 3.2 Arbre de composants (à créer)

```
admin/
├── AdminClientsPage.tsx            liste portails (depuis propulspace_portal_health_v2)
│   └── ClientHealthRow.tsx         statut · progression · dernier login · lien projet
├── AdminClientPanel.tsx            layout onglets + contexte projet courant
│   └── tabs/
│       ├── OverviewTab.tsx         infos client/projet éditables + <PortalStatusSection/> (réutilisé)
│       ├── InvoicesTab.tsx         liste + <AdminInvoiceForm/> (facture + acomptes) + envoyer/relancer
│       ├── SignaturesTab.tsx       liste + <AdminSignatureDialog/> (DocuSeal) + resend/download
│       ├── DocumentsTab.tsx        liste + <AdminDocumentUpload/> + toggle visible_to_client + delete
│       ├── StepsTab.tsx            CRUD <AdminProjectStepForm/> + réordonnancement + next_action
│       └── ActivityTab.tsx         timeline analytics_events + audit_log
└── hooks/
    ├── useAdminClients.ts          lecture portal_health
    ├── useAdminInvoices.ts         CRUD invoices + installments (RPC admin_create_invoice)
    ├── useAdminSignatures.ts       appelle edge admin-docuseal-create-submission
    ├── useAdminDocuments.ts        upload bucket + insert documents
    ├── useAdminProjectSteps.ts     CRUD project_steps + reorder
    └── useAdminProjectInfo.ts      update projects_v2 (client_*, portal_*, next_action_*)
```

**Réutilisé tel quel** : primitives `shared/` (Hero, KpiTile, ActivityRow, EmptyState, Badge, SectionHead, Progress, TimelineStep, FileIcon, StatusPage), `PortalStatusSection`, `ActivatePortalDialog`/`DeactivatePortalDialog`, `LeadDetailSheet`, hooks `usePropulspaceAdmin`/`usePortalState`/`usePortalActivation`/`usePropulspaceDeletion`, et les vues `propulspace_*_v2` (lecture).

### 3.3 Flux de données — lectures via vues, écritures via RPC

**Contrainte PostgREST** : le schéma `propulspace` n'est pas exposé. Le front (admin compris) ne peut donc PAS faire `supabase.from('propulspace.invoices')`. Tout passe par `public` : **vues** (lecture) et **RPC** (écriture).

**Lectures admin — déjà disponibles.** Les vues `public.propulspace_*_v2` sont `security_invoker` avec un `WHERE is_admin() OR (filtre client)` : l'admin voit donc **toutes** les lignes et filtre par projet côté requête.

| Lecture | Appel | Dispo ? |
|---|---|---|
| Factures / acomptes / docs / signatures / jalons d'un projet | `supabase.from('propulspace_<x>_v2').select('*').eq('project_id', pId)` | ✅ |
| Dashboard santé portails | `supabase.from('projects_portal_health_v2').select('*')` | ✅ |
| État portail (inactive/orphan/broken/invited/active) | `supabase.from('propulspace_portal_state_v2').select('*')` | ✅ |

**Écritures admin.** Aujourd'hui aucune RPC d'écriture sur invoices/documents/signatures/project_steps n'existe (seuls `admin_convert_qualif_to_project`, `admin_archive_project`, `admin_delete_project`, `admin_delete_qualif_lead`). Donc :

| Action admin | Mécanisme | Nouveau backend ? |
|---|---|---|
| Éditer infos client / projet / prochaine étape | UPDATE direct `public.projects_v2` (RLS équipe OK, trigger `guard_portal_columns_admin_only` laisse passer l'équipe) — colonnes `client_*`, `portal_next_milestone_label/date`, etc. | non |
| Envoyer demande de signature | edge `admin-docuseal-create-submission` (existe) | non |
| Activer / désactiver / réinviter portail | edges `admin-portal-invite`/`-resend`/`-deactivate` (existent) | non |
| Envoyer facture / relancer / notifier livrable | edge `send-portal-email` (existe, templates #33/#34/#39) | non |
| Payer (côté client) | edge `portal-create-checkout-session` → Stripe → `stripe-webhook` (existent) | non |
| **Créer facture + acomptes (atomique, n° séquentiel, snapshot)** | **RPC `admin_create_invoice` (migration 270)** | **oui** |
| **Éditer brouillon / envoyer facture (status→sent + auto-lock art. 293B)** | **RPC `admin_update_invoice` + `admin_send_invoice` (migration 271)** | **oui** |
| **Créer / éditer visibilité / soft-delete document** | **RPC `admin_insert_document` / `admin_set_document_visibility` / `admin_delete_document` (migration 272)** | **oui** |
| **CRUD + réordonner jalons** | **RPC `admin_upsert_project_step` / `admin_delete_project_step` / `admin_reorder_project_steps` (migration 273)** | **oui** |

Toutes les nouvelles RPC : `public.*`, `SECURITY DEFINER`, garde `propulspace.is_admin()`, `SET search_path = 'public','propulspace','pg_temp'` — sur le modèle de `admin_convert_qualif_to_project`.

L'upload de fichier document se fait via `supabase.storage.from('propulspace-documents')` (vérifier la policy storage admin), puis `admin_insert_document` enregistre la ligne (`uploaded_by = auth.uid()`).

### 3.4 Génération PDF de facture

Les colonnes `invoices.pdf_url` + `pdf_hash_sha256` **existent déjà** (table 050) → pas de migration. Il manque l'edge `generate-invoice-pdf` (calquée sur `generate-quote-pdf`) qui rend le PDF FR, l'upload dans le bucket `propulspace-documents` et remplit ces deux colonnes. Décision D1 = (a) : inclus en phase 1.

## 4. Migrations SQL (à exécuter à la main sur Supabase, `propulspace_270+`)

> Je livre chaque migration en fichier `supabase/migrations/<ts>_propulspace_NNN_*.sql`. **L'utilisateur les applique manuellement** (pas d'accès MCP Supabase). Ne pas rejouer les ≤269.

- **270 (phase 1) — `admin_create_invoice`** : crée la facture (numéro via `next_invoice_number()`, snapshot client immuable depuis `projects_v2.client_*`, `vat_rate=0`) + N acomptes (`invoice_installments`) en une transaction. Retourne `invoice_id`.
- **271 (phase 1) — `admin_update_invoice` + `admin_send_invoice`** : édition d'un brouillon ; envoi = `status` → `sent` + `is_locked = true` (immuabilité art. 293B, GAP-37/B-009) + trigger `BEFORE UPDATE` refusant toute modif si `is_locked`.
- **272 (phase 3) — RPC documents** : `admin_insert_document`, `admin_set_document_visibility`, `admin_delete_document` (soft-delete via `deleted_at`). + vérifier/ajouter la policy storage admin sur le bucket `propulspace-documents` (GAP-16 : `uploaded_by = auth.uid()`).
- **273 (phase 4) — RPC jalons** : `admin_upsert_project_step`, `admin_delete_project_step`, `admin_reorder_project_steps`.
- **274 (phase 6) — audit submit qualif** : insérer une ligne `audit_log` (lead, changement de statut, `ip_address`, `user_agent`) au passage `submitted` (GAP-39 ; complète B-017).

PAS de migration pour le PDF : `invoices.pdf_url`/`pdf_hash_sha256` existent déjà. Vues dashboard `projects_portal_health_v2` (mig. 249/251) et `propulspace_portal_state_v2` (mig. 250) **confirmées existantes**.

## 5. Découpage en phases (tranches verticales, gate de test à chaque palier)

Chaque phase traverse **admin → DB → portail client → test**. On ne passe à la suivante que si le type-check + build passent et que le critère de test est vert.

| Ph. | Tranche | Livrables clés | Gate |
|---|---|---|---|
| **0** | Fondations | routing étendu, `AdminClientsPage` + `useAdminClients`, `AdminClientPanel` (shell onglets) | L'admin liste les portails (statut/progression) et ouvre un panneau client |
| **1** | 💰 Factures | migration 270 (+271), `useAdminInvoices`, `AdminInvoiceForm` + acomptes, envoi via `send-portal-email`, (D1 PDF) | E2E : admin crée facture → client la voit → paie Stripe (test) → webhook → `paid` (GAP-31) |
| **2** | ✍️ Signatures | `useAdminSignatures`, `AdminSignatureDialog` → `admin-docuseal-create-submission`, liste + resend/download | E2E : admin envoie → mock webhook DocuSeal → `signed` → client télécharge PDF (GAP-32) |
| **3** | 📄 Documents | `useAdminDocuments`, `AdminDocumentUpload` (bucket + insert `uploaded_by`), toggle visibilité, delete | Admin upload + visibilité → client télécharge (signed URL) ; GAP-16 couvert |
| **4** | 🗺️ Jalons & infos | `useAdminProjectSteps` (CRUD+reorder), `AdminProjectStepForm`, `useAdminProjectInfo`, `OverviewTab` éditable + next_action | Admin édite étapes + infos + next_action → le portail reflète |
| **5** | 📊 Activité | `ActivityTab` (timeline `analytics_events` + `audit_log` par projet) | L'admin voit l'activité d'un client |
| **6** | 🔒 Durcissement + prod | tests RLS isolation (`tests/sql/propulspace_rls_isolation.sql`, GAP-33), ErrorBoundary autour de `EspaceClientApp` (GAP-34), migration 274 (audit submit), re-valid. serveur draft (GAP-25), checklist secrets/webhooks/templates posée | Suite E2E + tests RLS verts ; pilote activable de bout en bout |

## 6. Décisions ouvertes

- **D1 — PDF de facture FR → TRANCHÉ : (a)**. On génère le PDF dès la phase 1 via une edge `generate-invoice-pdf` calquée sur `generate-quote-pdf`, + migration 273 (`pdf_url`/`pdf_hash_sha256`). La phase 1 inclut donc cette sous-tâche.
- **D2 — Contenu légal (cycle public)** : (a) je scaffolde pages + bannière + template FR à faire relire par un juriste, ou (b) tu fournis les textes. Sans impact sur le pilote.

## 7. Jalon PUBLIC (cycle suivant — spec + plan dédiés)

Après validation du pilote : pages légales (GAP-20) + consentement RGPD `/diagnostic` (GAP-21) ; anti-spam serveur — rate-limit (GAP-22), anti-doublon 30j (GAP-23), Turnstile (GAP-24) ; quality score (GAP-27) ; Sentry (GAP-30) ; durcissement config (sender Brevo GAP-18, URLs GAP-19) ; tests RLS en CI (R-007). Effort estimé +8-14 j·h.

## 8. Gestion d'erreurs & tests

- **Erreurs** : `ErrorBoundary` autour du portail client (GAP-34) ; toasts sur échec d'écriture admin ; surfaçage des erreurs edge (statuts 4xx/5xx) ; UI optimiste avec rollback sur les CRUD jalons/docs.
- **Tests** : Playwright E2E par tranche (Stripe phase 1, DocuSeal phase 2) ; SQL RLS isolation phase 6 (client A ne voit pas les données de B ; cas `portal_project_id()` NULL) ; `npm run build` (type-check) après chaque phase ; vérif comportement réel (lancer le portail, parcours) avant de déclarer une phase terminée.

## 9. Références

- Audit : `.planning/AUDIT_LANCEMENT_PROPULSPACE_2026-06-03.md`
- Backlog/risques : `.planning/BACKLOG_PROPULSPACE.md`, `.planning/PROGRESS_PROPULSPACE.md`
- Données : `docs/propulspace-data-model.md`, `supabase/migrations/_baseline_propulspace_schema.md`
- Convention migrations : `supabase/migrations/README_PROPULSPACE.md` (ne pas rejouer ≤269)
