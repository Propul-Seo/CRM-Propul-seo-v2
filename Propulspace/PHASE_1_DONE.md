# PROPUL'SPACE — Phase 1 COMPLETED ✅

> **Date** : 15 mai 2026
> **Branche** : `feature/propulspace-phase-1-db`
> **Auteur** : Lyes Triki (driven by Claude Code via Supabase MCP)
> **Statut** : Tout appliqué en prod, CRM existant intact

---

## 1. Migrations appliquées (8 sur 8)

| # | Migration | But | Statut |
|---|---|---|---|
| 010 | `propulspace_010_schema_init` | Création schema `propulspace` + séquence `invoice_number_seq` (démarre à 1031) + fonction `next_invoice_number()` retournant `PS-XXXX` | ✅ |
| 020 | `propulspace_020_extend_existing` | Extension de `public.users` (3 colonnes) et `public.projects_v2` (15 colonnes) avec champs `portal_*` et `client_*` | ✅ |
| 030 | `propulspace_030_audit_log` | Table `audit_log` + fonction `audit_trigger_fn()` (générique, RGPD compliant) | ✅ |
| 040 | `propulspace_040_qualification` | Tables `qualification_leads` (48 colonnes, Phase 0) + `qualification_uploads` | ✅ |
| 050 | `propulspace_050_portal_tables` | Tables `project_steps`, `documents` (GED), `invoices` (avec snapshot client JSONB), `invoice_installments`, `signatures`, `onboarding_responses` | ✅ |
| 060 | `propulspace_060_webhooks_analytics` | Tables `stripe_webhook_events`, `docuseal_webhook_events`, `analytics_events` | ✅ |
| 070 | `propulspace_070_rls_policies` | Helpers `is_admin()` + `portal_project_id()` + 18 politiques RLS | ✅ |
| 080 | `propulspace_080_storage_buckets` | Buckets `propulspace-uploads` + `propulspace-documents` + 5 politiques storage | ✅ |
| 999 | `propulspace_999_rollback` | Fichier de rollback complet (commenté, jamais exécuté) | ✅ Écrit |

**Note** : Migration 999 est dans le repo mais **non appliquée**. À décommenter manuellement uniquement en cas d'urgence.

---

## 2. Bilan état final de la base

### Schema `propulspace`

| Élément | Count |
|---|---|
| Tables | 12 |
| Index | 44 |
| Triggers d'audit | 4 (sur `qualification_leads`, `documents`, `invoices`, `signatures`) |
| Fonctions | 4 (`next_invoice_number`, `audit_trigger_fn`, `is_admin`, `portal_project_id`) |
| Séquences | 2 |
| Politiques RLS | 18 |

### Storage

| Bucket | Privé | Max size | Politiques |
|---|---|---|---|
| `propulspace-uploads` | Oui (signed URLs) | 25 MB | INSERT public, SELECT/DELETE admin |
| `propulspace-documents` | Oui (signed URLs) | 50 MB | ALL admin, SELECT client portail |

### Extensions sur tables existantes

| Table | Colonnes ajoutées | Total |
|---|---|---|
| `public.users` | `portal_enabled`, `portal_linked_project_id`, `portal_last_login_at` | 3 |
| `public.projects_v2` | `portal_visible`, `portal_phase`, `portal_url_slug`, `portal_activated_at`, `portal_deactivated_at`, `portal_deactivation_reason`, `portal_next_milestone_label`, `portal_next_milestone_date`, `portal_published_hours_worked`, `portal_progress_percent`, `portal_brand_logo_url`, `portal_brand_primary_color`, `client_address`, `client_vat_number`, `client_represented_by` | 15 |

**Toutes les colonnes ajoutées ont une valeur DEFAULT ou sont NULLABLE → aucune incompatibilité avec le code existant.**

### Données intactes

| Table | Avant | Après | Statut |
|---|---|---|---|
| `public.users` | 10 | 10 | ✅ Aucune perte |
| `public.projects_v2` | 42 | 42 | ✅ Aucune perte |
| `public.contacts` | 434 | 434 | ✅ Aucune perte |

---

## 3. Architecture validée

### Décision structurante V1 : "1 espace = 1 projet"

- Pas de table `clients` séparée (table `public.clients` reste vide et ignorée)
- Toutes les entités Propul'Space référencent `project_id` (vers `public.projects_v2`), jamais `client_id`
- Pour les factures : snapshot Polaroid JSONB des infos client au moment d'émettre (immuabilité légale FR)

### Décisions principales

