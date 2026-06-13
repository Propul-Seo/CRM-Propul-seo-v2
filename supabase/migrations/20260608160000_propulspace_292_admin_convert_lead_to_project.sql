-- ============================================================================
-- Migration 292 — RPC unifiée admin_convert_lead_to_project (SP2)
-- ============================================================================
-- Une seule porte de conversion lead→projet pour les 3 pipelines :
--   - 'qualification' (propulspace.qualification_leads_v2) : combo complet,
--      reprend EXACTEMENT la logique de la migration 256 (projet + contact
--      primary + activité système + GED logo/charte/screenshots + marque
--      converti).
--   - 'site_web'  (public.contacts)      : projet + contact primary + activité.
--      Pas de GED (les leads site web n'ont pas d'assets uploadés).
--   - 'erp'       (public.crmerp_leads)  : projet + contact primary + activité.
--      Pas de GED, pas de budget (la table ERP n'a pas de colonne montant).
--
-- Décisions cadrées (spec SP2 §3) :
--   Q5 — conversion seule : on garde les 3 tables/listes de leads, on unifie
--        uniquement l'acte de conversion.
--   Q6 — portail découplé : la RPC n'écrit JAMAIS portal_client_email.
--        L'activation du portail se fait ailleurs (PortalStatusSection).
--   Statut de départ : tous les projets démarrent à 'brief_received'.
--
-- Garde : propulspace.is_admin() (admin/manager), comme la mig 256.
-- Anti double-conversion : selon le type, lit converted_to_project_id de la
-- table source ; si non-NULL → RAISE already_converted.
--
-- Compat : propulspace.admin_convert_qualif_to_project (+ wrapper public) est
-- réécrit en wrapper fin appelant admin_convert_lead_to_project(id,
-- 'qualification') pour ne casser aucun appelant résiduel.
--
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RPC unifiée (schéma propulspace, SECURITY DEFINER)
-- ----------------------------------------------------------------------------
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
  -- Source qualif (typée sur la vue/table existante, comme la mig 256).
  v_lead public.qualification_leads_v2;
  -- Sources site_web / erp.
  v_contact public.contacts;
  v_erp public.crmerp_leads;
  -- Champs projet (communs à tous les types).
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
  -- GED (qualif only).
  v_docs_count int := 0;
  v_screenshot_idx int := 0;
  v_screenshot text;
  -- Contact primary.
  v_contact_id uuid;
  v_contact_name text;
  -- Activité système.
  v_activity_content text;
  v_activity_label text;
BEGIN
  -- --- Garde admin (identique mig 256) ---
  IF NOT propulspace.is_admin() THEN
    RAISE EXCEPTION 'access_denied: admin only' USING ERRCODE = '42501';
  END IF;

  -- --- Validation du type ---
  IF p_lead_type NOT IN ('qualification', 'site_web', 'erp') THEN
    RAISE EXCEPTION 'invalid_lead_type: % (attendu qualification|site_web|erp)', p_lead_type USING ERRCODE = 'P0001';
  END IF;

  -- ==========================================================================
  -- Lecture + mapping de la source selon le type.
  -- Les valeurs communes alimentent ensuite la routine d'insertion partagée.
  -- ==========================================================================
  IF p_lead_type = 'qualification' THEN
    -- ----- QUALIFICATION : logique reprise telle quelle de la mig 256 -----
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
    -- Qualif : pas de responsable assigné (le questionnaire n'en porte pas).
    v_assigned_to := NULL;
    v_assigned_name := NULL;

  ELSIF p_lead_type = 'site_web' THEN
    -- ----- SITE WEB : source public.contacts -----
    SELECT * INTO v_contact FROM public.contacts WHERE id = p_lead_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'lead_not_found: % (site_web)', p_lead_id USING ERRCODE = 'P0002'; END IF;
    IF v_contact.converted_to_project_id IS NOT NULL THEN
      RAISE EXCEPTION 'already_converted: project % (site_web)', v_contact.converted_to_project_id USING ERRCODE = 'P0001';
    END IF;

    -- Mapping colonnes réelles de public.contacts :
    --   company (NOT NULL DEFAULT '') → nom client / société ; fallback name.
    --   name → contact ; email/phone directs.
    v_company      := NULLIF(trim(v_contact.company), '');
    v_project_name := COALESCE(v_company, NULLIF(trim(v_contact.name), ''), 'Nouveau projet');
    v_client_name  := COALESCE(v_company, NULLIF(trim(v_contact.name), ''));
    v_first_name   := NULLIF(split_part(COALESCE(v_contact.name, ''), ' ', 1), '');
    v_phone        := v_contact.phone;
    v_email        := v_contact.email;
    -- Pipeline site web → catégorie site_web par défaut (pas de typage fin côté lead).
    v_category     := 'site_web';
    v_presta_type  := ARRAY['site_web'];
    -- Budget : project_price si renseigné (sinon NULL, montant inconnu).
    v_budget       := v_contact.project_price;
    -- Pas de deadline côté lead site web → start_date = aujourd'hui (défaut sûr).
    v_start_date   := CURRENT_DATE;
    v_description  := NULL;
    -- Pas d'enrichissement Pappers stocké sur contacts → siret/company_data NULL.
    v_siret        := NULL;
    v_company_data := NULL;
    -- Responsable : assigned_to (FK users) → nom résolu plus bas.
    v_assigned_to  := v_contact.assigned_to;

  ELSE
    -- ----- ERP : source public.crmerp_leads -----
    SELECT * INTO v_erp FROM public.crmerp_leads WHERE id = p_lead_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'lead_not_found: % (erp)', p_lead_id USING ERRCODE = 'P0002'; END IF;
    IF v_erp.converted_to_project_id IS NOT NULL THEN
      RAISE EXCEPTION 'already_converted: project % (erp)', v_erp.converted_to_project_id USING ERRCODE = 'P0001';
    END IF;

    -- Mapping colonnes réelles de public.crmerp_leads :
    --   company_name → nom client / société ; contact_name → contact.
    --   email/phone directs. assignee_id (FK users) = responsable.
    v_company      := NULLIF(trim(v_erp.company_name), '');
    v_project_name := COALESCE(v_company, NULLIF(trim(v_erp.contact_name), ''), 'Nouveau projet');
    v_client_name  := COALESCE(v_company, NULLIF(trim(v_erp.contact_name), ''));
    v_first_name   := NULLIF(split_part(COALESCE(v_erp.contact_name, ''), ' ', 1), '');
    v_phone        := v_erp.phone;
    v_email        := v_erp.email;
    -- Pipeline ERP → catégorie erp.
    v_category     := 'erp';
    v_presta_type  := ARRAY['erp'];
    -- La table crmerp_leads n'a PAS de colonne montant → budget inconnu (NULL).
    v_budget       := NULL;
    v_start_date   := CURRENT_DATE;
    v_description  := NULL;
    v_siret        := NULL;
    v_company_data := NULL;
    -- Responsable : assignee_id (≠ assigned_to des contacts).
    v_assigned_to  := v_erp.assignee_id;
  END IF;

  -- Résolution du nom du responsable (site_web/erp) pour le cache visuel V2.
  IF v_assigned_to IS NOT NULL THEN
    SELECT name INTO v_assigned_name FROM public.users WHERE id = v_assigned_to;
  END IF;

  -- ==========================================================================
  -- Routine commune : projet + contact primary + activité (+ GED si qualif)
  -- + marquage de la source. Toujours exécutée quel que soit le type.
  -- ==========================================================================

  -- (1) Projet — statut 'brief_received' (YAGNI : pas de mapping par pipeline).
  --     portal_client_email JAMAIS écrit ici (Q6 — portail découplé).
  INSERT INTO public.projects_v2 (
    name, client_name, client_first_name, client_phone, client_company,
    description, status, priority, category, presta_type, budget, start_date,
    progress, is_archived, siret, company_data, assigned_to, assigned_name
  ) VALUES (
    v_project_name, v_client_name, v_first_name, v_phone, v_company,
    NULLIF(v_description, ''), 'brief_received', 'medium', v_category, v_presta_type, v_budget, v_start_date,
    0, false, v_siret, v_company_data, v_assigned_to, v_assigned_name
  ) RETURNING id INTO v_project_id;

  -- (2) Contact primary — créé seulement s'il n'y a pas déjà un primary
  --     (même garde que la mig 256 ; insert sans user_id, comme 256/255).
  IF NOT EXISTS (
    SELECT 1 FROM public.project_contacts pc
    WHERE pc.project_id = v_project_id AND pc.role = 'primary'
  ) THEN
    v_contact_name := COALESCE(NULLIF(trim(v_first_name), ''), NULLIF(trim(v_client_name), ''), v_email);
    -- Pour la qualif, on conserve le nom complet du lead (comme la mig 256).
    IF p_lead_type = 'qualification' THEN
      v_contact_name := COALESCE(NULLIF(trim(v_lead.full_name), ''), v_lead.email);
    ELSIF p_lead_type = 'site_web' THEN
      v_contact_name := COALESCE(NULLIF(trim(v_contact.name), ''), v_email);
    ELSE
      v_contact_name := COALESCE(NULLIF(trim(v_erp.contact_name), ''), v_email);
    END IF;

    INSERT INTO public.contacts (name, email, phone, company)
    VALUES (v_contact_name, v_email, v_phone, v_company)
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
    -- Conserve le libellé riche de la mig 256 (date + type questionnaire).
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
      -- submitted_at présent uniquement pour la qualif (compat metadata mig 256).
      'submitted_at', CASE WHEN p_lead_type = 'qualification' THEN to_jsonb(v_lead.submitted_at) ELSE 'null'::jsonb END
    )
  );

  -- (4) GED — uniquement pour la qualif (logo, charte, lien charte, captures).
  --     Les pipelines site_web/erp n'ont pas d'assets uploadés → rien à créer.
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

  -- (5) Marque la source convertie (toujours).
  --     Qualif : a aussi status='converted' + converted_at (comme mig 256).
  --     site_web/erp : la mig 291 n'ajoute QUE converted_to_project_id
  --     (pas de colonnes status/converted_at de conversion) → on ne touche
  --     pas leur colonne status (qui est un statut de pipeline, pas un état
  --     de conversion).
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
    'contact_created', v_contact_id IS NOT NULL
  );
