/*
  # Création du bucket de stockage "devis"
  
  1. Nouveau bucket
    - Nom: devis
    - Accès: privé (sécurisé)
    - Usage: stockage des devis clients
  
  2. Sécurité
    - RLS activé
    - Politiques d'accès sécurisées
*/

-- Création du bucket de stockage "devis" (privé)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'devis',
  'devis',
  FALSE, -- bucket privé
  FALSE,
  52428800, -- 50MB limite
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs authentifiés de télécharger des fichiers
CREATE POLICY "Utilisateurs authentifiés peuvent télécharger des devis" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'devis' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour permettre aux utilisateurs de lire leurs propres fichiers
CREATE POLICY "Utilisateurs peuvent lire leurs propres devis" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'devis' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres fichiers
CREATE POLICY "Utilisateurs peuvent mettre à jour leurs propres devis" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'devis' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "Utilisateurs peuvent supprimer leurs propres devis" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'devis' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour permettre aux administrateurs d'accéder à tous les fichiers
CREATE POLICY "Administrateurs peuvent accéder à tous les devis" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'devis' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid() AND users.role = 'admin'
    )
  );