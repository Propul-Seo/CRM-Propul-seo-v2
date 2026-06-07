# SP0 — Socle de liaison & décisions (fusion CRM ↔ Propul'Space)

> Première tranche (SP0) de la Stratégie C. Cadrée 2026-06-05, **vérifiée sur le code réel le 2026-06-07**.
> Doc archi de référence : `docs/superpowers/2026-06-05-crm-propulspace-fusion-architecture.md`
> **Principe : rails + décisions seulement. Zéro migration de donnée. Zéro changement RLS en prod. Le portail reste vert.**

## 1. Objectif
Poser le socle minimal pour que les tranches suivantes (SP1→SP6) convergent **sans rouvrir le schéma de base**, purger le code mort/cassé qui pousse à copier de mauvais exemples, et **figer par écrit** les décisions structurantes. SP0 ne change **aucun comportement visible**.

## 2. Périmètre

### Dans SP0
- **1 migration « rail »** : FK `projects_v2.legacy_project_id`.
- **Purge code conservatrice** (4 items vérifiés, §5) — `tsc` + build verts, **aucun DROP en prod**.
- **ADR-005** : décisions figées (tables canoniques, helper RLS cible, multi-projets, legacy read-only).
- **Inventaire** des usages des 3 helpers RLS (prépare la future tranche RLS).

### Hors SP0 (reporté)
Toute migration de donnée · toute bascule lecture/écriture · tout changement RLS prod (la conso des helpers = étape dédiée) · le switcher multi-projets · R-008 (storage, avant SP4) · la migration localStorage `useActivities` (SP5) · le DROP des tables legacy (fin de chaque SP) · Q3 identité (→ SP1) · Q5 pipeline leads (→ SP2).

## 3. Décisions figées (→ ADR-005)

**Tables canoniques** (ratifie §1 de la doc archi) :

| Concept | Source de vérité |
|---|---|
| Client / identité | `contacts` (registre) + `projects_v2.client_*` (snapshot) |
| Projet | `projects_v2` |
| Facture | `propulspace.invoices` (+ `invoice_installments`) |
| Documents | `propulspace.documents` |
| Activité | `project_activities_v2` (timeline) + `contact_activities` (CRM) · `audit_log` séparé (RGPD) |
| Jalons / Tâches | `checklist_items_v2` (interne) + `propulspace.project_steps` (client) |
| Communication | `posts` (+ `project_id` à venir SP6) |
| Calendrier | `calendar_events` |

**Décision A — Portail multi-projets** (confirme ADR-004) : un email portail peut couvrir N projets. `portal_client_email` = **index simple** (déjà en place, mig. 265), **pas de UNIQUE**. Switcher = backlog (hors SP0). R-009 = perf, **adressé**.

