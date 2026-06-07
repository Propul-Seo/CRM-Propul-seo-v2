-- ============================================================================
-- Migration 287 — Archivage des tables legacy `clients` / `leads`
-- ============================================================================
-- ⚠️ DIFFÉRÉ : à appliquer après ~1 semaine + reconfirmation.
--
-- Tranche SP1 (fusion CRM ↔ Propul'Space). Référence :
--   docs/superpowers/specs/2026-06-08-sp1-identite-client-design.md (§5, Q1)
--
-- NE PAS appliquer en même temps que la migration 286. Cette étape clôt SP1
-- APRÈS une période d'observation (grace period) confirmant que plus aucun code
-- ne lit/écrit ces tables (le dead code supabaseService.ts / useKanbanPipeline.ts
-- a été supprimé en SP1, mais on laisse une fenêtre de sécurité).
--
-- - `clients` : table vide / 0 usage confirmé -> DROP direct (IRRÉVERSIBLE :
--   reconfirmer 0 donnée utile avant d'exécuter).
-- - `leads`   : archivage RÉVERSIBLE par RENAME. Le DROP définitif de
--   leads_legacy_archive se fera dans une migration séparée, ~1 semaine plus
--   tard, après nouvelle reconfirmation.
-- ============================================================================

-- clients : vide / 0 usage confirmé -> DROP direct
DROP TABLE IF EXISTS public.clients;

-- leads : archivage réversible (DROP définitif ~1 semaine plus tard, migration séparée)
ALTER TABLE IF EXISTS public.leads RENAME TO leads_legacy_archive;
