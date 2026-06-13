-- Script de diagnostic pour user_profiles
-- À exécuter dans l'éditeur SQL de Supabase

-- Voir la structure exacte de la table
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

-- Voir les contraintes
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles';

-- Voir comment l'authentification est liée
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name LIKE '%auth%' OR table_name LIKE '%user%'
ORDER BY table_name, ordinal_position;
