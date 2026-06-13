# AUDIT SECURITE RLS - CRM Propulseo
**Date** : 2026-02-09
**Projet Supabase** : tbuqctfgjjxnevmsvucl (ERP)
**Statut** : CRITIQUE - Multiples failles de sécurité identifiées

---

## ETAPE 1 — INVENTAIRE SECURITE

### 1.1 Résumé exécutif

| Métrique | Valeur |
|----------|--------|
| Tables public schema | 52 |
| Tables avec RLS activée | **52/52** (100%) |
| Tables avec policies `USING true` | **8** (CRITIQUE) |
| Policies dangereuses (true/public) | **28** |
| Fonctions appelables par anon | **46/46** (100%) |
| Fonctions SECURITY DEFINER sans search_path | **20** |
| Fonctions avec credentials hardcodés | **1** (CRITIQUE) |
| Fonctions acceptant service_role_key | **1** (CRITIQUE) |
| Tables avec GRANTS anon complets | **52/52** (CRITIQUE) |

### 1.2 VULNERABILITES CRITIQUES (P0)

#### VULN-01 : Fonctions de reset password accessibles par anon
```
update_admin_password_direct()     → Password "Propulseo123" HARDCODE dans le code source
update_admin_password_via_api()    → Accepte service_role_key en paramètre (visible dans logs)
call_admin_update_password_function() → Callable par anon, SECURITY DEFINER
```
**Impact** : N'importe qui peut tenter de réinitialiser des mots de passe.

#### VULN-02 : TOUTES les tables ont des GRANTS complets pour `anon`
Les 52 tables du schema public accordent DELETE, INSERT, SELECT, UPDATE, TRIGGER, TRUNCATE au rôle `anon`. Même si RLS est activé, les policies avec `roles = {public}` s'appliquent aussi à `anon`.

#### VULN-03 : 8 tables avec policies `USING true` (accès ouvert)
Un utilisateur anonyme avec la clé `anon` peut lire/écrire ces tables :

| Table | Policies USING true |
|-------|-------------------|
| `contacts` | SELECT, INSERT, UPDATE, DELETE (4 policies !) |
| `contact_activities` | SELECT, INSERT, UPDATE, DELETE (4 policies !) |
| `tasks` | SELECT, INSERT, UPDATE, DELETE (4 policies !) |
| `crmerp_activities` | SELECT, INSERT, UPDATE, DELETE (4 policies !) |
| `crmerp_leads` | SELECT, INSERT, UPDATE |
| `crm_columns` | SELECT, INSERT, UPDATE (via ALL + SELECT + UPDATE) |
| `user_profiles` | SELECT |
| `users` | SELECT ("Users can view all profiles") |

#### VULN-04 : Fonctions SECURITY DEFINER sans `SET search_path`
20 fonctions SECURITY DEFINER n'ont pas de `search_path` fixé → vulnérable au search_path hijacking.

### 1.3 Tableau détaillé par table

#### Tables CRM (données métier sensibles)

| Table | RLS | Policies | Risque | Détail |
|-------|-----|----------|--------|--------|
| `clients` | ✅ | 5 | ⚠️ MOYEN | Policies correctes (owner/assigned/admin) MAIS doublons avec policy ALL permissive |
| `contacts` | ✅ | 8 | 🔴 CRITIQUE | 4 policies `USING true` + 4 policies scoped = les `true` gagnent (PERMISSIVE OR) |
| `contact_activities` | ✅ | 9 | 🔴 CRITIQUE | 4 policies `true` + 5 policies scoped = les `true` gagnent |
| `crmerp_leads` | ✅ | 4 | 🔴 CRITIQUE | SELECT/INSERT/UPDATE = `true`, seul DELETE restreint |
| `crmerp_activities` | ✅ | 4 | 🔴 CRITIQUE | TOUT est `true` |
| `leads` | ✅ | 4 | ✅ OK | assigned_to / admin |
| `lead_notes` | ✅ | 4 | ✅ OK | created_by / admin |
| `crm_bot_one_records` | ✅ | 4 | ✅ OK | user_id / admin |
| `crm_bot_one_activities` | ✅ | 4 | ✅ OK | via record owner / admin |
| `crm_bot_one_columns` | ✅ | 4 | ✅ OK | admin only write, auth read |
| `crm_columns` | ✅ | 7 | 🔴 CRITIQUE | `true` policies + doublons = ouvert |

#### Tables Projects/Tasks

