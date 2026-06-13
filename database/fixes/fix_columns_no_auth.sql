-- =====================================================
-- SOLUTION SANS AUTHENTIFICATION
-- =====================================================

-- 1. D'abord, voir quels utilisateurs existent
SELECT id, email FROM auth.users LIMIT 5;

-- 2. Créer les colonnes pour TOUS les utilisateurs existants
INSERT INTO crm_bot_one_columns (user_id, column_name, column_type, column_order, is_required, is_default, default_value, options)
SELECT 
    u.id,
    column_name,
    column_type,
    column_order,
    is_required,
    true,
    default_value,
    options
FROM auth.users u
CROSS JOIN (VALUES 
    ('Nom', 'text', 1, true, '', NULL),
    ('Email', 'email', 2, true, '', NULL),
    ('Téléphone', 'text', 3, false, '', NULL),
    ('Statut', 'select', 4, true, 'nouveau', '{"options": ["nouveau", "en_cours", "terminé"]}'::jsonb)
) AS cols(column_name, column_type, column_order, is_required, default_value, options)
ON CONFLICT (user_id, column_name) DO NOTHING;

-- 3. Vérifier le résultat
SELECT 
    'Total colonnes créées' as info,
    COUNT(*) as count
FROM crm_bot_one_columns;

-- 4. Voir les colonnes par utilisateur
SELECT 
    u.email,
    COUNT(c.id) as colonnes_count
FROM auth.users u
LEFT JOIN crm_bot_one_columns c ON u.id = c.user_id
GROUP BY u.id, u.email
ORDER BY u.email;

-- 5. Créer un enregistrement de test pour le premier utilisateur
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
SELECT 
    id,
    '{"Nom": "Test CRM", "Email": "test@propulseo.com", "Téléphone": "0123456789", "Statut": "nouveau"}'::jsonb,
    'active',
    ARRAY['test']
FROM first_user;

-- 6. Vérifier l'enregistrement
SELECT 
    'Enregistrements créés' as info,
    COUNT(*) as count
FROM crm_bot_one_records;

-- 7. Test final
SELECT 
    'Test final' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_columns) > 0
        AND (SELECT COUNT(*) FROM crm_bot_one_records) > 0
        THEN '✅ SUCCÈS - Page CRM Bot One prête !'
        ELSE '❌ ÉCHEC'
    END as result;
