# SCHEMA ALIGNMENT — Propul'Space vs reality of CRM database

> **Status** : Audit completed by Claude Code, validated by Lyes Triki
> **Date** : 2026-05-15
> **Scope** : audit complet du schéma actuel de la base avant Phase 1 migrations
> **Decision majeure validée** : **1 espace Propul'Space = 1 projet** (pas de table clients séparée en V1)

---

## 1. Cartographie de la base actuelle

### 1.1 Schemas applicatifs

| Schema | Type | Contenu | Usage |
|---|---|---|---|
| `public` | Tables réelles | 75 tables (mix CRM, V1 vestiges, V2 actif, Locagame) | Schema principal — source de vérité |
| `v2` | Vues uniquement | 9 vues qui pointent vers `public.*_v2` | Façade de lecture pour le code applicatif |
| `auth` | Supabase Auth | Tables système Supabase | Authentification |
| `storage` | Supabase Storage | Buckets et fichiers | Stockage fichiers |
| `vault` | Supabase Vault | Secrets chiffrés | Utilisé par AgencyVault |
| `supabase_migrations` | Historique | 61 migrations appliquées | Historique migrations |

### 1.2 Pattern V2 découvert

Architecture cachée : le schema `v2` n'a aucune table propre. Toutes ses "tables" sont en réalité des **vues** qui exposent les `public.*_v2` avec des noms simplifiés.

| Calque `v2.*` (vue) | Vraie table `public.*` | Rows |
|---|---|---|
| `v2.projects` | `public.projects_v2` | **42** |
| `v2.checklist_items` | `public.checklist_items_v2` | 175 |
| `v2.project_activities` | `public.project_activities_v2` | 13 |
| `v2.project_briefs` | `public.project_briefs_v2` | 3 |
| `v2.project_documents` | `public.project_documents_v2` | 1 |
| `v2.follow_ups` | `public.project_follow_ups_v2` | 4 |
| `v2.invoices` | `public.project_invoices_v2` | 2 |
| `v2.brief_invitations` | `public.brief_invitations` | 0 |
| `v2.comm_tasks` | `public.comm_tasks` | 0 |

**Conséquence** : pour Propul'Space, toute migration cible `public.*_v2` (vraie table) jamais `v2.*` (vue, ALTER TABLE échoue).

### 1.3 Tables actives clés (pour Propul'Space)

| Table | Rows | Rôle |
|---|---|---|
| `public.contacts` | 434 | Source réelle des leads/prospects/clients CRM |
| `public.projects_v2` | 42 | **Source des projets actifs** — cible principale Propul'Space |
| `public.users` | 10 | Équipe interne (Lyes + dev + ops) |
| `public.crmerp_leads` | 15 | Pipeline CRM-ERP leads récents |
| `public.project_contacts` | 4 | Lien formel projet ↔ contact (sous-utilisé) |
| `public.clients` | **0** | **Vestige V1 vide — à ignorer** |
| `public.projects` | 24 | **Vestige V1 — à ignorer** (le vrai est `projects_v2`) |
| `public.agency_accesses` | 2 | AgencyVault (coffre credentials) |

### 1.4 Tables hors scope Propul'Space

| Famille | Tables | Statut |
|---|---|---|
| Locagame | `categories`, `products`, `delivery_zones`, `customers`, `addresses`, `reservations`, `reservation_items`, `product_availability`, `themes`, `product_themes`, `admin_users` | Hors scope — projet client séparé |
| V1 vestiges | `leads`, `activities`, `events`, `dashboard_metrics`, `google_tokens`, `notification_settings`, `task_comments`, `lead_notes`, `prospect_activities`, `user_profiles` | À ignorer |
| Communication | `posts`, `post_assets`, `post_comments`, `post_metrics`, `client_posts`, `client_post_assets`, `client_post_comments`, `social_connections` | Hors scope Phase 1, mais utilisable plus tard |

---

## 2. Localisation des clients réels

### Recherche Précieuse / Servicimmo / CoproFlex

