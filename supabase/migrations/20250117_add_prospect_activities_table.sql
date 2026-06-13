-- Créer la table prospect_activities pour stocker les activités des prospects CRM
CREATE TABLE IF NOT EXISTS public.prospect_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL, -- Référence au prospect (peut être lead_id ou client_id)
  title VARCHAR(255) NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ NOT NULL,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('call', 'meeting', 'email', 'follow_up', 'demo', 'proposal', 'other')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  assigned_to UUID, -- Référence à l'utilisateur assigné
  created_by UUID NOT NULL, -- Référence à l'utilisateur créateur
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS prospect_activities_prospect_id_idx ON public.prospect_activities (prospect_id);
CREATE INDEX IF NOT EXISTS prospect_activities_activity_date_idx ON public.prospect_activities (activity_date);
CREATE INDEX IF NOT EXISTS prospect_activities_status_idx ON public.prospect_activities (status);
CREATE INDEX IF NOT EXISTS prospect_activities_type_idx ON public.prospect_activities (activity_type);
CREATE INDEX IF NOT EXISTS prospect_activities_assigned_to_idx ON public.prospect_activities (assigned_to);

-- Activer RLS (Row Level Security)
ALTER TABLE public.prospect_activities ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can view prospect activities" ON public.prospect_activities
  FOR SELECT USING (true);

CREATE POLICY "Users can insert prospect activities" ON public.prospect_activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update prospect activities" ON public.prospect_activities
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete prospect activities" ON public.prospect_activities
  FOR DELETE USING (true);

-- Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.handle_prospect_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at
CREATE TRIGGER handle_prospect_activities_updated_at
  BEFORE UPDATE ON public.prospect_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_prospect_activities_updated_at(); 