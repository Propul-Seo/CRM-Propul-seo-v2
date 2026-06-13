-- Vérifier si la table existe déjà et la supprimer si nécessaire
DROP TABLE IF EXISTS google_tokens;

-- Créer la table google_tokens avec la structure demandée
CREATE TABLE google_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer Row Level Security
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour que les utilisateurs authentifiés puissent accéder aux tokens
CREATE POLICY "Users can access Google tokens"
ON google_tokens
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);