| Table | RLS | Policies | Risque | Détail |
|-------|-----|----------|--------|--------|
| `projects` | ✅ | 8 | 🔴 CRITIQUE | 4 policies `auth.uid() IS NOT NULL` (tout authenticated) + 4 scoped = tout ouvert |
| `project_checklists` | ✅ | 4 | ⚠️ MOYEN | INSERT = any auth, SELECT/UPDATE = manager/admin |
| `tasks` | ✅ | 10 | 🔴 CRITIQUE | 4 policies `true` + 6 policies scoped = les `true` gagnent |
| `task_comments` | ✅ | 4 | ✅ OK | owner / via task access / admin |
| `archived_projects` | ✅ | 2 | ⚠️ MOYEN | user_id scope mais compare auth.uid() (pas auth_user_id) |
| `archived_tasks` | ✅ | 2 | ⚠️ MOYEN | Même problème |

#### Tables Finance (HAUTE SENSIBILITE)

| Table | RLS | Policies | Risque | Détail |
|-------|-----|----------|--------|--------|
| `accounting_entries` | ✅ | 4 | ✅ OK | manager/admin |
| `archived_accounting_entries` | ✅ | 4 | ⚠️ MOYEN | user_id = auth.uid() (compare avec auth UUID, pas users.id) |
| `monthly_accounting_metrics` | ✅ | 4 | ✅ OK | admin write, manager/admin read |
| `dashboard_metrics` | ✅ | 5 | ⚠️ MOYEN | Policy ALL `auth.uid() IS NOT NULL` (tout auth peut tout faire) |
| `partner_transactions` | ✅ | 7 | ⚠️ MOYEN | Doublons : policies `authenticated` + policies manager/admin |
| `partners` | ✅ | 7 | ⚠️ MOYEN | Doublons : policies `authenticated` READ/INSERT/UPDATE + admin |

#### Tables Utilisateurs/Profils

| Table | RLS | Policies | Risque | Détail |
|-------|-----|----------|--------|--------|
| `users` | ✅ | 9 | ⚠️ MOYEN | SELECT `true` dans 1 policy = tout le monde lit tout. Doublons. |
| `user_profiles` | ✅ | 6 | ⚠️ MOYEN | SELECT `true` + doublons |
| `user_permissions` | ✅ | 2 | ✅ OK | admin full, user read own |
| `user_activities` | ✅ | 5 | ✅ OK | owner / admin |
| `admin_users` | ✅ | 1 | ✅ OK | auto-référence admin |

#### Tables Chat/Messaging

| Table | RLS | Policies | Risque | Détail |
|-------|-----|----------|--------|--------|
| `channels` | ✅ | 6 | ⚠️ MOYEN | Doublons : policies `authenticated` + `auth.uid() IS NOT NULL` |
| `channel_members` | ✅ | 4 | ✅ OK | channel admin / member |
| `channel_read_status` | ✅ | 3 | ✅ OK | own user_id |
| `messages` | ✅ | 5 | ⚠️ MOYEN | Doublons |
| `message_reactions` | ✅ | 2 | ✅ OK | via user match |

#### Tables E-commerce (peu utilisées par le CRM)

| Table | RLS | Policies | Risque | Détail |
|-------|-----|----------|--------|--------|
| `categories` | ✅ | 1 | ⚠️ | SELECT `true` pour anon+authenticated |
| `products` | ✅ | 1 | ✅ OK | SELECT where is_active, anon+auth |
| `product_availability` | ✅ | 1 | ⚠️ | SELECT `true` pour anon+authenticated |
| `product_themes` | ✅ | 1 | ⚠️ | SELECT `true` pour public |
| `themes` | ✅ | 1 | ⚠️ | SELECT `true` pour public |
| `delivery_zones` | ✅ | 1 | ✅ OK | SELECT where is_active |
| `customers` | ✅ | 3 | ✅ OK | own id only |
| `addresses` | ✅ | 2 | ✅ OK | own customer_id |
| `reservations` | ✅ | 2 | ✅ OK | own customer_id |
| `reservation_items` | ✅ | 1 | ✅ OK | via reservation owner |

#### Autres

| Table | RLS | Policies | Risque |
|-------|-----|----------|--------|
| `activities` | ✅ | 4 | ✅ OK (manager/admin) |
| `prospect_activities` | ✅ | 4 | ✅ OK (manager/admin) |
| `events` | ✅ | 5 | ⚠️ MOYEN (doublons, ALL policy) |
| `google_tokens` | ✅ | 1 | 🔴 CRITIQUE (ALL pour tout authenticated - tokens OAuth !) |
| `notification_settings` | ✅ | 1 | ✅ OK (own user) |
| `company_settings` | ✅ | 4 | ✅ OK (admin write, auth read) |
| `activity_log` | ✅ | 3 | ⚠️ MOYEN (doublons, user_id NULL policy) |
| `yearly_stats` | ✅ | 1 | ✅ OK (own user) |

### 1.4 Fonctions dangereuses