| Recherché | Où c'est trouvé | Type |
|---|---|---|
| **Précieuse** | `public.projects_v2.name = "Précieuse"` (client_name : "Emeline", status `in_progress`) | Projet actif |
| **Servicimmo** | (1) `public.contacts.name = "Lhottelier"` + `company = "Servicimmo"` (status `offre_envoyee`) — (2) `public.projects_v2.name = "Servicimmo"` (client_name : "Jacques-Alexandre Lhotellier", status `brief_received`) | Contact CRM + projet actif |
| **CoproFlex** | `public.projects_v2.name = "CoproFlex"` (client_name vide, status `in_progress`) | Projet actif |

### Conclusion architecturale

**Tes clients Propul'SEO ne sont PAS dans une table normalisée**. Ils sont dispersés :
- 35 projets sur 42 ont un `client_name` texte dans `projects_v2`
- 434 contacts dans `public.contacts` (leads + prospects + clients confondus)
- 15 leads récents dans `public.crmerp_leads`
- 4 liens formels dans `public.project_contacts`

→ Justifie la décision **"1 espace = 1 projet"** : on ne crée pas de table clients normalisée pour Propul'Space V1.

---

## 3. Diff PRD section 3.3 vs réalité

### 3.1 Tables existantes étendues — corrections nécessaires

#### `public.users` (PRD parle de `users`)

| PRD propose | Décision finale | Raison |
|---|---|---|
| `portal_enabled BOOLEAN DEFAULT false` | ✅ OK garder | — |
| `portal_linked_client_id UUID REFERENCES clients(id)` | ❌ Remplacer par `portal_linked_project_id UUID REFERENCES public.projects_v2(id)` | Pas de table clients utilisable |
| `portal_phase TEXT CHECK (...)` | ❌ Déplacer sur `projects_v2` | Le cycle de vie concerne le projet, pas le user |
| `portal_activated_at TIMESTAMPTZ` | ❌ Déplacer sur `projects_v2` | Le projet est activé, pas le user |
| `portal_deactivated_at TIMESTAMPTZ` | ❌ Déplacer sur `projects_v2` | Idem |
| `portal_deactivation_reason TEXT` | ❌ Déplacer sur `projects_v2` | Idem |
| `portal_last_login_at TIMESTAMPTZ` | ✅ OK garder sur `users` | Le user se connecte, pas le projet |

**Colonnes finales `public.users` extensions** : 3 colonnes
- `portal_enabled BOOLEAN DEFAULT false`
- `portal_linked_project_id UUID REFERENCES public.projects_v2(id)`
- `portal_last_login_at TIMESTAMPTZ`

#### `public.clients` (vestige V1)

| PRD propose | Décision finale | Raison |
|---|---|---|
| Toutes les colonnes `portal_*` + `quality_score` | ❌ **Ne pas toucher cette table** | Vestige V1 vide, on l'oublie |

**Colonnes finales `public.clients` extensions** : aucune. Table ignorée pour V1.

#### `public.projects_v2` (cible réelle, le PRD disait `projects`)

| PRD propose | Décision finale | Raison |
|---|---|---|
| Cible `projects` | ❌ Cible `public.projects_v2` | Vraie table active (42 rows) |
| `portal_visible BOOLEAN DEFAULT false` | ✅ OK | (Distincte de `portal_enabled` legacy déjà présente) |
| `portal_next_milestone_label TEXT` | ✅ OK | — |
| `portal_next_milestone_date DATE` | ✅ OK | — |
| `portal_published_hours_worked NUMERIC(10,2)` | ✅ OK | — |
| `portal_progress_percent INTEGER 0-100` | ✅ OK | — |
| **Ajout** : `portal_url_slug TEXT UNIQUE` | ✅ Migré depuis `clients` | Slug pour URL `espace.propulseo-site.com/{slug}` |
| **Ajout** : `portal_brand_logo_url TEXT` | ✅ Migré depuis `clients` | — |
| **Ajout** : `portal_brand_primary_color TEXT` | ✅ Migré depuis `clients` | — |
| **Ajout** : `portal_phase TEXT CHECK (...)` | ✅ Migré depuis `users` | Cycle de vie du projet |
| **Ajout** : `portal_activated_at TIMESTAMPTZ` | ✅ Migré depuis `users` | — |
| **Ajout** : `portal_deactivated_at TIMESTAMPTZ` | ✅ Migré depuis `users` | — |
| **Ajout** : `portal_deactivation_reason TEXT` | ✅ Migré depuis `users` | — |
| **Ajout** : `client_company_name TEXT` | 🆕 Nouveau besoin (facture) | Raison sociale officielle (CTRP LDA) |
| **Ajout** : `client_address TEXT` | 🆕 Nouveau besoin (facture) | Adresse complète |
| **Ajout** : `client_vat_number TEXT` | 🆕 Nouveau besoin (facture) | TVA intracommunautaire |
| **Ajout** : `client_represented_by TEXT` | 🆕 Nouveau besoin (facture) | Représentant légal |

