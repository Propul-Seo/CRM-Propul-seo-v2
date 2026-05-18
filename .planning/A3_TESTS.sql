-- ============================================================================
-- Sprint A.3 — Tests d'isolation et garde-fous sécurité (rejouable)
-- ============================================================================
-- Usage : exécuter ce script via MCP execute_sql ou psql sur le project
-- ERP (tbuqctfgjjxnevmsvucl). Il vérifie l'état des policies, GRANTs, RPC
-- et tente quelques opérations en mode anon pour valider qu'elles échouent.
--
-- Le script utilise BEGIN ... ROLLBACK pour annuler tous les SET et tests.
-- Aucune écriture en prod.
--
-- À rejouer :
--   - Après chaque migration touchant la sécurité (policies, GRANTs, RLS).
--   - Avant chaque sprint produit qui manipulera des données portail.
-- ============================================================================

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- Section 1 — Assertions structurelles
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_count INT;
BEGIN
  -- R-011 : qualification_leads n'a plus qu'une seule policy (admin)
  SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'propulspace' AND tablename = 'qualification_leads';
  ASSERT v_count = 1,
    format('R-011 : qualification_leads doit avoir 1 policy (admin), trouvé : %s', v_count);

  -- R-013 : 0 grant anon sur les 13 tables/vues sensibles
  SELECT COUNT(*) INTO v_count
    FROM information_schema.role_table_grants
    WHERE grantee = 'anon'
      AND (
        (table_schema = 'propulspace' AND table_name IN (
          'documents','invoices','invoice_installments','project_steps',
          'qualification_leads','signatures'))
        OR (table_schema = 'public' AND table_name IN (
          'projects_v2',
          'propulspace_documents_v2','propulspace_invoices_v2',
          'propulspace_invoice_installments_v2','propulspace_project_steps_v2',
          'propulspace_signatures_v2','qualification_leads_v2'))
      );
  ASSERT v_count = 0,
    format('R-013 : grants anon résiduels sur tables/vues sensibles, trouvé : %s', v_count);

  -- R-012 : vues client ont les nombres de colonnes attendus (whitelist explicite)
  SELECT COUNT(*) INTO v_count FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'propulspace_invoices_v2';
  ASSERT v_count = 19,
    format('R-012 : propulspace_invoices_v2 doit avoir 19 cols, trouvé : %s', v_count);

  SELECT COUNT(*) INTO v_count FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'propulspace_invoice_installments_v2';
  ASSERT v_count = 9,
    format('R-012 : propulspace_invoice_installments_v2 doit avoir 9 cols, trouvé : %s', v_count);

  SELECT COUNT(*) INTO v_count FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'propulspace_documents_v2';
  ASSERT v_count = 14,
    format('R-012 : propulspace_documents_v2 doit avoir 14 cols, trouvé : %s', v_count);

  SELECT COUNT(*) INTO v_count FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'propulspace_signatures_v2';
  ASSERT v_count = 12,
    format('R-012 : propulspace_signatures_v2 doit avoir 12 cols, trouvé : %s', v_count);

  SELECT COUNT(*) INTO v_count FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'propulspace_project_steps_v2';
  ASSERT v_count = 10,
    format('R-012 : propulspace_project_steps_v2 doit avoir 10 cols, trouvé : %s', v_count);

  -- A.3.1 : les 3 RPC qualif_*_draft sont GRANT EXECUTE à anon
  SELECT COUNT(*) INTO v_count
    FROM information_schema.routine_privileges
    WHERE grantee = 'anon'
      AND routine_schema = 'public'
      AND routine_name IN ('qualif_create_draft','qualif_get_draft','qualif_update_draft');
  ASSERT v_count = 3,
    format('A.3.1 : public.qualif_*_draft doivent avoir 3 GRANT EXECUTE anon, trouvé : %s', v_count);

  -- R-008 : policy storage client_read filtre par préfixe project_id
  SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'ps_docs_storage_client_read'
      AND qual LIKE '%name%~~%portal_project_id%';
  ASSERT v_count = 1,
    format('R-008 : policy storage doit filtrer par name LIKE portal_project_id/, trouvé : %s', v_count);

  -- Colonne draft_session_token NOT NULL + index unique
  ASSERT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='qualification_leads'
      AND column_name='draft_session_token' AND is_nullable='NO'),
    'A.3.1 : colonne draft_session_token doit être NOT NULL';
  ASSERT EXISTS (SELECT 1 FROM pg_indexes
    WHERE schemaname='propulspace' AND indexname='idx_qualif_draft_token'),
    'A.3.1 : index unique idx_qualif_draft_token manquant';

  RAISE NOTICE '✅ Section 1 — Assertions structurelles : OK (8/8)';
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- Section 2 — Tests runtime en mode anon
-- ───────────────────────────────────────────────────────────────────────────
-- Bascule sur le rôle anon et tente des opérations qui doivent toutes
-- échouer (insufficient_privilege) ou retourner 0 row.

