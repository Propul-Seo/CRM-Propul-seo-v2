-- ============================================================================
-- Migration 170 — Sprint A.3.1 : sécuriser les drafts qualification (R-011)
-- ============================================================================
-- Risque adressé : R-011 (🔴 CRITIQUE) — fuite RGPD.
--   Les policies `ps_qualif_public_select_draft` / `ps_qualif_public_update_draft`
--   autorisaient anon à SELECT / UPDATE TOUTES les rows status='draft', sans
--   filtre d'identité. Un attaquant pouvait dumper nom/email/tel/budget de
--   tous les drafts en cours.
--
-- Approche :
--   1. Ajouter `draft_session_token` UUID secret (générée serveur, jamais en URL).
--   2. Retirer les 3 policies anon SELECT / UPDATE / INSERT.
--   3. Remplacer par 3 RPC SECURITY DEFINER qui valident le token avant
--      lecture / écriture : `qualif_create_draft`, `qualif_get_draft`,
--      `qualif_update_draft`.
--   4. Le client stocke le token en sessionStorage (perdu à la fermeture
--      d'onglet, recommencé à zéro — accepté pour V1).
--
-- Pré-requis : 0 draft en prod (validé avec Lyes 2026-05-18). Si rows draft
-- existaient, elles recevraient un token rétroactif inaccessible côté client.
--
-- Rollback : voir tout en bas, section commentée.
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Ajout de la colonne draft_session_token
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE propulspace.qualification_leads
  ADD COLUMN IF NOT EXISTS draft_session_token UUID;

-- Filet pour rows existantes (devrait être 0)
UPDATE propulspace.qualification_leads
  SET draft_session_token = gen_random_uuid()
  WHERE draft_session_token IS NULL;

ALTER TABLE propulspace.qualification_leads
  ALTER COLUMN draft_session_token SET NOT NULL,
  ALTER COLUMN draft_session_token SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_qualif_draft_token
  ON propulspace.qualification_leads(draft_session_token);

COMMENT ON COLUMN propulspace.qualification_leads.draft_session_token IS
  'Secret côté client (sessionStorage). Requis par toutes les RPC qualif_*_draft. Jamais exposé via vue ou SELECT direct.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. DROP des policies anon fuyantes (R-011)
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS ps_qualif_public_select_draft ON propulspace.qualification_leads;
DROP POLICY IF EXISTS ps_qualif_public_update_draft ON propulspace.qualification_leads;
DROP POLICY IF EXISTS ps_qualif_public_insert        ON propulspace.qualification_leads;

-- Reste en place : ps_qualif_admin_all (admin propulspace.is_admin())

-- ───────────────────────────────────────────────────────────────────────────
-- 3a. RPC qualif_create_draft — crée un draft vide et retourne (id, token)
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION propulspace.qualif_create_draft(
  p_source TEXT DEFAULT 'portal_diagnostic',
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL
)
RETURNS TABLE(lead_id UUID, session_token UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = propulspace, pg_temp
AS $$
DECLARE
  v_id UUID;
  v_token UUID;
BEGIN
  INSERT INTO propulspace.qualification_leads (
    full_name, email, phone, business_sector,
    budget_range, status, source,
    utm_source, utm_medium, utm_campaign
  ) VALUES (
    '', '', '', '',
    '<2000', 'draft', COALESCE(p_source, 'portal_diagnostic'),
    p_utm_source, p_utm_medium, p_utm_campaign
  )
  RETURNING id, draft_session_token
  INTO v_id, v_token;

  RETURN QUERY SELECT v_id, v_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION propulspace.qualif_create_draft(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION propulspace.qualif_create_draft(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION propulspace.qualif_create_draft(TEXT, TEXT, TEXT, TEXT) IS
  'Crée une row draft vide et retourne (lead_id, session_token). Le token doit être stocké en sessionStorage côté client. Appelable par anon.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3b. RPC qualif_get_draft — lit une row par token (draft only)
-- ───────────────────────────────────────────────────────────────────────────
-- Retourne un sous-ensemble des colonnes : pas de quality_score, pappers_enrichment,
-- ip_address, user_agent, internal admin fields.

CREATE OR REPLACE FUNCTION propulspace.qualif_get_draft(p_token UUID)
RETURNS TABLE(
  id UUID,
  full_name TEXT, email TEXT, phone TEXT, company_name TEXT,
  business_sector TEXT, business_sector_custom TEXT,
  has_existing_site BOOLEAN, existing_site_url TEXT, monthly_traffic TEXT,
  main_problems TEXT[], has_domain_only BOOLEAN,
  main_goal TEXT, target_audience TEXT, competitors TEXT,
  desired_features TEXT[], ecommerce_platform TEXT, product_count_range TEXT,
  monthly_orders_range TEXT, reservation_type TEXT, health_specific_needs TEXT,
  has_visual_identity TEXT, wants_identity_creation BOOLEAN,
  budget_range TEXT, desired_timeline TEXT, timeline_reason TEXT,
  is_decision_maker TEXT, preferred_contact_method TEXT, final_cta_choice TEXT,
  status TEXT, draft_progress_percent INTEGER,
  logo_file_url TEXT, brand_guide_url TEXT, existing_site_screenshots JSONB,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = propulspace, pg_temp
AS $$
  SELECT
    id, full_name, email, phone, company_name,
    business_sector, business_sector_custom,
    has_existing_site, existing_site_url, monthly_traffic,
    main_problems, has_domain_only,
    main_goal, target_audience, competitors,
    desired_features, ecommerce_platform, product_count_range,
    monthly_orders_range, reservation_type, health_specific_needs,
    has_visual_identity, wants_identity_creation,
    budget_range, desired_timeline, timeline_reason,
    is_decision_maker, preferred_contact_method, final_cta_choice,
    status, draft_progress_percent,
    logo_file_url, brand_guide_url, existing_site_screenshots,
    created_at, updated_at
  FROM propulspace.qualification_leads
  WHERE draft_session_token = p_token
    AND status = 'draft'
    AND submitted_at IS NULL
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION propulspace.qualif_get_draft(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION propulspace.qualif_get_draft(UUID) TO anon, authenticated;

COMMENT ON FUNCTION propulspace.qualif_get_draft(UUID) IS
  'Lit un draft par session_token. Filtre status=draft AND submitted_at IS NULL. Colonnes admin (quality_score, pappers, ip) exclues.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3c. RPC qualif_update_draft — UPDATE par token avec payload JSONB whitelist
-- ───────────────────────────────────────────────────────────────────────────
-- Le payload JSONB ne peut affecter que la whitelist de colonnes métier qualif.
-- COALESCE conserve la valeur existante si la clé est absente du payload.
-- Transition draft→submitted autorisée (le client envoie status='submitted'
-- à l'étape finale).

CREATE OR REPLACE FUNCTION propulspace.qualif_update_draft(
  p_token UUID,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = propulspace, pg_temp
AS $$
DECLARE
  v_id UUID;
  v_target_status TEXT;
BEGIN
  -- Statut cible : 'draft' par défaut, 'submitted' si payload le demande explicitement
  v_target_status := COALESCE(p_payload->>'status', 'draft');
  IF v_target_status NOT IN ('draft', 'submitted') THEN
    RAISE EXCEPTION 'Invalid target status: %', v_target_status USING ERRCODE = '22023';
  END IF;

  UPDATE propulspace.qualification_leads SET
    -- Step 1 — identity
    full_name              = COALESCE(p_payload->>'full_name',              full_name),
    email                  = COALESCE(p_payload->>'email',                  email),
    phone                  = COALESCE(p_payload->>'phone',                  phone),
    company_name           = COALESCE(p_payload->>'company_name',           company_name),
    business_sector        = COALESCE(p_payload->>'business_sector',        business_sector),
    business_sector_custom = COALESCE(p_payload->>'business_sector_custom', business_sector_custom),
    -- Step 2 — current situation
    has_existing_site      = COALESCE((p_payload->>'has_existing_site')::boolean, has_existing_site),
    existing_site_url      = COALESCE(p_payload->>'existing_site_url', existing_site_url),
    monthly_traffic        = COALESCE(p_payload->>'monthly_traffic',   monthly_traffic),
    main_problems          = CASE WHEN p_payload ? 'main_problems'
                               THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'main_problems'))
                               ELSE main_problems END,
    has_domain_only        = COALESCE((p_payload->>'has_domain_only')::boolean, has_domain_only),
    -- Step 3 — goals
    main_goal              = COALESCE(p_payload->>'main_goal',       main_goal),
    target_audience        = COALESCE(p_payload->>'target_audience', target_audience),
    competitors            = COALESCE(p_payload->>'competitors',     competitors),
    -- Step 4 — features
    desired_features       = CASE WHEN p_payload ? 'desired_features'
                               THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'desired_features'))
                               ELSE desired_features END,
    ecommerce_platform     = COALESCE(p_payload->>'ecommerce_platform',     ecommerce_platform),
    product_count_range    = COALESCE(p_payload->>'product_count_range',    product_count_range),
    monthly_orders_range   = COALESCE(p_payload->>'monthly_orders_range',   monthly_orders_range),
    reservation_type       = COALESCE(p_payload->>'reservation_type',       reservation_type),
    health_specific_needs  = COALESCE(p_payload->>'health_specific_needs',  health_specific_needs),
    -- Step 5 — visual identity
    has_visual_identity    = COALESCE(p_payload->>'has_visual_identity', has_visual_identity),
    wants_identity_creation = COALESCE((p_payload->>'wants_identity_creation')::boolean, wants_identity_creation),
    logo_file_url          = COALESCE(p_payload->>'logo_file_url',  logo_file_url),
    brand_guide_url        = COALESCE(p_payload->>'brand_guide_url', brand_guide_url),
    existing_site_screenshots = CASE WHEN p_payload ? 'existing_site_screenshots'
                                  THEN p_payload->'existing_site_screenshots'
                                  ELSE existing_site_screenshots END,
    -- Step 6 — budget & timing
    budget_range           = COALESCE(p_payload->>'budget_range',    budget_range),
    desired_timeline       = COALESCE(p_payload->>'desired_timeline', desired_timeline),
    timeline_reason        = COALESCE(p_payload->>'timeline_reason',  timeline_reason),
    -- Step 7 — decision & contact
    is_decision_maker      = COALESCE(p_payload->>'is_decision_maker',      is_decision_maker),
    preferred_contact_method = COALESCE(p_payload->>'preferred_contact_method', preferred_contact_method),
    final_cta_choice       = COALESCE(p_payload->>'final_cta_choice', final_cta_choice),
    -- Progress & status
    draft_progress_percent = COALESCE((p_payload->>'draft_progress_percent')::integer, draft_progress_percent),
    status                 = v_target_status,
    submitted_at           = CASE WHEN v_target_status = 'submitted' AND submitted_at IS NULL
                                  THEN NOW() ELSE submitted_at END,
    updated_at             = NOW()
  WHERE draft_session_token = p_token
    AND status = 'draft'
    AND submitted_at IS NULL
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Draft not found or already submitted' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION propulspace.qualif_update_draft(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION propulspace.qualif_update_draft(UUID, JSONB) TO anon, authenticated;

COMMENT ON FUNCTION propulspace.qualif_update_draft(UUID, JSONB) IS
  'Update partiel d''un draft via session_token. Whitelist de colonnes : champs métier qualif + status (draft|submitted). Champs admin (quality_score, pappers, ae_assigned, status converted/contacted/qualified/unqualified) NON modifiables.';

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Wrappers PostgREST dans public (Supabase n'expose que public via PostgREST)
-- ───────────────────────────────────────────────────────────────────────────
-- Les 3 fonctions propulspace.qualif_* ne sont pas appelables depuis le client
-- (schéma propulspace non exposé). On ajoute de fines passe-plats dans public.
-- SECURITY INVOKER ici : la fonction interne propulspace.* est déjà SECURITY
-- DEFINER, le wrapper n'a donc pas besoin d'élévation.

CREATE OR REPLACE FUNCTION public.qualif_create_draft(
  p_source TEXT DEFAULT 'portal_diagnostic',
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL
)
RETURNS TABLE(lead_id UUID, session_token UUID)
LANGUAGE sql
VOLATILE
SET search_path = public, pg_temp
AS $$
  SELECT * FROM propulspace.qualif_create_draft(p_source, p_utm_source, p_utm_medium, p_utm_campaign);
$$;

REVOKE EXECUTE ON FUNCTION public.qualif_create_draft(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.qualif_create_draft(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Signature TABLE() explicite (PAS SETOF qualification_leads) pour empêcher
-- PostgREST d'exposer les colonnes admin (quality_score, pappers_enrichment,
-- ip_address, etc.) via la sérialisation auto de la table.
CREATE OR REPLACE FUNCTION public.qualif_get_draft(p_token UUID)
RETURNS TABLE(
  id UUID,
  full_name TEXT, email TEXT, phone TEXT, company_name TEXT,
  business_sector TEXT, business_sector_custom TEXT,
  has_existing_site BOOLEAN, existing_site_url TEXT, monthly_traffic TEXT,
  main_problems TEXT[], has_domain_only BOOLEAN,
  main_goal TEXT, target_audience TEXT, competitors TEXT,
  desired_features TEXT[], ecommerce_platform TEXT, product_count_range TEXT,
  monthly_orders_range TEXT, reservation_type TEXT, health_specific_needs TEXT,
  has_visual_identity TEXT, wants_identity_creation BOOLEAN,
  budget_range TEXT, desired_timeline TEXT, timeline_reason TEXT,
  is_decision_maker TEXT, preferred_contact_method TEXT, final_cta_choice TEXT,
  status TEXT, draft_progress_percent INTEGER,
  logo_file_url TEXT, brand_guide_url TEXT, existing_site_screenshots JSONB,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT * FROM propulspace.qualif_get_draft(p_token);
$$;

REVOKE EXECUTE ON FUNCTION public.qualif_get_draft(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.qualif_get_draft(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.qualif_update_draft(
  p_token UUID,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE sql
VOLATILE
SET search_path = public, pg_temp
AS $$
  SELECT propulspace.qualif_update_draft(p_token, p_payload);
$$;

REVOKE EXECUTE ON FUNCTION public.qualif_update_draft(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.qualif_update_draft(UUID, JSONB) TO anon, authenticated;

COMMENT ON FUNCTION public.qualif_create_draft(TEXT, TEXT, TEXT, TEXT) IS
  'Wrapper PostgREST. Délègue à propulspace.qualif_create_draft.';
COMMENT ON FUNCTION public.qualif_get_draft(UUID) IS
  'Wrapper PostgREST. Délègue à propulspace.qualif_get_draft.';
COMMENT ON FUNCTION public.qualif_update_draft(UUID, JSONB) IS
  'Wrapper PostgREST. Délègue à propulspace.qualif_update_draft.';

-- ============================================================================
-- ROLLBACK (commenté — à exécuter manuellement si nécessaire)
-- ============================================================================
-- DROP FUNCTION IF EXISTS public.qualif_create_draft(TEXT, TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.qualif_get_draft(UUID);
-- DROP FUNCTION IF EXISTS public.qualif_update_draft(UUID, JSONB);
-- DROP FUNCTION IF EXISTS propulspace.qualif_create_draft(TEXT, TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS propulspace.qualif_get_draft(UUID);
-- DROP FUNCTION IF EXISTS propulspace.qualif_update_draft(UUID, JSONB);
-- DROP INDEX IF EXISTS propulspace.idx_qualif_draft_token;
-- ALTER TABLE propulspace.qualification_leads DROP COLUMN IF EXISTS draft_session_token;
-- CREATE POLICY ps_qualif_public_insert ON propulspace.qualification_leads
--   FOR INSERT TO anon, authenticated
--   WITH CHECK (status = 'draft' AND submitted_at IS NULL);
-- CREATE POLICY ps_qualif_public_select_draft ON propulspace.qualification_leads
--   FOR SELECT TO anon, authenticated USING (status = 'draft');
-- CREATE POLICY ps_qualif_public_update_draft ON propulspace.qualification_leads
--   FOR UPDATE TO anon, authenticated
--   USING (status = 'draft')
--   WITH CHECK (status IN ('draft', 'submitted'));
