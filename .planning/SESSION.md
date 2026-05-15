# Session State — 2026-05-15 fin (Phase 1 Propul'Space DB terminée)

## Branch
**feature/propulspace-phase-1-db** — exception à la règle "main only" car gros chantier multi-phases avec sign-off Lyes. Mergera dans main quand toute Phase 1 + Phase 2 (qualif) sera stabilisée.

## Completed cette session
- **Audit complet** du schéma DB → découverte que `public.projects_v2` est la vraie table active (pas `projects` ni vue `v2.projects`)
- **Décision V1 majeure** : "1 espace = 1 projet" — toutes les FK Propul'Space utilisent `project_id` (jamais `client_id`). Table `public.clients` (vide vestige V1) ignorée.
- **8 migrations Propul'Space appliquées en prod** via Supabase MCP (010 → 080) :
  - Schema `propulspace` + 12 tables + 44 index + 4 triggers d'audit + 4 fonctions + 2 séquences + 18 RLS policies
  - Extensions `public.users` (3 cols) + `public.projects_v2` (15 cols : portal_*/client_*/lifecycle/branding)
  - 2 storage buckets + 5 storage policies
- Numérotation facture `PS-1031` opérationnelle, franchise TVA art. 293 B, snapshot Polaroid JSONB sur factures, table dédiée `invoice_installments` pour échéances multiples
- Types TypeScript regénérés (schema public uniquement — propulspace à regénérer Phase 2 via CLI)
- `npx tsc --noEmit` ✅ clean
- Migration 999 rollback écrite (commentée, jamais exécutée)
- `.env.example` + `.gitignore` exception
- Docs Phase 1 : `Propulspace/PHASE_1_DONE.md`, `Propulspace/SCHEMA_ALIGNMENT.md`, `Propulspace/PHASE_1_PLAN_VALIDATED.md`
- 6 mémoires Propul'Space sauvegardées (équipe, workflow 2 Claude, pre-flight, architecture, factures/GED, cohérence existant)
- Règles globales mises à jour : explications SQL en français + français vulgarisé partout + garde-fou nomenclature

## Commits cette session
- `6cff151` chore : déplacement PRD vers docs/ + plan Phase 1 validé
- `e0af132` feat(propulspace): Phase 1 — database & infrastructure complete

## Next Task
**Phase 2 — Qualification (Phase 0 du parcours client)**

Lyes va envoyer le prompt Phase 2 préparé par Claude web (à partir du résumé qu'on lui transmet). À l'attente du prompt corrigé qui doit respecter les conventions :
- `public.projects_v2` jamais `projects` ni `v2.projects`
- `project_id` partout jamais `client_id`
- Pre-flight MCP obligatoire avant tout SQL final
- Format : Task 1 pre-flight → ... → Task N wrap-up doc

À démarrer côté Lyes avant Phase 2 :
- Compte Sentry + DSN
- Compte Brevo (free tier 300/jour)
- Compte Cal.com Cloud free tier

## Blockers
Aucun bloquant. Phase 1 terminée proprement.

## Key Context

### Architecture Propul'Space V1 validée
- **1 espace = 1 projet** (pas de table clients séparée)
- Toutes tables Propul'Space → FK `project_id` → `public.projects_v2(id)`
- Workflow facture : insert dans `propulspace.invoices` (avec `client_snapshot JSONB` immutable) → génération PDF (Phase 3) → auto-insert dans `propulspace.documents` pour visibilité GED côté client

### Dette technique notée (à régler avant Phase 4-5)
1. Policy RLS pré-existante `authenticated_all_projects_v2` sur `public.projects_v2` → donne accès à TOUS les projets pour tout authenticated. À resserrer **avant activation d'un compte portail client**.
2. Antoine Bigot à désactiver dans `public.partners` (`is_active = false`)
3. PITR Supabase pas activé (à reconsidérer quand prod réelle)
4. Types TypeScript propulspace à regénérer via CLI Supabase quand on commencera à coder Phase 2

### Project Supabase
- Project ID : `tbuqctfgjjxnevmsvucl` (ERP)
- Région : eu-west-3, Postgres 17.4.1
- MCP Supabase authentifié et utilisable

### Pilote test
- Projet "Propul'seo" existant (`74968202-5f6a-4981-8d30-f68a8ec7661f`, in_progress) servira de fixture pour les tests RLS Phase 4-5
- Précieuse : projet existant déjà, pas de deadline serrée, sera pilote prod