DO $$
DECLARE
  v_count INT;
  v_caught BOOLEAN;
BEGIN
  SET LOCAL ROLE anon;

  -- anon SELECT direct sur qualification_leads : doit échouer
  v_caught := FALSE;
  BEGIN
    EXECUTE 'SELECT count(*) FROM propulspace.qualification_leads' INTO v_count;
  EXCEPTION WHEN insufficient_privilege THEN
    v_caught := TRUE;
  END;
  ASSERT v_caught, 'R-011 : anon a pu SELECT propulspace.qualification_leads (devrait échouer)';

  -- anon SELECT sur la vue v2 : doit échouer
  v_caught := FALSE;
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.qualification_leads_v2' INTO v_count;
  EXCEPTION WHEN insufficient_privilege THEN
    v_caught := TRUE;
  END;
  ASSERT v_caught, 'R-013 : anon a pu SELECT public.qualification_leads_v2 (devrait échouer)';

  -- anon SELECT propulspace_invoices_v2 : doit échouer
  v_caught := FALSE;
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.propulspace_invoices_v2' INTO v_count;
  EXCEPTION WHEN insufficient_privilege THEN
    v_caught := TRUE;
  END;
  ASSERT v_caught, 'R-013 : anon a pu SELECT propulspace_invoices_v2 (devrait échouer)';

  -- anon SELECT projects_v2 : doit échouer
  v_caught := FALSE;
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.projects_v2' INTO v_count;
  EXCEPTION WHEN insufficient_privilege THEN
    v_caught := TRUE;
  END;
  ASSERT v_caught, 'R-013 : anon a pu SELECT projects_v2 (devrait échouer)';

  -- anon DELETE projects_v2 : doit échouer
  v_caught := FALSE;
  BEGIN
    EXECUTE 'DELETE FROM public.projects_v2 WHERE FALSE';
  EXCEPTION WHEN insufficient_privilege THEN
    v_caught := TRUE;
  END;
  ASSERT v_caught, 'R-013 : anon a pu DELETE projects_v2 (devrait échouer)';

  -- anon peut quand même appeler les RPC qualif (autorisation OK, retour vide)
  v_caught := FALSE;
  BEGIN
    PERFORM public.qualif_get_draft(gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN
    v_caught := TRUE;
  END;
  ASSERT NOT v_caught, 'A.3.1 : anon doit pouvoir appeler public.qualif_get_draft';

  RESET ROLE;
  RAISE NOTICE '✅ Section 2 — Tests runtime anon : OK (6/6)';
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- Section 3 — RPC qualif : whitelist colonnes (smoke réduit)
-- ───────────────────────────────────────────────────────────────────────────
-- On vérifie qu'un anon ne peut PAS forcer une colonne admin via le payload.

DO $$
DECLARE
  v_lead UUID;
  v_token UUID;
  v_quality_score INT;
  v_pappers JSONB;
BEGIN
  -- Création depuis le rôle postgres (le DO bloc s'exécute en superuser)
  SELECT lead_id, session_token INTO v_lead, v_token
    FROM public.qualif_create_draft('test_a3_5');

  -- Tente d'injecter quality_score (admin only) via payload : doit être ignoré
  PERFORM public.qualif_update_draft(v_token, jsonb_build_object(
    'full_name', 'Audit Test',
    'email', 'a35@test.local',
    'phone', '0600000000',
    'business_sector', 'autre',
    'quality_score', 999,                 -- admin only, doit être ignoré
    'pappers_enrichment', '{"injected": true}'::jsonb,  -- admin only, ignoré
    'ip_address', '1.2.3.4'               -- admin only, ignoré
  ));

  SELECT quality_score, pappers_enrichment
    INTO v_quality_score, v_pappers
    FROM propulspace.qualification_leads
    WHERE id = v_lead;

  ASSERT v_quality_score = 0,
    format('A.3.1 whitelist : quality_score injecté (=%s), devrait rester 0', v_quality_score);
  ASSERT v_pappers IS NULL,
    'A.3.1 whitelist : pappers_enrichment injecté, devrait rester NULL';

  RAISE NOTICE '✅ Section 3 — Whitelist RPC qualif : OK (2/2)';
END $$;

-- Tout est rollback : aucune trace persistée
ROLLBACK;
