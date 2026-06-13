# R-018 — Refonte policy RLS `projects_v2` (zéro régression)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la policy `authenticated_all_projects_v2` (FOR ALL USING true, fuite RGPD) par 3 policies scopées : équipe interne en R/W complet, client portail en R sur son seul projet + W limité à 3 colonnes profil.

**Architecture:** Une seule transition policy en 2 migrations (additive 262 + cleanup 263). Helper `is_team_member()` (présence dans `public.users` avec `role` non-NULL) introduit en amont. Tests SQL versionnés dans `tests/sql/` exécutés avant et après chaque migration. Bascule réversible en 30s si régression détectée (recreate ancienne policy).

**Tech Stack:** PostgreSQL RLS, Supabase MCP `apply_migration` / `execute_sql`, helpers SECURITY DEFINER existants (`public.is_admin`, `propulspace.portal_project_id`), policies `FOR SELECT`/`FOR UPDATE`/`FOR ALL`, GRANT colonne-level.

---

## Contexte & contraintes

### État actuel (audit prod 2026-05-21)

- **Policy unique** sur `public.projects_v2` :
  - `authenticated_all_projects_v2` — `FOR ALL TO authenticated USING (true) WITH CHECK (true)`
  - → **n'importe quel utilisateur authentifié peut lire/écrire les 51 projets**
- **51 projets** en table.
- **2 vues dépendantes** : `projects_portal_health_v2`, `propulspace_portal_state_v2` (peuvent être en SECURITY DEFINER, à vérifier — si oui, elles sont insensibles à ce changement).
- **Helpers existants** :
  - `public.is_admin()` SECURITY DEFINER — retourne true si `users.role='admin'` OU email `team@propulseo-site.com`. **Insuffisant** pour notre besoin (les commerciaux/marketing/dev seraient bloqués).
  - `propulspace.portal_project_id()` SECURITY DEFINER — retourne le project_id du client portail connecté via match sur `portal_client_email`.

### Code impacté (13 fichiers, 2 surfaces)

**Surface équipe agence (doit garder accès complet)** :
- `src/modules/ProjectDetailsV3Preview/hooks/useProjectUpdateV3.ts` — UPDATE
- `src/modules/ProjectDetailsV3Preview/hooks/useProjectContactsV3.ts` — UPDATE (sync `client_id`)
- `src/modules/ProjectDetailsV3Preview/hooks/useChecklistV3.ts` — UPDATE
- `src/modules/LeadsV3/LeadsV3Page.tsx` — SELECT
- `src/modules/LeadsV3/hooks/useConvertLeadToProject.ts` — INSERT (en pratique passe par edge function `admin-convert-qualif-to-project` → bypass RLS)
- `src/modules/EspaceClient/admin/hooks/usePortalState.ts` — SELECT (admin uniquement)

**Surface client portail (accès limité à SON projet)** :
- `src/modules/EspaceClient/shared/hooks/usePortalAuth.ts` — SELECT par `portal_client_email` (critique : login flow)
- `src/modules/EspaceClient/client/hooks/usePortalProjectDetails.ts` — SELECT
- `src/modules/EspaceClient/client/hooks/usePortalProfileMutations.ts` — UPDATE limité à `client_first_name`, `client_phone`, `client_company`
- `src/modules/EspaceClient/client/ClientLoginPage.tsx` — pas d'accès direct (lecture via `usePortalAuth`)

### Risque clé — login portail

`usePortalAuth.loadAuthState` exécute :
```sql
SELECT id, name, client_name, status, portal_client_email
FROM projects_v2 WHERE portal_client_email = $1
```
**juste après** `signInWithPassword`. À ce moment :
- `auth.uid()` retourne l'UUID du client
- `auth.jwt()->>'email'` retourne l'email du client
- `portal_project_id()` peut donc résoudre le project_id

→ La nouvelle policy `projects_v2_portal_select` (USING `id = portal_project_id()`) doit suffire pour ce flow. **Pas de RPC SECURITY DEFINER additionnelle nécessaire.**

À valider absolument en Task 8 (test runtime).

### Architecture cible

| Policy | Rôles | Cmd | USING | WITH CHECK |
|---|---|---|---|---|
| `projects_v2_team_all` | `authenticated` | `FOR ALL` | `public.is_team_member()` | `public.is_team_member()` |
| `projects_v2_portal_select` | `authenticated` | `FOR SELECT` | `id = propulspace.portal_project_id()` | — |
| `projects_v2_portal_update` | `authenticated` | `FOR UPDATE` | `id = propulspace.portal_project_id()` | `id = propulspace.portal_project_id()` |

