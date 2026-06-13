-- =====================================================
-- CORRECTION DES POLITIQUES RLS
-- =====================================================

-- 1. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view their own CRM Bot One records" ON crm_bot_one_records;
DROP POLICY IF EXISTS "Users can insert their own CRM Bot One records" ON crm_bot_one_records;
DROP POLICY IF EXISTS "Users can update their own CRM Bot One records" ON crm_bot_one_records;
DROP POLICY IF EXISTS "Users can delete their own CRM Bot One records" ON crm_bot_one_records;

DROP POLICY IF EXISTS "Users can view their own CRM Bot One columns" ON crm_bot_one_columns;
DROP POLICY IF EXISTS "Users can insert their own CRM Bot One columns" ON crm_bot_one_columns;
DROP POLICY IF EXISTS "Users can update their own CRM Bot One columns" ON crm_bot_one_columns;
DROP POLICY IF EXISTS "Users can delete their own CRM Bot One columns" ON crm_bot_one_columns;

-- 2. Créer des politiques RLS plus permissives pour le développement
CREATE POLICY "Allow all operations for authenticated users on crm_bot_one_records" 
    ON crm_bot_one_records 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on crm_bot_one_columns" 
    ON crm_bot_one_columns 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3. Vérifier que RLS est activé
ALTER TABLE crm_bot_one_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_bot_one_columns ENABLE ROW LEVEL SECURITY;

-- 4. Vérifier les nouvelles politiques
SELECT 
    'Nouvelles politiques' as info,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('crm_bot_one_records', 'crm_bot_one_columns')
ORDER BY tablename, policyname;

-- 5. Test d'insertion avec les nouvelles politiques
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
VALUES (
    auth.uid(),
    '{"Nom entreprise": "Test RLS", "Nom contact": "Test User", "Email": "test@rls.com", "Statut": "prospect"}'::jsonb,
    'prospect',
    ARRAY['test', 'rls']
);

-- 6. Vérifier l'insertion
SELECT 
    'Test RLS' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM crm_bot_one_records WHERE data->>'Nom entreprise' = 'Test RLS')
        THEN '✅ Politiques RLS OK'
        ELSE '❌ Problème RLS'
    END as result;

-- 7. Nettoyer le test
DELETE FROM crm_bot_one_records WHERE data->>'Nom entreprise' = 'Test RLS';

-- 8. Test final
SELECT 
    'Configuration finale' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'crm_bot_one_records') >= 1
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'crm_bot_one_columns') >= 1
        THEN '✅ Politiques RLS configurées'
        ELSE '❌ Échec configuration'
    END as result;