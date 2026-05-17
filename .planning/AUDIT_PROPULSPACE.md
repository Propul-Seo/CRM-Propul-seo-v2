# Audit Propul'Space — 2026-05-17

Stack : React 18 + Vite + TS + Supabase + React Router. Code portail = `src/modules/EspaceClient/`. Backend = schéma `propulspace.*` + colonnes `projects_v2.portal_*`.

---

## 1. Pont CRM → Portail (état réel)

### 1.1 Modèle d'identité
- **Source de vérité** : `projects_v2.portal_client_email` (nullable).
- **Auth** : magic link Supabase Auth → session `auth.users` créée à la volée (`shouldCreateUser: true`). Pas de row dans `public.users` pour les clients externes (trigger `handle_new_user` skip ces emails depuis migration `propulspace_150_skip_portal_clients`).
- **Résolution projet** : RPC `propulspace.portal_project_id()` lit `projects_v2 WHERE portal_client_email = email(auth.uid())` → renvoie l'`id` projet pour les RLS des vues `propulspace_*_v2`.
- Hook front : [`usePortalAuth.ts:34-41`](src/modules/EspaceClient/shared/hooks/usePortalAuth.ts:34) — lit `projects_v2` filtré par email session.

### 1.2 ⚠️ Trou critique côté CRM admin
**Aucune UI du CRM admin existant n'écrit dans `portal_client_email`.** Vérification grep exhaustive sur `src/` :
- 7 occurrences au total — toutes en lecture (`usePortalAuth.ts`) ou typage (`database.ts`).
- **0 occurrence dans** `ProjectsManagerV2/`, `CRMERP/`, `CRMERPLeadDetails/`, `ProjectDetails/`, `ContactDetails/`.

Conséquence : aujourd'hui, **le seul moyen de brancher un projet sur le portail est une mise à jour SQL manuelle**. C'est ce qu'on a fait pour le test E2E (`UPDATE projects_v2 SET portal_client_email = ... WHERE id = 74968202-...`).

Dette notée en mémoire projet (`feedback_coherence_existant` + SESSION.md) : à patcher en V3 CRM. C'est le **bloquant #1 pour la mise en prod** du portail.

### 1.3 Flow "lead qualifié → projet portail" (partiel)
- Lead qualifié (depuis flow public `/diagnostic`) écrit dans `propulspace.qualification_leads` (statut `new`/`contacted`/`qualified`/`converted`).
- Admin vue 9 : [`LeadsQualifiesPage.tsx`](src/modules/EspaceClient/admin/LeadsQualifiesPage.tsx) — kanban + actions disqualifier/promouvoir.
- **Action "promouvoir"** : status passe à `converted`, mais **aucune création automatique de row `projects_v2`** côté code. À vérifier dans [`useQualificationLeads.ts`](src/modules/EspaceClient/admin/hooks/useQualificationLeads.ts) — probablement un TODO ou une promotion manuelle attendue.

---

## 2. Inventaire actuel

### 2.1 Routes (70 fichiers EspaceClient)
| Préfixe | Module | Fichier d'entrée |
|---|---|---|
| `/diagnostic` (public) | Qualification flow 7 étapes | [`QualificationFlowPage.tsx`](src/modules/EspaceClient/qualification/QualificationFlowPage.tsx) |
| `/espace-client` (client auth) | Portail client (7 pages) | [`client/EspaceClientApp.tsx`](src/modules/EspaceClient/client/EspaceClientApp.tsx) |
| `/espace-client/login` | Magic link form | [`ClientLoginPage.tsx`](src/modules/EspaceClient/client/ClientLoginPage.tsx) |
| `/admin/propulspace` (admin auth) | Admin portail | [`admin/PropulspaceAdminApp.tsx`](src/modules/EspaceClient/admin/PropulspaceAdminApp.tsx) |

