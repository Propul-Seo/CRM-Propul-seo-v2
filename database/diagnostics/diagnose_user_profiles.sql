-- Script de diagnostic pour la table user_profiles
-- À exécuter dans l'éditeur SQL de Supabase

-- Voir la structure de la table user_profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Voir quelques exemples de données
SELECT * FROM user_profiles LIMIT 3;

-- Voir les contraintes de la table
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles';

-- Voir les index
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles';
