-- ============================================================================
-- Migration 294 — projects_v2.progress dérivé de la checklist de production
-- ============================================================================
-- Problème : public.projects_v2.progress est posé à 0 à la création et n'est
-- JAMAIS recalculé. La vraie progression était calculée uniquement côté front
-- (hook useChecklistV3) sur la page détail → kanban + vue Liste affichaient 0 %.
--
-- Décision (UX projets-v3) : progress devient une valeur DÉRIVÉE de la checklist,
-- maintenue automatiquement par trigger. Aucun écran ne l'édite à la main
-- (NewProjectFormV3 ne fait que l'initialiser à 0), donc pas de conflit.
--
-- Calcul (identique au front useChecklistV3.progress) :
--   progress = round( 100 * nb_items_racine_done / nb_items_racine_total )
--   item racine = parent_task_id IS NULL ; "done" = status = 'done'.
--   0 si aucun item racine.
--
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Fonction de recalcul pour un projet donné
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_project_progress_v2(p_project_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.projects_v2 p
  SET progress = COALESCE((
    SELECT round(
      100.0 * count(*) FILTER (WHERE c.status = 'done')
      / NULLIF(count(*), 0)
    )::int
    FROM public.checklist_items_v2 c
    WHERE c.project_id = p_project_id
      AND c.parent_task_id IS NULL
  ), 0)
  WHERE p.id = p_project_id;
$$;

-- ----------------------------------------------------------------------------
-- 2. Trigger : recalcule à chaque mutation d'item de checklist
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_recompute_project_progress_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_project_progress_v2(OLD.project_id);
    RETURN OLD;
  END IF;

  PERFORM public.recompute_project_progress_v2(NEW.project_id);

  -- Cas rare : un item change de projet → recalculer aussi l'ancien projet.
  IF TG_OP = 'UPDATE' AND NEW.project_id IS DISTINCT FROM OLD.project_id THEN
    PERFORM public.recompute_project_progress_v2(OLD.project_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Ne se déclenche que sur les colonnes qui influencent le calcul (efficacité :
-- un simple renommage d'item ne recalcule pas). INSERT/DELETE toujours pris.
DROP TRIGGER IF EXISTS recompute_progress_on_checklist ON public.checklist_items_v2;
CREATE TRIGGER recompute_progress_on_checklist
AFTER INSERT OR DELETE OR UPDATE OF status, parent_task_id, project_id
ON public.checklist_items_v2
FOR EACH ROW
EXECUTE FUNCTION public.trg_recompute_project_progress_v2();

-- ----------------------------------------------------------------------------
-- 3. Backfill des projets existants (one-shot)
-- ----------------------------------------------------------------------------
-- ⚠️ Le garde-fou R-018 (trg_guard_portal_columns_admin_only, BEFORE UPDATE sur
-- projects_v2) — dans sa version active mig 260 (whitelist jsonb fail-safe) —
-- interdit de modifier TOUTE colonne hors [client_first_name, client_phone,
-- client_company, updated_at, last_activity_at] pour un non-team_member. Donc
-- `progress` EST bloqué hors team_member. En runtime ce n'est pas un souci (seuls
-- des membres d'équipe modifient la checklist → bypass is_team_member()), MAIS ce
-- backfill tourne dans le SQL Editor où la session n'est PAS team_member → on
-- désactive le garde-fou le temps de l'UPDATE, puis on le réactive.
-- Transaction explicite : si l'UPDATE échoue, le ROLLBACK réactive le trigger
-- (pas de fenêtre où le garde-fou reste désactivé). Nécessite le rôle
-- propriétaire de la table — OK en SQL Editor.
BEGIN;
ALTER TABLE public.projects_v2 DISABLE TRIGGER trg_guard_portal_columns_admin_only;

UPDATE public.projects_v2 p
SET progress = COALESCE((
  SELECT round(
    100.0 * count(*) FILTER (WHERE c.status = 'done')
    / NULLIF(count(*), 0)
  )::int
  FROM public.checklist_items_v2 c
  WHERE c.project_id = p.id
    AND c.parent_task_id IS NULL
), 0);

ALTER TABLE public.projects_v2 ENABLE TRIGGER trg_guard_portal_columns_admin_only;
COMMIT;

COMMENT ON FUNCTION public.recompute_project_progress_v2(uuid) IS
  'SP/projets-v3 : recalcule projects_v2.progress depuis la checklist (items racine done/total). Appelée par le trigger sur checklist_items_v2.';