### 2.2 Pages client (7 routes + 3 statuts)
| Page | Lignes | Données |
|---|---|---|
| [`DashboardPage`](src/modules/EspaceClient/client/pages/DashboardPage.tsx) | 122 | KPIs avancement + activité récente |
| [`ProjectPage`](src/modules/EspaceClient/client/pages/ProjectPage.tsx) | 57 | Timeline étapes (`propulspace_project_steps_v2`) |
| [`DocumentsPage`](src/modules/EspaceClient/client/pages/DocumentsPage.tsx) | 109 | GED unifiée (`propulspace_documents_v2`) |
| [`InvoicesPage`](src/modules/EspaceClient/client/pages/InvoicesPage.tsx) | 170 | Factures + acomptes + liens Stripe |
| [`SignaturesPage`](src/modules/EspaceClient/client/pages/SignaturesPage.tsx) | 137 | DocuSeal |
| [`ProfilePage`](src/modules/EspaceClient/client/pages/ProfilePage.tsx) | 66 | Coordonnées + logout |
| [`HelpPage`](src/modules/EspaceClient/client/pages/HelpPage.tsx) | 94 | FAQ + contact |
| Statuts | — | [`MagicLinkExpiredPage`](src/modules/EspaceClient/client/pages/MagicLinkExpiredPage.tsx), [`PortalSuspendedPage`](src/modules/EspaceClient/client/pages/PortalSuspendedPage.tsx), [`NotFoundPortalPage`](src/modules/EspaceClient/client/pages/NotFoundPortalPage.tsx) |

### 2.3 Pages admin
- [`LeadsQualifiesPage`](src/modules/EspaceClient/admin/LeadsQualifiesPage.tsx) **(Vue 9)** — leads kanban + filtres + KPIs + sheet détail.
- [`DisqualifyLeadDialog`](src/modules/EspaceClient/admin/components/DisqualifyLeadDialog.tsx), [`LeadDetailSheet`](src/modules/EspaceClient/admin/components/LeadDetailSheet.tsx), [`LeadCard`](src/modules/EspaceClient/admin/components/LeadCard.tsx) — composants supports.
- Garde : [`PropulspaceAdminGuard.tsx`](src/modules/EspaceClient/admin/PropulspaceAdminGuard.tsx) — autorise email `team@propulseo-site.com`.

### 2.4 Page publique
- Qualification 7 étapes ([`QualificationFlowPage.tsx`](src/modules/EspaceClient/qualification/QualificationFlowPage.tsx)) — identité, situation, objectifs, features, brand, budget, finalisation.
- Sauvegarde draft via [`useQualificationDraft.ts`](src/modules/EspaceClient/qualification/hooks/useQualificationDraft.ts) (debounce 500 ms + localStorage + upsert distant).
- Composants : `ProgressBar`, `RadioCard`, `CheckboxCard`, `FileUploadZone`, `RecapAccordion`, `ConditionalBranch`.

### 2.5 Hooks
| Hook | Rôle |
|---|---|
| `usePortalAuth` | Magic link + session + résolution projet |
| `usePortalData<T>` (générique) | Wrapper RLS pour vues `propulspace_*_v2` |
| `usePortalInvoices/Documents/Signatures/Steps/Installments` | Instances typées |
| `useQualificationDraft` | Draft form public (debounce + persist) |
| `useQualificationLeads` | Admin : list + filtres + transitions statut |
| `usePropulspaceAdmin` | Garde admin (email check) |
| `useForceLightTheme` | Force thème clair (portail = light only) |

### 2.6 Composants partagés
13 primitives toutes < 100 lignes : `ActivityRow`, `Badge`, `BrandPill`, `EmptyState`, `FileIcon`, `Hero`, `KpiTile`, `Progress`, `SectionHead`, `StatusPage`, `TimelineStep` + 4 layouts (`PortalLayout`, `PortalShell`, `PortalTabBar`, `PortalContactFab`) + 1 guard (`PortalGuard`) + 1 provider (`PortalContext`).

