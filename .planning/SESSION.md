# Session State — 2026-05-20 (Debug session E2E + UI dark theme)

## Branch
`feature/propulspace-phase-2-front` — exception multi-phases assumée (merge dans `main` fin Phase 2 après QA validée).

## Completed This Session
- ✅ **Bug 1 — Upload bloqué résolu** : garde élargie dans `useQualificationDraft.persist()` (création draft dès qu'un seul champ touché). Validé via preview : token créé dès click sur Step0.
- ✅ **Bug 2 — Précédent broken résolu** : `flowRouter.shouldSkipBackward` corrigé (`features` au lieu de `objectives`).
- ✅ **Bug 3 — Email 401 résolu** : `verify_jwt:false` (Dashboard) + CORS `x-application-name` + `.from('qualification_leads_v2')` au lieu de `.schema('propulspace')`.
- ✅ **Bug 4 — Portail invite payload** : `project_id` → `projectId` (camelCase strict edge function).
- ✅ **UI dark theme drawer Qualification** : `QualificationLeadDetailsSheet` aligné CRM (bg #0a0814).
- ✅ **Migration 243** : `erp_current_system text → text[]` (multi-select).
- ✅ **Step7Finalization** : retrait encadré "RDV bientôt".
- ✅ **StepErp1System** : RadioCard → CheckboxCard (multi-select systèmes).

## Next Task
**Session B (autre jour) — priorités** :
1. **Enrichir mapping qualif → projet** (demandé Lyes) : actuellement seul `company_name` est copié. Étendre avec budget midpoint (déjà fait), secteur, délai, project_type → category/presta_type (déjà fait), notes (objectif, fonctionnalités, charte, ERP modules), `start_date_estimated` selon `desired_timeline`. Quels champs `projects_v2` mapper ?
2. **Fix H1 (atomicité conversion)** : mini-migration 244 RPC `propulspace.admin_convert_qualif_to_project(qualif_id, project_payload)` SECURITY DEFINER (transaction atomique insert projet + update qualif).
3. **Fix H3 (LeadsV3Page 231 lignes > 200)** : extraction `useLeadsV3Cards` hook.
4. **Hard delete leads + projets** (scope original Session B) avec confirmation typée.

## Blockers
- Aucun.
- Lyes a confirmé test E2E réussi côté front (preview). Doit valider en main que le drawer dark theme rend bien.

## Key Context
- 4 commits cette session : `b691b15`, `f07cd26`, `e5bd6e9` (+ migration 243 appliquée).
- Tous les secrets Brevo configurés en prod par Lyes. Edge function `questionnaire-send-emails` v4 déployée.
- `verify_jwt:false` activé pour `questionnaire-send-emails` côté Dashboard.
- Code review session debug : 2 findings, 0 fixe bloquant (1 faux positif Tailwind arbitrary values, 1 vrai mineur déjà documenté/scopé Session B).
