# Session State — 2026-05-12 14:45

## Branch
**preview/v3-ux-overhaul** (exception assumée — chantier V3 isolé, validé en début de session)

## Completed This Session
- **Sprint 0** : retrait variantes Synthèse + simplification QuickActionBar (4 actions, plus de "Tâche"/"Plus")
- **Sprint 1** (1.1-1.5) : édition projet/contact/pipeline/échéance câblés. Hotfix : tous les updates passent via `useProjectUpdateV3` (v2 schema), pas `useProjectsCRUD` (V1)
- **Sprint 1.6** : pipeline en Select (validé via 3 previews) + contact enrichi (email/tél cliquables) + refonte sidebars (gauche=identité, droite=actions)
- **Sprint 1.7** : multi-contacts par projet avec rôles (Principal/Décideur/Technique/Comptabilité/Autre+custom). Table `project_contacts` créée en prod + migration versionnée. Hook `useProjectContactsV3` + UI cards + RoleEditorV3 inline + AddProjectContactModalV3
- **Code review pre-flight** : 3 fixes (mode création ContactEditModalV3 dead path supprimé, migration .sql ajoutée au repo, commentaire useProjectsCRUD nettoyé)

## Next Task
**Sprint 2 — Templates mocks → BDD (fix bugs Production)**

Fichier critique : `src/modules/ProjectDetailsV3Preview/hooks/useChecklistV3.ts`

Bugs racine identifiés :
1. `mockSiteWebChecklists.ts` (et ERP/Comm) contient `assigned_to: 'user-alice'` (string non-UUID) → INSERT en BDD crashe
2. Items mock (préfixés `sw-`/`erp-`/`comm-`) restent en mémoire, jamais matérialisés en BDD → toggle ne persiste pas

Fix : implémenter `materializeTemplate(projectId, prestaType, projectAssignedTo)` dans useChecklistV3 qui :
- INSERT batch des items du template au premier mount si pas déjà fait
- `assigned_to = projectAssignedTo ?? null` (hérite de l'assigné projet, ignore les 'user-alice' du mock)
- Une fois en BDD, toggle devient un vrai UPDATE persistant

Plan complet dans `.claude/plans/sur-la-partie-document-glowing-bonbon.md` (Sprint 2).

## Blockers
Aucun. MCP Supabase configuré sur le bon projet (`tbuqctfgjjxnevmsvucl` = ERP), migrations applicables directement.

## Key Context
- **Page projet V3 entièrement fonctionnelle** : Modifier projet, édition contact multi avec rôles, pipeline en Select cliquable, responsable, échéance. Plus aucun toast "disponible dans une prochaine version".
- **Convention typage** : V1=`database.ts` (sacrée, Étienne), V2/V3=`project-v2.ts`. Pas de fichier dédié V3.
- **Double source vérité** `projects_v2.client_id` ↔ `project_contacts` : sync via `syncPrimaryToClientId` à chaque mutation primary. À terme remplacer par trigger SQL.
- **Retours fin de chantier en file d'attente** : (1) QuickActionBar ajouter champ date + PJ, (2) Coffre-fort Propul'seo (identifiants OVH/Supabase chiffrés).
- **Dette technique acceptée** : ProjectEditModalV3 à 301 lignes (à split en form-helpers), rollback createAndLink non-atomique, RLS project_contacts permissif, inputCls/Field dupliqués 3x.
- **Premier login** : `lyestriki@yahoo.fr` / `DemoPropul2026!`. Projet de test V3 = Lolett (`d570010a-553f-4171-88a2-ecb637a4663e`).
- **Dev server** : http://localhost:5174/projets-v3-preview/:id