### 2.7 Intégrations (wrappers présents, **pas câblés**)
[`integrations/stripe.ts`](src/modules/EspaceClient/shared/integrations/stripe.ts), [`docuseal.ts`](src/modules/EspaceClient/shared/integrations/docuseal.ts), [`calcom.ts`](src/modules/EspaceClient/shared/integrations/calcom.ts), [`email.ts`](src/modules/EspaceClient/shared/integrations/email.ts) (Brevo), [`pappers.ts`](src/modules/EspaceClient/shared/integrations/pappers.ts) — **fichiers stubs**, aucun appel real depuis les pages.

### 2.8 Backend — migrations ✅ DRIFT RÉSOLU 2026-05-17 (Sprint A.1)

**État initial (avant A.1)** : 1 seule migration locale (`propulspace_999_rollback`), 15 appliquées en prod (le SESSION.md ne listait que les 6 dernières).

**État après A.1** : ✅ 15 migrations versionnées localement + 1 rollback + 3 fichiers baseline + 1 README + 1 doc data model.

- [`20260515183614_propulspace_010_schema_init.sql`](supabase/migrations/20260515183614_propulspace_010_schema_init.sql) — schéma + sequence factures + fonction `next_invoice_number()`
- [`20260515183733_propulspace_020_extend_existing.sql`](supabase/migrations/20260515183733_propulspace_020_extend_existing.sql) — 15 colonnes `portal_*` + 3 `client_*` sur projects_v2
- [`20260515184427_propulspace_030_audit_log.sql`](supabase/migrations/20260515184427_propulspace_030_audit_log.sql) — table audit + fonction trigger
- [`20260515184632_propulspace_040_qualification.sql`](supabase/migrations/20260515184632_propulspace_040_qualification.sql) — qualification_leads + uploads
- [`20260515184848_propulspace_050_portal_tables.sql`](supabase/migrations/20260515184848_propulspace_050_portal_tables.sql) — 6 tables portail
- [`20260515185024_propulspace_060_webhooks_analytics.sql`](supabase/migrations/20260515185024_propulspace_060_webhooks_analytics.sql) — webhooks + analytics
- [`20260515191852_propulspace_070_rls_policies.sql`](supabase/migrations/20260515191852_propulspace_070_rls_policies.sql) — RLS 12 tables + fonctions helpers
- [`20260515192051_propulspace_080_storage_buckets.sql`](supabase/migrations/20260515192051_propulspace_080_storage_buckets.sql) — 2 buckets + policies
- [`20260515194639_propulspace_090_phase2_prep.sql`](supabase/migrations/20260515194639_propulspace_090_phase2_prep.sql) — `portal_client_email`
- [`20260516110432_propulspace_100_qualification_files_phase2.sql`](supabase/migrations/20260516110432_propulspace_100_qualification_files_phase2.sql) — fichiers qualification
- [`20260516111449_propulspace_110_qualification_public_rls.sql`](supabase/migrations/20260516111449_propulspace_110_qualification_public_rls.sql) — RLS publique drafts
- [`20260516111845_propulspace_120_qualification_public_view.sql`](supabase/migrations/20260516111845_propulspace_120_qualification_public_view.sql) — vue publique
- [`20260516113658_propulspace_130_portal_views.sql`](supabase/migrations/20260516113658_propulspace_130_portal_views.sql) — 5 vues portail
- [`20260516114658_propulspace_140_portal_auth_via_email.sql`](supabase/migrations/20260516114658_propulspace_140_portal_auth_via_email.sql) — refactor `portal_project_id()` (ADR-001)
- [`20260516115321_propulspace_150_skip_portal_clients.sql`](supabase/migrations/20260516115321_propulspace_150_skip_portal_clients.sql) — patch `handle_new_user()`

