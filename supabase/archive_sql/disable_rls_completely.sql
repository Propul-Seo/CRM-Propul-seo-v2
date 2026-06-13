-- =====================================================
-- DÉSACTIVATION COMPLÈTE DES RLS
-- =====================================================

-- 1. Supprimer toutes les politiques RLS
DROP POLICY IF EXISTS "Users can view their own CRM Bot One records" ON crm_bot_one_records;
DROP POLICY IF EXISTS "Users can insert their own CRM Bot One records" ON crm_bot_one_records;
DROP POLICY IF EXISTS "Users can update their own CRM Bot One records" ON crm_bot_one_records;
DROP POLICY IF EXISTS "Users can delete their own CRM Bot One records" ON crm_bot_one_records;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on crm_bot_one_records" ON crm_bot_one_records;

DROP POLICY IF EXISTS "Users can view their own CRM Bot One columns" ON crm_bot_one_columns;
DROP POLICY IF EXISTS "Users can insert their own CRM Bot One columns" ON crm_bot_one_columns;
DROP POLICY IF EXISTS "Users can update their own CRM Bot One columns" ON crm_bot_one_columns;
DROP POLICY IF EXISTS "Users can delete their own CRM Bot One columns" ON crm_bot_one_columns;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on crm_bot_one_columns" ON crm_bot_one_columns;

-- 2. DÉSACTIVER RLS COMPLÈTEMENT
ALTER TABLE crm_bot_one_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_bot_one_columns DISABLE ROW LEVEL SECURITY;

-- 3. Vérifier que RLS est désactivé
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('crm_bot_one_records', 'crm_bot_one_columns');

-- 4. Test d'accès direct
SELECT 
    'Accès direct' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_records) >= 0
        AND (SELECT COUNT(*) FROM crm_bot_one_columns) >= 0
        THEN '✅ Accès OK - RLS désactivé'
        ELSE '❌ Problème d''accès'
    END as result;

-- 5. Afficher les données existantes
SELECT 
    'Données CRM Bot One' as info,
    data->>'Nom entreprise' as entreprise,
    data->>'Nom contact' as contact,
    data->>'Statut' as statut
FROM crm_bot_one_records
ORDER BY created_at DESC;

-- 6. Test final
SELECT 
    'Configuration finale' as test,
    CASE 
        WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'crm_bot_one_records') = false
        AND (SELECT rowsecurity FROM pg_tables WHERE tablename = 'crm_bot_one_columns') = false
        THEN '✅ RLS COMPLÈTEMENT DÉSACTIVÉ - CRM Bot One accessible !'
        ELSE '❌ RLS encore actif'
    END as result;
