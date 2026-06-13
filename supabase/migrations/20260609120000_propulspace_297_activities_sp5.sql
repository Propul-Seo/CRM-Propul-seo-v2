-- ============================================================================
-- Migration 297 — SP5 Activités (fil d'activité projet : portail + RLS + RPC + audit)
-- ============================================================================
-- Décisions Lyes (2026-06-08, cf. docs/superpowers/specs/2026-06-08-sp5-activites-design.md §4) :
--   D1  notes manuelles : invisibles par défaut, opt-in via visible_to_client
--   D4  activités is_auto (système) : visibles d'office côté client
--   D2  next_actions exposées au client SI l'activité est visible
--   D3  author_name exposé (jamais user_id) ; D5 RPC ; D7 calendrier reporté
--
-- ⚠️ À APPLIQUER À LA MAIN (Lyes) APRÈS relecture backend, AVANT le redeploy du
--    front (le front lit la vue + appelle les RPC ; ordre : SQL puis deploy).
-- ============================================================================

BEGIN;

-- 1) ── Colonne de visibilité client (opt-in pour les notes manuelles) ───────
ALTER TABLE public.project_activities_v2
  ADD COLUMN IF NOT EXISTS visible_to_client boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.project_activities_v2.visible_to_client IS
  'SP5 : si true, l''activité est exposée au portail client. Notes manuelles = opt-in ; activités is_auto = true mises visibles d''office par trg_activity_default_visibility.';

-- 1-bis) ── Les activités système (is_auto) sont visibles d''office (D4) ─────
CREATE OR REPLACE FUNCTION public.activity_default_visibility()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_auto THEN
    NEW.visible_to_client := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_default_visibility ON public.project_activities_v2;
CREATE TRIGGER trg_activity_default_visibility
  BEFORE INSERT ON public.project_activities_v2
  FOR EACH ROW EXECUTE FUNCTION public.activity_default_visibility();

-- NB : pas de backfill des activités is_auto historiques (éviter de surfacer du
--      bruit ancien au client). À décider séparément si besoin.

-- 2) ── Trigger d''audit (réutilise la fonction générique existante) ─────────
--      resource_type sera 'public.project_activities_v2'.
DROP TRIGGER IF EXISTS trg_audit_project_activities_v2 ON public.project_activities_v2;
CREATE TRIGGER trg_audit_project_activities_v2
  AFTER INSERT OR UPDATE OR DELETE ON public.project_activities_v2
  FOR EACH ROW EXECUTE FUNCTION propulspace.audit_trigger_fn();

-- 3) ── RLS stricte : on remplace la policy permissive dev_all ───────────────
--      Équipe interne = accès complet ; portail = lecture seule des activités
--      visibles de SON projet.
ALTER TABLE public.project_activities_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activities_v2_team_all ON public.project_activities_v2;
CREATE POLICY activities_v2_team_all ON public.project_activities_v2
  FOR ALL USING (public.is_team_member()) WITH CHECK (public.is_team_member());

DROP POLICY IF EXISTS activities_v2_portal_select ON public.project_activities_v2;
CREATE POLICY activities_v2_portal_select ON public.project_activities_v2
  FOR SELECT USING (
    visible_to_client = true
    AND project_id = propulspace.portal_project_id()
  );

-- ⚠️ BASCULE CRITIQUE : on retire la permissive (sinon RLS reste ouverte).
--    Les écritures internes passent désormais par activities_v2_team_all
--    (is_team_member) ET par les RPC SECURITY DEFINER ci-dessous.
DROP POLICY IF EXISTS dev_all_activities_v2 ON public.project_activities_v2;

-- 4) ── Vue portail (whitelist colonnes safe, security_invoker) ──────────────
DROP VIEW IF EXISTS public.propulspace_activities_v2;
CREATE VIEW public.propulspace_activities_v2
WITH (security_invoker = true) AS
  SELECT
    a.id,
    a.project_id,
    a.type,
    a.content,
    a.author_name,                              -- D3 : exposé
    (a.metadata ->> 'realized_at')  AS realized_at,   -- D2 : date de réalisation
    (a.metadata ->> 'next_actions') AS next_actions,  -- D2 : prochaines actions (si visible)
    a.is_auto,
    a.created_at
  FROM public.project_activities_v2 a
  WHERE a.visible_to_client = true;
  -- NB : la RLS de la table sous-jacente restreint déjà au projet du client.

-- Tout CREATE VIEW dans public ré-attribue l''ACL anon par défaut → REVOKE.
REVOKE ALL ON public.propulspace_activities_v2 FROM anon;
GRANT SELECT ON public.propulspace_activities_v2 TO authenticated;

COMMENT ON VIEW public.propulspace_activities_v2 IS
  'SP5 : fil d''activité projet exposé au portail client (lecture seule, colonnes safe, filtré visible_to_client).';

-- 5) ── RPC d''écriture équipe (D5 ; SECURITY DEFINER + garde is_team_member) ─
--      user_id résolu depuis la session pour la traçabilité audit.
CREATE OR REPLACE FUNCTION public.admin_create_activity(
  p_project_id        uuid,
  p_type              text,
  p_content           text,
  p_author_name       text    DEFAULT NULL,
  p_metadata          jsonb   DEFAULT '{}'::jsonb,
  p_visible_to_client boolean DEFAULT false
) RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_id uuid;
  v_user_id uuid;
BEGIN
  IF NOT public.is_team_member() THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;

  SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;

  INSERT INTO public.project_activities_v2
    (project_id, user_id, type, content, author_name, metadata, visible_to_client, is_auto)
  VALUES
    (p_project_id, v_user_id, p_type, p_content, p_author_name,
     COALESCE(p_metadata, '{}'::jsonb), p_visible_to_client, false)
  RETURNING id INTO v_id;

  UPDATE public.projects_v2 SET last_activity_at = now() WHERE id = p_project_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_activity(
  p_id                uuid,
  p_type              text    DEFAULT NULL,
  p_content           text    DEFAULT NULL,
  p_metadata          jsonb   DEFAULT NULL,
  p_visible_to_client boolean DEFAULT NULL
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.is_team_member() THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;
  UPDATE public.project_activities_v2 SET
    type              = COALESCE(p_type, type),
    content           = COALESCE(p_content, content),
    -- Fusion JSONB profonde : un patch partiel (ex. juste next_actions) n'écrase
    -- pas les autres clés (realized_at). p_metadata NULL = aucun changement.
    metadata          = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb),
    visible_to_client = COALESCE(p_visible_to_client, visible_to_client)
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_activity(p_id uuid)
  RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.is_team_member() THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;
  DELETE FROM public.project_activities_v2 WHERE id = p_id;
END;
$$;

-- Révoquer public + anon (sécurité en profondeur), puis autoriser authenticated.
-- La garde is_team_member() à l'intérieur des fonctions fait le vrai filtrage.
REVOKE ALL ON FUNCTION public.admin_create_activity(uuid,text,text,text,jsonb,boolean) FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_update_activity(uuid,text,text,jsonb,boolean)      FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_delete_activity(uuid)                              FROM public, anon;

GRANT EXECUTE ON FUNCTION public.admin_create_activity(uuid,text,text,text,jsonb,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_activity(uuid,text,text,jsonb,boolean)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_activity(uuid)                                TO authenticated;

COMMIT;

-- ============================================================================
-- SUITE (hors migration, optionnel) : élargir admin_get_audit_log / ActivityTab
--   au resource_type 'public.project_activities_v2' pour afficher l''historique
--   des activités dans l''onglet Activité admin.
-- ============================================================================
