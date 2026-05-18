# Suivi Propul'Space — Journal de bord

> Document vivant. Mis à jour à chaque clôture de tâche via `/token-saver fin`.
> Le journal (section 3) est cumulatif et n'est **jamais** effacé.

---

## 1. État global

- **Sprint en cours** : Sprint A + B livrés côté code. **QA E2E à dérouler** prochaine session.
- **Tâche en cours** : QA E2E sur 18 tests (cf `docs/propulspace/QA_E2E_RUNBOOK.md`). Décisions en attente : verdict B.2 wizard (α/β) + multi-projets ADR-004.
- **Phase produit** : Phase 2 (code complet, branchements infra Stripe/DocuSeal/Brevo à faire par Lyes, QA E2E à dérouler avant prod)
- **Branche** : `feature/propulspace-phase-2-front` (exception multi-phases assumée, merge dans `main` fin Phase 2 après QA validée)
- **Project Supabase** : ERP (`tbuqctfgjjxnevmsvucl`)
- **Dernière mise à jour** : 2026-05-18 (clôture Sprint B complet + tests runtime portail réussis + bug multi-projets identifié)

---

## 2. Roadmap

### Sprint A — Foundations (3-4 jours)
- [x] **A.1** Dump des 15 migrations distantes Propul'Space — terminé 2026-05-17
- [x] **A.2a** Bouton "Activer le portail" sur fiche projet CRM — terminé 2026-05-17
- [ ] **A.2b** Refonte ClientLoginPage (login email/mdp + reset password + UX) — reporté
- [x] **A.3** Durcissement RLS + R-011/R-008/R-012/R-013 fermés — terminé 2026-05-18

→ ✋ STOP validation Sprint A complet avant Sprint B

### Sprint B — Préparation Précieuse (5-7 jours)
- [x] **B.1** Runbook Brevo Custom SMTP — code 0, doc complète. Branchement à faire par Lyes.
- [x] **B.2** OnboardingWizard livré MAIS **scope incorrect** (collecte d'infos métier au lieu de wizard d'accueil chaleureux). À refaire selon brief original (option α ou β).
- [x] **B.3** Stripe complet (2 edge fns + UI portail + migrations + runbook). Branchement compte Stripe à faire.
- [x] **B.4** DocuSeal (2 edge fns + runbook). UI signatures portail déjà existante. Branchement compte DocuSeal à faire.
- [x] **B.5** QA_E2E_RUNBOOK.md livré (18 tests). **À dérouler en prochaine session.**

→ ✋ Reste : décider verdict B.2 wizard (α/β) + ADR-004 multi-projets + faire QA E2E

→ ✋ STOP validation Sprint B complet avant Sprint C

### Sprint C — Confort équipe (5 jours)
- [ ] **C.1** Vue 10 admin dashboard multi-projets portail
- [ ] **C.2** Vue 11 admin panel client 6 onglets
- [ ] **C.3** AlertDialogs destructifs avec confirmation typée

---

## 3. Journal des tâches (cumulatif)

> Ordre chronologique. Une entrée par tâche close.

### ✅ Sprint B complet — Brevo + Onboarding + Stripe + DocuSeal + QA (terminé 2026-05-18)
**Démarré** : 2026-05-18
**Terminé** : 2026-05-18 (commits 57ca272 → d0e895a → a3d3e11)
**Périmètre** : compléter toute la prépa client Précieuse côté code, sans branchement infra (Stripe/DocuSeal/Brevo à brancher par Lyes via runbooks).

