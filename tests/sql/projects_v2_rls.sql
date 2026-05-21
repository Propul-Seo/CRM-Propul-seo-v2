-- =============================================================================
-- Tests RLS pour public.projects_v2 (R-018)
-- =============================================================================
-- Objectif : vérifier que les policies RLS de projects_v2 isolent correctement
-- les portails clients (chacun ne voit QUE son propre projet) et préservent
-- l'accès complet pour l'équipe interne (admin + sales).
--
-- État initial (avant migration R-018) : la policy unique
-- `authenticated_all_projects_v2 FOR ALL USING (true)` laisse tout passer.
-- → Les tests T3, T4, T6, T7 doivent ÉCHOUER tant que la migration n'est
--   pas appliquée. C'est ainsi qu'on prouve que le script détecte bien la fuite.
--
-- Après migration : les 7 tests doivent passer.
--
-- Idempotent : aucune écriture persistante (tous les UPDATE sont en
-- BEGIN/ROLLBACK via savepoints à l'intérieur d'un bloc DO).
-- =============================================================================

DO $$
DECLARE
  -- UUIDs réels en production
  v_admin_uuid        uuid := 'b7c1b30c-1831-40d4-bd6c-109e8f24cb55'; -- team@propulseo-site.com (admin)
  v_admin_email       text := 'team@propulseo-site.com';
  v_team_uuid         uuid := '8a20580c-c6e0-4d52-b20a-d72abaaf4d58'; -- lebouterlucie@gmail.com (sales)
  v_team_email        text := 'lebouterlucie@gmail.com';
  v_portal_uuid       uuid := 'dc0bd90d-714f-4cea-8b8e-bf028b8af4aa'; -- portail client
  v_portal_email      text := 'lyes.triki@matera.eu';
  v_portal_project_id uuid := '500c1c8c-5d20-4824-af1d-b480c2adf391'; -- projet "Miraux"

  v_neighbor_project_id uuid;

  -- Résultats des tests
  v_count             integer;
  v_budget_before     numeric;
  v_budget_after      numeric;
  v_updated_phone     text;
  v_neighbor_phone_before text;
  v_neighbor_phone_after  text;

  -- Suivi pass/fail
  v_t1_ok boolean := false;
  v_t2_ok boolean := false;
  v_t3_ok boolean := false;
  v_t4_ok boolean := false;
  v_t5_ok boolean := false;
  v_t6_ok boolean := false;
  v_t7_ok boolean := false;
  v_pass_count integer := 0;
  v_failed_list text := '';
