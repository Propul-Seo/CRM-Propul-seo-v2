# Session State — 2026-05-20 (Migration 242 + constants ERP — Bloc A partiel)

## Branch
`feature/propulspace-phase-2-front` — exception multi-phases assumée (merge dans `main` fin Phase 2 après QA E2E validée).

## Completed This Session
- ✅ **URL Calendly** réelle dans ThankYouA.tsx (remplace placeholder `cal.com/propulseo/diagnostic`).
- ✅ **Migration 242** appliquée en prod : `project_type` (site/site_erp/erp) + 10 colonnes ERP + view + RPC `qualif_update_draft` whitelist étendue.
- ✅ **constants.erp.ts** (nouveau, 55 lignes) — 6 enums ERP : systèmes, volumes, modules, users, SSO, intégrations.
- ✅ **constants.ts** modifié — ajout `PROJECT_TYPES` + 3 totaux dynamiques + re-export ERP_*.
- ✅ **Décisions tranchées avec Lyes** : project_type 3 valeurs / questionnaire ERP complet (4 nouveaux steps) / pas de status `archived` (réutiliser `unqualified`) / hard delete projet avec confirmation (Session B) / notif équipe via Brevo email seulement (pas WhatsApp).

## Next Task
**Reprendre le Bloc A** (questionnaire ERP — partie front) :
1. Schema Zod : ajouter `step0Schema` + 4 schemas ERP dans `schema.ts`
2. Step0 component (3 cards site/site_erp/erp) + 4 nouveaux step components ERP
3. QualificationFlowPage routage conditionnel selon `project_type`
4. ProgressBar dynamique (total = QUALIF_TOTAL_STEPS_SITE/ERP/SITE_ERP)
5. RecapAccordion sections ERP
6. Puis Bloc B (LeadsV3 colonne "Questionnaire complété" + routage Site/ERP)

## Blockers
- Aucun blocker code/DB.
- Brevo : compte créé (sender `lyes.triki@propulseo-site.com` vérifié DKIM+DMARC). Clé API + 2 templates à fournir pour brancher l'edge function en Bloc D.

## Key Context
- **Code review session** : 2 issues, 0 fixe bloquant (1 faux positif styles inline pré-existants, 1 différé `autre_erp` orphelin dans CHECK SQL).
- **Plan Session A** : Bloc A (questionnaire ERP) → B (LeadsV3 colonne+conversion) → C (archive) → D (Brevo) → E (review final). ~10h total, on a fait ~1.5h.
- **Session B (autre jour)** : hard delete leads + projets avec confirmation typée.
- **Parallélisme** : Option A validée — Lyes attend merge Phase 2 avant de paralléliser sur main.