+ `REVOKE UPDATE ON projects_v2 FROM authenticated` puis `GRANT UPDATE (client_first_name, client_phone, client_company) ON projects_v2 TO authenticated` pour limiter les colonnes éditables côté client. Les commerciaux gardent accès via la policy `FOR ALL` (qui dans Postgres prend en compte les GRANT colonnes-level — donc il faut **ajouter** `GRANT UPDATE (toutes colonnes admin) ON projects_v2 TO authenticated` aussi, sinon les commerciaux ne peuvent updater que 3 colonnes).

⚠️ **Subtilité Postgres** : un `GRANT UPDATE (col1, col2)` n'est PAS un override de `GRANT UPDATE` global. Si les deux GRANT existent, le user peut update toutes les colonnes. La sécurité réelle vient de la **policy WITH CHECK**, pas du GRANT colonne-level.

Donc on garde `GRANT UPDATE ON projects_v2 TO authenticated` global, et on s'appuie sur :
- Policy team_all (WITH CHECK is_team_member) → autorise tout pour internes
- Policy portal_update (WITH CHECK id=portal_project_id) → autorise update lignes du client portail uniquement

Pour limiter les **colonnes** éditables par le portail, on ajoute un **trigger BEFORE UPDATE** qui rejette si l'utilisateur n'est pas team_member ET essaie de modifier une colonne hors liste blanche. Solution plus propre que jouer avec GRANT colonne-level + WITH CHECK complexe.

### Helper `is_team_member()`

```sql
CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE auth_user_id = auth.uid();
  RETURN user_role IS NOT NULL;
END;
$$;
```

**Pourquoi présence dans `users` + role non-NULL** : la table `public.users` est réservée aux internes Propul'SEO (les clients portail n'ont jamais de row). Un user portail aura toujours `is_team_member() = false`. Future-proof : si Lyes ajoute un rôle "stagiaire", il marche sans nouvelle migration.

---

## File Structure

**Migrations Supabase** (appliquées via MCP `apply_migration`) :
- `259_create_is_team_member.sql` — helper
- `260_create_portal_columns_trigger.sql` — trigger limitation colonnes portail
- `261_add_new_projects_v2_policies.sql` — additif (ancienne policy toujours active)
- `262_drop_old_projects_v2_policy.sql` — bascule (moment critique)
- `263_audit_comments_projects_v2.sql` — COMMENT ON POLICY pour traçabilité

**Tests** :
- `tests/sql/projects_v2_rls.sql` — script versionné, exécuté manuellement avant/après chaque migration RLS

**Code** :
- `src/modules/EspaceClient/client/hooks/usePortalProfileMutations.ts` — retirer le commentaire `R-018 à corriger` (déclaration vraie maintenant)
- `.planning/PROGRESS_PROPULSPACE.md` — append entrée journal R-018

---

## Tasks

### Task 1 : Vérifier vues dépendantes & advisors pré-flight

**Files:**
- Lecture seule (audit)

- [ ] **Step 1 : Vérifier les vues qui dépendent de `projects_v2`**

Exécuter via MCP `execute_sql` sur project `tbuqctfgjjxnevmsvucl` :
```sql
SELECT viewname,
       CASE WHEN viewdefinition ILIKE '%security_invoker%' THEN 'INVOKER' ELSE 'DEFINER' END AS security_mode
FROM pg_views
WHERE schemaname = 'public'
  AND definition ILIKE '%projects_v2%';
```

Attendu : `projects_portal_health_v2` et `propulspace_portal_state_v2` apparaissent. Noter leur mode (INVOKER ou DEFINER).

→ Si DEFINER : insensibles à la nouvelle RLS, OK.
→ Si INVOKER : elles seront soumises à la nouvelle policy, donc un client portail ne verra que sa ligne dans les vues. À documenter dans `usePortalState` si applicable.

- [ ] **Step 2 : Lancer `get_advisors` Supabase MCP avant toute modif**

Exécuter via MCP `get_advisors` (type=security) sur project `tbuqctfgjjxnevmsvucl`. Noter le nombre d'alertes existantes (baseline). On comparera après les migrations pour vérifier qu'on n'introduit pas de nouvelles alertes.

- [ ] **Step 3 : Lister les RPC qui touchent `projects_v2`**

```sql
SELECT n.nspname || '.' || p.proname AS function,
       p.prosecdef AS security_definer
FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%projects_v2%'
ORDER BY n.nspname, p.proname;
```

Toute fonction `prosecdef=true` (SECURITY DEFINER) bypass la RLS et **ne sera PAS impactée** par le changement. Toute fonction `prosecdef=false` (SECURITY INVOKER) hérite des permissions du caller → doit être auditée individuellement.

