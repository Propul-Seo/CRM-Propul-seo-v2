-- =====================================================
-- CRM BOT ONE - LAYOUT SIMPLE FIXED
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
    ('Nom de l''entreprise', 'text', 1, true, '', NULL),
    ('Nom contact', 'text', 2, true, '', NULL),
    ('Email', 'email', 3, true, '', NULL),
    ('Téléphone', 'text', 4, false, '', NULL),
    ('Site web', 'url', 5, false, '', NULL),
    ('Type de contact', 'select', 6, true, 'entreprise', '{"options": ["particulier", "entreprise", "agence digital", "autre"]}'::jsonb),
    ('Statut', 'select', 7, true, 'prospect', '{"options": ["prospect", "en discussion", "Demo planifié", "abonné", "perdu"]}'::jsonb)
) AS cols(column_name, column_type, column_order, is_required, default_value, options)
ON CONFLICT (user_id, column_name) DO NOTHING;

-- 3. Créer quelques leads de test
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
SELECT 
    id,
    '{
        "Nom de l''entreprise": "PropulSEO",
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

-- 4. Créer un lead en discussion
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
SELECT 
    id,
    '{
        "Nom de l''entreprise": "Digital Agency Pro",
        "Nom contact": "Marie Martin",
        "Email": "marie@digitalagency.com",
        "Téléphone": "0987654321",
        "Site web": "https://digitalagency.com",
        "Type de contact": "agence digital",
        "Statut": "en discussion"
    }'::jsonb,
    'en discussion',
    ARRAY['hot', 'agence']
FROM first_user;

-- 5. Créer un lead avec demo planifié
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
SELECT 
    id,
    '{
        "Nom de l''entreprise": "Restaurant Le Bon Goût",
        "Nom contact": "Pierre Durand",
        "Email": "pierre@restaurant.com",
        "Téléphone": "0555123456",
        "Site web": "https://restaurant-bongout.com",
        "Type de contact": "entreprise",
        "Statut": "Demo planifié"
    }'::jsonb,
    'Demo planifié',
    ARRAY['demo', 'restaurant']
FROM first_user;

-- 6. Vérifier le résultat
SELECT 
    'CRM Bot One configuré' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_columns) >= 7
        AND (SELECT COUNT(*) FROM crm_bot_one_records) >= 3
        THEN '✅ SUCCÈS - Layout simple prêt !'
        ELSE '❌ ÉCHEC'
    END as result;

-- 7. Afficher les leads créés
SELECT 
    data->>'Nom de l''entreprise' as entreprise,
    data->>'Nom contact' as contact,
    data->>'Statut' as statut,
    data->>'Type de contact' as type_contact
FROM crm_bot_one_records
ORDER BY created_at DESC;