| Fonction | SECURITY DEFINER | Anon callable | Risque |
|----------|:---:|:---:|--------|
| `update_admin_password_direct()` | ✅ | ✅ | 🔴 Password hardcodé |
| `update_admin_password_direct(email,pass)` | ✅ | ✅ | 🔴 Peut reset n'importe quel password |
| `update_admin_password_via_api(email,pass,url,key)` | ✅ | ✅ | 🔴 Accepte service_role_key |
| `call_admin_update_password_function(email,pass,url)` | ✅ | ✅ | 🔴 Callable par anon |
| `get_users_list()` | ✅ | ✅ | ⚠️ Liste tous les users |
| `sync_all_bot_one_to_clients()` | ✅ | ✅ | ⚠️ Mutation de masse |
| `create_client_from_bot_one_record(id)` | ✅ | ✅ | ⚠️ Crée des clients |
| `create_user_profile_if_missing(uuid)` | ✅ | ✅ | ⚠️ |

### 1.5 Colonnes sensibles identifiées

| Table | Colonnes sensibles |
|-------|-------------------|
| `google_tokens` | `access_token`, `refresh_token` |
| `users` | `email`, `phone` |
| `clients` | `email`, `phone`, `address`, `total_revenue` |
| `contacts` | `email`, `phone`, `project_price`, `total_revenue` |
| `crmerp_leads` | `email`, `phone` |
| `accounting_entries` | `amount` |
| `partner_transactions` | `amount` |
| `partners` | `email`, `phone` |
| `projects` | `budget` |
| `activity_log` | `ip_address` |

### 1.6 Storage

| Bucket | Public | Policies |
|--------|--------|----------|
| `devis` | ❌ | ✅ 4 policies correctes (user folder isolation) |

---

## ETAPE 2 — MODELE D'AUTORISATION

### Modèle choisi : **Option B (Owner/Assignee) + Permission Flags**

#### Pourquoi ce modèle ?

1. **Single-org** : Propulseo est une seule entreprise, pas multi-tenant → Option A (orgs) est overkill
2. **Déjà en place** : La table `users` a déjà les colonnes `can_view_*` que le frontend utilise
3. **3 utilisateurs** : La simplicité prime sur la flexibilité
4. **Colonnes owner existantes** : `user_id`, `assigned_to`, `created_by` existent sur la plupart des tables

#### Schéma d'autorisation

```
┌──────────────────────────────────────────────────────────┐
│                    MODELE D'ACCES                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  NIVEAU 1 : Authentification                             │
│  └─ anon → AUCUN accès (sauf catalog e-commerce)        │
│  └─ authenticated → accès conditionnel                   │
│                                                          │
│  NIVEAU 2 : Module (visibilité menu/page)                │
│  └─ users.can_view_dashboard  → Dashboard                │
│  └─ users.can_view_leads      → CRM Principal            │
│  └─ users.can_view_crm_bot_one → CRM Bot One            │
│  └─ users.can_view_crm_erp    → CRM ERP                 │
│  └─ users.can_view_projects   → Projects                 │
│  └─ users.can_view_finance    → Accounting               │
│  └─ users.can_view_settings   → Settings (admin only)    │
│  └─ users.can_view_chat       → Chat                     │
│                                                          │
│  NIVEAU 3 : Record (données individuelles)               │
│  └─ Owner : user_id = current_user_auth_id()             │
│  └─ Assignee : assigned_to = current_user_auth_id()      │
│  └─ Admin : is_admin() → accès total                     │
│                                                          │
│  NIVEAU 4 : Action (CRUD granulaire)                     │
│  └─ users.can_edit_leads                                 │
│  └─ users.can_create_projects                            │
│  └─ users.can_edit_projects                              │
│  └─ users.can_assign_tasks                               │
│                                                          │
│  L'ADMIN configure les niveaux 2-4 pour chaque user      │
│  via la page Settings > Team Manager                     │
└──────────────────────────────────────────────────────────┘
```

#### Source de vérité : table `users`

La table `users` (pas `user_permissions`) est la source unique. Les colonnes de permission sont :
- `can_view_dashboard`, `can_view_leads`, `can_view_projects`, `can_view_tasks`
- `can_view_chat`, `can_view_finance`, `can_view_settings`
- `can_view_crm_bot_one`, `can_view_crm_erp`
- `can_edit_leads`, `can_create_projects`, `can_edit_projects`, `can_assign_tasks`

La table `user_permissions` est **redondante** et sera abandonnée (mais pas supprimée pour rollback).

#### Mapping table → permission