- [ ] **Step 4 : Documenter findings dans le plan**

Si une RPC SECURITY INVOKER touche `projects_v2`, ajouter une sous-task à Task 5 pour la convertir en DEFINER OU réécrire avec un filtre explicite (ex : `WHERE id = portal_project_id()`).

---

### Task 2 : Créer le script de tests RLS (avant toute migration)

**Files:**
- Create: `tests/sql/projects_v2_rls.sql`

- [ ] **Step 1 : Récupérer 3 UUIDs de test depuis prod**

```sql
-- UUID d'un admin (rôle 'admin')
SELECT auth_user_id AS admin_uuid FROM public.users WHERE role = 'admin' LIMIT 1;

-- UUID d'un team non-admin (rôle 'sales' ou 'marketing')
SELECT auth_user_id AS team_uuid, role FROM public.users WHERE role NOT IN ('admin') LIMIT 1;

-- UUID + email d'un client portail (présent dans auth.users mais PAS dans public.users)
SELECT au.id AS portal_uuid, au.email, p.id AS project_id
FROM auth.users au
JOIN projects_v2 p ON p.portal_client_email = au.email
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = au.id)
LIMIT 1;
```

Noter les 3 triplets (uuid, email, project_id attendu).

- [ ] **Step 2 : Écrire le script de tests**

```sql
-- tests/sql/projects_v2_rls.sql
-- Tests RLS pour public.projects_v2 (R-018).
-- À exécuter via MCP execute_sql ou psql avant ET après chaque migration RLS.
-- Remplace les UUIDs ci-dessous par ceux récupérés en Task 2 Step 1.

DO $$
DECLARE
  v_admin_uuid uuid := '<UUID_ADMIN>';
  v_team_uuid uuid := '<UUID_TEAM_NON_ADMIN>';
  v_portal_uuid uuid := '<UUID_PORTAL_CLIENT>';
  v_portal_email text := '<EMAIL_PORTAL_CLIENT>';
  v_portal_project_id uuid := '<UUID_PROJECT_DU_CLIENT>';
  v_neighbor_project_id uuid;
  v_count int;
  v_failed text[] := ARRAY[]::text[];
BEGIN
  -- Récupère un projet voisin (pas celui du client) pour test négatif
  SELECT id INTO v_neighbor_project_id
  FROM projects_v2 WHERE id <> v_portal_project_id LIMIT 1;

  -- TEST 1 : admin voit tous les projets
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin_uuid, 'email', 'team@propulseo-site.com')::text, true);
  SELECT COUNT(*) INTO v_count FROM projects_v2;
  IF v_count < 51 THEN v_failed := v_failed || 'T1 admin SELECT count=' || v_count; END IF;

  -- TEST 2 : team non-admin voit tous les projets
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_team_uuid)::text, true);
  SELECT COUNT(*) INTO v_count FROM projects_v2;
  IF v_count < 51 THEN v_failed := v_failed || 'T2 team SELECT count=' || v_count; END IF;

  -- TEST 3 : client portail voit UN SEUL projet (le sien)
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_portal_uuid, 'email', v_portal_email)::text, true);
  SELECT COUNT(*) INTO v_count FROM projects_v2;
  IF v_count <> 1 THEN v_failed := v_failed || 'T3 portal SELECT count=' || v_count || ' (attendu 1)'; END IF;

  -- TEST 4 : client portail NE PEUT PAS lire le projet du voisin
  SELECT COUNT(*) INTO v_count FROM projects_v2 WHERE id = v_neighbor_project_id;
  IF v_count <> 0 THEN v_failed := v_failed || 'T4 portal NEIGHBOR LEAK count=' || v_count; END IF;

  -- TEST 5 : client portail peut update SES colonnes profil
  BEGIN
    UPDATE projects_v2 SET client_phone = '+33600000000'
    WHERE id = v_portal_project_id;
    IF NOT FOUND THEN v_failed := v_failed || 'T5 portal UPDATE profile FAILED'; END IF;
  EXCEPTION WHEN OTHERS THEN
    v_failed := v_failed || 'T5 portal UPDATE profile EXCEPTION: ' || SQLERRM;
  END;

  -- TEST 6 : client portail NE PEUT PAS update budget (colonne sensible)
  BEGIN
    UPDATE projects_v2 SET budget = 99999 WHERE id = v_portal_project_id;
    -- Si pas d'exception, on vérifie que budget n'a pas changé
    PERFORM 1 FROM projects_v2 WHERE id = v_portal_project_id AND budget = 99999;
    IF FOUND THEN v_failed := v_failed || 'T6 portal UPDATE budget SHOULD FAIL'; END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- expected
  END;

  -- TEST 7 : client portail NE PEUT PAS update le projet du voisin
  BEGIN
    UPDATE projects_v2 SET client_phone = 'HACK' WHERE id = v_neighbor_project_id;
    IF FOUND THEN v_failed := v_failed || 'T7 portal UPDATE NEIGHBOR SHOULD FAIL'; END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Reset session
  PERFORM set_config('request.jwt.claims', NULL, true);
  PERFORM set_config('role', NULL, true);

  -- Rapport
  IF array_length(v_failed, 1) IS NULL THEN
    RAISE NOTICE '✅ Tous les tests RLS projects_v2 PASS (7/7)';
  ELSE
    RAISE EXCEPTION '❌ Tests RLS projects_v2 FAILED: %', array_to_string(v_failed, ' | ');
  END IF;
END $$;
```

