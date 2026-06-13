-- =============================================================================
-- R-018 — Étape 2/5 : extension du trigger guard_portal_columns_admin_only
-- =============================================================================
-- Avant cette migration, le trigger ne bloquait que les colonnes portal_*
-- (portal_client_email, portal_activated_at, etc.) et utilisait is_admin().
--
-- Nouveau comportement :
--   1. Bypass complet pour les team_member (is_team_member() = présence dans
--      public.users avec role non-NULL).
--   2. Pour TOUT autre utilisateur (= portail client), seules les colonnes
--      de la whitelist sont modifiables :
--        - client_first_name, client_phone, client_company (édition profil)
--        - updated_at, last_activity_at (colonnes système gérées par autres triggers)
--   3. Approche par diff jsonb : si une nouvelle colonne est ajoutée à
--      projects_v2 dans le futur, elle est protégée par défaut (fail-safe).
--
-- Couplé avec la nouvelle policy projects_v2_portal_update (migration 261)
-- qui restreint l'UPDATE aux lignes du client (id = portal_project_id()).
-- Cette migration restreint les COLONNES éditables une fois la ligne accessible.
--
-- Appliquée en prod : 2026-05-21 via MCP apply_migration.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.guard_portal_columns_admin_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_allowed_cols text[] := ARRAY[
    'client_first_name', 'client_phone', 'client_company',
    -- Colonnes système gérées par triggers internes (set_updated_at, etc.)
    'updated_at', 'last_activity_at'
  ];
  v_old_json jsonb;
  v_new_json jsonb;
  v_changed_key text;
BEGIN
  -- Team interne (présence dans public.users avec role non-NULL) : bypass.
  IF public.is_team_member() THEN
    RETURN NEW;
  END IF;

  -- Tout le reste (client portail) : diff jsonb, vérification clé par clé.
  v_old_json := to_jsonb(OLD);
  v_new_json := to_jsonb(NEW);

  FOR v_changed_key IN SELECT key FROM jsonb_each(v_new_json) LOOP
    IF (v_old_json -> v_changed_key) IS DISTINCT FROM (v_new_json -> v_changed_key) THEN
      IF NOT (v_changed_key = ANY(v_allowed_cols)) THEN
        RAISE EXCEPTION
          'R-018 — Le portail client ne peut modifier que client_first_name, client_phone, client_company. Colonne interdite : %',
          v_changed_key
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.guard_portal_columns_admin_only() IS
'R-018 — Trigger BEFORE UPDATE qui restreint les UPDATE par le portail client aux colonnes [client_first_name, client_phone, client_company]. Les team_member (présents dans public.users) sont court-circuités. Approche fail-safe : toute nouvelle colonne ajoutée à projects_v2 est protégée par défaut.';