| Table(s) | Permission requise (SELECT) | Owner column |
|----------|---------------------------|--------------|
| `clients`, `leads`, `lead_notes`, `prospect_activities`, `activities` | `can_view_leads` | `user_id` / `assigned_to` |
| `contacts`, `contact_activities` | `can_view_leads` | `user_id` |
| `crm_bot_one_records`, `crm_bot_one_activities` | `can_view_crm_bot_one` | `user_id` |
| `crmerp_leads`, `crmerp_activities` | `can_view_crm_erp` | `user_id` / `assigned_to` |
| `crm_columns`, `crm_bot_one_columns` | Config CRM | auth read |
| `projects`, `project_checklists` | `can_view_projects` | `user_id` / `assigned_to` |
| `tasks`, `task_comments` | `can_view_tasks` | `user_id` / `assigned_to` |
| `archived_*` | Même perm que table source | `user_id` |
| `accounting_entries`, `monthly_accounting_metrics` | `can_view_finance` | - (admin/manager) |
| `partners`, `partner_transactions` | `can_view_finance` | - |
| `dashboard_metrics` | `can_view_dashboard` | - (read all auth) |
| `channels`, `messages`, `channel_members`, etc. | `can_view_chat` | membership |
| `events` | toujours accessible | `user_id` |
| `users`, `user_profiles` | toujours accessible (own data) | `auth_user_id` / `id` |
| `google_tokens` | own tokens only | `user_id` |
| `company_settings` | read all, write admin | - |

---

## ETAPE 3 — FONCTIONS UTILITAIRES

Voir migration SQL ci-dessous. Fonctions créées :

1. **`is_admin()`** — Vérifie si l'utilisateur courant est admin (role='admin' OU email admin)
2. **`is_manager_or_admin()`** — Admin ou manager
3. **`current_user_db_id()`** — Retourne `users.id` pour l'auth.uid() courant
4. **`user_has_permission(perm text)`** — Vérifie un flag de permission sur la table users

Toutes avec `SET search_path = ''` et `SECURITY DEFINER` quand nécessaire.

---

## ETAPE 4 — MIGRATION SQL

Voir fichier : `supabase/migrations/20260209_security_rls_overhaul.sql`

---

## ETAPE 5 — CAS SPECIAUX

### Views
Aucune view dans le schema public → pas de risque de bypass.

### Storage
Le bucket `devis` est correctement sécurisé (folder isolation par user).

### Edge Functions
Les Edge Functions utilisent le service_role_key côté serveur → pas de fuite RLS.
Mais les 3 fonctions SQL de password reset **doivent être supprimées** (remplacées par les Edge Functions).

### Triggers
Tous les triggers sont des `update_*_updated_at` ou des sync triggers → pas de risque de bypass RLS. Les triggers SECURITY DEFINER (`handle_new_user`, `trigger_create_client_from_bot_one`) sont nécessaires pour les opérations cross-table.

---

## ETAPE 6 — TESTS DE SECURITE

Voir section tests dans la migration SQL et checklist ci-dessous.

### Checklist de tests

- [ ] User normal ne peut PAS lire `contacts` d'un autre user
- [ ] User normal ne peut PAS lire `google_tokens` d'un autre user
- [ ] User normal ne peut PAS lire `accounting_entries` sans `can_view_finance`
- [ ] User normal ne peut PAS appeler les fonctions password reset (supprimées)
- [ ] User normal ne peut PAS modifier `users.role` ou `users.can_view_*`
- [ ] Admin PEUT lire toutes les tables
- [ ] Admin PEUT modifier les permissions des users
- [ ] Anon ne peut accéder à AUCUNE table métier
- [ ] Anon ne peut appeler AUCUNE fonction métier
- [ ] INSERT respecte les WITH CHECK (user ne peut créer que pour soi)
- [ ] DELETE est restreint (owner + admin seulement)

---

## OUTPUT E — MODIFICATIONS FRONTEND

### Fichiers à adapter

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useUsers.ts` | Les permissions sont déjà lues depuis `users` table → **aucun changement** |
| `src/components/layout/Layout.tsx` | Vérifie déjà `can_view_*` → **aucun changement** |
| `src/components/layout/Sidebar.tsx` | Vérifie déjà `can_view_*` → **aucun changement** |
| `src/modules/Settings/index.tsx` | Vérifie déjà les permissions → **aucun changement** |

**Conclusion** : Le frontend est déjà aligné avec le modèle choisi. Aucune modification de code nécessaire.
Le seul impact potentiel est que certaines requêtes qui marchaient "par chance" (via policies `true`) retourneront maintenant des résultats filtrés. C'est le comportement souhaité.

### Points d'attention post-migration

1. **CRM ERP** (`crmerp_leads`, `crmerp_activities`) : Actuellement ouvert à tous. Après migration, seuls les users avec `can_view_crm_erp = true` ET owner/assigned verront les données.
2. **Contacts** : Actuellement ouvert à tous. Après migration, scoped par user_id.
3. **Tasks** : Actuellement ouvert à tous. Après migration, scoped par user_id/assigned_to.
4. **Projects** : Actuellement tout authenticated peut CRUD. Après migration, scoped.

→ **L'admin devra s'assurer que les users ont les bonnes permissions activées** avant d'appliquer la migration.