- [ ] **Step 3 : Lancer le script SUR L'ÉTAT ACTUEL (baseline)**

Exécuter via MCP `execute_sql`. Avec la policy actuelle (FOR ALL USING true) :
- TEST 1 PASS (admin voit 51)
- TEST 2 PASS (team voit 51)
- **TEST 3 doit FAIL** (portail voit 51 au lieu de 1) ← c'est exactement la fuite qu'on corrige
- **TEST 4 doit FAIL** (portail accède au voisin)
- TEST 5 PASS (portail peut update)
- **TEST 6 doit FAIL** (portail peut update budget)
- **TEST 7 doit FAIL** (portail peut update voisin)

→ Confirme que le script détecte bien la fuite. Si TOUS les tests passent en baseline, le script est cassé (faux négatif).

- [ ] **Step 4 : Commit**

```bash
git add tests/sql/projects_v2_rls.sql
git commit -m "test(rls): script de tests RLS projects_v2 (R-018 baseline)

Baseline confirme la fuite : tests 3,4,6,7 FAIL avec la policy
actuelle FOR ALL USING true. Sera relancé après chaque migration."
```

---

### Task 3 : Migration 259 — Helper `is_team_member()`

**Files:**
- Migration : `259_create_is_team_member`

- [ ] **Step 1 : Pre-flight protocol (4 étapes)**

Suivre le protocole Propul'Space :
1. État actuel : `SELECT proname FROM pg_proc WHERE proname='is_team_member';` → doit être vide
2. Dry-run mental : la migration ne crée qu'une fonction, zéro effet sur les données. Rollback = `DROP FUNCTION public.is_team_member()`.
3. Advisors : noter baseline (Task 1 Step 2)
4. Validation Lyes : présenter la migration en français vulgarisé avant `apply_migration`.

- [ ] **Step 2 : Appliquer la migration via MCP**

```sql
-- name: 259_create_is_team_member

CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE auth_user_id = auth.uid();

  -- Retourne true si l'utilisateur est dans public.users avec un rôle non-NULL.
  -- public.users est réservée aux internes Propul'SEO (les clients portail
  -- n'ont jamais de row). Future-proof : tout nouveau rôle interne fonctionne
  -- sans nouvelle migration.
  RETURN user_role IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION public.is_team_member() IS
'R-018 — Renvoie true si l''utilisateur connecté est un membre interne (présent dans public.users avec un role non-NULL). Utilisé par les policies RLS de projects_v2 et tables liées.';

GRANT EXECUTE ON FUNCTION public.is_team_member() TO authenticated;
```

- [ ] **Step 3 : Sanity check**

```sql
-- En tant qu'admin
SELECT public.is_team_member();  -- attendu : true

-- Reset puis test sans contexte auth
SELECT public.is_team_member();  -- attendu : false (auth.uid() NULL)
```

- [ ] **Step 4 : Advisors check**

`get_advisors` ne doit pas avoir d'alerte nouvelle. Une alerte "function not in pg_temp search_path" est attendue et acceptée (volontaire, search_path='').

- [ ] **Step 5 : Commit**

```bash
git commit -m "feat(rls): helper is_team_member() pour policies projects_v2 (R-018)

Étape 1/5 de la refonte R-018. Helper SECURITY DEFINER qui retourne
true si l'utilisateur est dans public.users avec un role non-NULL.
Sera utilisé par la nouvelle policy projects_v2_team_all."
```

---

### Task 4 : Migration 260 — Trigger limitation colonnes portail

**Files:**
- Migration : `260_portal_columns_guard_projects_v2`

- [ ] **Step 1 : Définir la liste blanche des colonnes éditables par le portail**

Colonnes que le client portail PEUT updater (depuis `usePortalProfileMutations`) :
- `client_first_name`
- `client_phone`
- `client_company`

