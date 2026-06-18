-- ============================================================================
-- Migration 301 — Conversion lead→projet : reprendre activités + notes
-- ============================================================================
-- Étend propulspace.admin_convert_lead_to_project (mig 292) pour que le projet
-- créé hérite de l'historique du lead :
--   - NOTES du lead → description du projet (site_web : contacts.notes text[]
--     joint ; erp : crmerp_leads.notes text). Qualif inchangé (questionnaire).
--   - ACTIVITÉS du lead → recopiées dans public.project_activities_v2 en
--     préservant date / auteur / type :
--       site_web : public.contact_activities  (filtre status <> 'cancelled')
--       erp      : public.crmerp_activities
--       qualif   : aucune (pas d'historique d'activités, le questionnaire est
--                  déjà repris en description + GED).
--
-- Mapping type → project_activities_v2.type (CHECK email|call|decision|task|
-- file|access|status|invoice|system) : call→call, email→email, sinon→task.
-- Le type d'origine (meeting/note/task) est conservé : préfixe FR dans le
-- contenu (« RDV — … », « Note — … ») + `metadata.original_type`.
--
-- Reste identique à la mig 292 : garde admin, anti double-conversion, projet
-- 'brief_received', contact primary, activité système, GED qualif, marquage
-- source. SECURITY DEFINER → l'insert dans project_activities_v2 et la lecture
-- des activités sources s'exécutent comme le propriétaire (RLS contournée,
-- comme l'insert d'activité système déjà présent).
--
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). CREATE OR REPLACE — ne
--    remplace que la fonction propulspace ; les wrappers public de la mig 292
--    sont inchangés (signature identique).
-- ============================================================================

