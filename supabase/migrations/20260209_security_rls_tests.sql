-- ============================================================================
-- TESTS DE SECURITE RLS
-- À exécuter APRES la migration 20260209_security_rls_overhaul.sql
--
-- Ces tests vérifient que les policies sont bien étanches.
-- Exécuter via le SQL Editor de Supabase (service_role).
-- ============================================================================

-- ============================================================================
-- TEST 1: Vérifier que toutes les tables ont RLS activé
-- ============================================================================

SELECT
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅' ELSE '❌ DANGER' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- TEST 2: Vérifier qu'aucune policy n'utilise USING true
-- ============================================================================

SELECT
    tablename,
    policyname,
    cmd,
    qual::text as using_expr,
    '❌ USING true DETECTED' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text = 'true' OR with_check::text = 'true')
  -- Exclude e-commerce catalog tables (intentionally public)
  AND tablename NOT IN ('categories', 'products', 'product_availability', 'product_themes', 'themes', 'delivery_zones')
ORDER BY tablename;

-- ============================================================================
-- TEST 3: Vérifier qu'aucune policy ne cible le role 'anon' sur tables métier
-- ============================================================================

SELECT
    tablename,
    policyname,
    roles,
    '❌ ANON ACCESS' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND (roles::text LIKE '%anon%' OR roles::text LIKE '%public%')
  AND tablename NOT IN ('categories', 'products', 'product_availability', 'product_themes', 'themes', 'delivery_zones')
ORDER BY tablename;

-- ============================================================================
-- TEST 4: Vérifier que les fonctions dangereuses sont supprimées
-- ============================================================================

SELECT
    p.proname as function_name,
    CASE
        WHEN p.proname IN ('update_admin_password_direct', 'update_admin_password_via_api', 'call_admin_update_password_function')
        THEN '❌ SHOULD BE DROPPED'
        ELSE '✅'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%password%'
ORDER BY p.proname;

-- ============================================================================
-- TEST 5: Vérifier qu'aucune fonction n'est callable par anon
-- ============================================================================

SELECT
    p.proname,
    '❌ ANON CAN EXECUTE' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND has_function_privilege('anon', p.oid, 'EXECUTE') = true
ORDER BY p.proname;

-- ============================================================================
-- TEST 6: Vérifier les GRANTS anon sur les tables
-- ============================================================================

SELECT
    table_name,
    privilege_type,
    '❌ ANON HAS PRIVILEGE' as status
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee = 'anon'
  AND table_name NOT IN ('categories', 'products', 'product_availability', 'product_themes', 'themes', 'delivery_zones')
ORDER BY table_name, privilege_type;

-- ============================================================================
-- TEST 7: Vérifier les fonctions SECURITY DEFINER ont search_path
-- ============================================================================

SELECT
    p.proname,
    p.prosecdef as security_definer,
    CASE
        WHEN p.proconfig IS NULL THEN '❌ NO search_path SET'
        WHEN NOT (p.proconfig::text LIKE '%search_path%') THEN '❌ NO search_path SET'
        ELSE '✅'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;

-- ============================================================================
-- TEST 8: Simulation - User normal ne peut pas voir les contacts d'un autre
--
-- Pour tester manuellement:
-- 1. Se connecter comme user "theo" (sales)
-- 2. Essayer SELECT * FROM contacts WHERE user_id != auth.uid()
-- 3. Devrait retourner 0 rows (sauf si manager/admin)
-- ============================================================================

-- Compter le nombre de policies par table (devrait être 3-4 par table)
SELECT
    tablename,
    count(*) as policy_count,
    string_agg(cmd, ', ' ORDER BY cmd) as commands_covered
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- TEST 9: Vérifier la couverture des policies (chaque table doit avoir SELECT)
-- ============================================================================

WITH tables AS (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
),
policies AS (
    SELECT tablename, cmd FROM pg_policies WHERE schemaname = 'public'
)
SELECT
    t.tablename,
    CASE WHEN EXISTS (SELECT 1 FROM policies p WHERE p.tablename = t.tablename AND p.cmd = 'SELECT')
         THEN '✅' ELSE '❌ NO SELECT POLICY' END as has_select,
    CASE WHEN EXISTS (SELECT 1 FROM policies p WHERE p.tablename = t.tablename AND p.cmd IN ('INSERT', 'ALL'))
         THEN '✅' ELSE '⚠️ NO INSERT POLICY' END as has_insert
FROM tables t
ORDER BY t.tablename;