**Livrables clés** :
- **B.3 Stripe** : 2 migrations (210 statuts/colonnes Stripe + trigger recalc, 211 vue admin) + 2 edge functions (`portal-create-checkout-session` JWT verify ON, `stripe-webhook` JWT OFF + HMAC) + refonte UI InvoicesPage (boutons Payer par acompte + entière, bannière retour, polling 4×2s) + STRIPE_RUNBOOK.md.
- **B.1 Brevo** : BREVO_RUNBOOK.md exhaustif (compte, DKIM/SPF, templates 3 emails Auth, diagnostic).
- **B.2 OnboardingWizard** : migration 220/221 (vue + UNIQUE project_id) + hook useOnboarding (autosave + upsert StrictMode-safe) + Wizard 5 étapes + 5 step components + Banner sur dashboard. **⚠️ Scope incorrect** — refonte selon brief original Lyes prévue.
- **B.4 DocuSeal** : 2 edge functions (`admin-docuseal-create-submission` admin only, `docuseal-webhook` HMAC SHA-256 + idempotency key sans timestamp pour expired) + DOCUSEAL_RUNBOOK.md.
- **B.5 QA** : QA_E2E_RUNBOOK.md (18 tests E2E couvrant auth/onboarding/Stripe/DocuSeal/sécurité/robustesse).

**Code reviews** : 12 findings au total entre les sprints A.3, A.2b, B.3, B.2+B.4. 9 fixes appliqués, 3 différés (race webhook protégée par UNIQUE, orphelin DocuSeal V1 acceptable, edge case DELETE installments documenté).

**Tests runtime effectués** :
- Magic link → dashboard portail OK (après refresh HMR initial)
- Bannière onboarding visible et fonctionnelle
- Wizard 5 étapes interactif + stepper + autosave
- Login admin CRM OK avec `team@propulseo-site.com`
- Tentative activation portail sur 2e projet avec même email → **bug identifié** : Supabase Auth refuse (1 email = 1 user). Décision ADR-004 multi-projets non implémentée.

**Risques résiduels à traiter session QA** :
- Décision verdict B.2 wizard (α tout supprimer / β déplacer côté admin) → impacte combien de code à jeter
- Décision multi-projets (coder ~3-4h ou contournement V1)
- Branchements infra (Stripe / DocuSeal / Brevo) — bloque les tests live

---

### ✅ A.3 — Durcissement RLS + sécurité portail (terminé 2026-05-18)
**Démarré** : 2026-05-18
**Terminé** : 2026-05-18 (script de tests vert + code review traitée)
**Périmètre** : fermer les 4 risques sécurité documentés (R-011/R-013/R-012/R-008) avant d'attaquer Stripe (B.3).

**Approche** : 1 sous-tâche par risque, migration séparée à chaque fois, code review en fin de sprint, script de tests rejouable.

**Fichiers créés (6 migrations + 1 script tests)** :
- `supabase/migrations/20260518090000_propulspace_170_qualif_secure_draft.sql` — colonne `draft_session_token UUID NOT NULL`, drop 3 policies anon, 3 RPC `propulspace.qualif_*_draft` (SD) + 3 wrappers `public.qualif_*_draft` (PostgREST). Whitelist ~30 colonnes en update.
- `supabase/migrations/20260518100000_propulspace_180_revoke_anon_grants.sql` — REVOKE ALL FROM anon sur 13 tables/vues sensibles.
- `supabase/migrations/20260518110000_propulspace_190_restrict_client_views.sql` — DROP+CREATE 5 vues `propulspace_*_v2` avec whitelist colonnes safe (miroir des types `Portal*`). REVOKE anon inline (leçon hotfix).
- `supabase/migrations/20260518120000_propulspace_200_storage_path_filter.sql` — durcir policy Storage avec `name LIKE portal_project_id()||'/%'`.
- `supabase/migrations/20260518130000_propulspace_195_revoke_anon_views_after_recreate.sql` — hotfix : CREATE VIEW dans public ré-attribue ACL anon par défaut. Détecté par les tests.
- `supabase/migrations/20260518140000_propulspace_201_storage_policy_simplify.sql` — code review C-1 : un seul appel `portal_project_id()`.
- `.planning/A3_TESTS.sql` — script rejouable (3 sections : assertions structurelles + runtime anon + whitelist RPC).