Toutes les autres colonnes (`budget`, `status`, `name`, `start_date`, `end_date`, `portal_client_email`, `assigned_name`, etc.) sont **interdites** au portail.

- [ ] **Step 2 : Pre-flight**

État actuel : `SELECT tgname FROM pg_trigger WHERE tgrelid='public.projects_v2'::regclass;` → noter triggers existants pour ne pas les casser.

- [ ] **Step 3 : Appliquer la migration**

```sql
-- name: 260_portal_columns_guard_projects_v2

CREATE OR REPLACE FUNCTION public.projects_v2_portal_columns_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Les internes (team_member) ont droit de tout modifier
  IF public.is_team_member() THEN
    RETURN NEW;
  END IF;

  -- Pour tout le reste (client portail), on vérifie que SEULES
  -- les colonnes de la liste blanche ont changé.
  IF NEW.budget IS DISTINCT FROM OLD.budget
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.name IS DISTINCT FROM OLD.name
     OR NEW.start_date IS DISTINCT FROM OLD.start_date
     OR NEW.end_date IS DISTINCT FROM OLD.end_date
     OR NEW.portal_client_email IS DISTINCT FROM OLD.portal_client_email
     OR NEW.assigned_name IS DISTINCT FROM OLD.assigned_name
     OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
     OR NEW.client_id IS DISTINCT FROM OLD.client_id
     OR NEW.client_name IS DISTINCT FROM OLD.client_name
     OR NEW.client_email IS DISTINCT FROM OLD.client_email
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.presta_type IS DISTINCT FROM OLD.presta_type
     OR NEW.siret IS DISTINCT FROM OLD.siret
     OR NEW.portal_phase IS DISTINCT FROM OLD.portal_phase
     OR NEW.portal_activated_at IS DISTINCT FROM OLD.portal_activated_at
  THEN
    RAISE EXCEPTION 'R-018 — Le portail client ne peut modifier que client_first_name, client_phone, client_company. Tentative de modification d''une colonne protégée détectée.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.projects_v2_portal_columns_guard() IS
'R-018 — Trigger BEFORE UPDATE qui restreint le portail client à modifier UNIQUEMENT client_first_name/client_phone/client_company. Les team_member sont court-circuités.';

CREATE TRIGGER projects_v2_portal_columns_guard_trg
  BEFORE UPDATE ON public.projects_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.projects_v2_portal_columns_guard();
```

- [ ] **Step 4 : Smoke test immédiat (la policy permissive est encore active, donc on teste juste le trigger)**

Via MCP `execute_sql`, simuler un client portail :
```sql
SELECT set_config('role', 'authenticated', false);
SELECT set_config('request.jwt.claims',
  '{"sub":"<UUID_PORTAL>","email":"<EMAIL_PORTAL>"}', false);

-- Doit passer
UPDATE projects_v2 SET client_phone = '+33600000001'
WHERE id = '<UUID_PROJECT_PORTAL>';

-- Doit FAIL avec "insufficient_privilege"
UPDATE projects_v2 SET budget = 99999
WHERE id = '<UUID_PROJECT_PORTAL>';
```

Si TEST 6 du script `projects_v2_rls.sql` passe maintenant, le trigger fait son boulot.

- [ ] **Step 5 : Commit**

```bash
git commit -m "feat(rls): trigger limite colonnes éditables par portail (R-018)

Étape 2/5. Trigger BEFORE UPDATE qui rejette toute modif d'une
colonne hors liste blanche (client_first_name/phone/company) si
l'appelant n'est pas team_member. Les internes bypass."
```

---

### Task 5 : Audit RPC SECURITY INVOKER (préparation Task 6)

**Files:**
- Lecture seule

- [ ] **Step 1 : Re-lancer la requête de Task 1 Step 3**

```sql
SELECT n.nspname || '.' || p.proname AS function,
       p.prosecdef AS security_definer
FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%projects_v2%'
  AND n.nspname IN ('public', 'propulspace')
ORDER BY p.prosecdef, n.nspname, p.proname;
```

- [ ] **Step 2 : Pour chaque fonction `prosecdef=false`, ouvrir sa définition**

```sql
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = '<schema>' AND p.proname = '<name>';
```

Pour chaque fonction trouvée, décider :
- **A** : passer en SECURITY DEFINER (si la fonction est pensée pour être un wrapper public)
- **B** : ajouter un filtre explicite `WHERE id = portal_project_id() OR is_team_member()` (si la fonction est censée respecter la RLS du caller)
- **C** : laisser en INVOKER (si la nouvelle RLS suffit — c'est ok pour les fonctions qui lisent et qu'on veut soumettre à la RLS)

- [ ] **Step 3 : Documenter les décisions dans une nouvelle section du plan**

