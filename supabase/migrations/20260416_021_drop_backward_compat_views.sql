-- Sprint 5 : Suppression des vues backward-compat dans public
-- ===========================================================
-- Ces vues ont été créées pendant la migration pour assurer la compatibilité.
-- Maintenant que tous les hooks et edge functions pointent vers v2.*,
-- elles ne sont plus nécessaires.
--
-- IMPORTANT : exécuter après validation complète en staging.

DROP VIEW IF EXISTS public.projects_v2 CASCADE;
DROP VIEW IF EXISTS public.project_activities_v2 CASCADE;
DROP VIEW IF EXISTS public.project_documents_v2 CASCADE;
DROP VIEW IF EXISTS public.follow_ups_v2 CASCADE;
DROP VIEW IF EXISTS public.checklist_items_v2 CASCADE;
DROP VIEW IF EXISTS public.project_briefs_v2 CASCADE;
DROP VIEW IF EXISTS public.invoices_v2 CASCADE;
DROP VIEW IF EXISTS public.project_accesses_v2 CASCADE;
DROP VIEW IF EXISTS public.comm_tasks_v2 CASCADE;
DROP VIEW IF EXISTS public.brief_invitations CASCADE;
