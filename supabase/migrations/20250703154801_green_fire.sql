/*
  # Mise à jour de la table google_tokens
  
  1. Modifications
     - Mise à jour de la structure de la table google_tokens
     - Ajout des contraintes et index nécessaires
     - Configuration des permissions RLS
  
  2. Structure
     - id (uuid, primary key, default uuid_generate_v4())
     - user_id (uuid, not null, référence à users)
     - access_token (text, not null)
     - refresh_token (text, not null)
     - expiry_date (timestamp with time zone, not null)
     - created_at (timestamp with time zone, default now())
     - updated_at (timestamp with time zone, default now())
*/

-- Vérifier si la table existe déjà et la supprimer si nécessaire
DROP TABLE IF EXISTS google_tokens;

-- Créer la table google_tokens avec la structure demandée
CREATE TABLE google_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Créer un index pour optimiser les recherches par user_id
CREATE INDEX idx_google_tokens_user_id ON google_tokens(user_id);

-- Activer Row Level Security
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour que les utilisateurs ne puissent gérer que leurs propres tokens
CREATE POLICY "Users can manage their own Google tokens"
ON google_tokens
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Créer un trigger pour mettre à jour automatiquement le champ updated_at
CREATE TRIGGER update_google_tokens_updated_at
BEFORE UPDATE ON google_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();