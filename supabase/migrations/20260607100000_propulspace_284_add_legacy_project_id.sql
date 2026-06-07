-- SP0 — Fusion CRM <-> Propul'Space : lien de traçabilité projects_v2 -> public.projects (legacy)
-- Rail de réconciliation, INTERNE. Non client-facing, non éditable par le portail.
-- Colonne vide à la création (NULL partout) ; backfill prévu en SP2 (conversion lead->projet).
-- Idempotent (IF NOT EXISTS) : rejouable sans risque.
-- À appliquer À LA MAIN via le SQL Editor du projet ERP (MCP non branché sur l'ERP).
--
-- Vérifications faites en amont (audit adversarial SP0) :
--   * public.projects.id et public.projects_v2.id sont tous deux en uuid (FK cohérente).
--   * ON DELETE SET NULL : supprimer un projet legacy ne casse rien (pas de cascade).
--   * Index partiel (WHERE ... IS NOT NULL) : léger, n'indexe que les lignes liées.
--   * Colonne hors whitelist du trigger guard_portal_columns_admin_only -> non éditable
--     par le portail ; bypass team_member préservé -> aucun blocage côté admin.
--   * Policies RLS projects_v2 filtrent par ligne, pas par colonne -> aucun impact.

ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS legacy_project_id uuid
  REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_v2_legacy_project_id
  ON public.projects_v2 (legacy_project_id)
  WHERE legacy_project_id IS NOT NULL;

COMMENT ON COLUMN public.projects_v2.legacy_project_id IS
  'SP0 link field to legacy public.projects.id. Internal traceability only, not client-facing, not portal-editable. Backfill in SP2.';