Documentation associée :
- [`supabase/migrations/README_PROPULSPACE.md`](supabase/migrations/README_PROPULSPACE.md) — note "ne pas rejouer en prod"
- [`supabase/migrations/_baseline_propulspace_schema.md`](supabase/migrations/_baseline_propulspace_schema.md) — snapshot final
- [`supabase/migrations/_baseline_projects_v2_portal_columns.md`](supabase/migrations/_baseline_projects_v2_portal_columns.md) — colonnes portal_* sur projects_v2
- [`docs/propulspace-data-model.md`](docs/propulspace-data-model.md) — modèle vulgarisé

**Risques sécurité découverts pendant le dump** (à traiter Sprint A.3) :
- 🔴 R-011 (critique) — fuite RGPD anon SELECT drafts
- 🟠 R-008 / R-012 / R-013 — durcissement RLS + GRANTs + colonnes vues
- 🟠 R-009 — pas d'index sur `portal_client_email`

### 2.9 Backend — vues SQL
5 vues `security_invoker` filtrées par `portal_project_id()` :
- `propulspace_project_steps_v2`
- `propulspace_invoices_v2`
- `propulspace_invoice_installments_v2`
- `propulspace_documents_v2`
- `propulspace_signatures_v2`

### 2.10 Edge functions
**Aucune edge function dédiée Propul'Space** dans `supabase/functions/`. Les 16 existantes sont héritées du CRM (admin-create-user, generate-quote-pdf, ringover-call, sync-project-budget, etc.).

---

## 3. Manquant (confirmé absent du code)