CREATE OR REPLACE FUNCTION propulspace.admin_convert_lead_to_project(
  p_lead_id   uuid,
  p_lead_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'propulspace', 'pg_temp'
AS $function$
DECLARE
  v_lead public.qualification_leads_v2;
  v_contact public.contacts;
  v_erp public.crmerp_leads;
  v_project_id uuid;
  v_project_name text;
  v_client_name text;
  v_first_name text;
  v_phone text;
  v_email text;
  v_company text;
  v_category text;
  v_presta_type text[];
  v_budget numeric;
  v_start_date date;
  v_description text;
  v_siret text;
  v_company_data jsonb;
  v_assigned_to uuid;
  v_assigned_name text;
  v_docs_count int := 0;
  v_screenshot_idx int := 0;
  v_screenshot text;
  v_contact_id uuid;
  v_contact_name text;
  v_activity_content text;
  v_activity_label text;
  v_activities_count int := 0;
BEGIN
  -- --- Garde admin ---
  IF NOT propulspace.is_admin() THEN
    RAISE EXCEPTION 'access_denied: admin only' USING ERRCODE = '42501';
  END IF;

  -- --- Validation du type ---
  IF p_lead_type NOT IN ('qualification', 'site_web', 'erp') THEN
    RAISE EXCEPTION 'invalid_lead_type: % (attendu qualification|site_web|erp)', p_lead_type USING ERRCODE = 'P0001';
  END IF;

  -- ==========================================================================
  -- Lecture + mapping de la source selon le type.
  -- ==========================================================================
  IF p_lead_type = 'qualification' THEN
    SELECT * INTO v_lead FROM public.qualification_leads_v2 WHERE id = p_lead_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'lead_not_found: % (qualification)', p_lead_id USING ERRCODE = 'P0002'; END IF;
    IF v_lead.converted_to_project_id IS NOT NULL THEN
      RAISE EXCEPTION 'already_converted: project % (qualification)', v_lead.converted_to_project_id USING ERRCODE = 'P0001';
    END IF;
    IF v_lead.status <> 'submitted' THEN
      RAISE EXCEPTION 'invalid_status: only submitted (got %)', v_lead.status USING ERRCODE = 'P0001';
    END IF;

    v_project_name := COALESCE(NULLIF(trim(v_lead.company_name), ''), NULLIF(trim(v_lead.full_name), ''), 'Nouveau projet');
    v_client_name  := COALESCE(NULLIF(trim(v_lead.company_name), ''), NULLIF(trim(v_lead.full_name), ''));
    v_first_name   := NULLIF(split_part(COALESCE(v_lead.full_name, ''), ' ', 1), '');
    v_phone        := v_lead.phone;
    v_email        := v_lead.email;
    v_company      := v_lead.company_name;

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
    v_assigned_to := NULL;
    v_assigned_name := NULL;

  ELSIF p_lead_type = 'site_web' THEN
    SELECT * INTO v_contact FROM public.contacts WHERE id = p_lead_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'lead_not_found: % (site_web)', p_lead_id USING ERRCODE = 'P0002'; END IF;
    IF v_contact.converted_to_project_id IS NOT NULL THEN
      RAISE EXCEPTION 'already_converted: project % (site_web)', v_contact.converted_to_project_id USING ERRCODE = 'P0001';
    END IF;

    v_company      := NULLIF(trim(v_contact.company), '');
    v_project_name := COALESCE(v_company, NULLIF(trim(v_contact.name), ''), 'Nouveau projet');
    v_client_name  := COALESCE(v_company, NULLIF(trim(v_contact.name), ''));
    v_first_name   := NULLIF(split_part(COALESCE(v_contact.name, ''), ' ', 1), '');
    v_phone        := v_contact.phone;
    v_email        := v_contact.email;
    v_category     := 'site_web';
    v_presta_type  := ARRAY['site_web'];
    v_budget       := v_contact.project_price;
    v_start_date   := CURRENT_DATE;
    -- NOTES du lead site web (colonne text[]) → description du projet.
    v_description  := NULLIF(array_to_string(v_contact.notes, E'\n\n'), '');
    v_siret        := NULL;
    v_company_data := NULL;
    v_assigned_to  := v_contact.assigned_to;

  ELSE
    SELECT * INTO v_erp FROM public.crmerp_leads WHERE id = p_lead_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'lead_not_found: % (erp)', p_lead_id USING ERRCODE = 'P0002'; END IF;
    IF v_erp.converted_to_project_id IS NOT NULL THEN
      RAISE EXCEPTION 'already_converted: project % (erp)', v_erp.converted_to_project_id USING ERRCODE = 'P0001';
    END IF;

    v_company      := NULLIF(trim(v_erp.company_name), '');
    v_project_name := COALESCE(v_company, NULLIF(trim(v_erp.contact_name), ''), 'Nouveau projet');
    v_client_name  := COALESCE(v_company, NULLIF(trim(v_erp.contact_name), ''));
    v_first_name   := NULLIF(split_part(COALESCE(v_erp.contact_name, ''), ' ', 1), '');
    v_phone        := v_erp.phone;
    v_email        := v_erp.email;
    v_category     := 'erp';
    v_presta_type  := ARRAY['erp'];
    v_budget       := NULL;
    v_start_date   := CURRENT_DATE;
    -- NOTES du lead ERP (colonne text) → description du projet.
    v_description  := NULLIF(trim(v_erp.notes), '');
    v_siret        := NULL;
    v_company_data := NULL;
    v_assigned_to  := v_erp.assignee_id;
  END IF;

  IF v_assigned_to IS NOT NULL THEN
    SELECT name INTO v_assigned_name FROM public.users WHERE id = v_assigned_to;
  END IF;

  -- ==========================================================================
  -- Routine commune : projet + contact primary + activité (+ historique + GED)
  -- ==========================================================================

  -- (1) Projet — statut 'brief_received'. portal_client_email JAMAIS écrit ici.
  INSERT INTO public.projects_v2 (
    name, client_name, client_first_name, client_phone, client_company,
    description, status, priority, category, presta_type, budget, start_date,
    progress, is_archived, siret, company_data, assigned_to, assigned_name
  ) VALUES (
    v_project_name, v_client_name, v_first_name, v_phone, v_company,
    NULLIF(v_description, ''), 'brief_received', 'medium', v_category, v_presta_type, v_budget, v_start_date,
    0, false, v_siret, v_company_data, v_assigned_to, v_assigned_name
  ) RETURNING id INTO v_project_id;

  -- (2) Contact primary.
  IF NOT EXISTS (
    SELECT 1 FROM public.project_contacts pc
    WHERE pc.project_id = v_project_id AND pc.role = 'primary'
  ) THEN
    v_contact_name := COALESCE(NULLIF(trim(v_first_name), ''), NULLIF(trim(v_client_name), ''), v_email);
    IF p_lead_type = 'qualification' THEN
      v_contact_name := COALESCE(NULLIF(trim(v_lead.full_name), ''), v_lead.email);
    ELSIF p_lead_type = 'site_web' THEN
      v_contact_name := COALESCE(NULLIF(trim(v_contact.name), ''), v_email);
    ELSE
      v_contact_name := COALESCE(NULLIF(trim(v_erp.contact_name), ''), v_email);
    END IF;

    -- converted_to_project_id posé dès la création : ce contact APPARTIENT au
    -- projet (lien porté par project_contacts ci-dessous), ce n'est pas un lead
    -- actif → il est exclu du board CRM par le filtre `.is(converted_to_project_id, null)`.
    -- Sans ça, chaque conversion ferait réapparaître un faux lead "Prospect".
    INSERT INTO public.contacts (name, email, phone, company, converted_to_project_id)
    VALUES (v_contact_name, v_email, v_phone, v_company, v_project_id)
    RETURNING id INTO v_contact_id;

    INSERT INTO public.project_contacts (project_id, contact_id, role)
    VALUES (v_project_id, v_contact_id, 'primary');
  END IF;

  -- (3) Activité système « Converti depuis <type> ».
  v_activity_label := CASE p_lead_type
    WHEN 'qualification' THEN 'questionnaire de qualification'
    WHEN 'site_web' THEN 'lead site web'
    ELSE 'lead ERP' END;

  IF p_lead_type = 'qualification' THEN
    v_activity_content := 'Questionnaire de qualification rempli le ' ||
      to_char(COALESCE(v_lead.submitted_at, now()), 'DD/MM/YYYY HH24:MI') ||
      '. Type : ' || COALESCE(v_lead.project_type, 'site') || '. Voir l''onglet Brief / questionnaire pour le détail.';
  ELSE
    v_activity_content := 'Projet créé par conversion d''un ' || v_activity_label ||
      ' le ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || '.';
  END IF;

  INSERT INTO public.project_activities_v2 (project_id, user_id, author_name, type, content, is_auto, metadata)
  VALUES (
    v_project_id, NULL, 'Système', 'system', v_activity_content, true,
    jsonb_build_object(
      'source', 'lead_conversion',
      'lead_type', p_lead_type,
      'lead_id', p_lead_id,
      'submitted_at', CASE WHEN p_lead_type = 'qualification' THEN to_jsonb(v_lead.submitted_at) ELSE 'null'::jsonb END
    )
  );

  -- (3b) Reprise de l'HISTORIQUE D'ACTIVITÉS du lead → fil du projet.
  --      Préserve date (created_at), auteur, type (mappé + libellé FR + metadata).
  IF p_lead_type = 'site_web' THEN
    INSERT INTO public.project_activities_v2 (project_id, user_id, author_name, type, content, is_auto, metadata, created_at)
    SELECT
      v_project_id,
      ca.user_id,
      u.name,
      CASE ca.type WHEN 'call' THEN 'call' WHEN 'email' THEN 'email' ELSE 'task' END,
      COALESCE(
        NULLIF(concat_ws(' — ',
          CASE ca.type WHEN 'call' THEN 'Appel' WHEN 'email' THEN 'Email' WHEN 'meeting' THEN 'RDV'
                       WHEN 'note' THEN 'Note' WHEN 'task' THEN 'Tâche' ELSE COALESCE(ca.type, 'Activité') END,
          NULLIF(concat_ws(E'\n', NULLIF(trim(ca.title), ''), NULLIF(trim(ca.description), '')), '')
        ), ''),
        'Activité'
      ),
      false,
      jsonb_build_object('source', 'lead_conversion_history', 'lead_type', 'site_web',
                         'original_activity_id', ca.id, 'original_type', ca.type),
      COALESCE(ca.activity_date, ca.created_at, now())
    FROM public.contact_activities ca
    LEFT JOIN public.users u ON u.id = ca.user_id
    WHERE ca.contact_id = p_lead_id
      AND ca.status IS DISTINCT FROM 'cancelled';
    GET DIAGNOSTICS v_activities_count = ROW_COUNT;

  ELSIF p_lead_type = 'erp' THEN
    INSERT INTO public.project_activities_v2 (project_id, user_id, author_name, type, content, is_auto, metadata, created_at)
    SELECT
      v_project_id,
      ca.created_by,
      u.name,
      CASE ca.type WHEN 'call' THEN 'call' WHEN 'email' THEN 'email' ELSE 'task' END,
      COALESCE(
        NULLIF(concat_ws(' — ',
          CASE ca.type WHEN 'call' THEN 'Appel' WHEN 'email' THEN 'Email' WHEN 'meeting' THEN 'RDV'
                       WHEN 'note' THEN 'Note' WHEN 'task' THEN 'Tâche' ELSE COALESCE(ca.type, 'Activité') END,
          NULLIF(trim(ca.content), '')
        ), ''),
        'Activité'
      ),
      false,
      jsonb_build_object('source', 'lead_conversion_history', 'lead_type', 'erp',
                         'original_activity_id', ca.id, 'original_type', ca.type),
      COALESCE(ca.created_at, now())
    FROM public.crmerp_activities ca
    LEFT JOIN public.users u ON u.id = ca.created_by
    WHERE ca.lead_id = p_lead_id;
    GET DIAGNOSTICS v_activities_count = ROW_COUNT;
  END IF;

  -- (4) GED — uniquement pour la qualif.
  IF p_lead_type = 'qualification' THEN
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
  END IF;

  -- (5) Marque la source convertie.
  IF p_lead_type = 'qualification' THEN
    UPDATE public.qualification_leads_v2
    SET status = 'converted', converted_to_project_id = v_project_id, converted_at = now(), updated_at = now()
    WHERE id = p_lead_id;
  ELSIF p_lead_type = 'site_web' THEN
    UPDATE public.contacts
    SET converted_to_project_id = v_project_id, updated_at = now()
    WHERE id = p_lead_id;
  ELSE
    UPDATE public.crmerp_leads
    SET converted_to_project_id = v_project_id, updated_at = now()
    WHERE id = p_lead_id;
  END IF;

  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'lead_type', p_lead_type,
    'documents_created', v_docs_count,
    'activities_copied', v_activities_count,
    'contact_created', v_contact_id IS NOT NULL
  );
END;
$function$;