**Colonnes existantes legacy à ne PAS toucher** : `portal_token`, `portal_enabled`, `portal_short_code`, `portal_expires_at`, `brief_token`, `brief_token_enabled`, `brief_short_code` (système ClientBrief existant).

Note : `siret` existe déjà sur `projects_v2` (champ `siret VARCHAR`). On le réutilise pour le SIRET du client.

**Colonnes finales `public.projects_v2` extensions** : 16 nouvelles colonnes.

### 3.2 Nouvelles tables `propulspace.*` — corrections

| Table PRD | Changement principal | Détail |
|---|---|---|
| `qualification_leads` | `client_id` → `converted_to_project_id` UUID NULLABLE REFERENCES `public.projects_v2(id)` | Le lead n'est pas encore un projet au moment de la qualif |
| `qualification_uploads` | Aucun changement (FK qualification_lead_id) | — |
| `project_steps` | `project_id` → REFERENCES `public.projects_v2(id) ON DELETE CASCADE` | Cible correcte |
| `documents` | `client_id` SUPPRIMÉ — seul `project_id` NOT NULL REFERENCES `public.projects_v2(id) ON DELETE CASCADE` | Simplification |
| `invoices` | `client_id` SUPPRIMÉ — seul `project_id` NOT NULL REFERENCES `public.projects_v2(id)` | Simplification |
| `invoices` | **AJOUT** `client_snapshot JSONB NOT NULL` | Photo Polaroid immuable des infos client (légal FR) |
| `invoices` | `vat_rate` DEFAULT 20 → DEFAULT 0 | Franchise art. 293 B du CGI |
| `invoice_installments` (nouveau) | FK `invoice_id UUID REFERENCES propulspace.invoices(id) CASCADE` | Échéances multiples (cf facture #1030 avec 3 échéances) |
| `signatures` | `client_id` SUPPRIMÉ — seul `project_id` NOT NULL REFERENCES `public.projects_v2(id)` | Simplification |
| `onboarding_responses` | `client_id` SUPPRIMÉ — seul `project_id` NOT NULL REFERENCES `public.projects_v2(id) CASCADE` | Simplification |
| `audit_log` | `client_id` → `project_id` UUID NULLABLE REFERENCES `public.projects_v2(id)` | NULLABLE pour actions sans projet |
| `analytics_events` | `client_id` → `project_id` UUID NULLABLE REFERENCES `public.projects_v2(id)` | NULLABLE pour events anonymes |
| `stripe_webhook_events` | Aucun changement | — |
| `docuseal_webhook_events` | Aucun changement | — |

### 3.3 Conventions de nomenclature à respecter

| Convention base | Détail |
|---|---|
| Migrations | `YYYYMMDDHHMMSS_snake_case` (timestamp précis) |
| Schemas | snake_case anglais (`propulspace` ✅) |
| Tables | snake_case anglais, pluriel (`invoices`, `documents`) |
| Colonnes | snake_case anglais |
| FK | `<entity>_id` (ex `project_id`, pas `projectId`) |
| Status enum | TEXT + CHECK constraint (pas USER-DEFINED enum) — exemple existant : `status TEXT CHECK (...)` |
| Tables avec suffixe `_v2` | Convention existante pour V2 : on **ne crée pas** de nouvelles tables `_v2`, mais on garde celles qui existent |

---

## 4. RLS et fonctions existantes

À vérifier en Step suivant (Phase 1 migration 060 RLS) :

- ⏳ Existence de la fonction `is_admin()` mentionnée dans le PRD — à confirmer via `pg_proc`
- ⏳ Rôles exacts dans `public.users.role` — à confirmer (PRD mentionne admin/manager/sales)
- ⏳ Politiques RLS existantes sur `projects_v2` — à respecter et ne pas casser

---

## 5. Recommandations finales

### 5.1 Pour les prochains prompts Claude web

À chaque fois que Claude web rédige un prompt avec du SQL ou des références aux tables, lui demander de :
1. Utiliser **`public.projects_v2`** comme cible projet (pas `projects` ni `v2.projects`)
2. Utiliser **`project_id`** comme FK partout, jamais `client_id`
3. **Ignorer** `public.clients` (vestige V1 vide)
4. Respecter les conventions : snake_case, `_id` suffix pour FK, CHECK pour enums
5. Toujours passer par le **pre-flight check MCP** avant d'écrire le SQL final

### 5.2 Ajustements à reporter dans le PRD

Le PRD section 3.3 doit être mis à jour pour refléter :
- Suppression de toutes les FK `client_id` → remplacement par `project_id`
- Suppression des extensions `public.clients` (table abandonnée)
- Toutes les colonnes `portal_*` du PRD originel sur `users` migrent sur `projects_v2`
- Ajout du `client_snapshot JSONB` sur `invoices` (légal FR)
- Ajout de la table `invoice_installments` (échéances multiples)
- Ajout des champs identité client sur `projects_v2` (`client_company_name`, `client_address`, `client_vat_number`, `client_represented_by`)

### 5.3 Phase 1 — migrations à réécrire

Toutes les migrations préparées doivent être réécrites avec la nouvelle architecture. Liste mise à jour :

| Migration | Contenu corrigé |
|---|---|
| **010** | `CREATE SCHEMA propulspace` + sequence `invoice_number_seq` + fonction `next_invoice_number()`. **Inchangée**. |
| **020** | Extensions `public.users` (3 colonnes) + `public.projects_v2` (16 colonnes). **Réécrite** : pas de `clients`, pas de `v2.projects`. |
| **030** | `propulspace.audit_log` créé en premier (pour trigger générique des tables suivantes). |
| **040** | `propulspace.qualification_leads` + `qualification_uploads` (avec `converted_to_project_id`). |
| **050** | `propulspace.project_steps` + `documents` + `invoices` (avec `client_snapshot JSONB`) + `invoice_installments` + `signatures` + `onboarding_responses` — tous avec `project_id` only. |
| **060** | `propulspace.stripe_webhook_events` + `docuseal_webhook_events` + `analytics_events`. |
| **070** | RLS policies sur toutes les tables propulspace (clés sur `project_id` via jointure `public.users.portal_linked_project_id`). |
| **080** | Buckets storage `propulspace-uploads` + `propulspace-documents`. |
| **090** | (Optionnel) Fixtures de test avec projet existant. |
| **999** | Rollback complet commenté. |

### 5.4 Points en suspens

- ⏳ Pour Phase 2 (qualification) : confirmer la liste finale des secteurs cibles pour le scoring (sector fit reporté V2, OK)
- ⏳ Pour Phase 3 : créer comptes Stripe + DocuSeal + Brevo + Cal.com
- ⏳ Pour Phase 4 : design exact du bouton "Activer Propul'Space" depuis fiche projet existante
- ⏳ Migration des contacts/leads existants vers `qualification_leads` (Annex B PRD) : pas urgent, reporté

---

## 6. Sign-off

| Acteur | Décision validée | Date |
|---|---|---|
| Lyes Triki | Architecture 1 espace = 1 projet (V1) | 2026-05-15 |
| Lyes Triki | Snapshot Polaroid + GED unifiée pour factures | 2026-05-15 |
| Lyes Triki | Cible `public.projects_v2`, pas `v2.projects` ni `public.clients` | 2026-05-15 |
| Lyes Triki | Réécriture des migrations 010-070 avec nouvelle archi | 2026-05-15 |

**Document de référence pour Phase 1.** Toutes les migrations doivent respecter ces décisions.
