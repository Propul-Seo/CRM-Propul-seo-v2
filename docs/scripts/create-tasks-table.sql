-- =====================================================
-- CRÉATION TABLE TASKS SI ELLE N'EXISTE PAS
-- =====================================================

-- ÉTAPE 1: Vérifier si la table existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    -- Créer la table tasks
    CREATE TABLE tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Informations de base
      title VARCHAR(255) NOT NULL,
      description TEXT,
      
      -- Gestion
      priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
      status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
      
      -- Assignation
      assigned_to UUID REFERENCES auth.users(id),
      project_id UUID, -- Référence optionnelle à une table projets
      
      -- Dates
      due_date TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      
      -- Métadonnées
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Créer les index pour les performances
    CREATE INDEX idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
    CREATE INDEX idx_tasks_status ON tasks(status);
    CREATE INDEX idx_tasks_priority ON tasks(priority);
    CREATE INDEX idx_tasks_due_date ON tasks(due_date);

    RAISE NOTICE 'Table tasks créée avec succès';
  ELSE
    RAISE NOTICE 'Table tasks existe déjà';
  END IF;
END $$;

-- ÉTAPE 2: Activer RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 3: Créer les politiques RLS
DO $$
BEGIN
  -- Supprimer les anciennes politiques si elles existent
  DROP POLICY IF EXISTS "Users can view own and assigned tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can update own and assigned tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

  -- Politique : utilisateur voit ses tâches et celles qui lui sont assignées
  CREATE POLICY "Users can view own and assigned tasks" ON tasks
    FOR SELECT USING (
      auth.uid() = user_id OR 
      auth.uid() = assigned_to
    );

  -- Politique : utilisateur peut créer ses propres tâches
  CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- Politique : utilisateur peut modifier ses tâches et celles qui lui sont assignées
  CREATE POLICY "Users can update own and assigned tasks" ON tasks
    FOR UPDATE USING (
      auth.uid() = user_id OR 
      auth.uid() = assigned_to
    );

  -- Politique : utilisateur peut supprimer ses propres tâches
  CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

  RAISE NOTICE 'Politiques RLS créées avec succès';
END $$;

-- ÉTAPE 4: Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at_trigger ON tasks;
CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- ÉTAPE 5: Vérification finale
SELECT 'VÉRIFICATION FINALE' as info;

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'tasks';

SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'tasks';

SELECT 'TABLE TASKS PRÊTE À UTILISER !' as status;
