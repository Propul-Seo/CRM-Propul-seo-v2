-- Test simple des réactions
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier que la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'message_reactions'
) as table_exists;

-- 2. Voir la structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'message_reactions';

-- 3. Voir les politiques RLS
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'message_reactions';

-- 4. Tester une insertion manuelle (remplacez les UUIDs par de vrais IDs)
-- SELECT gen_random_uuid() as message_id_example;
-- SELECT gen_random_uuid() as user_id_example;