**Fichiers modifiés (3)** :
- `src/modules/EspaceClient/qualification/hooks/useQualificationDraft.ts` — refonte complète : sessionStorage + 3 RPC + nouvelle méthode `submit()`. Purge ancienne clé localStorage.
- `src/modules/EspaceClient/qualification/QualificationFlowPage.tsx` — utilise `submit()` au lieu d'UPDATE direct sur vue, retire import `v2`.
- `src/modules/EspaceClient/qualification/constants.ts` — nouvelle clé `QUALIFICATION_TOKEN_SESSIONSTORAGE_KEY`.

**Migrations appliquées en prod** : 170, 180, 190, 195, 200, 201 (toutes vérifiées via MCP).

**Code review** : 7 findings ; 3 VRAIS corrigés (C-1, H-3 clearToken défensif, M-1 REVOKE inline 190) ; 4 FAUX/DIFFÉRÉS (H-1 chaînes vides volontaires, H-2 race préexistante hors-scope, M-2 DEFAULT 0 vérifié, L-1 supabase import).

**Risques résolus** :
- R-011 🔴 (fuite RGPD anon SELECT qualification_leads drafts)
- R-008 🟠 (Storage cross-tenant `propulspace-documents`)
- R-012 🟠 (colonnes admin exposées via vues SELECT *)
- R-013 🟠 (GRANTs anon excessifs sur tables/vues portail)

**Risques restants** : R-003 (tests RLS automatisés CI — différé), R-010 (doublon `qualification_uploads`/colonnes texte — backlog).

