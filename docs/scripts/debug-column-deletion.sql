-- Déboguer le système de suppression des colonnes CRM

-- 1. État actuel des colonnes
SELECT 
    id,
    title,
    position,
    is_active,
    created_at
FROM crm_columns 
ORDER BY position;

-- 2. Vérifier s'il y a des contacts dans chaque statut
SELECT 
    'Contacts par statut' as info,
    'prospect' as status,
    COUNT(*) as count
FROM contacts 
WHERE status = 'prospect'

UNION ALL

SELECT 
    'Contacts par statut' as info,
    'presentation_envoyee' as status,
    COUNT(*) as count
FROM contacts 
WHERE status = 'presentation_envoyee'

UNION ALL

SELECT 
    'Contacts par statut' as info,
    'meeting_booke' as status,
    COUNT(*) as count
FROM contacts 
WHERE status = 'meeting_booke'

UNION ALL

SELECT 
    'Contacts par statut' as info,
    'offre_envoyee' as status,
    COUNT(*) as count
FROM contacts 
WHERE status = 'offre_envoyee'

UNION ALL

SELECT 
    'Contacts par statut' as info,
    'en_attente' as status,
    COUNT(*) as count
FROM contacts 
WHERE status = 'en_attente'

UNION ALL

SELECT 
    'Contacts par statut' as info,
    'signe' as status,
    COUNT(*) as count
FROM contacts 
WHERE status = 'signe';

-- 3. Tester la suppression d'une colonne (simulation)
-- Remplacer 'TITRE_COLONNE' par le titre exact de la colonne à supprimer
-- Exemple: 'Prospects' ou 'Présentation Envoyée'
SELECT 
    'Test suppression' as info,
    c.title as column_title,
    c.id as column_id,
    COUNT(cont.id) as contacts_using_status
FROM crm_columns c
LEFT JOIN contacts cont ON (
    CASE c.title
        WHEN 'Prospects' THEN cont.status = 'prospect'
        WHEN 'Présentation Envoyée' THEN cont.status = 'presentation_envoyee'
        WHEN 'Meeting Booké' THEN cont.status = 'meeting_booke'
        WHEN 'Offre Envoyée' THEN cont.status = 'offre_envoyee'
        WHEN 'En Attente' THEN cont.status = 'en_attente'
        WHEN 'Signés' THEN cont.status = 'signe'
        ELSE false
    END
)
WHERE c.is_active = true
GROUP BY c.id, c.title
ORDER BY c.position;
