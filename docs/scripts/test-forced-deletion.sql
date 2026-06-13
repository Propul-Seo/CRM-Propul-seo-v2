-- Test de suppression forcée des colonnes CRM
-- Vérifie que les contacts sont bien déplacés avant suppression

-- 1. État initial des contacts par statut
SELECT 
    'État initial' as info,
    status,
    COUNT(*) as count
FROM contacts 
GROUP BY status 
ORDER BY count DESC;

-- 2. État initial des colonnes CRM
SELECT 
    'Colonnes CRM' as info,
    title,
    position,
    is_active
FROM crm_columns 
ORDER BY position;

-- 3. Simuler le déplacement des contacts d'une colonne
-- Remplacer 'SIGNES' par le statut de la colonne à supprimer
-- Exemple: 'signe', 'en_attente', 'offre_envoyee', etc.

-- Test de déplacement (simulation)
SELECT 
    'Test déplacement' as info,
    'signe' as source_status,
    COUNT(*) as contacts_to_move,
    'prospect' as destination_status
FROM contacts 
WHERE status = 'signe';

-- 4. Vérifier que la colonne "Prospects" peut recevoir des contacts
SELECT 
    'Destination Prospects' as info,
    'prospect' as status,
    COUNT(*) as current_count
FROM contacts 
WHERE status = 'prospect';

-- 5. Instructions pour tester la suppression forcée
SELECT 
    'INSTRUCTIONS' as info,
    '1. Ouvrir le CRM et cliquer sur l''icône ⚙️' as step1,
    '2. Essayer de supprimer une colonne avec des contacts' as step2,
    '3. Les contacts devraient être déplacés vers "Prospects"' as step3,
    '4. La colonne devrait être supprimée' as step4;
