# Suivi Propul'Space — Journal de bord

> Document vivant. Mis à jour à chaque clôture de tâche via `/token-saver fin`.
> Le journal (section 3) est cumulatif et n'est **jamais** effacé.

---

## 1. État global

- **Sprint en cours** : **Sprint B.2.6 — Routage Site/ERP qualif + Lead→Projet conversion** ✅ **LIVRÉ** (5 blocs A/B/C/D/E).
- **Tâche en cours** : Action Lyes — set secrets Brevo + redéployer edge function + tester en main `/diagnostic` Site/ERP/Site+ERP.
- **Phase produit** : Phase 2 (welcome wizard recadré + qualif refondue + routage Site/ERP livré, branchements infra Stripe/DocuSeal/Brevo à finaliser par Lyes, QA E2E à dérouler).
- **Branche** : `feature/propulspace-phase-2-front` (exception multi-phases assumée, merge dans `main` fin Phase 2 après QA validée)
- **Project Supabase** : ERP (`tbuqctfgjjxnevmsvucl`)
- **Dernière mise à jour** : 2026-05-20 PM — Session A complète (5 blocs livrés, 23 fichiers, 5 commits).

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
- [x] **B.2** OnboardingWizard v1 scope incorrect → **B.2 recadré livré 2026-05-19** : nouveau WelcomeWizard 5 étapes (Bienvenue / Coordonnées / Préférences / Tour / Done) avec DA Sky Aurora (B3) + animation E (orbes flottants). V1 conservée pour future page Configuration du projet (PR 2).
- [x] **B.3** Stripe complet (2 edge fns + UI portail + migrations + runbook). Branchement compte Stripe à faire.
- [x] **B.4** DocuSeal (2 edge fns + runbook). UI signatures portail déjà existante. Branchement compte DocuSeal à faire.
- [x] **B.5** QA_E2E_RUNBOOK.md livré (18 tests). **À dérouler en prochaine session.**
- [x] **B.2.5** Refonte questionnaire qualif `/diagnostic` — terminée 2026-05-20 (DA Sky Aurora + 4 "Autre" éditables + Réservation + Charte souple + ThankYou variante A). Migrations 240 + 241 appliquées en prod.

→ ✋ Reste : décider verdict B.2 wizard (α/β) + ADR-004 multi-projets + faire QA E2E + brancher Brevo + ajouter notif équipe post-submit

→ ✋ STOP validation Sprint B complet avant Sprint C

### Sprint C — Confort équipe (5 jours)
- [ ] **C.1** Vue 10 admin dashboard multi-projets portail
- [ ] **C.2** Vue 11 admin panel client 6 onglets
- [ ] **C.3** AlertDialogs destructifs avec confirmation typée

---

## 3. Journal des tâches (cumulatif)

> Ordre chronologique. Une entrée par tâche close.

### ✅ Hot fixes QA + isolation sessions auth CRM ↔ portail (terminé 2026-05-18 PM)
**Démarré** : 2026-05-18 (après-midi, début QA E2E)
**Terminé** : 2026-05-18 (commit 9208e62)
**Périmètre** : 3 bugs critiques détectés en QA + 1 refonte architecturale ciblée.

**Bugs fixés en cours de QA** :
- **Fix A — dialog activation portail** : `ActivatePortalDialog` masque les champs Prénom/Nom/Téléphone si un contact "Principal" existe déjà sur le projet. Avant : tentative de création doublon → 409 contrainte unique → message "Le contact n'a pas pu être créé". Maintenant : message info inline + l'activation passe juste l'email sans création contact.
- **Fix message d'erreur edge function** : `usePortalActivation` lit le vrai body via `error.context.json()` au lieu du générique "Edge Function returned a non-2xx status code".
- **Fix redirection post-login portail** : `ClientLoginPage` ajoute un `useEffect` qui détecte `state.status === 'ready'` et redirige vers `/espace-client`. Avant : le commentaire prétendait que `PortalGuard` redirigeait, mais `/login` est hors `PortalGuard` → user restait sur login sans feedback.

**Refonte isolation auth (root cause du hang signInWithPassword)** :
- Diagnostic : `Multiple GoTrueClient instances detected` + un seul `storageKey` partagé → un admin connecté au CRM bloquait toute connexion portail dans le même navigateur (hang indéfini).
- Solution : 2 clients supabase-js distincts avec `storageKey` explicite :
  - `supabase` → `'sb-crm-propulseo-auth'` (CRM admin)
  - `portalSupabase` (nouveau) → `'sb-propulspace-auth'` (portail client)