| Sujet | Décision |
|---|---|
| Schema DB | Nouveau `propulspace` dédié |
| Cible projets | `public.projects_v2` (vraie table active, pas `v2.projects` qui est une vue) |
| Numérotation factures | `PS-1031` puis `PS-1032`, etc. (continue de la facture #1030) |
| TVA | Franchise art. 293 B du CGI → `vat_rate DEFAULT 0` |
| Échéances multiples | Table dédiée `invoice_installments` |
| Représentée par | Etienne Guimbard seul (sur factures) |
| Sync compta | À implémenter Phase 3 : factures payées → module Accounting |
| GED | `propulspace.documents` (visible client) + `public.project_documents_v2` legacy (admin only) |
| Pilote test | Projet "Propul'seo" existant (`74968202-5f6a-4981-8d30-f68a8ec7661f`) |

---

## 4. Stratégie de sécurité

### Filets de sécurité utilisés
1. **Migrations 100% additives** : aucun DROP, aucun UPDATE sur données existantes
2. **Dry-run transactionnel via MCP** : chaque migration testée en `BEGIN ... ROLLBACK` avant apply réel
3. **Validation Lyes** entre chaque étape critique
4. **Backups quotidiens Supabase Pro** : 7 jours de rétention
5. **Migration 999 rollback** prête (commentée) en cas d'urgence

### Filets non utilisés (à activer plus tard)
- **PITR** (Point in Time Recovery) : non activé (coût Pro add-on prohibitif pour démarrer)
- **pg_dump local avant migration** : skippé pour Phase 1 (à formaliser pour Phase 2+ si Lyes le souhaite)

### Politiques RLS

**Pattern uniforme** sur toutes les tables Propul'Space :
- Admin (`role IN ('admin', 'manager')`) → FOR ALL (USING + WITH CHECK)
- Client portail (`portal_enabled = true AND portal_linked_project_id = <project>`) → SELECT filtré par projet
- Anon → bloqué par défaut (pas de politique)
- Service role → bypass RLS (pour Edge Functions)

**Cas particuliers** :
- `audit_log` : admin SELECT only (écriture via trigger SECURITY DEFINER)
- `analytics_events` : admin SELECT only (écriture via service_role)
- `webhook_events` : service_role only (aucune politique = tout bloqué pour authenticated/anon)
- `documents` : client peut INSERT (uploader) si `uploaded_by_client = true`
- `onboarding_responses` : client peut UPDATE (compléter son onboarding)

---

## 5. Types TypeScript

Le fichier `src/types/database.ts` a été regénéré et contient le schema `public` mis à jour avec toutes les nouvelles colonnes `portal_*` et `client_*`.

⚠️ **Limitation actuelle** : le MCP `generate_typescript_types` génère uniquement le schema `public`. Les types des tables `propulspace.*` ne sont **pas** dans le fichier.

→ **Action Phase 2** : regénérer les types complets via la CLI Supabase quand on commencera à utiliser les tables propulspace dans le code :
```bash
npx supabase gen types typescript --project-id tbuqctfgjjxnevmsvucl --schema public,v2,propulspace > src/types/database.ts
```

**Build TypeScript actuel** : ✅ `npx tsc --noEmit` passe sans erreur.

---

## 6. Procédure de rollback d'urgence

Si Propul'Space casse quelque chose (peu probable vu les migrations additives) :

1. **Confirmer avec Lyes** que rollback est nécessaire
2. Ouvrir `supabase/migrations/20260515999999_propulspace_999_rollback.sql`
3. Décommenter les blocs `BEGIN;`, les `DROP/DELETE`, et `COMMIT;`
4. Lancer via Supabase MCP `apply_migration` ou SQL Editor
5. Vérifier checks de la fin du fichier
6. Vérifier que CRM fonctionne

Alternative plus rapide : restaurer le backup quotidien Supabase (Dashboard → Database → Backups).

---

## 7. Variables d'environnement

Fichier `.env.example` créé avec les variables nécessaires :
- ✅ Variables actuelles (Supabase URL + keys)
- 🆕 `VITE_PUBLIC_PORTAL_URL=https://espace.propulseo-site.com`
- 🆕 `VITE_SENTRY_DSN=` (à remplir quand compte Sentry créé)
- 🔮 Variables Phase 2-3 commentées (Brevo, Stripe, DocuSeal, Cal.com)

---

## 8. Tests RLS Vitest

**Reporté Phase 2** : pour tester l'isolation des données entre projets, il faut créer de vrais comptes Supabase Auth liés à différents projets. Ce sera fait quand on créera les premiers comptes portail en Phase 4-5 (admin module + client-facing).

En attendant, les politiques RLS sont validées par construction (pattern uniforme + dry-run + verification du nombre de policies créées).

---

## 9. Dette technique identifiée

À traiter avant ou pendant Phase 4-5 :

1. **Politique `authenticated_all_projects_v2`** : il existe une politique RLS pré-existante (avant Propul'Space) qui donne accès à TOUS les projets pour tout utilisateur authentifié. Pour l'admin actuel c'est OK, mais **doit être resserrée avant d'activer un compte portail client** (sinon le client verrait tous les projets).
2. **PITR non activé** : envisager l'activation quand on aura des clients réels en prod.
3. **Antoine Bigot dans `public.partners`** : à désactiver (`is_active = false`) ou supprimer selon préférence Lyes.

---

## 10. Prochaines étapes — Phase 2

| Tâche | Référence PRD |
|---|---|
| 1. Compte Sentry + DSN | Phase 1 résiduel |
| 2. Compte Brevo (free tier 300/jour) | Phase 2 |
| 3. Compte Cal.com Cloud free tier | Phase 2 |
| 4. Form 7 étapes qualification + autosave | Phase 2 Task 10-13 |
| 5. 13 règles conditionnelles | Phase 2 Task 11 |
| 6. 5 Edge Functions (submit, create-account, dedupe, enrich, scoring) | Phase 2 Task 14-18 |
| 7. Admin module `/admin/leads-qualifies` | Phase 2 Task 22 |
| 8. Tests E2E Playwright | Phase 2 Task 23 |

**Durée estimée Phase 2** : 8 jours dev (J5-J12 du planning total).

---

## 11. Sign-off

| Acteur | Validation | Date |
|---|---|---|
| Lyes Triki | Architecture 1 espace = 1 projet | 2026-05-15 |
| Lyes Triki | Toutes décisions facture (FR, snapshot, échéances) | 2026-05-15 |
| Lyes Triki | Cible `public.projects_v2` (pas la vue `v2.projects`) | 2026-05-15 |
| Lyes Triki | 8 migrations appliquées en prod | 2026-05-15 |
| Lyes Triki | CRM admin toujours fonctionnel | 2026-05-15 |

---

**Phase 1 — Base de données et infrastructure : ✅ TERMINÉE.**

Prête pour Phase 2 — Qualification (formulaire public + Edge Functions).
