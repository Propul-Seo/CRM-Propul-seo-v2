-- =====================================================
-- CRM BOT ONE - LAYOUT SIMPLE AVEC COLONNES FIXES
-- =====================================================

-- 1. Supprimer les anciennes colonnes
DELETE FROM crm_bot_one_columns;

-- 2. Créer les colonnes fixes pour tous les utilisateurs
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
    ('Nom de l\'entreprise', 'text', 1, true, '', NULL),
    ('Nom contact', 'text', 2, true, '', NULL),
    ('Email', 'email', 3, true, '', NULL),
    ('Téléphone', 'text', 4, false, '', NULL),
    ('Site web', 'url', 5, false, '', NULL),
    ('Type de contact', 'select', 6, true, 'entreprise', '{"options": ["particulier", "entreprise", "agence digital", "autre"]}'::jsonb),
    ('Statut', 'select', 7, true, 'prospect', '{"options": ["prospect", "en discussion", "Demo planifié", "abonné", "perdu"]}'::jsonb)
) AS cols(column_name, column_type, column_order, is_required, default_value, options)
ON CONFLICT (user_id, column_name) DO NOTHING;

-- 3. Vérifier les colonnes créées
SELECT 
    'Colonnes CRM Bot One créées' as info,
    COUNT(*) as count
FROM crm_bot_one_columns;

-- 4. Afficher la structure
SELECT 
    column_name,
    column_type,
    column_order,
    is_required,
    options
FROM crm_bot_one_columns 
WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
ORDER BY column_order;

-- 5. Créer quelques leads de test
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
SELECT 
    id,
    '{
        "Nom de l\'entreprise": "PropulSEO",
        "Nom contact": "Jean Dupont",
        "Email": "jean@propulseo.com",
        "Téléphone": "0123456789",
        "Site web": "https://propulseo.com",
        "Type de contact": "entreprise",
        "Statut": "prospect"
    }'::jsonb,
    'prospect',
    ARRAY['test', 'demo']
FROM first_user;

-- 6. Vérifier les leads créés
SELECT 
    'Leads de test créés' as info,
    COUNT(*) as count
FROM crm_bot_one_records;

-- 7. Test final
SELECT 
    'CRM Bot One prêt' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_columns) >= 7
        AND (SELECT COUNT(*) FROM crm_bot_one_records) >= 1
        THEN '✅ SUCCÈS - CRM Bot One avec layout simple prêt !'
        ELSE '❌ ÉCHEC'
    END as result;