**Décision B — Helpers RLS (ratifiée, migration DIFFÉRÉE)** :
- `is_admin()` (admin OR `team@propulseo-site.com` · ~268 réfs · ~90 % du RLS) → **conservé tel quel** (gating admin, sémantique distincte).
- `is_team_member()` (role IS NOT NULL · 12 réfs) et `is_propulseo_team()` (role IN liste · 15 réfs) sont **quasi-synonymes** (« staff interne ») → **à consolider en UN seul prédicat**.
  - Cible recommandée : garder le **nom** `is_team_member()` (convention R-018 sur `projects_v2`) en adoptant la **sémantique liste-de-rôles explicite** de `is_propulseo_team()` (plus sûre qu'un simple NOT NULL). ~27 réfs à migrer.
  - **La migration SQL + tests RLS = étape dédiée, PAS SP0.** SP0 = décision + inventaire seulement.

**Décision C — Legacy read-only** : `projects` / `leads` / `clients` (+ CRMBotOne / CRMERP) restent en **lecture seule** pendant la transition. Leur DROP intervient **à la fin de la SP qui les remplace**, jamais avant.

**Reporté** : Q3 (contacts vs `auth.users` fait autorité) → SP1. Q5 (1 table `leads` unifiée vs 3 pipelines + vue d'agrégation) → SP2.

## 4. Livrable 1 — Migration « rail » (1 seule)

`supabase/migrations/<timestamp>_fusion_sp0_legacy_project_id.sql` :

```sql
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS legacy_project_id uuid NULL
  REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_v2_legacy_project_id
  ON public.projects_v2(legacy_project_id)
  WHERE legacy_project_id IS NOT NULL;

COMMENT ON COLUMN public.projects_v2.legacy_project_id IS
  'Réconciliation transitoire vers public.projects (CRM legacy). Backfill en SP2. À droper en fin de convergence.';
```

- Colonne **nullable, vide** (backfill en SP2). `ON DELETE SET NULL` → supprimer un projet legacy ne casse rien.
- Idempotente (`IF NOT EXISTS`). Appliquée en prod via **SQL Editor ERP** (MCP non branché sur l'ERP).
- Régénérer ensuite `src/types/database.ts` (ou ajout manuel ciblé dans Row/Insert/Update + `src/types/project-v2.ts`).

**Déjà en place — rien à créer** (vérifié 2026-06-07) :
- Index `contacts.email` : `idx_contacts_email` existe (mig. `divine_castle`).
- Index `portal_client_email` : `idx_projects_v2_portal_client_email` existe (mig. 265, sans UNIQUE).
- → SP0 ne fait que **constater** leur présence ; **pas de nouvelle migration d'index**.

## 5. Livrable 2 — Purge code conservatrice (vérifiée)
Aucun DROP de table en prod. `tsc --noEmit` + `npm run build` verts après chaque retrait.

| # | Cible vérifiée | Action |
|---|---|---|
| **P1** | `src/services/financialSyncService.ts` **absent**, importé par `useFinancialSync.ts` + `useProjectBudget.ts`, eux-mêmes **sans aucun consommateur** | Supprimer `src/hooks/useFinancialSync.ts` et `src/hooks/useProjectBudget.ts` (après confirmation finale 0 import). |
| **P2** | `prospectActivityService.ts:173` → `await import('@/services/activityService')` = **module inexistant** (échoue au runtime, masqué par try/catch) | Neutraliser le dead import dans `syncToCalendar()`. La vraie sync activités → calendrier = **SP5**. |
| **P3** | `useClientPostsQuery.ts` + `useClientPostsCRUD.ts` + re-exports (`hooks/supabase/index.ts:41-42`) — **aucun consommateur** ; tables `client_posts*` sans migration versionnée | Supprimer les 2 hooks + retirer les 2 lignes de barrel. **Laisser toute table en place** (DROP = SP6). Types `client_post*` dans `database.ts` retirés s'ils ne servent plus. |
| **P4** | Zustand persist `propulseo-store` (`src/store/index.ts:24-41`) persiste de la **donnée métier** (`projects`, `accountingData`) réinjectée stale au montage | Retirer `projects` + `accountingData` du `partialize` (source de vérité = Supabase). **Garder** les prefs UI (`darkMode`, `sidebarCollapsed`, `showCompletedTasks`, `currentUser`). `undoHistory` / `dashboardObjectives` / `calendarSyncSettings` → à trancher au plan (UI vs métier). Bump de version persist pour purger les caches existants. |

> ⚠️ `src/services/activitySyncService.ts` **existe et est utilisé** → **NE PAS y toucher**. La doc archi le confondait avec `activityService`.

## 6. Livrable 3 — ADR-005 (doc, aucun code)
- Écrire ADR-005 dans `PROGRESS_PROPULSPACE.md` §5 : Décisions A / B / C + table canonique du §3.
- Annexer l'**inventaire helpers RLS** (is_admin ≈268 · is_propulseo_team 15 · is_team_member 12) → backlog de la future tranche RLS.

## 7. Contraintes load-bearing (ce qui casserait le portail)
Ne PAS toucher : vues `propulspace_*_v2` · `portal_project_id()` / `portal_client_email` · RPC `admin_*` · trigger `guard_portal_columns_admin_only` · `V2_TABLE_MAP` (proxy v2) · les 2 clients Supabase / 2 sessions. **SP0 ne touche aucun de ces éléments → portail vert par construction.**

## 8. Definition of Done
- [ ] Migration `legacy_project_id` appliquée + vérifiée en prod (colonne + FK + index visibles).
- [ ] `database.ts` régénéré (colonne `legacy_project_id` présente côté TS).
- [ ] P1–P4 faits · `tsc --noEmit` + `npm run build` **verts**.
- [ ] Portail toujours vert (smoke test login client + dashboard — par Lyes).
- [ ] ADR-005 + inventaire RLS écrits dans `PROGRESS_PROPULSPACE.md`.
- [ ] Commits séparés par item logique, sur une **branche dédiée SP0**.

## 9. Risques / vigilance
- **P1** : si `tsc` était déjà rouge à cause de `financialSyncService`, la suppression le repasse vert (gain) ; sinon neutre.
- **P2** : vérifier si `syncToCalendar()` est appelé quelque part avant de décider stub vs suppression du corps.
- **P4** : vider le persist peut reloguer (currentUser gardé → OK). Trancher le sort de `undoHistory`/`dashboardObjectives`/`calendarSyncSettings` au plan.
- **Migration** : ajouter une FK pose un lock bref sur `projects_v2` (~51 lignes → négligeable).
- **Types** : après migration, ne pas oublier `database.ts`, sinon `legacy_project_id` invisible côté TS.
