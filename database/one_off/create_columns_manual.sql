-- =====================================================
-- CRÉATION MANUELLE DES COLONNES CRM BOT ONE
-- =====================================================
-- À exécuter dans le SQL Editor de Supabase

-- 1. D'abord, identifier un utilisateur existant
WITH user_info AS (
    SELECT id, email FROM auth.users LIMIT 1
)
SELECT 
    'Utilisateur sélectionné' as info,
    id,
    email
FROM user_info;

-- 2. Créer les colonnes pour le premier utilisateur trouvé
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_columns (
    user_id, 
    column_name, 
    column_type, 
    column_order, 
    is_required, 
    is_default, 
    default_value,
    options
)
SELECT 
    id,
    column_name,
    column_type,
    column_order,
    is_required,
    true as is_default,
    default_value,
    options
FROM first_user
CROSS JOIN (VALUES 
    ('Nom', 'text', 1, true, '', NULL),
    ('Email', 'email', 2, true, '', NULL),
    ('Téléphone', 'text', 3, false, '', NULL),
    ('Statut', 'select', 4, true, 'nouveau', '{"options": ["nouveau", "en_cours", "terminé", "annulé"]}'::jsonb)
) AS default_columns(column_name, column_type, column_order, is_required, default_value, options);

-- 3. Vérifier que les colonnes ont été créées
SELECT 
    'Colonnes créées' as test,
    COUNT(*) as count
FROM crm_bot_one_columns;

-- 4. Afficher les colonnes créées
SELECT 
    user_id,
    column_name,
    column_type,
    column_order,
    is_required,
    is_default,
    default_value,
    options
FROM crm_bot_one_columns
ORDER BY column_order;

-- 5. Créer un enregistrement de test
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (
    user_id,
    data,
    status,
    tags
)
SELECT 
    id,
    '{
        "Nom": "Test CRM Bot One",
        "Email": "test@propulseo.com",
        "Téléphone": "0123456789",
        "Statut": "nouveau"
    }'::jsonb,
    'active',
    ARRAY['test', 'demo', 'crm-bot-one']
FROM first_user;

-- 6. Vérifier l'enregistrement créé
SELECT 
    'Enregistrements créés' as test,
    COUNT(*) as count
FROM crm_bot_one_records;

-- 7. Afficher l'enregistrement de test
SELECT 
    id,
    user_id,
    data,
    status,
    tags,
    created_at
FROM crm_bot_one_records
ORDER BY created_at DESC
LIMIT 1;

-- 8. Test final complet
SELECT 
    'Test final' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_columns) >= 4
        AND (SELECT COUNT(*) FROM crm_bot_one_records) >= 1
        THEN '✅ TOUT FONCTIONNE'
        ELSE '❌ PROBLÈME PERSISTANT'
    END as result;