- Spec : `docs/superpowers/specs/2026-05-18-auth-isolation-portail-design.md`
- Code basculé sur `portalSupabase` : `usePortalAuth`, `PasswordSetForm`, `SetupPasswordPage`, `ResetPasswordPage`, `InvoicesPage`, `usePortalData` (+ `v2Portal` proxy), `useOnboarding`.
- Code review : 3 issues remontées, 2 vraies fixées (storageKey CRM explicite documenté dans spec migration, `getSession()` fallback dans `usePortalAuth` pour Safari ITP/PWA), 1 faux positif stylistique différé (`v2Portal` non utilisé dans `usePortalAuth` — appel direct `from('projects_v2')` équivalent).

**Validation** :
- `tsc --noEmit` clean.
- Test runtime : `portalSupabase.signInWithPassword` répond en 112ms après un `supabase.signInWithPassword` (même browser) → plus de hang.
- Storage keys distincts vérifiés via `supabase.auth.storageKey` / `portalSupabase.auth.storageKey`.

**Limites assumées** :
- Warning `Multiple GoTrueClient instances` persiste (déclenché par supabase-js sur le nombre d'instances, pas sur la collision de storage keys — cf [auth-js#762](https://github.com/supabase/auth-js/issues/762)). Cosmétique, inoffensif depuis que les storage keys sont distincts.
- Migration : tous les utilisateurs devront se reconnecter une fois après déploiement (ancienne clé `sb-tbuqctfg-auth-token` orpheline). Acceptable phase QA.

**Hors-périmètre** :
- Multi-projets ADR-004 (un email = un projet) : non traité.
- Refonte wizard onboarding B.2 (α/β) : non traité.
- Suite QA E2E des 18 tests : reportée à la prochaine session, maintenant que le flow login portail est fonctionnel.

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

### ✅ WelcomeWizard v2 recadré + DA Sky Aurora + Animation E (terminé 2026-05-19)
**Démarré** : 2026-05-19 (matin, recadrage Sprint B.2 par Lyes via brief Claude design)
**Terminé** : 2026-05-19 (commit e1de4e3)
**Périmètre** : refonte complète du wizard d'accueil portail client (5 étapes), direction artistique Sky Aurora, animation finale orbes flottants, code review.

**Migrations DB appliquées** :
- `230_welcome_wizard.sql` : +11 colonnes welcome_* sur `onboarding_responses`, +3 colonnes `client_first_name/phone/company` sur `projects_v2`, trigger SECURITY DEFINER `sync_onboarding_to_project_v2`, backfill rétroactif `inherited_from_qualification_id`, vue `propulspace_onboarding_v2` étendue avec REVOKE anon.
- `231_fix_onboarding_view_security_invoker.sql` : ALTER VIEW SET (security_invoker=true) — bug latent depuis 220, révélé par 230.
- `232_onboarding_grant_authenticated.sql` : GRANT SELECT/INSERT/UPDATE à authenticated sur la TABLE sous-jacente. La migration 220 avait oublié les GRANTs, masqué par SECURITY DEFINER, révélé par 231 → 403 sur tous les SELECT/INSERT du wizard.
- `233_fix_sync_trigger_direct_assign.sql` : trigger sync — COALESCE → assignation directe NEW. Fix HIGH #1 code review : désync silencieuse si client efface volontairement un champ.

**Fichiers code** :
- `welcome/useWelcomeWizard.ts` (199 lignes) — hook autosave debounce 500ms, fetch qualif, pré-remplissage one-shot, dismiss/complete/shouldOpenAutomatically. Export `DISMISS_THRESHOLD` partagé.
- `welcome/WelcomeWizard.tsx` (175 lignes) — shell Dialog full-screen avec DA Sky Aurora (backgroundImage + backgroundColor inline pour override theme dark CRM), header pill brandée tricolore, progress dots animés framer-motion, footer avec CTA gradient. Fix `[&>button]:hidden` (masque X auto shadcn) + retrait du `relative` qui cassait le centrage `fixed`.
- `welcome/steps/Step1Welcome.tsx` + `Step1QualifRecap.tsx` — split chaleureux gauche + mini-cards 2×2 droite (gradient pastel par catégorie) ou CTA `/diagnostic` si pas de qualif.
- `welcome/steps/Step2Contact.tsx` — carte identité avec liseré tricolore top, 5 lignes éditables inline + autosave.
- `welcome/steps/Step3Preferences.tsx` — pills mutex/multi + toggle custom (le Switch shadcn applique bg-background dark sur le thumb → rond noir invisible).
- `welcome/steps/Step4Tour.tsx` — carrousel spotlight 7 sections, flèches navigation, swipe trackpad onWheel + drag framer-motion.
- `welcome/steps/Step5Done.tsx` — animation E (orbes flottants) : 5 grandes particules qui dérivent en boucle 8s, vibe organique premium. Halo + gradient text italic prénom.
- `welcome/WelcomeBanner.tsx` (palier 9) — bannière dashboard "Reprendre l'onboarding" affichée si `welcome_dismissed_count ≥ DISMISS_THRESHOLD`. Note dette technique : double instance du hook avec WelcomeWizard, à refondre palier 10.

**Pages DEV preview** (à retirer au cleanup) :
- `/dev/welcome-variants` (5 variantes Step 5)
- `/dev/wizard-variants` (5 directions wizard A-E)
- `/dev/aurora-light` (4 sous-variantes light de B)
- `/dev/sky-aurora` (Sky Aurora décliné sur 5 steps)
- `/dev/sky-step5-anims` (5 variantes animation Step 5)

**Décisions design tranchées par Lyes** :
- Direction B3 Sky Aurora (bleu pâle + auroras diagonales sky/violet/peach + cards blanches)
- Animation Step 5 = E (orbes flottants)
- Modale 820px × ~380px (carré aplati centré)
- Bouton "Terminer plus tard" en outline white (visible)
- Bouton DEV temporaire top-right pour test (à retirer palier 10)

**Code review (verdict NEEDS FIXES)** :
- HIGH #1 : COALESCE silent erasure → fixé via migration 233.
- HIGH #2 : double instance hook Banner+Wizard → différé palier 10 (PortalShell context). Note ajoutée dans WelcomeBanner.tsx.
- MEDIUM #3 : DISMISS_THRESHOLD dupliqué → fixé via export.
- MEDIUM #4 : inline styles shadows magic values → différé (refacto tokens design ultérieure).

**Hors-périmètre / différé** :
- Palier 10 : PortalShell auto-open au login (retire le bouton DEV).
- Cleanup pages /dev/* (à supprimer après validation Lyes).
- Tokenization des shadows inline en variables CSS portal-theme.css.
- Tests E2E parcours complet du wizard (T5/T6/T7 du QA_E2E_RUNBOOK + tests autosave + sync trigger).

**Validation** :
- `tsc --noEmit` clean après chaque palier.
- 0 erreur browser console.
- Sync trigger validé en SQL : `welcome_first_name="Lyes"` → `client_first_name="Lyes"` dans projects_v2.
- 3 fixes critiques en cours de polish (Switch noir, modale non centrée, bg-surface-3 dark theme) résolus en debug live avec systematic-debugging skill.

---

### ✅ Refonte questionnaire qualif `/diagnostic` + Cleanup palier 10 (terminé 2026-05-20)

**Démarré** : 2026-05-19 (palier 10 PortalShell)
**Terminé** : 2026-05-20
**Périmètre** : Palier 10 PortalShell + cleanup V1 + refonte complète du questionnaire de qualification public.

**Livré côté palier 10** :
- PortalShell auto-open du WelcomeWizard via context partagé (`WelcomeWizardContext.tsx`). Dette HIGH #2 fermée : Banner et Wizard partagent maintenant une seule instance de `useWelcomeWizard`.
- Retrait `OnboardingBanner` (V1) du Dashboard + retrait 5 routes `/dev/*` dans `App.tsx` + suppression `welcome/dev/` (26 fichiers).
- Module Onboarding V1 (`useOnboarding` + `OnboardingWizard`) **conservé** pour la future page Configuration projet (PR 2).

**Livré côté qualif** :
- DA Sky Aurora cohérente avec WelcomeWizard (gradient sky→lavande→peach + auroras diagonales + cards radio/checkbox gradient soft + dots progress).
- `ConditionalBranch` réécrit v3 (ultra simple `if (!show) return null` + `.ps-fade-in`). Les versions Framer Motion AnimatePresence et CSS+setTimeout avaient bug (animations bloquées à mi-parcours).
- Apparition progressive **uniquement** sur branches conditionnelles métier (Step 2 site, Step 4 e-commerce + Réservation, Step 5 charte). Step 1 simplifié : 5 champs visibles d'office (suite retour Lyes).
- 5 champs "Précisez" qui apparaissent quand "Autre" coché (secteur, problèmes, objectif, fonctionnalités, plateforme).
- P3 Réservation : `RESERVATION_TYPES` (5 options) + apparition conditionnelle après e-commerce dans Step 4.
- P4 Charte souple : formats élargis (pdf/png/jpg/ai/svg/zip/sketch/fig) + champ Input URL externe (WeTransfer/Notion/Drive).
- Page ThankYou : variante A retenue (Confirmation premium silencieuse) avec 2 CTAs : Réserver appel cal.com (TODO URL réelle) + Voir nos accompagnements (`propulseo-site.com/nos-accompagnements`).
- Scroll fix : `overflow-x-hidden` retiré du wrapper (forçait `overflow-y: auto` qui bloquait le scroll vertical) + gradient inline override le bg portal-theme.
- 5 placeholders client neutralisés (Sophie/Précieuse/messika.com → fake génériques).
- `console.error` du hook wrappés en `if (import.meta.env.DEV)` (3 occurrences, anti-fuite info prod).

**Migrations appliquées en prod** :
- **240 — `propulspace_240_qualif_other_fields_and_existing_site_text`** :
  - `has_existing_site` boolean→text (fix bug envoi 400, RPC plantait sur cast `'oui'::boolean`)
  - 4 colonnes `desired_features_other`, `main_problems_other`, `main_goal_other`, `ecommerce_platform_other` text NULL
  - View `public.qualification_leads_v2` recréée
  - RPC `propulspace.qualif_update_draft` + `qualif_get_draft` recréées
- **241 — `propulspace_241_qualif_brand_guide_external_link`** :
  - 1 colonne `brand_guide_external_link text NULL`
  - View + RPCs recréées

**Fichiers touchés** :
- Module qualif : `QualificationFlowPage.tsx`, `ThankYouPage.tsx`, `_StepShell.tsx`, `Step1` à `Step7`, `conditionalRules.ts`, `constants.ts`, `schema.ts`, `useQualificationDraft.ts`, `RecapAccordion.tsx`, `RadioCard.tsx`, `CheckboxCard.tsx`, `ProgressBar.tsx`, `SaveIndicator.tsx`, `ConditionalBranch.tsx`
- Nouveaux : `hooks/useProgressiveReveal.ts`, `thankyou/ThankYouA.tsx`
- Welcome / portal : `WelcomeWizardContext.tsx`, `PortalShell.tsx`, `WelcomeWizard.tsx`, `WelcomeBanner.tsx`, `DashboardPage.tsx`, `App.tsx`
- Supprimés : 26 fichiers `welcome/dev/*` + 2 variantes ThankYouB/C

**Code reviews** :
- Round 1 (post-refonte) : 6 issues, 4 fixées (HIGH 1+2 orphan cleanup *_other + RecapAccordion, MED 4 console.error DEV, LOW 5 maxLength). 2 différées (MED 3 validation conditionnelle cohérente, LOW 6 useProgressiveReveal pas un hook React).
- Round 2 (post-P3/P4/ThankYou) : 5 issues + 1 faux positif, 3 fixées (HIGH 1 brand_guide_external_link orphan reset, MED 1 TODO URL cal.com, LOW 2 doublon RecapAccordion section 5). 2 différées (HIGH 2 path erreur charte, MED 2 ecommerceRevealed complexité).

**Validation Lyes** :
- Variante A ThankYou validée le 2026-05-20 + ajout CTA "Voir nos accompagnements" → `propulseo-site.com/nos-accompagnements`.
- Refonte testée côté browser (parcours complet → diagnostic-envoye atteint).

**Hors-périmètre / risques actifs** :
- Edge function `questionnaire-send-emails` reste un STUB. Aucun email envoyé client ni équipe.
- Pas de notification équipe (Slack/email) sur `submitted_at` → risque "rater un lead" si formulaire mis live.
- Pas de conversion automatique lead → projet CRM (`converted_to_project_id` reste NULL).
- URL `cal.com/propulseo/diagnostic` dans ThankYouA = placeholder fictif, TODO inline ajouté.
- "Audit + recherche thématique pertinente" (demande Lyes du 2026-05-19) jamais clarifié.

---

### ✅ Bloc A partiel — Migration 242 + constants ERP + URL Calendly (terminé 2026-05-20 PM)

**Démarré** : 2026-05-20 (après-midi)
**Terminé** : 2026-05-20 (avant atteinte 50% contexte, save préventif)
**Périmètre** : démarrer le routage Site/Site+ERP/ERP du questionnaire de qualification. Côté DB livré. Côté front : constants seulement (schema + composants reportés à prochaine session).

**Décisions tranchées avec Lyes en début de session** :
- **Q1 — Notification équipe post-submit** : email Brevo vers `team@propulseo-site.com` (pas de WhatsApp / CallMeBot finalement, simplification).
- **Q2 — Brevo** : compte créé par Lyes, sender `lyes.triki@propulseo-site.com` vérifié DKIM+DMARC. Clé API + templates à fournir avant Bloc D.
- **Q3 — Conversion lead→projet** : approche semi-auto avec colonne dédiée "Questionnaire complété" dans LeadsV3 Kanban (tout à gauche, onglet selon project_type). Bouton "Convertir en projet" → crée projet + active portail en 1 clic.
- **Q4 — Suppression** : hard delete avec confirmation (pour virer les projets fakes). Reporté à Session B.
- **Q5 — Parallélisme** : Option A — Lyes attend merge Phase 2 avant de paralléliser sur main.
- **Q6 — ERP scope** : projets ERP stratégiques, on fait le questionnaire complet avec branche dédiée (Option A). Pas juste un tag de routage.
- **Q7 — Status archive** : pas de nouveau status `archived`, on réutilise `unqualified` existant.

**Livré DB** :
- **Migration 242** appliquée en prod (`propulspace_242_qualif_project_type_and_erp`) :
  - `project_type text NOT NULL DEFAULT 'site'` CHECK in (site/site_erp/erp). Backfill : 4 leads existants → 'site'.
  - 10 colonnes ERP nullable : `erp_current_system` (excel/odoo/sage/pennylane/notion/papier/aucun/autre_erp/autre), `erp_current_system_other`, `erp_data_volume` (<1000/1000_10000/>10000/je_sais_pas), `erp_modules text[]`, `erp_modules_other`, `erp_users_count` (<5/5_20/20_50/>50), `erp_mobile_required boolean`, `erp_sso_type` (google/microsoft/email_password/none), `erp_integrations text[]`, `erp_integrations_other`.
  - View `public.qualification_leads_v2` recréée avec 11 nouvelles colonnes + REVOKE anon + GRANT authenticated/service_role.
  - RPC `propulspace.qualif_update_draft` recréée — whitelist étendue à `project_type` + 10 colonnes ERP (avec gestion `boolean` et `text[]` via jsonb).

**Livré code** :
- `src/modules/EspaceClient/qualification/constants.ts` (150 lignes) :
  - Constante `PROJECT_TYPES` (3 valeurs : site/site_erp/erp avec label + hint FR).
  - 3 totaux dynamiques : `QUALIF_TOTAL_STEPS_SITE=8`, `QUALIF_TOTAL_STEPS_ERP=7`, `QUALIF_TOTAL_STEPS_SITE_ERP=12`.
  - Re-export des 6 enums ERP depuis `./constants.erp`.
- `src/modules/EspaceClient/qualification/constants.erp.ts` (nouveau, 55 lignes) — split anti-200-lignes :
  - `ERP_CURRENT_SYSTEMS` (8 options), `ERP_DATA_VOLUMES` (4), `ERP_MODULES` (9 multi-select), `ERP_USERS_COUNT` (4), `ERP_SSO_TYPES` (4), `ERP_INTEGRATIONS` (6 multi-select).
- `src/modules/EspaceClient/qualification/thankyou/ThankYouA.tsx` — URL `cal.com/propulseo/diagnostic` (placeholder) remplacée par `calendly.com/team-propulseo-site/30min` (réel). Commentaire TODO inline retiré.

**Code review** (1 round, 2 findings) :
- MEDIUM — styles inline ThankYouA.tsx (lignes 8, 13, 15, 54) : **FAUX POSITIF** — dette pré-existante intentionnelle (override bg dark theme du portal-theme), hors scope cette session.
- LOW — `'autre_erp'` orphelin dans CHECK SQL (présent mais pas dans constants TS) : **DIFFÉRÉ** — non bloquant, `'autre'` couvre le cas, à nettoyer dans une mini-migration plus tard si on rebouge ces CHECKs.

**Hors-périmètre (reporté prochaine session)** :
- Schema Zod : step0 + 4 schemas ERP
- Step0 component (3 cards site/site_erp/erp)
- 4 step components ERP (system / modules / users / integrations)
- QualificationFlowPage : routage conditionnel selon project_type
- ProgressBar dynamique
- RecapAccordion : sections ERP-specific

**Hors-périmètre (Bloc B)** : Colonne LeadsV3 "Questionnaire complété" + routage Site/ERP + LeadCardV3 + panel détails qualif.

**Hors-périmètre (Bloc C)** : Conversion 1 clic + activation portail + bouton archiver lead (status `unqualified` + raison dans `notes`).

**Hors-périmètre (Bloc D)** : Edge function Brevo email équipe (attend clé API + 2 templates de Lyes).

**Hors-périmètre (Session B autre jour)** : Hard delete leads + projets avec confirmation typée + cascade documents/factures/portail/signatures/contacts.

**Validation** :
- Migration 242 : `apply_migration` MCP success ; verif `SELECT project_type FROM qualification_leads GROUP BY project_type` → 4 leads avec 'site'.
- Advisors : 1 warning `security_definer_view` sur `qualification_leads_v2` = dette pré-existante (la vue était déjà SECURITY DEFINER avant 242). Pas notre régression.
- Pas de validation runtime (front pas encore consommateur des constants).

**Risques résiduels** :
- View `qualification_leads_v2` toujours en SECURITY DEFINER (warning Supabase advisor). Aligner sur le pattern `propulspace_onboarding_v2` (security_invoker=true) → nécessite une policy RLS admin SELECT sur la table. À traiter en backlog sécurité.
- `'autre_erp'` orphelin dans CHECK SQL (différé code review).
- Notif équipe post-submit toujours absente (edge function reste stub). Risque "rater un lead" si formulaire mis live.

---

### ✅ Session A complète — Lead→Projet end-to-end (terminé 2026-05-20 PM)

**Démarré** : 2026-05-20 (suite du Bloc A partiel)
**Terminé** : 2026-05-20 (5 blocs A/B/C/D/E livrés en 1 session étendue)
**Périmètre** : ajouter le routage Site/Site+ERP/ERP au questionnaire, créer la colonne "Questionnaire complété" dans LeadsV3 Kanban, automatiser la conversion lead→projet+portail, et brancher Brevo pour la notification équipe.

**Livré code (23 fichiers)** :

Bloc A — Questionnaire ERP front :
- `qualification/constants.erp.ts` (nouveau) : 6 enums ERP (systems/volumes/modules/users/SSO/integrations)
- `qualification/schema.erp.ts` (nouveau) : 4 schemas Zod ERP avec superRefine "autre"
- `qualification/schema.ts` : `step0Schema` + 3 arrays `STEP_SCHEMAS_SITE/ERP/SITE_ERP` + `QualificationDraft` élargi
- `qualification/steps/Step0ProjectType.tsx` (nouveau) : 3 cards radio avec emoji
- `qualification/steps/StepErp1System.tsx` (nouveau) : système actuel + volume
- `qualification/steps/StepErp2Modules.tsx` (nouveau) : checkboxes modules multi-select
- `qualification/steps/StepErp3Users.tsx` (nouveau) : nb utilisateurs + mobile + SSO
- `qualification/steps/StepErp4Integrations.tsx` (nouveau) : checkboxes intégrations
- `qualification/flowRouter.tsx` (nouveau) : `getStepFlow(project_type)` + skip logic
- `qualification/QualificationFlowPage.tsx` (refactor complet) : utilise flowRouter, `currentStep` démarre à 0
- `qualification/components/ProgressBar.tsx` : `totalSteps` en prop (dynamique 8/8/12)
- `qualification/components/SaveIndicator.tsx` : `totalSteps` en prop
- `qualification/components/recapSections.ts` (nouveau, split anti-200-lignes) : `buildSections(draft)` qui retourne sections selon `project_type`
- `qualification/components/RecapAccordion.tsx` : simplifié, consomme `recapSections`
- `qualification/hooks/useQualificationDraft.ts` : whitelist étendue à `project_type` + 10 colonnes ERP

Bloc B — Colonne LeadsV3 :
- `LeadsV3/utils/leadStatusMapping.ts` : statut virtuel `questionnaire_complete` en tête (Site web + ERP), color #0ea5e9
- `LeadsV3/hooks/useLeadsV3Qualification.ts` (nouveau) : fetch `qualification_leads_v2` submitted+non converti, filtré par scope (site → site|site_erp, erp → erp|site_erp)
- `LeadsV3/utils/leadAdapters.ts` : `qualifToCard()` mapping QualificationLead → LeadCardData
- `LeadsV3/components/QualificationLeadDetailsSheet.tsx` (nouveau) : drawer right avec RecapAccordion réutilisé + 2 boutons
- `LeadsV3/LeadsV3Page.tsx` : merge cards qualif en tête, `onLeadClick` → ouvre drawer si qualif, drag-drop bloqué pour qualifs

Bloc C — Conversion + Archive :
- `LeadsV3/hooks/useConvertQualifLead.ts` (nouveau) : insert `projects_v2` (mapping presta_type/category selon project_type, midpoint budget), update `qualification_leads` (status=converted, converted_to_project_id, converted_at), invoke `admin-portal-invite` si activatePortal
- `LeadsV3/hooks/useArchiveQualifLead.ts` (nouveau) : update status='unqualified' + append raison dans notes
- `LeadsV3/components/QualificationLeadDetailsSheet.tsx` : 2 boutons drawer + 2 AlertDialogs (convert avec checkbox "Activer portail", archive avec textarea raison)
- `LeadsV3/LeadsV3Page.tsx` : passe `qualif.refetch` en `onActionComplete`

Bloc D — Edge function Brevo :
- `supabase/functions/questionnaire-send-emails/index.ts` (refonte stub → réel) : fetch lead via service_role, envoie HTML email équipe via Brevo API v3, fallback graceful si BREVO_API_KEY absente (200 + sent:false), template HTML inline avec gradient header + table infos + CTA CRM
- Secrets attendus : `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (default lyes.triki@propulseo-site.com), `TEAM_EMAIL` (default team@propulseo-site.com), `CRM_BASE_URL`

Bloc E — Code review :
- 6 findings — 1 fixé (C1 XSS Brevo : `escHtml()` sur toutes les interpolations HTML), 3 différés (H1 atomicité conversion = RPC dédiée Session B, H3 LeadsV3Page 231 lignes = extraction hook Session B, M1 race archive = protection UI suffisante V1), 2 faux positifs (H2 styles inline pré-existants, M2 site_erp visible OK dans les 2 scopes).

**Commits** :
- `7261295` feat(propulspace): migration 242 + constants ERP (Bloc A partiel)
- `2a4c8fb` feat(propulspace): Bloc A — questionnaire avec routage Site/Site+ERP/ERP
- `25750cc` feat(leadsv3): Bloc B — colonne Questionnaire complété + panel détails
- `29b1aa9` feat(propulspace): Bloc C + D — conversion 1 clic + edge function Brevo
- `77b40b6` fix(propulspace): code review hardening — XSS Brevo email (C1)

**Tests** :
- `tsc --noEmit` clean à chaque étape.
- Preview /diagnostic : Step0 affiché avec 3 cards radio, totalSteps = 8 par défaut. Interaction radio non testable via preview_click (outil natif ne propage pas l'event React sur input sr-only) — validation interactive Lyes nécessaire.
- Migration 242 vérifiée en prod : `SELECT project_type FROM qualification_leads` → 4 leads à 'site'.

**Hors-périmètre (Session B autre jour)** :
- Hard delete leads + projets avec confirmation typée + cascade.
- Mini-migration 243 RPC `admin_convert_qualif_to_project()` atomique (fix H1).
- Refacto LeadsV3Page <200 lignes via extraction `useLeadsV3Cards` (fix H3).
- Conversion useArchive vers SQL atomique (fix M1).

**Action Lyes (avant test live)** :
- `supabase secrets set BREVO_API_KEY=xkeysib-...`
- `supabase secrets set CRM_BASE_URL=https://crm.propulseo-site.com` (à confirmer)
- `supabase functions deploy questionnaire-send-emails`
- Tester parcours `/diagnostic` Site, ERP, Site+ERP en main.

**Risques résiduels** :
- H1 atomicité conversion : si update qualif échoue après insert projet, doublon possible. Mitigé par dialog confirmation typée.
- LeadsV3Page > 200 lignes (dette H3 documentée).
- Edge function `questionnaire-send-emails` re-déployée nécessaire avant que les emails partent (Brevo + secrets).
