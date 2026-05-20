-- BLOC 2 — Conversion atomique qualif → projet + GED
--
-- RPC unique remplaçant la séquence front (2 requêtes séparées) par une
-- transaction atomique. Mappe les champs qualif vers projects_v2 et insère
-- les fichiers uploadés (logo, charte, screenshots, lien externe) dans la
-- GED unifiée propulspace.documents.
--
-- SECURITY DEFINER : check admin explicite via propulspace.is_admin().
-- Search path verrouillé (lint Supabase function_search_path_mutable).
--
-- Retour : jsonb { project_id, documents_created, portal_activated }
-- Levée : EXCEPTION si non admin / qualif inexistante / déjà convertie.

CREATE OR REPLACE FUNCTION propulspace.admin_convert_qualif_to_project(
  p_qualif_id uuid,
  p_activate_portal boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, propulspace, pg_temp
AS $$
DECLARE
  v_lead         public.qualification_leads_v2;
  v_project_id   uuid;
  v_project_name text;
  v_client_name  text;
  v_first_name   text;
  v_category     text;
  v_presta_type  text[];
  v_budget       numeric;
  v_start_date   date;
  v_description  text;
  v_notes        text;
  v_siret        text;
  v_company_data jsonb;
  v_docs_count   int := 0;
  v_screenshot   text;
BEGIN
  -- Garde-fou admin
  IF NOT propulspace.is_admin() THEN
    RAISE EXCEPTION 'access_denied: admin only' USING ERRCODE = '42501';
  END IF;

  -- Charger le lead (FOR UPDATE pour bloquer une conversion concurrente)
  SELECT * INTO v_lead
  FROM public.qualification_leads_v2
  WHERE id = p_qualif_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'qualif_not_found: %', p_qualif_id USING ERRCODE = 'P0002';
  END IF;

  IF v_lead.converted_to_project_id IS NOT NULL THEN
    RAISE EXCEPTION 'already_converted: project %', v_lead.converted_to_project_id
      USING ERRCODE = 'P0001';
  END IF;

  IF v_lead.status <> 'submitted' THEN
    RAISE EXCEPTION 'invalid_status: only submitted leads can be converted (got %)', v_lead.status
      USING ERRCODE = 'P0001';
  END IF;

  -- Mapping champs simples
  v_project_name := COALESCE(NULLIF(trim(v_lead.company_name), ''),
                             NULLIF(trim(v_lead.full_name), ''),
                             'Nouveau projet');
  v_client_name  := COALESCE(NULLIF(trim(v_lead.company_name), ''),
                             NULLIF(trim(v_lead.full_name), ''));
  v_first_name   := NULLIF(split_part(COALESCE(v_lead.full_name, ''), ' ', 1), '');

  -- Catégorie & presta_type selon project_type
  IF v_lead.project_type = 'erp' THEN
    v_category := 'erp';
    v_presta_type := ARRAY['erp'];
  ELSIF v_lead.project_type = 'site_erp' THEN
    v_category := 'site_web';
    v_presta_type := ARRAY['site_web', 'erp'];
  ELSE
    v_category := 'site_web';
    v_presta_type := ARRAY['site_web'];
  END IF;

  -- Budget midpoint
  v_budget := CASE v_lead.budget_range
    WHEN '<2000'       THEN 1000
    WHEN '2000-5000'   THEN 3500
    WHEN '5000-10000'  THEN 7500
    WHEN '10000-20000' THEN 15000
    WHEN '>20000'      THEN 25000
    ELSE NULL
  END;

  -- Start date depuis desired_timeline
  v_start_date := CURRENT_DATE + CASE v_lead.desired_timeline
    WHEN '<1mois'         THEN 7
    WHEN '1-3mois'        THEN 30
    WHEN '3-6mois'        THEN 90
    WHEN 'pas_de_deadline' THEN 60
    ELSE 30
  END;

  -- Description (visible client portail) — markdown narratif
  v_description := concat_ws(E'\n\n',
    CASE WHEN v_lead.main_goal IS NOT NULL OR v_lead.main_goal_other IS NOT NULL
      THEN '## Objectif principal' || E'\n' || COALESCE(v_lead.main_goal_other, v_lead.main_goal)
    END,
    CASE WHEN v_lead.target_audience IS NOT NULL
      THEN '## Cible' || E'\n' || v_lead.target_audience
    END,
    CASE WHEN array_length(v_lead.desired_features, 1) > 0
      THEN '## Fonctionnalités souhaitées' || E'\n- ' || array_to_string(v_lead.desired_features, E'\n- ')
        || COALESCE(E'\n- ' || v_lead.desired_features_other, '')
    END,
    CASE WHEN array_length(v_lead.erp_modules, 1) > 0
      THEN '## Modules ERP' || E'\n- ' || array_to_string(v_lead.erp_modules, E'\n- ')
        || COALESCE(E'\n- ' || v_lead.erp_modules_other, '')
    END
  );

  -- Notes internes CRM (non visible client)
  v_notes := concat_ws(E'\n',
    'Score qualité : ' || COALESCE(v_lead.quality_score::text, '—'),
    CASE WHEN array_length(v_lead.main_problems, 1) > 0
      THEN 'Problèmes : ' || array_to_string(v_lead.main_problems, ', ')
    END,
    CASE WHEN v_lead.competitors IS NOT NULL THEN 'Concurrents : ' || v_lead.competitors END,
    CASE WHEN v_lead.is_decision_maker IS NOT NULL THEN 'Décisionnaire : ' || v_lead.is_decision_maker END,
    CASE WHEN v_lead.timeline_reason IS NOT NULL THEN 'Raison délai : ' || v_lead.timeline_reason END,
    CASE WHEN v_lead.preferred_contact_method IS NOT NULL THEN 'Contact préféré : ' || v_lead.preferred_contact_method END
  );

  -- Enrichissement Pappers
  v_company_data := v_lead.pappers_enrichment;
  v_siret := v_company_data->>'siret';

  -- INSERT projet
  INSERT INTO public.projects_v2 (
    name, client_name, client_first_name, client_phone, client_company,
    description, status, priority, category, presta_type, budget, start_date,
    progress, is_archived,
    portal_client_email,
    siret, company_data
  ) VALUES (
    v_project_name, v_client_name, v_first_name, v_lead.phone, v_lead.company_name,
    NULLIF(v_description, ''), 'brief_received', 'medium', v_category, v_presta_type, v_budget, v_start_date,
    0, false,
    CASE WHEN p_activate_portal THEN v_lead.email ELSE NULL END,
    v_siret, v_company_data
  )
  RETURNING id INTO v_project_id;

  -- GED : insert documents pour chaque fichier qualif.
  -- document_type doit appartenir au CHECK constraint documents_document_type_check.
  -- category reste libre (sous-classification UI).
  -- 1. Logo
  IF v_lead.logo_file_url IS NOT NULL THEN
    INSERT INTO propulspace.documents (project_id, document_type, category, name, description, file_url, visible_to_client, uploaded_by_client)
    VALUES (v_project_id, 'asset_logo', 'brief_qualif', 'Logo', 'Fourni par le client lors de la qualification', v_lead.logo_file_url, true, true);
    v_docs_count := v_docs_count + 1;
  END IF;

  -- 2. Charte graphique (fichier)
  IF v_lead.brand_guide_url IS NOT NULL THEN
    INSERT INTO propulspace.documents (project_id, document_type, category, name, description, file_url, visible_to_client, uploaded_by_client)
    VALUES (v_project_id, 'asset_charter', 'brief_qualif', 'Charte graphique', 'Fourni par le client lors de la qualification', v_lead.brand_guide_url, true, true);
    v_docs_count := v_docs_count + 1;
  END IF;

  -- 3. Charte graphique (lien externe) — document_type=other car ce n'est pas un fichier
  IF v_lead.brand_guide_external_link IS NOT NULL AND v_lead.brand_guide_external_link <> '' THEN
    INSERT INTO propulspace.documents (project_id, document_type, category, name, description, file_url, visible_to_client, uploaded_by_client)
    VALUES (v_project_id, 'other', 'brief_qualif_link', 'Charte graphique (lien externe)', 'Lien fourni par le client lors de la qualification', v_lead.brand_guide_external_link, true, true);
    v_docs_count := v_docs_count + 1;
  END IF;

  -- 4. Screenshots site existant
  IF v_lead.existing_site_screenshots IS NOT NULL THEN
    FOR v_screenshot IN
      SELECT jsonb_array_elements_text(v_lead.existing_site_screenshots)
    LOOP
      INSERT INTO propulspace.documents (project_id, document_type, category, name, description, file_url, visible_to_client, uploaded_by_client)
      VALUES (v_project_id, 'asset_content', 'brief_qualif',
              'Capture site existant #' || (v_docs_count + 1),
              'Fourni par le client lors de la qualification',
              v_screenshot, true, true);
      v_docs_count := v_docs_count + 1;
    END LOOP;
  END IF;

  -- UPDATE qualif (marquer convertie)
  UPDATE public.qualification_leads_v2
  SET status = 'converted',
      converted_to_project_id = v_project_id,
      converted_at = now(),
      updated_at = now()
  WHERE id = p_qualif_id;

  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'documents_created', v_docs_count,
    'portal_activated', p_activate_portal
  );
END;
$$;

-- Permissions : appel autorisé pour authenticated (le check admin est dans la fn).
REVOKE ALL ON FUNCTION propulspace.admin_convert_qualif_to_project(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION propulspace.admin_convert_qualif_to_project(uuid, boolean) TO authenticated;

COMMENT ON FUNCTION propulspace.admin_convert_qualif_to_project(uuid, boolean) IS
  'Convertit un lead qualif submitted en projet V2 + crée les rows GED depuis les fichiers uploadés. Transaction atomique. Admin only.';
