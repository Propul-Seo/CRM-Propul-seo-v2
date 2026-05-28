-- R-016 : restreindre les uploads anon/authenticated sur le bucket propulspace-uploads
-- à un set de prefixes contrôlés (évite pollution / écrasement de fichiers d'autres leads).
-- Prefixes autorisés : qualification/ (front qualif), documents/ (assets brief, factures),
-- signatures/ (DocuSeal). Si un nouveau prefix est nécessaire, ajouter ici.
DROP POLICY IF EXISTS ps_uploads_public_insert ON storage.objects;
CREATE POLICY ps_uploads_public_insert ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'propulspace-uploads'
    AND (
      name LIKE 'qualification/%'
      OR name LIKE 'documents/%'
      OR name LIKE 'signatures/%'
    )
  );
