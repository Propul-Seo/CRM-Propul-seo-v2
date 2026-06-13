-- =====================================================
-- AUDIT RLS (Row Level Security) - CRM PROPUL'SEO
-- =====================================================
-- Executer ce script dans Supabase SQL Editor pour auditer
-- la securite des tables
-- =====================================================

-- 1. LISTER TOUTES LES TABLES SANS RLS
-- =====================================================
SELECT
    schemaname,
    tablename,
    'DANGER: Pas de RLS active' as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
    SELECT DISTINCT tablename::text
    FROM pg_policies
    WHERE schemaname = 'public'
)
ORDER BY tablename;

-- 2. LISTER LES TABLES AVEC RLS DESACTIVE
-- =====================================================
SELECT
    schemaname,
    tablename,
    rowsecurity,
    CASE
        WHEN rowsecurity = false THEN 'DANGER: RLS desactive'
        ELSE 'OK: RLS active'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;

-- 3. LISTER TOUTES LES POLITIQUES EXISTANTES
-- =====================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. VERIFIER LES TABLES SENSIBLES
-- =====================================================
SELECT
    tablename,
    CASE
        WHEN tablename IN ('users', 'user_profiles', 'contacts', 'activities', 'projects', 'messages', 'transactions')
        THEN 'TABLE SENSIBLE - Verifier les politiques RLS'
        ELSE 'Standard'
    END as sensitivity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY sensitivity DESC, tablename;

-- 5. COMPTER LES POLITIQUES PAR TABLE
-- =====================================================
SELECT
    tablename,
    COUNT(*) as policy_count,
    CASE
        WHEN COUNT(*) = 0 THEN 'DANGER: Aucune politique'
        WHEN COUNT(*) < 4 THEN 'ATTENTION: Politiques incompletes (CRUD)'
        ELSE 'OK'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename::text = p.tablename::text
WHERE t.schemaname = 'public'
GROUP BY t.tablename
ORDER BY policy_count, tablename;
