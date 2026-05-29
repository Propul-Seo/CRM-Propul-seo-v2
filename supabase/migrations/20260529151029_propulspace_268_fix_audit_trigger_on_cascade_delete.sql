-- ============================================================================
-- Migration 268 — FIX : audit_trigger_fn casse la suppression de projet (409)
-- ============================================================================
-- Symptome : supprimer un projet ayant >=1 document/facture/signature echoue
--   avec « insert or update on table "audit_log" violates foreign key
--   constraint "audit_log_project_id_fkey" » (HTTP 409).
--
-- Cause racine : admin_delete_project DELETE le projet -> cascade DELETE des
--   documents/invoices/signatures -> les triggers AFTER DELETE (audit_trigger_fn)
--   tentent d'INSERER une ligne audit_log dont project_id pointe vers le projet
--   en cours de suppression. La FK audit_log_project_id_fkey (ON DELETE SET NULL)
--   ne protege que la cascade, PAS cet INSERT concurrent -> violation.
--
-- Correctif MINIMAL : on reprend la fonction d'origine A L'IDENTIQUE et on ajoute
--   UNIQUEMENT un garde-fou : si le project_id resolu ne reference plus un projet
--   existant, on insere avec project_id = NULL. L'evenement d'audit est conserve
--   (tracabilite preservee) mais detache du projet supprime — coherent avec la
--   semantique ON DELETE SET NULL deja en place sur la FK.
--   Le format de resource_type ('schema.table') et la structure de diff
--   ('before'/'after') sont preserves a l'identique.
--
-- Aucun changement de schema. Seule la fonction est remplacee (idempotent).
-- ============================================================================

CREATE OR REPLACE FUNCTION propulspace.audit_trigger_fn()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'propulspace', 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
  v_row JSONB;
  v_resource_id UUID;
BEGIN
  BEGIN
    SELECT id INTO v_user_id
    FROM public.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_row := row_to_json(OLD)::JSONB;
  ELSE
    v_row := row_to_json(NEW)::JSONB;
  END IF;

  BEGIN
    v_project_id := (v_row->>'project_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_project_id := NULL;
  END;

  -- Garde-fou (fix 268) : si le projet reference n'existe plus (cascade DELETE
  -- du projet en cours), on detache la ligne d'audit (project_id = NULL) au lieu
  -- de violer la FK audit_log_project_id_fkey. Coherent avec ON DELETE SET NULL.
  IF v_project_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.projects_v2 WHERE id = v_project_id) THEN
    v_project_id := NULL;
  END IF;

  BEGIN
    v_resource_id := (v_row->>'id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_resource_id := NULL;
  END;

  INSERT INTO propulspace.audit_log (
    project_id, user_id, resource_type, resource_id, action, diff
  ) VALUES (
    v_project_id,
    v_user_id,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    v_resource_id,
    LOWER(TG_OP),
    CASE
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('before', row_to_json(OLD))
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('before', row_to_json(OLD), 'after', row_to_json(NEW))
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('after', row_to_json(NEW))
    END
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;