**ADR implicites** :
- Auth qualif anon = `draft_session_token` UUID en sessionStorage (perdu à la fermeture d'onglet, accepté pour V1, lien email de récup à Sprint B.1).
- Pas de vues `propulspace_*_admin_v2` créées maintenant (YAGNI ; pas de consommateur admin actuel).
- `qualification_leads_v2` reste `SELECT *` (admin-only de fait, pas de risque client).
- Tout `CREATE VIEW` dans `public` doit être suivi de `REVOKE ALL FROM anon` explicite (règle à appliquer désormais).

---

### ✅ A.2a — Bouton "Activer le portail" sur fiche projet V3 (terminé 2026-05-17)
**Démarré** : 2026-05-17
**Terminé** : 2026-05-17 (test E2E validé)
**Périmètre** : permettre à l'admin d'activer/désactiver le portail client depuis l'UI CRM (plus de SQL manuel). Bouton sur la fiche projet V3 → dialog → invitation Supabase Auth → page setup-password → login email/mdp côté client. Découpé en A.2a (cette session) + A.2b (refonte ClientLoginPage, reportée).

**Approche** : 4 questions de cadrage à Lyes (V2/V3, magic link vs invite, RLS, raison désactivation), brainstorming ADR avant code, code review en cours de route (3 fixes critiques appliqués).

**Fichiers créés (10)** :

Migration SQL :
- `supabase/migrations/20260517205900_propulspace_160_portal_activation_metadata.sql` — 3 colonnes manquantes + index `portal_client_email` (R-009) + trigger BEFORE UPDATE `guard_portal_columns_admin_only` + REVOKE EXECUTE de la trigger fn

Edge functions (toutes JWT verifié + helper inliné) :
- `supabase/functions/admin-portal-invite/index.ts` — v3 (rollback deleteUser si update KO + CORS x-application-name)
- `supabase/functions/admin-portal-resend-invite/index.ts` — v3 (signInWithOtp au lieu de generateLink qui n'envoie pas l'email)
- `supabase/functions/admin-portal-deactivate/index.ts` — v2 (copie email vers portal_previous_client_email + raison optionnelle)

Front admin :
- `src/modules/EspaceClient/admin/hooks/usePortalActivation.ts` — 3 mutations + flags loading
- `src/modules/EspaceClient/admin/components/PortalStatusSection.tsx` — section sidebar (badge actif/inactif + dropdown actions + création contact optionnelle)
- `src/modules/EspaceClient/admin/components/ActivatePortalDialog.tsx` — email obligatoire + Prénom/Nom/Téléphone optionnels + checkbox confirmation
- `src/modules/EspaceClient/admin/components/DeactivatePortalDialog.tsx` — confirmation typée nom du projet + raison optionnelle

Front client :
- `src/modules/EspaceClient/client/pages/SetupPasswordPage.tsx` — création mdp post-invitation + garde internal-user (refuse les comptes de `public.users`)

**Fichiers modifiés (4)** :
- `src/modules/EspaceClient/client/EspaceClientApp.tsx` — route `/espace-client/setup-password`
- `src/modules/ProjectDetailsV3Preview/components/ProjectV3RightSidebar.tsx` — intégration PortalStatusSection en haut + branchement `createAndLink`
- `src/types/database.ts` — 3 nouvelles colonnes ajoutées dans Row/Insert/Update
- `src/types/project-v2.ts` — bloc PORTAIL PROPUL'SPACE (7 colonnes)

**Migrations appliquées en prod** : `propulspace_160_portal_activation_metadata` via MCP.

**Edge functions déployées en prod** : 3 fonctions, JWT verify activé.

**Tests** : E2E manuel par Lyes → activation OK, mail reçu, setup-password OK, login espace client OK.

**Hors-périmètre (reporté A.2b)** :
- Refonte ClientLoginPage avec formulaire email/mdp soigné + reset password flow + tests Vitest.
- Pré-remplissage email depuis liste complète des contacts du projet (actuellement = 1er contact lié uniquement).

**Code review** : 4 findings high-confidence ; 3 vrais corrigés (C-1 race rollback, C-2 generateLink→signInWithOtp, H-2 garde internal-user) ; 1 faux positif validé (H-1 is_admin marche avec JWT user).

**Risques sécurité résolus** : R-009 (index `portal_client_email`).

**Risques restants à traiter** :
- Sprint A.3 — refonte policies `projects_v2` (policy globale `USING true` toujours en place, trigger pose un filet sur portal_* seulement).
- Sprint A.3 — R-011 (fuite RGPD anon qualification_leads).

**ADR implicites** :
- Auth client = email/mdp (pas magic link permanent), via flow invitation Supabase Auth.
- Trigger BEFORE UPDATE chirurgical sur colonnes portal_* plutôt que refonte complète des policies projects_v2.
- Helper edge function inliné dans chaque fonction (Edge Runtime ne supporte pas `_shared/`).

---

### ✅ A.1 — Dump des 15 migrations distantes (terminé 2026-05-17)
**Démarré** : 2026-05-17
**Terminé** : 2026-05-17
**Périmètre** : versionner localement les 15 migrations propulspace appliquées en prod via MCP (drift critique).
**Approche** : MCP `execute_sql` sur `supabase_migrations.schema_migrations` pour récupérer le SQL exact, une migration à la fois, review structurée + validation Lyes entre chaque.

**Fichiers créés (19)** :

Migrations SQL versionnées (15) :
- `supabase/migrations/20260515183614_propulspace_010_schema_init.sql`
- `supabase/migrations/20260515183733_propulspace_020_extend_existing.sql`
- `supabase/migrations/20260515184427_propulspace_030_audit_log.sql`
- `supabase/migrations/20260515184632_propulspace_040_qualification.sql`
- `supabase/migrations/20260515184848_propulspace_050_portal_tables.sql`
- `supabase/migrations/20260515185024_propulspace_060_webhooks_analytics.sql`
- `supabase/migrations/20260515191852_propulspace_070_rls_policies.sql`
- `supabase/migrations/20260515192051_propulspace_080_storage_buckets.sql`
- `supabase/migrations/20260515194639_propulspace_090_phase2_prep.sql`
- `supabase/migrations/20260516110432_propulspace_100_qualification_files_phase2.sql`
- `supabase/migrations/20260516111449_propulspace_110_qualification_public_rls.sql`
- `supabase/migrations/20260516111845_propulspace_120_qualification_public_view.sql`
- `supabase/migrations/20260516113658_propulspace_130_portal_views.sql`
- `supabase/migrations/20260516114658_propulspace_140_portal_auth_via_email.sql`
- `supabase/migrations/20260516115321_propulspace_150_skip_portal_clients.sql`

Documentation (4) :
- `supabase/migrations/README_PROPULSPACE.md` — note "ne pas rejouer en prod"
- `supabase/migrations/_baseline_propulspace_schema.md` — snapshot complet schéma
- `supabase/migrations/_baseline_projects_v2_portal_columns.md` — colonnes portal_* sur projects_v2
- `docs/propulspace-data-model.md` — modèle de données vulgarisé

**Fichiers modifiés** :
- `.planning/PROGRESS_PROPULSPACE.md` — sections 1, 2, 3, 6 mises à jour
- `.planning/AUDIT_PROPULSPACE.md` — section drift marquée résolue

**Tests** :
- ⚠️ NON TESTÉ via `supabase db reset` local (Docker absent, choix Option C documenté avec Lyes).
- ✅ Migrations déjà validées en prod via leur application réelle 15-16/05.
- ✅ Test E2E magic link confirmant cohérence DB + code (2026-05-17).

**Vérifications RLS / sécurité** :
- ✅ Toutes les policies relues, 5 risques sécurité identifiés et documentés (R-008 à R-013).
- ✅ Aucune action sur la prod (lecture seule via MCP).

**Hors-périmètre relevé (7 risques + 1 dette)** :
- R-008 Storage cross-tenant
- R-009 portal_client_email sans index ni unique
- R-010 doublon stockage uploads
- R-011 fuite RGPD anon SELECT drafts (🔴 critique)
- R-012 vues SELECT * exposent colonnes admin
- R-013 GRANTs anon excessifs
- R-014 try/catch silencieux handle_new_user
- Dette : trigger `on_auth_user_created` (créé en migration CRM non identifiée) non versionné côté propulspace

**Validation Lyes** : en attente (résumé final à présenter)

**Commit** : à venir après validation

**Notes** :
- Découverte clé : 15 migrations en prod, pas 6 (SESSION.md ne listait que les 6 récentes du 16/05).
- Workflow review-par-Claude-avant-écriture appliqué à partir de la 040 — efficace pour repérer les risques sécurité (R-008 à R-013).
- Option B (test sur branche Supabase) écartée après challenge de Lyes : les migrations sont déjà prouvées en prod, le test apporterait surtout une vérif de fidélité de copie (marginale vu qu'on copie via MCP fidèlement).

---

## 4. État DB ↔ Code (couverture applicative)

| Table `propulspace.*` | Migration | Types TS | Consommateur applicatif | Statut |
|---|---|---|---|---|
| `qualification_leads` | 040 | ✅ | `useQualificationDraft`, admin Vue 9 | ✅ Câblé |
| `qualification_uploads` | 040/100 | ✅ | `FileUploadZone` | ✅ Câblé |
| `project_steps` | 050 | ✅ | vue `_v2` + `ProjectPage` + `DashboardPage` | ✅ Câblé |
| `documents` | 050 | ✅ | vue `_v2` + `DocumentsPage` | ✅ Câblé |
| `invoices` | 050 | ✅ | vue `_v2` + `InvoicesPage` | ✅ Câblé |
| `invoice_installments` | 050 | ✅ | vue `_v2` (via `InvoicesPage`) | ✅ Câblé |
| `signatures` | 050 | ✅ | vue `_v2` + `SignaturesPage` | ✅ Câblé |
| `audit_log` | 030 | ✅ | aucun | 🟠 Orphelin |
| `onboarding_responses` | 050 | ✅ | aucun | 🟠 Prévu B.2 |
| `stripe_webhook_events` | 060 | ✅ | aucun | 🟠 Prévu B.3 |
| `docuseal_webhook_events` | 060 | ✅ | aucun | 🟠 Prévu B.4 |
| `analytics_events` | 060 | ✅ | aucun | 🟠 Backlog tracking |

### Vues SQL
| Vue | Migration | Consommateur |
|---|---|---|
| `propulspace_project_steps_v2` | 130 | `usePortalData` |
| `propulspace_invoices_v2` | 130 | `usePortalData` |
| `propulspace_invoice_installments_v2` | 130 | `usePortalData` |
| `propulspace_documents_v2` | 130 | `usePortalData` |
| `propulspace_signatures_v2` | 130 | `usePortalData` |

### Fonctions
| Fonction | Migration | Rôle | Statut |
|---|---|---|---|
| `propulspace.portal_project_id()` | 140 (refactor) | Résolution projet via `portal_client_email` | ✅ Utilisée RLS toutes vues `_v2` |
| `public.handle_new_user()` (trigger) | 150 (patch) | Skip création row `users` pour emails portail | ✅ Validé E2E magic link |

### Pont CRM → Portail (UI)
| Élément | Statut |
|---|---|
| Édition `projects_v2.portal_client_email` depuis le CRM admin | ❌ **Absent** — bloquant prod, prévu Sprint A.2 |
| Promotion automatique `qualification_lead → projects_v2` | ❌ Absent — backlog |
| Bouton "Envoyer 1er magic link" depuis fiche projet | ❌ Absent — prévu A.2 |

---

## 5. Décisions architecturales (ADR)

### ADR-001 — Auth portail via `projects_v2.portal_client_email`
- **Date** : 2026-05-16
- **Contexte** : éviter de polluer `public.users` (table interne agence) avec les emails de clients externes. Besoin de gérer aussi les cas multi-projets / changement de contact.
- **Décision** : la source de vérité est `projects_v2.portal_client_email`. RLS via RPC `propulspace.portal_project_id()` qui matche `email(auth.uid())`. Trigger `handle_new_user` skip les emails portail.
- **Conséquences** : refactor migration 140 + patch trigger migration 150. Le client n'apparaît jamais dans `public.users`.
- **Commits** : `bcd20ba` (refactor auth), `942590b` (hardening 5 issues).

### ADR-002 — Architecture "1 espace = 1 projet"
- **Date** : 2026-05 (Phase 1)
- **Contexte** : éviter une table `clients` séparée. Tout référence un `project_id`.
- **Décision** : `public.clients` reste vide. Toutes les vues `propulspace_*_v2` filtrent par `project_id`. Un client multi-projets aura plusieurs portails distincts (séparation des accès et factures).
- **Conséquences** : modèle simple, RGPD facilité (un email = un projet visible).

### ADR-003 — Factures + GED unifiée
- **Date** : 2026-05 (Phase 2)
- **Contexte** : workflow facture = snapshot polaroid + PDF Storage. Un seul PDF, deux vues (invoices + documents).
- **Décision** : `propulspace.invoices` produit un PDF auto-inséré dans `propulspace.documents` (via trigger ou code applicatif TBD). Legacy `project_documents_v2` intouché.

### ADR-004 — Multi-projets par client (un email peut accéder à plusieurs projets)
- **Date** : 2026-05-17 (tranchée pendant clôture A.1, Q-A1-3)
- **Contexte** : ADR-002 ("1 espace = 1 projet") restait ambigu sur le cas où un même client souscrit plusieurs prestations. Trancher : un email unique côté `auth.users` peut-il être rattaché à plusieurs `projects_v2` ?
- **Décision** : **Oui, un client peut avoir plusieurs projets via le même email portail.** Pas d'`UNIQUE` strict sur `projects_v2.portal_client_email`. L'espace client doit fournir un **switcher de projet** en haut de l'UI pour basculer entre ses projets.
- **Conséquences architecturales** :
  - 🔧 `propulspace.portal_project_id()` ne peut plus renvoyer 1 projet via `LIMIT 1` — doit gérer une **liste** et un concept de "projet actif".
  - 🔧 Nouvelle fonction `propulspace.portal_project_ids()` (pluriel) qui renvoie le `UUID[]` de tous les projets de l'email connecté.
  - 🔧 Le "projet actif" est stocké côté session client (localStorage / cookie / JWT custom claim) — à arbitrer.
  - 🔧 Toutes les RLS qui utilisent `portal_project_id()` doivent passer à `project_id = ANY(propulspace.portal_project_ids())` ou continuer à filtrer par projet actif uniquement (sécurité plus stricte).
  - 🔧 `PortalContext` doit exposer `projects: PortalProject[]` + `activeProject: PortalProject` + `setActiveProject(id)`.
  - 🔧 `PortalShell` doit afficher un dropdown switcher si `projects.length > 1`.
  - 🔧 `usePortalAuth` doit charger tous les projets de l'email, pas juste le premier.
- **Sprint cible** : à arbitrer — soit en parallèle de Sprint A.3 (durcissement RLS), soit dans un Sprint dédié post-Sprint B. Pour l'instant la prod n'a pas de client multi-projets, donc le `LIMIT 1` actuel fonctionne mais cache le futur besoin.
- **Note** : R-009 ("pas d'UNIQUE") n'est plus un bug latent → c'est désormais le **comportement souhaité**. Reste juste le besoin d'INDEX pour la perf.

---

## 6. Risques actifs

| ID | Description | Sévérité | Mitigation | Statut |
|---|---|---|---|---|
| R-001 | Pas de pont UI CRM → portail (édition `portal_client_email` manuelle SQL uniquement) | 🔴 Critique | Sprint A.2 | 🟡 Ouvert |
| R-003 | RLS reposant uniquement sur `portal_project_id()` sans tests automatisés | 🟠 Élevée | Sprint A.3 | 🟡 Ouvert |
| R-004 | Templates Auth Supabase brandés LOCAGAME (projet partagé) | 🟡 Moyenne | Sprint B.1 (SMTP Brevo) | 🟡 Ouvert |
| R-005 | `audit_log` non câblé alors qu'il sert au RGPD | 🟠 Élevée | À planifier — pas dans roadmap actuelle | 🟡 Ouvert |
| R-006 | Wrappers intégrations `stripe/docuseal/brevo/calcom.ts` stubs non appelés | 🟡 Moyenne | Sprints B.3 / B.4 | 🟡 Ouvert |
| R-007 | Aucun test (Vitest absent, pas de pgTAP) | 🟠 Élevée | Sprint A.3 amorce | 🟡 Ouvert |
| ~~R-008~~ | ~~Storage `propulspace-documents` policy client SELECT sans filtre projet~~ | 🟠 Élevée | Migration 200/201 | 🟢 **Résolu 2026-05-18** |
| **R-009** | **`projects_v2.portal_client_email` sans INDEX (perf — full scan à chaque appel RLS)** — ⚠️ partie UNIQUE retirée suite ADR-004 (multi-projets souhaité) | 🟡 Moyenne (perf seule) | Sprint A.3 ou backlog perf | 🟡 Ouvert |
| **R-010** | **Doublon stockage uploads qualification : table `qualification_uploads` ET colonnes `logo_file_url/brand_guide_url/existing_site_screenshots` sur `qualification_leads` (désync possible)** | 🟡 Moyenne | Backlog (consolider une source de vérité) | 🟡 Ouvert |
| ~~R-011~~ | ~~Fuite RGPD anon SELECT/UPDATE qualification_leads drafts~~ | 🔴 Critique | Migration 170 (draft_session_token + 3 RPC SECURITY DEFINER) | 🟢 **Résolu 2026-05-18** |
| ~~R-012~~ | ~~Vues `propulspace_*_v2` exposent colonnes admin via SELECT *~~ | 🟠 Élevée | Migration 190+195 (whitelist explicite + hotfix REVOKE) | 🟢 **Résolu 2026-05-18** (5 vues client ; `qualification_leads_v2` reste admin-only de fait) |
| ~~R-013~~ | ~~GRANTs anon excessifs sur 13 tables/vues portail~~ | 🟠 Élevée | Migration 180+195 (REVOKE ALL FROM anon + hotfix post-CREATE VIEW) | 🟢 **Résolu 2026-05-18** |
| **R-014** | **Try/catch silencieux dans `handle_new_user()` peut masquer INSERT failures pour internes** | 🟡 Moyenne | Monitoring logs Supabase (chercher "handle_new_user INSERT failed") | 🟡 Ouvert |
| **R-015** | **🔴 Escalade privilèges : `ps_docs_client_insert` ne contraint pas `uploaded_by` — un client peut s'auto-attribuer un user interne dans l'audit trail** (migration 070) | 🔴 Critique | Sprint A.3 (ajouter `AND uploaded_by IS NULL` au WITH CHECK) | 🟡 Ouvert |
| **R-016** | **`anon` peut INSERT dans `propulspace-uploads` sans path prefix — pollution/écrasement fichiers d'autres leads si UUID connu** (migration 080) | 🟠 Élevée | Sprint A.3 (`WITH CHECK ... name LIKE 'qualification/%'` ou RPC SECURITY DEFINER) | 🟡 Ouvert |
| **R-017** | **`ps_qualif_public_update_draft` autorise `status='submitted'` sans imposer `submitted_at IS NOT NULL` — pipeline admin pollué par faux positifs** (migration 110) | 🟠 Élevée | Sprint A.3 (ajouter contrainte dans WITH CHECK) | 🟡 Ouvert |

### Risques résolus
| ID | Description | Résolu | Détail |
|---|---|---|---|
| R-002 | Drift migrations propulspace (15 fichiers absents du repo) | 🟢 2026-05-17 | Tâche A.1 — 15 migrations versionnées + 4 docs baseline + README |

---

## 7. Questions ouvertes

| ID | Question | Posée par | Date | Statut |
|---|---|---|---|---|
| Q-001 | OnboardingWizard B.2 : bloquant à la 1re connexion ou skippable ? | — | 2026-05-17 | 🟡 À trancher avant B.2 |
| Q-002 | Tracking `analytics_events` : on câble ou on supprime la table ? | — | 2026-05-17 | 🟡 À trancher post-Sprint B |
| Q-003 | `audit_log` RGPD : on câble côté backend (trigger) ou côté front (insert volontaire) ? | — | 2026-05-17 | 🟡 À trancher post-Sprint B |

### Questions tranchées
| ID | Question | Tranchée | Décision |
|---|---|---|---|
| Q-A1-3 | Un client peut-il avoir plusieurs projets via le même email portail ? | 🟢 2026-05-17 | Oui — switcher de projet côté espace client. Voir ADR-004. |

---

## 8. Hors-périmètre détectés (backlog)

_Voir `.planning/BACKLOG_PROPULSPACE.md` pour le détail._

Headlines :
- `audit_log` non câblé (R-005)
- `analytics_events` sans tracking (Q-002)
- Wrappers intégrations stubs (R-006)
- Pas de tests automatisés (R-007)
- Renommer `EspaceClient/` → `Propulspace/` (cohérence nomenclature)
- `react-error-boundary` au niveau `PortalShell`
- Split `DashboardPage` / `InvoicesPage` (>100 lignes, fetch + UI mélangés)

---

## 9. Liens

- [Audit Propul'Space (snapshot 2026-05-17)](AUDIT_PROPULSPACE.md)
- [Backlog hors-périmètre](BACKLOG_PROPULSPACE.md) _(à créer au 1er hors-périmètre détecté)_
- [Dernière session (instantané)](SESSION.md)
- [PRD v2 EN](../docs/PRD_PROPULSPACE_v2_EN.md)
- [Data model Propul'Space](../docs/propulspace-data-model.md) _(à créer dans A.1)_

---

## 10. Conventions de mise à jour

1. **Maj obligatoire** à la clôture de chaque tâche (via `/token-saver fin`).
2. **Maj sections** : 1 (état global), 2 (roadmap), 3 (journal — append only).
3. **Maj situationnelles** : 4 (DB↔code) après ajout de table/vue ; 5 (ADR) à chaque décision non triviale ; 6 (risques) quand apparaît/résolu ; 7 (questions) quand posée/tranchée.
4. **Jamais effacer** : le journal (3) reste intact. Une tâche close ne disparaît pas.
5. **Date format** : ISO `YYYY-MM-DD` partout.
6. **Statut emoji** : 🟡 en cours / 🟢 résolu / 🔴 critique ouvert / 🟠 élevé ouvert.
