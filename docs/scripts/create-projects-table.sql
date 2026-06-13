-- =====================================================
-- CRÉATION TABLE PROJECTS SI ELLE N'EXISTE PAS
-- =====================================================

-- ÉTAPE 1: Vérifier si la table projects existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    -- Créer la table projects
    CREATE TABLE projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'on_hold', 'cancelled'
      client_id UUID, -- Référence optionnelle à une table clients
      budget DECIMAL(15,2),
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Créer les index
    CREATE INDEX idx_projects_name ON projects(name);
    CREATE INDEX idx_projects_status ON projects(status);
    CREATE INDEX idx_projects_client_id ON projects(client_id);
    CREATE INDEX idx_projects_start_date ON projects(start_date);

    RAISE NOTICE 'Table projects créée avec succès';
  ELSE
    RAISE NOTICE 'Table projects existe déjà';
  END IF;
END $$;

-- ÉTAPE 2: Activer RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 3: Créer les politiques RLS
DO $$
BEGIN
  -- Supprimer les anciennes politiques si elles existent
  DROP POLICY IF EXISTS "Users can view all projects" ON projects;
  DROP POLICY IF EXISTS "Users can insert projects" ON projects;
  DROP POLICY IF EXISTS "Users can update projects" ON projects;
  DROP POLICY IF EXISTS "Users can delete projects" ON projects;

  -- Politique : tous les utilisateurs authentifiés peuvent voir tous les projets
  CREATE POLICY "Users can view all projects" ON projects
    FOR SELECT USING (auth.uid() IS NOT NULL);

  -- Politique : utilisateurs authentifiés peuvent créer des projets
  CREATE POLICY "Users can insert projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

  -- Politique : utilisateurs authentifiés peuvent modifier des projets
  CREATE POLICY "Users can update projects" ON projects
    FOR UPDATE USING (auth.uid() IS NOT NULL);

  -- Politique : utilisateurs authentifiés peuvent supprimer des projets
  CREATE POLICY "Users can delete projects" ON projects
    FOR DELETE USING (auth.uid() IS NOT NULL);

  RAISE NOTICE 'Politiques RLS créées avec succès';
END $$;

-- ÉTAPE 4: Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at_trigger ON projects;
CREATE TRIGGER projects_updated_at_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- ÉTAPE 5: Insérer quelques projets d'exemple
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects LIMIT 1) THEN
    INSERT INTO projects (name, description, status, budget, start_date) VALUES
      ('Site Web E-commerce', 'Développement d''un site e-commerce complet', 'active', 15000.00, NOW() - INTERVAL '30 days'),
      ('Application Mobile', 'Application mobile pour gestion des tâches', 'active', 8000.00, NOW() - INTERVAL '15 days'),
      ('Refonte Logo', 'Refonte de l''identité visuelle', 'completed', 2000.00, NOW() - INTERVAL '60 days'),
      ('Formation Équipe', 'Formation sur les nouvelles technologies', 'on_hold', 5000.00, NOW() + INTERVAL '30 days');
    
    RAISE NOTICE 'Projets d''exemple insérés';
  ELSE
    RAISE NOTICE 'Projets existants détectés, pas d''insertion d''exemples';
  END IF;
END $$;

-- ÉTAPE 6: Vérification finale
SELECT 'VÉRIFICATION FINALE' as info;

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'projects';

SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'projects';

SELECT 'TABLE PROJECTS PRÊTE À UTILISER !' as status;