Ajouter ici la liste des fonctions auditées et la décision prise pour chacune. Si aucune fonction INVOKER ne touche `projects_v2`, écrire "Aucune RPC INVOKER à modifier" et passer à Task 6.

- [ ] **Step 4 (conditionnel) : Si décision A pour une ou plusieurs fonctions**

Créer une migration intermédiaire `260b_promote_rpc_to_security_definer.sql` avec le détail. Tester chaque RPC via MCP `execute_sql` après modif.

- [ ] **Step 5 : Commit (si modif)**

```bash
git commit -m "fix(rls): RPC X promue SECURITY DEFINER avant bascule R-018"
```

---

### Task 6 : Migration 261 — Additif : 3 nouvelles policies (ancienne toujours active)

**Files:**
- Migration : `261_add_new_projects_v2_policies`

- [ ] **Step 1 : Pre-flight**

État actuel des policies :
```sql
SELECT polname FROM pg_policy WHERE polrelid = 'public.projects_v2'::regclass;
```
Attendu : `authenticated_all_projects_v2` (unique).

- [ ] **Step 2 : Appliquer la migration**

```sql
-- name: 261_add_new_projects_v2_policies

-- Phase additive : on ajoute les nouvelles policies SANS retirer l'ancienne.
-- Postgres applique le OR entre toutes les policies → tant que l'ancienne
-- (USING true) est là, rien ne change. Mais on peut TESTER les nouvelles
-- en isolation via le script tests/sql/projects_v2_rls.sql ré-exécuté
-- après suppression mentale de l'ancienne (les nouvelles seules doivent
-- couvrir tous les cas légitimes).

CREATE POLICY projects_v2_team_all
  ON public.projects_v2
  FOR ALL
  TO authenticated
  USING (public.is_team_member())
  WITH CHECK (public.is_team_member());

CREATE POLICY projects_v2_portal_select
  ON public.projects_v2
  FOR SELECT
  TO authenticated
  USING (id = propulspace.portal_project_id());

CREATE POLICY projects_v2_portal_update
  ON public.projects_v2
  FOR UPDATE
  TO authenticated
  USING (id = propulspace.portal_project_id())
  WITH CHECK (id = propulspace.portal_project_id());

COMMENT ON POLICY projects_v2_team_all ON public.projects_v2 IS
'R-018 — Équipe interne (présence dans public.users avec role non-NULL) a accès R/W complet.';

COMMENT ON POLICY projects_v2_portal_select ON public.projects_v2 IS
'R-018 — Client portail voit UNIQUEMENT son projet (matché via portal_client_email JWT).';

COMMENT ON POLICY projects_v2_portal_update ON public.projects_v2 IS
'R-018 — Client portail peut updater UNIQUEMENT sa ligne. Colonnes restreintes par trigger projects_v2_portal_columns_guard_trg.';
```

- [ ] **Step 3 : Vérifier l'état**

```sql
SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'public.projects_v2'::regclass;
```
Attendu : 4 policies (`authenticated_all_projects_v2` + les 3 nouvelles).

- [ ] **Step 4 : Smoke test runtime app**

Lancer `npm run dev`, se logger CRM admin → vérifier que Leads V3 affiche toujours tous les projets. Aucune régression attendue (la policy permissive est toujours là).

- [ ] **Step 5 : Commit**

```bash
git commit -m "feat(rls): ajout policies scopées projects_v2 (R-018 phase 3/5)

3 nouvelles policies créées en mode additif :
- projects_v2_team_all : internes en R/W
- projects_v2_portal_select : client portail voit son projet
- projects_v2_portal_update : client portail update son projet
L'ancienne policy authenticated_all_projects_v2 reste active.
Bascule effective en migration 262 (DROP de l'ancienne)."
```

---

### Task 7 : Migration 262 — Bascule : DROP ancienne policy ⚠️ MOMENT CRITIQUE

**Files:**
- Migration : `262_drop_old_projects_v2_policy`

- [ ] **Step 1 : Re-lancer le script de tests RLS AVANT bascule**

