# SP5 — Activités (fil d'activité projet) — Design / cadrage

> Statut : **CADRÉ, PRÊT À DÉCIDER** (rédigé en session autonome 2026-06-08).
> ⚠️ **Aucune migration appliquée.** Le SQL est un **brouillon** (`.planning/SP5_DRAFT_migration_297.sql`)
> à finaliser après les décisions de Lyes (§4) + une **relecture backend adversariale** (discipline projet).
> S'inscrit dans [[crm-propulspace-fusion]] (avant-dernière tranche, avant SP6).

## 1. Objectif

Faire de `project_activities_v2` la **source de vérité unique** du fil d'activité projet, et
« finir » SP5 : traçabilité (audit), écritures sécurisées (RPC), RLS prod, et **affichage côté
portail client** (aujourd'hui absent).

## 2. État réel (audit du 2026-06-08)

| Brique | État |
|---|---|
| Table `public.project_activities_v2` (id, project_id, user_id, author_name, type, content, is_auto, metadata jsonb, created_at) | ✅ existe |
| Métadonnées enrichies (`metadata.realized_at`, `metadata.next_actions`) | ✅ en place (sans migration, livré commit `195c1e6`) |
| Modal + timeline **admin** (`ProjectActivityModalV3`, `SyntheseTabV3`, `ActivityTimeline`) | ✅ fonctionnel |
| CRUD admin (`useProjectActivitiesV3` : insert/update/delete **directs**) | ✅ mais écritures directes |
| **Trigger d'audit** sur la table | ❌ absent → `admin_get_audit_log` ne renvoie rien pour les activités |
| **Vue portail** `propulspace_activities_v2` + type `PortalActivity` + affichage client | ❌ absent |
| **RPC** `admin_create/update/delete_activity` | ❌ absent (écritures directes) |
| **RLS stricte** prod (actuellement `dev_all USING true`) | ❌ permissive → fuite inter-clients en prod |
| Sync calendrier (`ProspectActivityService.syncToCalendar`) | ❌ no-op intentionnel |

## 3. Cible proposée (1 migration `297` + front)

```
┌─ public.project_activities_v2  (+ colonne visible_to_client)
│   ├─ RLS stricte : team = is_team_member() FOR ALL
│   │                portal = SELECT WHERE project_id = portal_project_id() AND visible_to_client
│   ├─ trigger AFTER I/U/D  →  propulspace.audit_trigger_fn()  (réutilise l'existant)
│   └─ RPC admin_create/update/delete_activity (SECURITY DEFINER, is_admin, MAJ last_activity_at)
│
├─ public.propulspace_activities_v2  (VUE, security_invoker, REVOKE anon / GRANT authenticated)
│   └─ whitelist colonnes SAFE : id, project_id, type, content, author_name, created_at,
│                                 (metadata->>'realized_at') as realized_at
│       → exposée au portail via v2Portal.from('propulspace_activities_v2')
│
└─ admin_get_audit_log / ActivityTab : inclure resource_type 'public.project_activities_v2'
```

Front (gated sur la migration — donc **non livré cette session**) :
- `usePortalProjectActivities()` dans `client/hooks/usePortalData.ts` (lecture vue).
- `ClientActivityTimeline` réutilisant le style V2 (cf. `DashboardPage`/`ProjectPage`), branché dans
  le bloc « Activité & prochaine étape » de `ProjectPage.tsx` (déjà refondu en V2).
- `useProjectActivitiesV3` : bascule des écritures directes → RPC `admin_*` + entrées `AdminRpcMap`.

## 4. ⚠️ Décisions à trancher par Lyes (avant de figer le SQL)

| # | Question | Défaut recommandé (dans le brouillon) |
|---|---|---|
| **D1** | Le client voit-il **toutes** les activités ou seulement celles marquées visibles ? | **Opt-in admin** : colonne `visible_to_client` (défaut `false`), comme les documents SP4 (« interne par défaut »). Toggle par ligne dans le modal admin. |
| **D2** | Expose-t-on `next_actions` (prochaines actions) au client ? | **Non** (planning interne équipe). On expose `content`, `author_name`, `realized_at`. |
| **D3** | Expose-t-on `author_name` au client ? | **Oui** (le client aime voir « Marie G. a… »). Jamais `user_id`. |
| **D4** | RLS admin : tous les admins voient toutes les activités ? | **Oui** — cohérent avec [[admin-acces-equipe-globale]] (`is_team_member()` FOR ALL). |
| **D5** | On crée les RPC `admin_*_activity` maintenant (au lieu des écritures directes) ? | **Oui** (centralise validation + MAJ `last_activity_at` + cohérence audit). |
| **D6** | Les activités `is_auto`/`system` sont-elles visibles côté client ? | **Non par défaut** (filtre `visible_to_client` les exclut tant qu'un admin ne les coche pas). |
| **D7** | Sync calendrier ? | **Reportée SP6+** (garder le stub). |
| **D8** | Numéro de migration | **297** (libre selon la mémoire). |

## 5. Plan d'exécution (après go Lyes)

1. **Relecture backend adversariale** du SQL brouillon (sous-agent type « backend architect » + revue RLS/FK/trigger) — discipline `ultracode` pour une migration prod.
2. Finaliser `supabase/migrations/20260608xxxxxx_propulspace_297_activities_sp5.sql` (depuis le brouillon).
3. Lyes applique le SQL à la main (cf. [[migrations-fournir-sql-copier-coller]]), régénère/édite `database.ts`.
4. Front (vue → hook → `ClientActivityTimeline` → branchement `ProjectPage` ; bascule écritures RPC).
5. `npx tsc --noEmit` + `npx vite build` + recette navigateur (Lyes).

## 6. Risques

- 🔴 **RLS prod** : le passage `dev_all` → stricte doit être **additif puis bascule** (pattern R-018) pour ne pas casser l'admin en vol.
- 🟠 **Trigger d'audit** : `resource_type` sera `public.project_activities_v2` (table en schéma `public`, pas `propulspace`) → bien penser à **élargir le filtre** d'`admin_get_audit_log`/`ActivityTab`, sinon l'audit n'apparaît pas.
- 🟠 **Écritures portail** : la vue est SELECT-only ; le client n'écrit jamais d'activité (lecture seule) — pas de RPC portail nécessaire.
