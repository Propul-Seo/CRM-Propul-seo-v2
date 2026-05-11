# Session State — 2026-05-11 22:30

## Branch
main

## Completed This Session
- **Sprint 1** (V3 isolation foundations) : composants génériques `src/components/activities-hub/` (QuickActionBar, ActivityModal, ActivityTimeline, types). Réutilisables pour V3 sans toucher V1/V2.
- **Sprint 2** (sidebars V3) : `ProjectV3LeftSidebar` + `ProjectV3RightSidebar` (copies adaptées du CRM ERP lead). Statuts génériques + spécifiques (sw/erp/comm) gérés via `getStatusStyle`/`getStatusLabel` avec fallback safe.
- **Sprint 3** (onglets centraux) : 4 onglets V3 — Synthèse (KPI cards + timeline d'activités), Production (checklist par phase + templates par presta_type), Brief (édition 6 champs), Documents (GED par catégorie avec upload Supabase Storage).
- **Sprint 4** (assemblage + route) : `ProjectDetailsV3Preview/index.tsx` (orchestration 3 colonnes + chip "V3 Preview"). Route `/projets-v3-preview/:id` accessible.
- **Mode démo admin** : script local `scripts/create-demo-admin.mjs` (ignoré par git, mot de passe en clair). Compte créé : `lyestriki@yahoo.fr` / `DemoPropul2026!`, rôle admin toutes permissions.
- **Bug fix** : `addActivity` du hook V3 alignée sur la vraie table BDD (`content` direct, pas `title`/`description` — la table prod utilise toujours l'ancien schéma).
- **Sécurité (code review)** : route `/projets-v3-preview` ajoutée dans `routePermissions` avec permission `can_view_projects`.

## Next Task
**Démarrer Sprint 3A — UX Overhaul sur la branche `preview/v3-ux-overhaul`.**

Plan complet dans [`.planning/V3_UX_OVERHAUL_PLAN.md`](./V3_UX_OVERHAUL_PLAN.md).

Sprints prévus :
- **3A — Bugs bloquants** (~1h) : fix ajout tâche (bug `position` vs `sort_order` confirmé par code review #4), sidebar app collapse auto sur page V3, pipeline adapté au type de projet (sw/erp/comm), breadcrumb cliquable.
- **3B — Cohérence info** (~1h) : supprimer redondances statuts (3 endroits → 1), repenser/supprimer section "Statistiques" droite, empty states actionnables, compteurs sur onglets.
- **3C — Polish typo/empty/buttons** (~2h) : hiérarchie typographique, sidebar collapsable, QuickActionBar plus engageante, badges priorité par défaut invisibles, loading skeleton coordonné.
- **3D — Power user + robustesse** (~2h) : toast d'erreur systématique (fixe code review #1, #2), optimistic UI, raccourcis clavier (Cmd+K palette), mode focus, permissions par rôle, `uploader_name` correct (#2), `fetchDocs` stable (#3).

**Première commande de la prochaine session** :
```
git checkout preview/v3-ux-overhaul
```

## Blockers
Aucun.

## Key Context
- **Règle V3 isolation stricte** : ne JAMAIS modifier les fichiers V1/V2. Tout en V3 est dans `src/components/activities-hub/` et `src/modules/ProjectDetailsV3Preview/`. Mémoire `feedback_v3_isolation.md` à respecter. Cf MEMORY.md.
- **Mode démo admin** : `lyestriki@yahoo.fr` / `DemoPropul2026!` sur le projet Supabase `tbuqctfgjjxnevmsvucl`. Script `scripts/create-demo-admin.mjs` non commit. Pour relancer : `node scripts/create-demo-admin.mjs`.
- **Bug V2 connu (non corrigé) — règle isolation** : `useActivitiesV2` (V2) insère `content` au lieu de `title`/`description` SI la table v2.project_activities (schéma v2) est utilisée. En réalité le client `v2.from('project_activities')` redirige vers `public.project_activities_v2` qui utilise `content` → V2 fonctionne par hasard. À investiguer un jour si schéma BDD migré.
- **2 fichiers V1/V2 modifiés** (additif autorisé) : `src/lib/routes.ts` (helper + permission) et `src/components/layout/Layout.tsx` (lazy import + Route).
- **Migration SQL non commitée** : `supabase/migrations/20260507_project_end_checklist.sql` — chantier antérieur, à vérifier avant prochain commit BDD.
- **Issues de code review différées au Sprint 3D** : #1 (handleDelete erreurs), #2 (uploader_name hardcodé), #3 (fetchDocs stable). Issue #6 (sécurité permission) **corrigée** cette session. Issue #4 (position vs sort_order) à fixer en Sprint 3A.