END;
$function$;

-- ----------------------------------------------------------------------------
-- 2. Wrapper public PostgREST (pattern mig 252/281)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_convert_lead_to_project(
  p_lead_id   uuid,
  p_lead_type text
)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SET search_path = public, pg_temp
AS $$
  SELECT propulspace.admin_convert_lead_to_project(p_lead_id, p_lead_type);
$$;

REVOKE ALL ON FUNCTION public.admin_convert_lead_to_project(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_convert_lead_to_project(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.admin_convert_lead_to_project(uuid, text) IS
  'Wrapper PostgREST SP2. Délègue à propulspace.admin_convert_lead_to_project (SECURITY DEFINER, admin only). Convertit un lead (qualification|site_web|erp) en projet complet.';

-- ----------------------------------------------------------------------------
-- 3. Compat : admin_convert_qualif_to_project réécrit en wrapper fin
--    (zéro régression pour un éventuel appelant résiduel).
-- ----------------------------------------------------------------------------
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
  v_result jsonb;
BEGIN
  -- p_activate_portal est ignoré (Q6 : portail découplé de la conversion).
  -- Conservé dans la signature pour ne casser aucun appelant existant.
  v_result := propulspace.admin_convert_lead_to_project(p_qualif_id, 'qualification');
  -- Réexpose la clé historique portal_activated (toujours false désormais).
  RETURN v_result || jsonb_build_object('portal_activated', false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_convert_qualif_to_project(
  p_qualif_id uuid,
  p_activate_portal boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SET search_path = public, pg_temp
AS $$
  SELECT propulspace.admin_convert_qualif_to_project(p_qualif_id, p_activate_portal);
$$;

REVOKE ALL ON FUNCTION public.admin_convert_qualif_to_project(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_convert_qualif_to_project(uuid, boolean) TO authenticated;

COMMENT ON FUNCTION propulspace.admin_convert_qualif_to_project(uuid, boolean) IS
  'SP2 : wrapper fin (déprécié) → admin_convert_lead_to_project(p_qualif_id, ''qualification''). p_activate_portal ignoré (portail découplé).';
