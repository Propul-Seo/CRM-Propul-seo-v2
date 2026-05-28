-- ============================================================================
-- Migration 258 — RPC conversion crée le row onboarding_responses lié à la qualif
-- ============================================================================
-- Bug observé en E2E : à la 1ère connexion portail, WelcomeWizard affiche
-- "On n'a pas encore reçu votre questionnaire" alors que le client a rempli
-- /diagnostic et que le projet a été créé par conversion.
--
-- Cause : la RPC admin_convert_qualif_to_project ne créait pas le row dans
-- propulspace.onboarding_responses. Le upsert du hook useWelcomeWizard
-- (à la 1ère connexion portail) crée alors un row vide sans le lien
-- inherited_from_qualification_id → impossible pour le wizard de savoir que
-- la qualif a déjà été remplie.
--
-- Fix :
-- 1) La RPC insère désormais un row onboarding_responses avec
--    inherited_from_qualification_id renseigné. ON CONFLICT : si le row
--    existait déjà sans lien, le compléter.
-- 2) Backfill : pour les rows existants sans lien, le restaurer depuis
--    qualification_leads_v2.converted_to_project_id.
-- ============================================================================

CREATE OR REPLACE FUNCTION propulspace.admin_convert_qualif_to_project(
  p_qualif_id uuid,
  p_activate_portal boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'propulspace', 'pg_temp'
AS $function$
DECLARE
  v_lead public.qualification_leads_v2;
  v_project_id uuid; v_project_name text; v_client_name text; v_first_name text;
  v_category text; v_presta_type text[]; v_budget numeric; v_start_date date;
  v_description text; v_siret text; v_company_data jsonb;
  v_docs_count int := 0; v_screenshot_idx int := 0; v_screenshot text;
  v_contact_id uuid; v_contact_name text;
  v_activity_content text;
BEGIN
  IF NOT propulspace.is_admin() THEN
    RAISE EXCEPTION 'access_denied: admin only' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_lead FROM public.qualification_leads_v2 WHERE id = p_qualif_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'qualif_not_found: %', p_qualif_id USING ERRCODE = 'P0002'; END IF;
  IF v_lead.converted_to_project_id IS NOT NULL THEN
    RAISE EXCEPTION 'already_converted: project %', v_lead.converted_to_project_id USING ERRCODE = 'P0001';
  END IF;
  IF v_lead.status <> 'submitted' THEN
    RAISE EXCEPTION 'invalid_status: only submitted (got %)', v_lead.status USING ERRCODE = 'P0001';
  END IF;

  v_project_name := COALESCE(NULLIF(trim(v_lead.company_name), ''), NULLIF(trim(v_lead.full_name), ''), 'Nouveau projet');
  v_client_name := COALESCE(NULLIF(trim(v_lead.company_name), ''), NULLIF(trim(v_lead.full_name), ''));
  v_first_name := NULLIF(split_part(COALESCE(v_lead.full_name, ''), ' ', 1), '');

  IF v_lead.project_type = 'erp' THEN v_category := 'erp'; v_presta_type := ARRAY['erp'];
  ELSIF v_lead.project_type = 'site_erp' THEN v_category := 'site_web'; v_presta_type := ARRAY['site_web', 'erp'];
  ELSE v_category := 'site_web'; v_presta_type := ARRAY['site_web']; END IF;

  v_budget := CASE v_lead.budget_range
    WHEN '<2000' THEN 1000 WHEN '2000-5000' THEN 3500 WHEN '5000-10000' THEN 7500
    WHEN '10000-20000' THEN 15000 WHEN '>20000' THEN 25000 ELSE NULL END;
  v_start_date := CURRENT_DATE + CASE v_lead.desired_timeline
    WHEN '<1mois' THEN 7 WHEN '1-3mois' THEN 30 WHEN '3-6mois' THEN 90
    WHEN 'pas_de_deadline' THEN 60 ELSE 30 END;

  v_description := concat_ws(E'\n\n',
    CASE WHEN v_lead.main_goal IS NOT NULL OR v_lead.main_goal_other IS NOT NULL
      THEN '## Objectif principal' || E'\n' || COALESCE(v_lead.main_goal_other, v_lead.main_goal) END,
    CASE WHEN v_lead.target_audience IS NOT NULL THEN '## Cible' || E'\n' || v_lead.target_audience END,
    CASE WHEN array_length(v_lead.desired_features, 1) > 0
      THEN '## Fonctionnalités souhaitées' || E'\n- ' || array_to_string(v_lead.desired_features, E'\n- ')
        || COALESCE(E'\n- ' || v_lead.desired_features_other, '') END,
    CASE WHEN array_length(v_lead.erp_modules, 1) > 0
      THEN '## Modules ERP' || E'\n- ' || array_to_string(v_lead.erp_modules, E'\n- ')
        || COALESCE(E'\n- ' || v_lead.erp_modules_other, '') END
  );

  v_company_data := v_lead.pappers_enrichment;
  v_siret := v_company_data->>'siret';

  INSERT INTO public.projects_v2 (
    name, client_name, client_first_name, client_phone, client_company,
    description, status, priority, category, presta_type, budget, start_date,
    progress, is_archived, siret, company_data
  ) VALUES (
    v_project_name, v_client_name, v_first_name, v_lead.phone, v_lead.company_name,
    NULLIF(v_description, ''), 'brief_received', 'medium', v_category, v_presta_type, v_budget, v_start_date,
    0, false, v_siret, v_company_data
  ) RETURNING id INTO v_project_id;

  INSERT INTO propulspace.onboarding_responses (project_id, inherited_from_qualification_id)
  VALUES (v_project_id, p_qualif_id)
  ON CONFLICT (project_id) DO UPDATE
    SET inherited_from_qualification_id = EXCLUDED.inherited_from_qualification_id
    WHERE propulspace.onboarding_responses.inherited_from_qualification_id IS NULL;

  IF NOT EXISTS (SELECT 1 FROM public.project_contacts pc WHERE pc.project_id = v_project_id AND pc.role = 'primary') THEN
    v_contact_name := COALESCE(NULLIF(trim(v_lead.full_name), ''), v_lead.email);
    INSERT INTO public.contacts (name, email, phone, company)
    VALUES (v_contact_name, v_lead.email, v_lead.phone, v_lead.company_name)
    RETURNING id INTO v_contact_id;
    INSERT INTO public.project_contacts (project_id, contact_id, role)
    VALUES (v_project_id, v_contact_id, 'primary');
  END IF;

  v_activity_content := 'Questionnaire de qualification rempli le ' ||
    to_char(COALESCE(v_lead.submitted_at, now()), 'DD/MM/YYYY HH24:MI') ||
    '. Type : ' || COALESCE(v_lead.project_type, 'site') || '. Voir l''onglet Questionnaire pour le détail.';

  INSERT INTO public.project_activities_v2 (project_id, user_id, author_name, type, content, is_auto, metadata)
  VALUES (v_project_id, NULL, 'Système', 'system', v_activity_content, true,
          jsonb_build_object('source', 'qualif_conversion', 'qualif_id', p_qualif_id, 'submitted_at', v_lead.submitted_at));

  IF v_lead.logo_file_url IS NOT NULL THEN
    INSERT INTO propulspace.documents (project_id, document_type, category, name, description, file_url, visible_to_client, uploaded_by_client)
    VALUES (v_project_id, 'asset_logo', 'brief_qualif', 'Logo', 'Fourni par le client lors de la qualification', v_lead.logo_file_url, true, true);
    v_docs_count := v_docs_count + 1;
  END IF;
  IF v_lead.brand_guide_url IS NOT NULL THEN
    INSERT INTO propulspace.documents (project_id, document_type, category, name, description, file_url, visible_to_client, uploaded_by_client)
    VALUES (v_project_id, 'asset_charter', 'brief_qualif', 'Charte graphique', 'Fourni par le client lors de la qualification', v_lead.brand_guide_url, true, true);
    v_docs_count := v_docs_count + 1;
  END IF;
  IF v_lead.brand_guide_external_link IS NOT NULL AND v_lead.brand_guide_external_link <> '' THEN
    INSERT INTO propulspace.documents (project_id, document_type, category, name, description, file_url, visible_to_client, uploaded_by_client)
    VALUES (v_project_id, 'other', 'brief_qualif_link', 'Charte graphique (lien externe)', 'Lien fourni par le client lors de la qualification', v_lead.brand_guide_external_link, true, true);
    v_docs_count := v_docs_count + 1;
  END IF;
  IF v_lead.existing_site_screenshots IS NOT NULL THEN
    FOR v_screenshot IN SELECT jsonb_array_elements_text(v_lead.existing_site_screenshots) LOOP
      v_screenshot_idx := v_screenshot_idx + 1;
      INSERT INTO propulspace.documents (project_id, document_type, category, name, description, file_url, visible_to_client, uploaded_by_client)
      VALUES (v_project_id, 'asset_content', 'brief_qualif', 'Capture site existant #' || v_screenshot_idx,
              'Fourni par le client lors de la qualification', v_screenshot, true, true);
      v_docs_count := v_docs_count + 1;
    END LOOP;
  END IF;

  UPDATE public.qualification_leads_v2
  SET status = 'converted', converted_to_project_id = v_project_id, converted_at = now(), updated_at = now()
  WHERE id = p_qualif_id;

  RETURN jsonb_build_object('project_id', v_project_id, 'documents_created', v_docs_count, 'portal_activated', p_activate_portal, 'contact_created', v_contact_id IS NOT NULL);
END;
$function$;

UPDATE propulspace.onboarding_responses onb
SET inherited_from_qualification_id = ql.id,
    updated_at = now()
FROM public.qualification_leads_v2 ql
WHERE ql.converted_to_project_id = onb.project_id
  AND onb.inherited_from_qualification_id IS NULL;