Exécuter `tests/sql/projects_v2_rls.sql`. Doit FAIL sur T3/T4/T6/T7 (fuite encore présente via l'ancienne policy).

- [ ] **Step 2 : Pre-flight critique**

- Vérifier qu'aucune session admin n'est en train d'écrire (regarder via Supabase Studio si possible)
- Confirmer avec Lyes qu'on bascule MAINTENANT
- Préparer la commande de rollback en clair (à coller en 30s si KO) :

```sql
-- ROLLBACK D'URGENCE — à exécuter via MCP execute_sql si bascule KO
CREATE POLICY authenticated_all_projects_v2
  ON public.projects_v2 FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

- [ ] **Step 3 : Appliquer la migration**

```sql
-- name: 262_drop_old_projects_v2_policy

DROP POLICY IF EXISTS authenticated_all_projects_v2 ON public.projects_v2;

-- Vérification immédiate
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_policy
  WHERE polrelid = 'public.projects_v2'::regclass;
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'R-018 — État de policies inattendu : % policies trouvées (attendu 3)', v_count;
  END IF;
END $$;
```

- [ ] **Step 4 : Re-lancer le script de tests RLS APRÈS bascule**

Doit afficher `✅ Tous les tests RLS projects_v2 PASS (7/7)`.

**Si KO** : exécuter immédiatement le ROLLBACK D'URGENCE (Step 2). Analyser le test qui a échoué, corriger, retenter.

- [ ] **Step 5 : Smoke test runtime app — 5 scénarios obligatoires**

1. **CRM Admin (team@propulseo-site.com)** : se logger, ouvrir Leads V3 → voir tous les projets ✓
2. **CRM Team non-admin** : se logger avec un compte commercial, ouvrir Leads V3 → voir tous les projets ✓
3. **Portail client** : se logger avec un client portail → ne voir QUE son projet (dashboard portail) ✓
4. **Édition profil portail** : changer son téléphone via `usePortalProfileMutations` → succès ✓
5. **Conversion lead→projet** (admin) : depuis CRM, convertir un lead → nouveau projet créé ✓

Chaque scénario testé en console browser : vérifier `Network` qu'il n'y a pas de 403/RLS error.

- [ ] **Step 6 : Advisors check final**

`get_advisors` ne doit pas avoir de nouvelle alerte critique. L'alerte `auth_rls_initplan` peut apparaître si les policies utilisent des fonctions non-volatiles — c'est juste un avertissement perf, pas bloquant.

- [ ] **Step 7 : Commit**

```bash
git commit -m "feat(rls): bascule policies projects_v2 — R-018 résolu (4/5)

DROP de authenticated_all_projects_v2 (FOR ALL USING true).
Désormais seules les 3 policies scopées sont actives.
Script tests/sql/projects_v2_rls.sql passe 7/7.
Smoke test runtime OK sur admin, team, portail, conversion lead."
```

---

### Task 8 : Mise à jour code TS

**Files:**
- Modify: `src/modules/EspaceClient/client/hooks/usePortalProfileMutations.ts:23`

- [ ] **Step 1 : Retirer le commentaire obsolète**

Dans `usePortalProfileMutations.ts`, lignes 22-25 actuelles :
```ts
   * NB : la table projects_v2 a actuellement une policy permissive FOR ALL TO
   *      authenticated USING (true) (R-018 à corriger). On compense côté UI en
   *      filtrant par project.id du contexte portail.
```

Remplacer par :
```ts
   * Sécurité : la table projects_v2 a une RLS scopée (R-018) qui restreint
   * le portail à son projet + 3 colonnes (client_first_name/phone/company).
   * Toute tentative d'update d'une autre colonne est rejetée par le trigger
   * projects_v2_portal_columns_guard_trg avec une erreur "insufficient_privilege".
```

- [ ] **Step 2 : Vérifier qu'aucun autre commentaire "R-018" / "policy permissive" / "à corriger" ne traîne**

```bash
grep -rn "R-018\|FOR ALL.*authenticated\|policy permissive" src/
```

Si résultats : mettre à jour ou retirer les mentions devenues fausses.

- [ ] **Step 3 : Type check**

```bash
npm run build
```
Doit être clean.

- [ ] **Step 4 : Commit**

```bash
git commit -m "docs(portal): retire mentions R-018 obsolètes dans commentaires

R-018 est résolu (migrations 259-262). Les commentaires qui
décrivaient la policy permissive comme 'à corriger' sont mis à jour."
```

---

### Task 9 : Migration 263 — Documentation & audit final

**Files:**
- Migration : `263_audit_projects_v2_rls`

- [ ] **Step 1 : Appliquer la migration de documentation**

```sql
-- name: 263_audit_projects_v2_rls

COMMENT ON TABLE public.projects_v2 IS
'Source de vérité des projets agence/client. RLS R-018 active depuis 2026-05-XX :
- Équipe interne (is_team_member()) : R/W complet
- Client portail (portal_project_id() match) : R sur sa ligne + UPDATE sur 3 colonnes profil
- Toute autre tentative : 0 row visible OU 403.
Tests : tests/sql/projects_v2_rls.sql (7 tests).';

-- Vérification finale : 3 policies, RLS activée, trigger en place
DO $$
DECLARE
  v_rls_enabled boolean;
  v_policy_count int;
  v_trigger_count int;
BEGIN
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class WHERE oid = 'public.projects_v2'::regclass;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policy WHERE polrelid = 'public.projects_v2'::regclass;

  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger WHERE tgname = 'projects_v2_portal_columns_guard_trg';

  IF NOT v_rls_enabled THEN RAISE EXCEPTION 'R-018 — RLS désactivée !'; END IF;
  IF v_policy_count <> 3 THEN RAISE EXCEPTION 'R-018 — Nombre de policies inattendu : %', v_policy_count; END IF;
  IF v_trigger_count <> 1 THEN RAISE EXCEPTION 'R-018 — Trigger portail manquant'; END IF;

  RAISE NOTICE '✅ R-018 verrouillé : RLS active, 3 policies, 1 trigger garde.';
END $$;
```

- [ ] **Step 2 : Update du PROGRESS Propul'Space**

Ajouter dans `.planning/PROGRESS_PROPULSPACE.md` section 3 (Journal) une entrée datée :

```markdown
### ✅ R-018 — Refonte policy RLS projects_v2 (terminé YYYY-MM-DD)
**Démarré** : 2026-05-21
**Terminé** : YYYY-MM-DD
**Périmètre** : fermeture du trou RGPD critique (ancienne policy FOR ALL USING true permettait à tout authenticated de lire les 51 projets).

**Migrations appliquées** : 259, 260, 261, 262, 263
- 259 : helper `is_team_member()` (présence dans public.users)
- 260 : trigger `projects_v2_portal_columns_guard_trg` (limite portail à 3 colonnes profil)
- 261 : ajout des 3 nouvelles policies en mode additif
- 262 : DROP de l'ancienne policy permissive (moment de bascule)
- 263 : COMMENT ON TABLE + vérification finale (RLS active, 3 policies, 1 trigger)

**Tests** : `tests/sql/projects_v2_rls.sql` (7 tests, tous PASS post-bascule).
- T1 admin voit 51 ✓
- T2 team voit 51 ✓
- T3 portail voit 1 ✓
- T4 portail ne voit pas le voisin ✓
- T5 portail update son profil ✓
- T6 portail ne peut pas update budget ✓
- T7 portail ne peut pas update voisin ✓

**Smoke test runtime** : 5 scénarios validés (admin Leads V3 / team Leads V3 / portail dashboard / portail update profil / conversion lead).

**Validation** : `npm run build` clean. Advisors Supabase : aucune nouvelle alerte critique.

**Hors-périmètre** :
- Helpers similaires sur autres tables (`tasks`, `clients`) à auditer en R-019 (suite roadmap).
- Conversion script SQL → pgTAP différée à R-007.
```

- [ ] **Step 3 : Tag git pour traçabilité**

```bash
git tag -a r-018-resolved -m "R-018 fermé : projects_v2 RLS scopée. Tests 7/7 PASS."
```

- [ ] **Step 4 : Commit final**

```bash
git add .planning/PROGRESS_PROPULSPACE.md
git commit -m "docs(propulspace): R-018 résolu — entrée journal + tag git

5 migrations appliquées (259-263), 7/7 tests RLS PASS,
5/5 smoke tests runtime OK. Trou RGPD critique fermé."
```

---

## Self-Review

**Spec coverage** :
- ✅ Helper `is_team_member()` (présence non-NULL dans public.users) — Task 3
- ✅ Bascule en 2 migrations additif/cleanup — Tasks 6, 7
- ✅ Tests SQL versionnés — Task 2
- ✅ Audit RPC SECURITY INVOKER — Task 5
- ✅ Trigger limite colonnes portail — Task 4
- ✅ Documentation (COMMENT ON TABLE) — Task 9
- ✅ Rollback d'urgence préparé — Task 7 Step 2
- ✅ Smoke test runtime 5 scénarios — Task 7 Step 5

**Placeholders** : néant. Tous les UUIDs sont marqués `<UUID_…>` avec instruction explicite Task 2 Step 1 pour les récupérer en prod.

**Type consistency** : `is_team_member()` utilisé partout (jamais renommé), `portal_project_id()` est la fonction existante (jamais inventé `portal_project_ids()` qui n'existe pas en prod), nom de trigger `projects_v2_portal_columns_guard_trg` cohérent entre migration 260 et vérification 263.

---

## Exécution

**Plan complet, sauvegardé.** Deux options d'exécution :

1. **Subagent-Driven (recommandé)** — un agent frais par task, review entre chaque, itération rapide. Cohérent avec le risque (sécu critique, 51 projets en prod).
2. **Inline Execution** — exécution dans cette session avec checkpoints.

Lyes choisit.
