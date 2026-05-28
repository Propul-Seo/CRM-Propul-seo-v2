-- Migration 242 — Propul'Space
-- Ajout du routage Site / Site+ERP / ERP + 10 colonnes ERP-spécifiques
-- + élargissement view qualification_leads_v2 + RPC qualif_update_draft
--
-- Contexte : le questionnaire /diagnostic est aujourd'hui 100% orienté site web.
-- On ajoute une étape "Type de besoin" en amont pour router les leads vers
-- le bon pipeline LeadsV3 (Site web / ERP) et collecter des infos ERP dédiées.
--
-- Volume impacté : 4 lignes en DB (3 drafts + 1 submitted), backfill safe.
-- Réversible : ROLLBACK trivial (ALTER TABLE DROP COLUMN).

-- ============================================================================
-- BLOC 1 — Colonne de routage : project_type
-- ============================================================================
ALTER TABLE propulspace.qualification_leads
  ADD COLUMN project_type text NOT NULL DEFAULT 'site'
    CHECK (project_type IN ('site', 'site_erp', 'erp'));

-- Backfill explicite (DEFAULT le fait déjà mais on documente l'intention)
UPDATE propulspace.qualification_leads
SET project_type = 'site'
WHERE project_type IS NULL;

-- ============================================================================
-- BLOC 2 — Colonnes ERP-spécifiques (toutes nullable, vides si project_type='site')
-- ============================================================================
ALTER TABLE propulspace.qualification_leads
  ADD COLUMN erp_current_system text
    CHECK (erp_current_system IS NULL OR erp_current_system IN (
      'excel', 'odoo', 'sage', 'pennylane', 'notion', 'papier', 'aucun', 'autre_erp', 'autre'
    )),
  ADD COLUMN erp_current_system_other text,
  ADD COLUMN erp_data_volume text
    CHECK (erp_data_volume IS NULL OR erp_data_volume IN (
      '<1000', '1000_10000', '>10000', 'je_sais_pas'
    )),
  ADD COLUMN erp_modules text[],
  ADD COLUMN erp_modules_other text,
  ADD COLUMN erp_users_count text
    CHECK (erp_users_count IS NULL OR erp_users_count IN (
      '<5', '5_20', '20_50', '>50'
    )),
  ADD COLUMN erp_mobile_required boolean,
  ADD COLUMN erp_sso_type text
    CHECK (erp_sso_type IS NULL OR erp_sso_type IN (
      'google', 'microsoft', 'email_password', 'none'
    )),
  ADD COLUMN erp_integrations text[],
  ADD COLUMN erp_integrations_other text;

-- ============================================================================
-- BLOC 3 — Recréer la view qualification_leads_v2 avec les nouvelles colonnes
-- ============================================================================
DROP VIEW IF EXISTS public.qualification_leads_v2;

CREATE VIEW public.qualification_leads_v2 AS
SELECT
  id,
  full_name,
  email,
  phone,
  company_name,
  business_sector,
  business_sector_custom,
  project_type,
  has_existing_site,
  existing_site_url,
  monthly_traffic,
  main_problems,
  main_problems_other,
  has_domain_only,
  main_goal,
  main_goal_other,
  target_audience,
  competitors,
  desired_features,
  desired_features_other,
  ecommerce_platform,
  ecommerce_platform_other,
  product_count_range,
  monthly_orders_range,
  reservation_type,
  health_specific_needs,
  has_visual_identity,
  wants_identity_creation,
  logo_file_url,
  brand_guide_url,
  brand_guide_external_link,
  existing_site_screenshots,
  -- ERP block
  erp_current_system,
  erp_current_system_other,
  erp_data_volume,
  erp_modules,
  erp_modules_other,
  erp_users_count,
  erp_mobile_required,
  erp_sso_type,
  erp_integrations,
  erp_integrations_other,
  -- end ERP
  budget_range,
  desired_timeline,
  timeline_reason,
  is_decision_maker,
  preferred_contact_method,
  final_cta_choice,
  quality_score,
  quality_score_breakdown,
  status,
  draft_progress_percent,
  converted_to_project_id,
  user_id,
  ae_assigned,
  source,
  utm_source,
  utm_medium,
  utm_campaign,
  ip_address,
  user_agent,
  pappers_enrichment,
  submitted_at,
  contacted_at,
  converted_at,
  created_at,
  updated_at,
  notes
FROM propulspace.qualification_leads;

-- Règle projet : toute CREATE VIEW dans public DOIT être suivie d'un REVOKE anon
-- (cf hotfix migration 195, leçon Sprint A.3).
REVOKE ALL ON public.qualification_leads_v2 FROM anon;
GRANT SELECT ON public.qualification_leads_v2 TO authenticated;
GRANT SELECT ON public.qualification_leads_v2 TO service_role;

-- ============================================================================
-- BLOC 4 — Recréer la RPC qualif_update_draft avec whitelist étendue
-- ============================================================================
CREATE OR REPLACE FUNCTION propulspace.qualif_update_draft(p_token uuid, p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'propulspace', 'pg_temp'
AS $function$
DECLARE
  v_id UUID;
  v_target_status TEXT;
BEGIN
  v_target_status := COALESCE(p_payload->>'status', 'draft');
  IF v_target_status NOT IN ('draft', 'submitted') THEN
    RAISE EXCEPTION 'Invalid target status: %', v_target_status USING ERRCODE = '22023';
  END IF;

  UPDATE propulspace.qualification_leads SET
    full_name              = COALESCE(p_payload->>'full_name',              full_name),
    email                  = COALESCE(p_payload->>'email',                  email),
    phone                  = COALESCE(p_payload->>'phone',                  phone),
    company_name           = COALESCE(p_payload->>'company_name',           company_name),
    business_sector        = COALESCE(p_payload->>'business_sector',        business_sector),
    business_sector_custom = COALESCE(p_payload->>'business_sector_custom', business_sector_custom),
    project_type           = COALESCE(p_payload->>'project_type',           project_type),
    has_existing_site      = COALESCE(p_payload->>'has_existing_site',      has_existing_site),
    existing_site_url      = COALESCE(p_payload->>'existing_site_url',      existing_site_url),
    monthly_traffic        = COALESCE(p_payload->>'monthly_traffic',        monthly_traffic),
    main_problems          = CASE WHEN p_payload ? 'main_problems'
                               THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'main_problems'))
                               ELSE main_problems END,
    main_problems_other    = COALESCE(p_payload->>'main_problems_other',    main_problems_other),
    has_domain_only        = COALESCE((p_payload->>'has_domain_only')::boolean, has_domain_only),
    main_goal              = COALESCE(p_payload->>'main_goal',              main_goal),
    main_goal_other        = COALESCE(p_payload->>'main_goal_other',        main_goal_other),
    target_audience        = COALESCE(p_payload->>'target_audience',        target_audience),
    competitors            = COALESCE(p_payload->>'competitors',            competitors),
    desired_features       = CASE WHEN p_payload ? 'desired_features'
                               THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'desired_features'))
                               ELSE desired_features END,
    desired_features_other = COALESCE(p_payload->>'desired_features_other', desired_features_other),
    ecommerce_platform     = COALESCE(p_payload->>'ecommerce_platform',     ecommerce_platform),
    ecommerce_platform_other = COALESCE(p_payload->>'ecommerce_platform_other', ecommerce_platform_other),
    product_count_range    = COALESCE(p_payload->>'product_count_range',    product_count_range),
    monthly_orders_range   = COALESCE(p_payload->>'monthly_orders_range',   monthly_orders_range),
    reservation_type       = COALESCE(p_payload->>'reservation_type',       reservation_type),
    health_specific_needs  = COALESCE(p_payload->>'health_specific_needs',  health_specific_needs),
    has_visual_identity    = COALESCE(p_payload->>'has_visual_identity',    has_visual_identity),
    wants_identity_creation = COALESCE((p_payload->>'wants_identity_creation')::boolean, wants_identity_creation),
    logo_file_url          = COALESCE(p_payload->>'logo_file_url',          logo_file_url),
    brand_guide_url        = COALESCE(p_payload->>'brand_guide_url',        brand_guide_url),
    brand_guide_external_link = COALESCE(p_payload->>'brand_guide_external_link', brand_guide_external_link),
    existing_site_screenshots = CASE WHEN p_payload ? 'existing_site_screenshots'
                                  THEN p_payload->'existing_site_screenshots'
                                  ELSE existing_site_screenshots END,
    -- ERP fields (whitelist étendue migration 242)
    erp_current_system       = COALESCE(p_payload->>'erp_current_system',       erp_current_system),
    erp_current_system_other = COALESCE(p_payload->>'erp_current_system_other', erp_current_system_other),
    erp_data_volume          = COALESCE(p_payload->>'erp_data_volume',          erp_data_volume),
    erp_modules              = CASE WHEN p_payload ? 'erp_modules'
                                 THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'erp_modules'))
                                 ELSE erp_modules END,
    erp_modules_other        = COALESCE(p_payload->>'erp_modules_other',        erp_modules_other),
    erp_users_count          = COALESCE(p_payload->>'erp_users_count',          erp_users_count),
    erp_mobile_required      = COALESCE((p_payload->>'erp_mobile_required')::boolean, erp_mobile_required),
    erp_sso_type             = COALESCE(p_payload->>'erp_sso_type',             erp_sso_type),
    erp_integrations         = CASE WHEN p_payload ? 'erp_integrations'
                                 THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'erp_integrations'))
                                 ELSE erp_integrations END,
    erp_integrations_other   = COALESCE(p_payload->>'erp_integrations_other',   erp_integrations_other),
    -- end ERP
    budget_range             = COALESCE(p_payload->>'budget_range',             budget_range),
    desired_timeline         = COALESCE(p_payload->>'desired_timeline',         desired_timeline),
    timeline_reason          = COALESCE(p_payload->>'timeline_reason',          timeline_reason),
    is_decision_maker        = COALESCE(p_payload->>'is_decision_maker',        is_decision_maker),
    preferred_contact_method = COALESCE(p_payload->>'preferred_contact_method', preferred_contact_method),
    final_cta_choice         = COALESCE(p_payload->>'final_cta_choice',         final_cta_choice),
    draft_progress_percent   = COALESCE((p_payload->>'draft_progress_percent')::integer, draft_progress_percent),
    status                   = v_target_status,
    submitted_at             = CASE WHEN v_target_status = 'submitted' AND submitted_at IS NULL
                                    THEN NOW() ELSE submitted_at END,
    updated_at               = NOW()
  WHERE draft_session_token = p_token
    AND status = 'draft'
    AND submitted_at IS NULL
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Draft not found or already submitted' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_id;
END;
$function$;

-- ============================================================================
-- Notes
-- ============================================================================
-- 1) RLS : aucune modification. Les policies existantes sur qualification_leads
--    restent en vigueur. La RPC qualif_update_draft est SECURITY DEFINER donc
--    elle bypass les RLS de toute façon (whitelist explicite ci-dessus).
-- 2) Idempotence : la migration peut être rejouée (DEFAULT 'site' sur project_type,
--    les ADD COLUMN ERP sont nullable, le CREATE OR REPLACE FUNCTION écrase l'ancienne).
--    Le DROP VIEW + CREATE VIEW est destructif si une autre vue en dépend — aucune
--    dépendance connue à ce jour.
-- 3) Ordre des opérations dans la RPC : project_type est placé en début de bloc
--    pour signaler l'intention de routage en haut du UPDATE.