### Sub-phase E — admin Propul'Space
- ❌ **Vue 10** PortalDashboardPage admin (vue d'ensemble multi-projets portail)
- ❌ **Vue 11** PortalClientPanel — 6 onglets admin par projet (étapes, factures, docs, signatures, notif, profil)
- ❌ AlertDialogs destructifs (delete étape / facture / signature)
- ❌ NotificationsPanel admin

### Sub-phase F — onboarding + intégrations
- ❌ **Vue 12** OnboardingWizard 1re connexion client (logo, secteur, contacts clés, accès techniques)
- ❌ **Vues 16-19** pages success/cancel Stripe + DocuSeal
- ❌ Edge function Brevo (envoi mail transactionnel à la conversion lead, signature OK, facture émise)
- ❌ Edge function Stripe (création checkout session + webhook `invoice.paid`)
- ❌ Edge function DocuSeal (création envelope + webhook signature complétée)
- ❌ Câblage réel des wrappers `integrations/*.ts` dans les pages

### Pont CRM → Portail (ajouté à l'inventaire des manques)
- ❌ Champ `portal_client_email` éditable depuis le CRM admin (form projet / dialog dédié)
- ❌ Bouton "Activer le portail" sur fiche projet → set email + trigger 1er magic link
- ❌ Promotion automatique `qualification_lead → projects_v2 + portal_client_email` après action admin "convertir"

---

## 4. Dettes & risques

### 🔴 Critique
1. ~~**Drift migrations** — 6 migrations appliquées en prod absentes du repo.~~ ✅ **RÉSOLU 2026-05-17** (Sprint A.1) — 15 migrations versionnées + docs baseline. Voir section 2.8.
2. **Pas de pont CRM → portail UI** — activation manuelle par SQL uniquement. Bloquant prod. → Sprint A.2 (R-001)
3. **Templates Auth Supabase brandés LOCAGAME** — projet Supabase partagé. Mails envoyés au client = mauvais branding. → Sprint B.1 SMTP Brevo (R-004)
4. **RLS reposant entièrement sur `portal_project_id()`** — Sprint A.3 (R-003)
5. **🔴 Fuite RGPD `qualification_leads`** — découvert pendant A.1 : policies anon SELECT/UPDATE sans filtre identité. → Sprint A.3 prio 1 (R-011)

### 🟠 Important
5. **Wrappers intégrations stubs** — `stripe.ts`, `docuseal.ts`, etc. existent mais ne sont jamais appelés. Soit on les câble, soit on les supprime (mort code).
6. **Pas un seul test** sur tout le module (ni unit ni e2e). Le flow qualification 7 étapes + transitions admin sont des zones à risque régression.
7. **`emailRedirectTo` hardcodé `${origin}/espace-client`** ([usePortalAuth.ts:75](src/modules/EspaceClient/shared/hooks/usePortalAuth.ts:75)) — pas de paramètre, pas de support multi-domaine futur.
8. **Trigger `handle_new_user`** patché à chaud en `propulspace_150` après bug "Database error saving new user". Code du trigger pas versionné côté repo → on ne peut pas le relire.

### 🟡 Nice-to-have
9. `usePortalAuth` ne distingue pas "token expiré" vs "lien invalide" vs "no project". UX `/login` n'affiche pas pourquoi la session n'a pas été créée.
10. `DashboardPage` (122 lignes) et `InvoicesPage` (170 lignes) mélangent fetch + UI. Split possible en `<KpisRow />` + `<ActivityFeed />` + `<InvoicesList />`.
11. `useQualificationDraft` utilise localStorage avec un session_id côté client → vulnérable à manipulation locale. Acceptable pour un draft, mais à durcir si on veut traçabilité.
12. Pas de `react-error-boundary` au niveau `PortalShell` → un crash sur une page = page blanche complète.
13. `useForceLightTheme` — kludge CSS. Devrait être un attribut `data-theme="light"` sur le root portail plutôt qu'un hook qui force.

---

## 5. Pistes d'amélioration (recommandations Claude web)

### Pour les prochains sprints
- **Sprint A — Pont CRM (priorité absolue avant prod)**
  - Form "Activer le portail" sur fiche projet V3 : champ email + bouton "Envoyer le 1er magic link" → edge function qui valide email + trigger Supabase `signInWithOtp`.
  - Promotion lead qualifié → projet : edge function `convert_qualified_lead` qui crée la row `projects_v2`, copie `portal_client_email` depuis `qualification_leads.email`, archive le lead.
  - Dump des 6 migrations distantes en fichiers locaux versionnés (`supabase db dump --schema propulspace`).

- **Sprint B — Sub-phase E admin**
  - Vue 10 dashboard admin multi-projets (table + filtres statut portail actif/inactif).
  - Vue 11 panel client 6 onglets — réutiliser les vues existantes en passant `project_id` explicite côté admin (RLS bypass via `is_admin()`).
  - AlertDialogs destructifs avec confirmation typée (taper le nom du projet).

- **Sprint C — Sub-phase F intégrations**
  - Vue 12 OnboardingWizard : gate au 1er login si `projects_v2.portal_onboarded_at IS NULL`.
  - Edge functions Brevo / Stripe / DocuSeal avec retry + idempotency keys.
  - SMTP custom Brevo dans Supabase Auth → fix branding LOCAGAME.

### Améliorations transversales
- Tests Vitest sur `portal_project_id()` (mock session) + tests e2e Playwright sur `/diagnostic` + magic link mock.
- Error boundary par page portail.
- Couche `services/portal*.ts` pour sortir la logique fetch des hooks composants.
- Renommer `EspaceClient` → `Propulspace` côté code (cohérence avec nomenclature DB + docs).
- Documenter les vues `_v2` dans un schéma .md dédié (`docs/propulspace-data-model.md`).

---

## 6. Récapitulatif chiffres
- **70 fichiers** TS/TSX dans `src/modules/EspaceClient/`
- **7 pages client** + **1 page admin** (Vue 9) + **1 flow public** (qualification 7 étapes)
- **5 vues SQL** `propulspace_*_v2`
- **6 migrations** appliquées en prod, **1 seule** versionnée localement (rollback)
- **0 edge function** dédiée Propul'Space
- **0 test** sur tout le module
- **13 primitives** UI partagées (toutes < 100 lignes)
- **5 wrappers d'intégration** stubs (Stripe, DocuSeal, Cal.com, Brevo, Pappers)