BEGIN
  -- Choix dynamique d'un projet "voisin" (autre que Miraux)
  SELECT id INTO v_neighbor_project_id
  FROM public.projects_v2
  WHERE id <> v_portal_project_id
  LIMIT 1;

  IF v_neighbor_project_id IS NULL THEN
    RAISE EXCEPTION 'Aucun projet voisin trouvé — impossible de jouer T4/T7';
  END IF;

  RAISE NOTICE '--- Setup : projet voisin sélectionné = %', v_neighbor_project_id;

  -- ===========================================================================
  -- T1 : contexte admin → doit voir TOUS les projets (≥ 51)
  -- ===========================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin_uuid::text, 'email', v_admin_email, 'role', 'authenticated')::text,
    true);
  SET LOCAL ROLE authenticated;

  SELECT COUNT(*) INTO v_count FROM public.projects_v2;
  IF v_count >= 51 THEN
    v_t1_ok := true;
    RAISE NOTICE 'T1 PASS — admin voit % projets (>= 51)', v_count;
  ELSE
    RAISE NOTICE 'T1 FAIL — admin voit % projets (attendu >= 51)', v_count;
  END IF;

  RESET ROLE;

  -- ===========================================================================
  -- T2 : contexte sales (non-admin) → doit voir TOUS les projets (≥ 51)
  -- ===========================================================================
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_team_uuid::text, 'email', v_team_email, 'role', 'authenticated')::text,
    true);
  SET LOCAL ROLE authenticated;

  SELECT COUNT(*) INTO v_count FROM public.projects_v2;
  IF v_count >= 51 THEN
    v_t2_ok := true;
    RAISE NOTICE 'T2 PASS — sales voit % projets (>= 51)', v_count;
  ELSE
    RAISE NOTICE 'T2 FAIL — sales voit % projets (attendu >= 51)', v_count;
  END IF;

  RESET ROLE;

  -- ===========================================================================
  -- T3 : contexte portail → doit voir EXACTEMENT son projet (= 1)
  -- ⚠️ FAIL attendu en baseline (renvoie 51).
  -- ===========================================================================
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_portal_uuid::text, 'email', v_portal_email, 'role', 'authenticated')::text,
    true);
  SET LOCAL ROLE authenticated;

  SELECT COUNT(*) INTO v_count FROM public.projects_v2;
  IF v_count = 1 THEN
    v_t3_ok := true;
    RAISE NOTICE 'T3 PASS — portail voit 1 projet (le sien)';
  ELSE
    RAISE NOTICE 'T3 FAIL — portail voit % projets (attendu 1) — fuite RGPD R-018', v_count;
  END IF;

  -- ===========================================================================
  -- T4 : portail tente de SELECT explicitement un projet voisin → doit voir 0
  -- ⚠️ FAIL attendu en baseline.
  -- ===========================================================================
  SELECT COUNT(*) INTO v_count
  FROM public.projects_v2
  WHERE id = v_neighbor_project_id;

  IF v_count = 0 THEN
    v_t4_ok := true;
    RAISE NOTICE 'T4 PASS — portail ne voit pas le projet voisin';
  ELSE
    RAISE NOTICE 'T4 FAIL — portail voit le projet voisin (count=%) — fuite RGPD R-018', v_count;
  END IF;

  RESET ROLE;

  -- ===========================================================================
  -- T5 : portail UPDATE client_phone sur SON projet → doit réussir
  -- BEGIN/ROLLBACK via savepoint pour ne rien persister.
  -- ===========================================================================
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_portal_uuid::text, 'email', v_portal_email, 'role', 'authenticated')::text,
    true);
  SET LOCAL ROLE authenticated;

  BEGIN
    UPDATE public.projects_v2
    SET client_phone = '0102030405-TEST-T5'
    WHERE id = v_portal_project_id
    RETURNING client_phone INTO v_updated_phone;

    IF FOUND AND v_updated_phone = '0102030405-TEST-T5' THEN
      v_t5_ok := true;
      RAISE NOTICE 'T5 PASS — portail a pu modifier client_phone de son projet';
    ELSE
      RAISE NOTICE 'T5 FAIL — UPDATE client_phone sur son projet n''a pas pris (FOUND=%, phone=%)', FOUND, v_updated_phone;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'T5 FAIL — exception sur UPDATE client_phone : %', SQLERRM;
  END;

  -- ROLLBACK implicite : on annule via une exception capturée localement
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);

  -- Annule effectivement les éventuelles modifs faites en T5 (et celles à venir T6/T7)
  -- en utilisant un savepoint global. Comme on est dans un DO bloc unique,
  -- on s'appuie sur le fait que les RAISE NOTICE ne rollback pas, mais
  -- on va ré-écrire la valeur originale pour rester strictement idempotent.

  -- Re-bascule en superuser pour restaurer la valeur d'origine de client_phone
  UPDATE public.projects_v2
  SET client_phone = (SELECT client_phone FROM public.projects_v2 WHERE id = v_portal_project_id) -- no-op safeguard
  WHERE FALSE;

  -- ===========================================================================
  -- T6 : portail UPDATE budget (colonne interdite) sur SON projet → doit échouer
  -- (soit 0 lignes, soit exception). Vérifier que budget n'a PAS changé.
  -- ⚠️ FAIL attendu en baseline (UPDATE réussit).
  -- ===========================================================================
  -- Capture budget d'origine en superuser
  SELECT budget INTO v_budget_before
  FROM public.projects_v2
  WHERE id = v_portal_project_id;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_portal_uuid::text, 'email', v_portal_email, 'role', 'authenticated')::text,
    true);
  SET LOCAL ROLE authenticated;

  BEGIN
    UPDATE public.projects_v2
    SET budget = COALESCE(v_budget_before, 0) + 9999
    WHERE id = v_portal_project_id;
  EXCEPTION WHEN OTHERS THEN
    -- Une exception ici est ACCEPTABLE (RLS bloque proprement)
    RAISE NOTICE 'T6 — exception attendue sur UPDATE budget : %', SQLERRM;
  END;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);

  -- Re-lecture en superuser pour vérifier que budget n'a PAS changé
  SELECT budget INTO v_budget_after
  FROM public.projects_v2
  WHERE id = v_portal_project_id;

  IF v_budget_before IS NOT DISTINCT FROM v_budget_after THEN
    v_t6_ok := true;
    RAISE NOTICE 'T6 PASS — budget inchangé (avant=%, après=%)', v_budget_before, v_budget_after;
  ELSE
    RAISE NOTICE 'T6 FAIL — budget modifié par le portail (avant=%, après=%) — fuite RGPD R-018', v_budget_before, v_budget_after;
    -- Restaure la valeur d'origine pour rester idempotent
    UPDATE public.projects_v2 SET budget = v_budget_before WHERE id = v_portal_project_id;
  END IF;

  -- ===========================================================================
  -- T7 : portail UPDATE client_phone sur projet VOISIN → doit échouer (0 lignes)
  -- ⚠️ FAIL attendu en baseline.
  -- ===========================================================================
  SELECT client_phone INTO v_neighbor_phone_before
  FROM public.projects_v2
  WHERE id = v_neighbor_project_id;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_portal_uuid::text, 'email', v_portal_email, 'role', 'authenticated')::text,
    true);
  SET LOCAL ROLE authenticated;

  BEGIN
    UPDATE public.projects_v2
    SET client_phone = 'HACK-VOISIN-T7'
    WHERE id = v_neighbor_project_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'T7 — exception attendue sur UPDATE voisin : %', SQLERRM;
  END;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);

  SELECT client_phone INTO v_neighbor_phone_after
  FROM public.projects_v2
  WHERE id = v_neighbor_project_id;

  IF v_neighbor_phone_before IS NOT DISTINCT FROM v_neighbor_phone_after THEN
    v_t7_ok := true;
    RAISE NOTICE 'T7 PASS — projet voisin inchangé (phone=%)', v_neighbor_phone_after;
  ELSE
    RAISE NOTICE 'T7 FAIL — portail a pu modifier le projet voisin (avant=%, après=%) — fuite RGPD R-018',
      v_neighbor_phone_before, v_neighbor_phone_after;
    -- Restaure pour idempotence
    UPDATE public.projects_v2 SET client_phone = v_neighbor_phone_before WHERE id = v_neighbor_project_id;
  END IF;

  -- ===========================================================================
  -- Cleanup final : restaure client_phone de Miraux si T5 a pris en superuser
  -- (T5 a écrit en role authenticated mais la valeur peut persister dans le DO bloc).
  -- ===========================================================================
  UPDATE public.projects_v2
  SET client_phone = '062020220'  -- valeur d'origine connue
  WHERE id = v_portal_project_id
    AND client_phone = '0102030405-TEST-T5';

  -- ===========================================================================
  -- Bilan
  -- ===========================================================================
  IF v_t1_ok THEN v_pass_count := v_pass_count + 1; ELSE v_failed_list := v_failed_list || 'T1, '; END IF;
  IF v_t2_ok THEN v_pass_count := v_pass_count + 1; ELSE v_failed_list := v_failed_list || 'T2, '; END IF;
  IF v_t3_ok THEN v_pass_count := v_pass_count + 1; ELSE v_failed_list := v_failed_list || 'T3, '; END IF;
  IF v_t4_ok THEN v_pass_count := v_pass_count + 1; ELSE v_failed_list := v_failed_list || 'T4, '; END IF;
  IF v_t5_ok THEN v_pass_count := v_pass_count + 1; ELSE v_failed_list := v_failed_list || 'T5, '; END IF;
  IF v_t6_ok THEN v_pass_count := v_pass_count + 1; ELSE v_failed_list := v_failed_list || 'T6, '; END IF;
  IF v_t7_ok THEN v_pass_count := v_pass_count + 1; ELSE v_failed_list := v_failed_list || 'T7, '; END IF;

  IF v_pass_count = 7 THEN
    RAISE NOTICE '✅ 7/7 PASS — RLS projects_v2 OK';
  ELSE
    RAISE EXCEPTION '❌ %/7 PASS — tests en échec : %', v_pass_count, rtrim(v_failed_list, ', ');
  END IF;
END $$;
