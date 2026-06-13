-- ============================================================
-- Migration 001 : Créer le schéma v2 + extensions
-- ============================================================

-- 1. Créer le schéma dédié v2
CREATE SCHEMA IF NOT EXISTS v2;

-- 2. Activer pgcrypto pour le chiffrement des accès
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Permissions : donner accès au schéma v2 aux rôles Supabase
GRANT USAGE ON SCHEMA v2 TO anon, authenticated, service_role;

-- Tables futures : authenticated et service_role ont tous les droits,
-- anon a uniquement SELECT (filtré par RLS)
ALTER DEFAULT PRIVILEGES IN SCHEMA v2
  GRANT ALL ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA v2
  GRANT SELECT ON TABLES TO anon;

-- Séquences (pour les colonnes auto-incrémentées si nécessaire)
ALTER DEFAULT PRIVILEGES IN SCHEMA v2
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;

-- Fonctions
ALTER DEFAULT PRIVILEGES IN SCHEMA v2
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;

-- 4. Exposer le schéma v2 via PostgREST (API REST Supabase)
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, v2';
NOTIFY pgrst, 'reload config';
