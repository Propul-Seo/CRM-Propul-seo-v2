-- =============================================================================
-- 301 — Corbeille tables legacy leads/activités + drop fonctions mortes
-- Date : 2026-07-02
-- -----------------------------------------------------------------------------
-- Contexte : les leads vivent dans `contacts` (428 lignes) / `crmerp_leads`
-- (15) et leurs activités dans `contact_activities` (389). Les 6 tables
-- ci-dessous sont VIDES (0 ligne) et ne sont plus référencées par aucun code
-- vivant — audit du 2026-07-02 : front CRM (grep src/), edge functions (repo),
-- fonctions SQL (pg_proc), triggers (pg_trigger), vues (pg_rewrite), FK
-- (pg_constraint), registre MCP. Le front + le registre MCP ont été nettoyés
-- le même jour (hooks useSupabaseLeads/useSupabaseActivityLog, KPI DashboardV3,
-- cleanColumn, registry.py).
--
-- Réversibilité : ALTER TABLE trash_2026_07_02.<table> SET SCHEMA public;
-- Purge définitive (plus tard, après période d'observation) :
--   DROP SCHEMA trash_2026_07_02 CASCADE;
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS trash_2026_07_02;

ALTER TABLE public.leads               SET SCHEMA trash_2026_07_02;
ALTER TABLE public.lead_notes          SET SCHEMA trash_2026_07_02;
ALTER TABLE public.activities          SET SCHEMA trash_2026_07_02;
ALTER TABLE public.activity_log        SET SCHEMA trash_2026_07_02;
ALTER TABLE public.prospect_activities SET SCHEMA trash_2026_07_02;
ALTER TABLE public.user_activities     SET SCHEMA trash_2026_07_02;

-- Fonctions mortes des deux bouts (aucun appelant) dont les cibles partent en
-- corbeille. Définitions archivées dans
-- supabase/archive_sql/2026-07-02_dropped_legacy_activity_functions.sql
DROP FUNCTION IF EXISTS public.sync_bot_one_activity_to_main(jsonb);
DROP FUNCTION IF EXISTS public.create_bot_one_record_activity(uuid, text, text, timestamp with time zone, text, text, text);
DROP FUNCTION IF EXISTS public.get_user_stats(uuid);
DROP FUNCTION IF EXISTS public.get_user_daily_stats(uuid, date);
