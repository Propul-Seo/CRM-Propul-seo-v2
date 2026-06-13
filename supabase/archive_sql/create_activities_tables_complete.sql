-- =====================================================
-- CRÉATION DES TABLES D'ACTIVITÉS POUR BOT ONE ET BYW
-- =====================================================

-- Table des activités Bot One
CREATE TABLE IF NOT EXISTS public.crm_bot_one_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.crm_bot_one_records(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des activités BYW
CREATE TABLE IF NOT EXISTS public.crm_byw_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.crm_byw_records(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_activities_record_id ON public.crm_bot_one_activities(record_id);
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_activities_date ON public.crm_bot_one_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_activities_status ON public.crm_bot_one_activities(status);

CREATE INDEX IF NOT EXISTS idx_crm_byw_activities_record_id ON public.crm_byw_activities(record_id);
CREATE INDEX IF NOT EXISTS idx_crm_byw_activities_date ON public.crm_byw_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_crm_byw_activities_status ON public.crm_byw_activities(status);

-- Fonction handle_updated_at si elle n'existe pas
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS handle_crm_bot_one_activities_updated_at ON public.crm_bot_one_activities;
CREATE TRIGGER handle_crm_bot_one_activities_updated_at
  BEFORE UPDATE ON public.crm_bot_one_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_crm_byw_activities_updated_at ON public.crm_byw_activities;
CREATE TRIGGER handle_crm_byw_activities_updated_at
  BEFORE UPDATE ON public.crm_byw_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Désactiver RLS pour simplifier
ALTER TABLE public.crm_bot_one_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_byw_activities DISABLE ROW LEVEL SECURITY;

-- Message de confirmation
SELECT 
  'TABLES D''ACTIVITÉS CRÉÉES' as status,
  'Tables crm_bot_one_activities et crm_byw_activities créées avec succès' as message,
  NOW() as creation_time;
