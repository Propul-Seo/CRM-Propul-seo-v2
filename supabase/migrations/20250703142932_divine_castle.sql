-- =====================================================
-- PROPULSEO CRM - STRUCTURE COMPLÈTE DES TABLES
-- =====================================================
-- Script de création de toutes les tables pour Supabase
-- Version: 1.0 - Janvier 2025

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TYPES ÉNUMÉRÉS (AVEC VÉRIFICATION D'EXISTENCE)
-- =====================================================

-- Vérifier si les types existent déjà avant de les créer
DO $$
BEGIN
    -- Rôles utilisateurs
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'sales', 'marketing', 'developer', 'manager');
    END IF;

    -- Statuts contacts/clients
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
        CREATE TYPE client_status AS ENUM ('prospect', 'devis', 'signe', 'livre', 'perdu');
    END IF;
    
    -- Statuts projets
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled');
    END IF;
    
    -- Priorités
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
    
    -- Statuts tâches
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'waiting', 'done');
    END IF;
    
    -- Types d'événements
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        CREATE TYPE event_type AS ENUM ('rdv_client', 'deadline', 'livraison', 'suivi', 'marketing', 'formation', 'meeting');
    END IF;
    
    -- Statuts devis
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
        CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'viewed', 'signed', 'rejected', 'expired');
    END IF;
    
    -- Statuts factures
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
    END IF;
    
    -- Types de campagnes
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_type') THEN
        CREATE TYPE campaign_type AS ENUM ('email', 'social', 'seo', 'ads', 'content', 'webinar');
    END IF;
    
    -- Statuts campagnes
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
        CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
    END IF;
END$$;

-- =====================================================
-- TABLE 1: USERS - Gestion des utilisateurs de l'équipe
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'sales',
  avatar_url TEXT,
  phone TEXT,
  position TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'Europe/Paris',
  language TEXT DEFAULT 'fr-FR',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 2: CONTACTS - CRM & Leads
-- =====================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  company TEXT,
  sector TEXT,
  status client_status NOT NULL DEFAULT 'prospect',
  total_revenue DECIMAL(12,2) DEFAULT 0,
  assigned_to UUID REFERENCES users(id),
  source TEXT, -- website, referral, ads, etc.
  lead_score INTEGER DEFAULT 50 CHECK (lead_score >= 0 AND lead_score <= 100),
  notes TEXT[],
  tags TEXT[],
  last_contact TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 3: PROJECTS - Projets clients
-- =====================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL, -- Renamed from contact_id to client_id
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  priority task_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  deadline DATE,
  budget DECIMAL(12,2),
  actual_cost DECIMAL(12,2) DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  category TEXT NOT NULL,
  tags TEXT[],
  completed_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 4: TASKS - Gestion des tâches
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Renamed from contact_id to client_id
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id) NOT NULL,
  deadline TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2) DEFAULT 0,
  category TEXT NOT NULL,
  tags TEXT[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 5: INVOICES - Factures et comptabilité
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL, -- Renamed from contact_id to client_id
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 20.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 6: QUOTES - Devis
-- =====================================================

CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL, -- Renamed from contact_id to client_id
  quote_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status quote_status NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 20.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  valid_until DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 7: EVENTS - Calendrier et rendez-vous
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Renamed from contact_id to client_id
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees UUID[], -- Array of user IDs
  reminder_minutes INTEGER DEFAULT 15,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 8: ANALYTICS_DATA - Données pour graphiques et KPIs
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_type TEXT NOT NULL, -- revenue, count, percentage, etc.
  period_type TEXT NOT NULL, -- daily, weekly, monthly, yearly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  dimensions JSONB, -- Additional dimensions (source, category, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 9: CAMPAIGNS - Campagnes marketing
-- =====================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type campaign_type NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  description TEXT,
  target_audience TEXT,
  budget DECIMAL(12,2),
  actual_cost DECIMAL(12,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  assigned_to UUID REFERENCES users(id) NOT NULL,
  metrics JSONB, -- impressions, clicks, conversions, etc.
  settings JSONB, -- Campaign-specific settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 10: ACTIVITY_LOG - Historique des activités
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- contact, project, task, etc.
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLES DE LIAISON
-- =====================================================

-- TABLE 11: PROJECT_MEMBERS - Attribution des membres aux projets
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- lead, member, observer
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(project_id, user_id)
);

-- TABLE 12: TASK_COMMENTS - Commentaires sur les tâches
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT[], -- URLs to files
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 13: INVOICE_ITEMS - Lignes de facture détaillées
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLES DE CONFIGURATION
-- =====================================================

-- TABLE 14: COMPANY_SETTINGS - Paramètres de l'entreprise
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'Propulseo',
  company_logo TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  tax_number TEXT,
  default_currency TEXT DEFAULT 'EUR',
  default_tax_rate DECIMAL(5,2) DEFAULT 20.00,
  invoice_prefix TEXT DEFAULT 'INV',
  quote_prefix TEXT DEFAULT 'QUO',
  fiscal_year_start INTEGER DEFAULT 1, -- Month (1-12)
  settings JSONB, -- Additional settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 15: NOTIFICATION_SETTINGS - Préférences de notifications
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  task_reminders BOOLEAN DEFAULT true,
  deadline_alerts BOOLEAN DEFAULT true,
  client_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  weekly_reports BOOLEAN DEFAULT true,
  notification_frequency TEXT DEFAULT 'immediate', -- immediate, daily, weekly
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index pour les recherches fréquentes (avec vérification d'existence)
DO $$
BEGIN
    -- Contacts indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_status') THEN
        CREATE INDEX idx_contacts_status ON contacts(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_assigned_to') THEN
        CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_user_id') THEN
        CREATE INDEX idx_contacts_user_id ON contacts(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_email') THEN
        CREATE INDEX idx_contacts_email ON contacts(email);
    END IF;

    -- Projects indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_status') THEN
        CREATE INDEX idx_projects_status ON projects(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_assigned_to') THEN
        CREATE INDEX idx_projects_assigned_to ON projects(assigned_to);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_client_id') THEN
        CREATE INDEX idx_projects_client_id ON projects(client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_user_id') THEN
        CREATE INDEX idx_projects_user_id ON projects(user_id);
    END IF;

    -- Tasks indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_status') THEN
        CREATE INDEX idx_tasks_status ON tasks(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_assigned_to') THEN
        CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_project_id') THEN
        CREATE INDEX idx_tasks_project_id ON tasks(project_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_deadline') THEN
        CREATE INDEX idx_tasks_deadline ON tasks(deadline);
    END IF;

    -- Events indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_start_time') THEN
        CREATE INDEX idx_events_start_time ON events(start_time);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_user_id') THEN
        CREATE INDEX idx_events_user_id ON events(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_client_id') THEN
        CREATE INDEX idx_events_client_id ON events(client_id);
    END IF;

    -- Invoices indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_status') THEN
        CREATE INDEX idx_invoices_status ON invoices(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_client_id') THEN
        CREATE INDEX idx_invoices_client_id ON invoices(client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_due_date') THEN
        CREATE INDEX idx_invoices_due_date ON invoices(due_date);
    END IF;

    -- Quotes indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quotes_status') THEN
        CREATE INDEX idx_quotes_status ON quotes(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quotes_client_id') THEN
        CREATE INDEX idx_quotes_client_id ON quotes(client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quotes_valid_until') THEN
        CREATE INDEX idx_quotes_valid_until ON quotes(valid_until);
    END IF;

    -- Analytics indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_analytics_data_period') THEN
        CREATE INDEX idx_analytics_data_period ON analytics_data(period_start, period_end);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_analytics_data_metric') THEN
        CREATE INDEX idx_analytics_data_metric ON analytics_data(metric_name, period_type);
    END IF;

    -- Activity log indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_log_user_id') THEN
        CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_log_entity') THEN
        CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_log_created_at') THEN
        CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
    END IF;
END$$;

-- =====================================================
-- ACTIVATION DE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables (avec vérification)
DO $$
BEGIN
    -- Vérifier si RLS est déjà activé avant de l'activer
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'users' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'contacts' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'projects' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'tasks' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'invoices' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'quotes' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'events' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'analytics_data' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'campaigns' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'activity_log' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'project_members' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'task_comments' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'invoice_items' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'notification_settings' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
    END IF;
END$$;

-- =====================================================
-- POLITIQUES RLS (AVEC VÉRIFICATION D'EXISTENCE)
-- =====================================================

-- Supprimer les politiques existantes pour éviter les conflits
DO $$
DECLARE
    tables text[] := ARRAY['users', 'contacts', 'projects', 'tasks', 'invoices', 'quotes', 
                          'events', 'analytics_data', 'campaigns', 'activity_log', 
                          'project_members', 'task_comments', 'invoice_items', 'notification_settings'];
    t text;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can view all profiles" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update own profile" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own contacts" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own projects" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own tasks" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own invoices" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own quotes" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own events" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own analytics" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own campaigns" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view own activity" ON %I', t);
    END LOOP;
END$$;

-- Créer les nouvelles politiques
-- Users: Tous peuvent voir les profils, seuls les admins peuvent modifier
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (
  auth.uid()::text = auth_user_id::text OR 
  EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- Contacts: Utilisateurs peuvent gérer leurs propres contacts
CREATE POLICY "Users can manage own contacts" ON contacts FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Projects: Utilisateurs peuvent gérer leurs propres projets
CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Tasks: Utilisateurs peuvent gérer leurs propres tâches
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Invoices: Utilisateurs peuvent gérer leurs propres factures
CREATE POLICY "Users can manage own invoices" ON invoices FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Quotes: Utilisateurs peuvent gérer leurs propres devis
CREATE POLICY "Users can manage own quotes" ON quotes FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Events: Utilisateurs peuvent gérer leurs propres événements
CREATE POLICY "Users can manage own events" ON events FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Analytics: Utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can manage own analytics" ON analytics_data FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Campaigns: Utilisateurs peuvent gérer leurs propres campagnes
CREATE POLICY "Users can manage own campaigns" ON campaigns FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Activity Log: Utilisateurs peuvent voir leurs propres activités
CREATE POLICY "Users can view own activity" ON activity_log FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Project members: Utilisateurs peuvent voir les membres de leurs projets
CREATE POLICY "Users can manage project members" ON project_members FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
);

-- Task comments: Utilisateurs peuvent gérer les commentaires de leurs tâches
CREATE POLICY "Users can manage task comments" ON task_comments FOR ALL USING (
  task_id IN (SELECT id FROM tasks WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
);

-- Invoice items: Utilisateurs peuvent gérer les lignes de leurs factures
CREATE POLICY "Users can manage invoice items" ON invoice_items FOR ALL USING (
  invoice_id IN (SELECT id FROM invoices WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
);

-- Notification settings: Utilisateurs peuvent gérer leurs propres paramètres
CREATE POLICY "Users can manage own notification settings" ON notification_settings FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- =====================================================
-- FONCTIONS AUTOMATIQUES
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at (avec vérification d'existence)
DO $$
BEGIN
    -- Users
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Contacts
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contacts_updated_at') THEN
        CREATE TRIGGER update_contacts_updated_at 
        BEFORE UPDATE ON contacts 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Projects
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
        CREATE TRIGGER update_projects_updated_at 
        BEFORE UPDATE ON projects 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Tasks
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
        CREATE TRIGGER update_tasks_updated_at 
        BEFORE UPDATE ON tasks 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Invoices
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
        CREATE TRIGGER update_invoices_updated_at 
        BEFORE UPDATE ON invoices 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Quotes
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quotes_updated_at') THEN
        CREATE TRIGGER update_quotes_updated_at 
        BEFORE UPDATE ON quotes 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Events
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_events_updated_at') THEN
        CREATE TRIGGER update_events_updated_at 
        BEFORE UPDATE ON events 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Campaigns
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaigns_updated_at') THEN
        CREATE TRIGGER update_campaigns_updated_at 
        BEFORE UPDATE ON campaigns 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Company settings
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_settings_updated_at') THEN
        CREATE TRIGGER update_company_settings_updated_at 
        BEFORE UPDATE ON company_settings 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Notification settings
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_settings_updated_at') THEN
        CREATE TRIGGER update_notification_settings_updated_at 
        BEFORE UPDATE ON notification_settings 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')::user_role
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour création automatique du profil (avec vérification d'existence)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END$$;

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Insérer les paramètres par défaut de l'entreprise
INSERT INTO company_settings (
  company_name,
  company_email,
  company_website,
  default_currency,
  default_tax_rate,
  invoice_prefix,
  quote_prefix
) VALUES (
  'Propulseo',
  'contact@propulseo.com',
  'https://propulseo.com',
  'EUR',
  20.00,
  'PROP-INV',
  'PROP-QUO'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- VUES UTILES POUR LES RAPPORTS
-- =====================================================

-- Vue pour le dashboard principal (avec vérification d'existence)
DO $$
BEGIN
    DROP VIEW IF EXISTS dashboard_metrics;
    
    CREATE VIEW dashboard_metrics AS
    SELECT 
      u.id as user_id,
      u.name as user_name,
      COUNT(DISTINCT c.id) as total_contacts,
      COUNT(DISTINCT CASE WHEN c.status = 'prospect' THEN c.id END) as prospects,
      COUNT(DISTINCT CASE WHEN c.status = 'signe' THEN c.id END) as signed_clients,
      COUNT(DISTINCT p.id) as total_projects,
      COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN p.id END) as active_projects,
      COUNT(DISTINCT t.id) as total_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
      COALESCE(SUM(c.total_revenue), 0) as total_revenue
    FROM users u
    LEFT JOIN contacts c ON c.assigned_to = u.id
    LEFT JOIN projects p ON p.assigned_to = u.id
    LEFT JOIN tasks t ON t.assigned_to = u.id
    WHERE u.is_active = true
    GROUP BY u.id, u.name;
END$$;

-- =====================================================
-- COMMENTAIRES FINAUX
-- =====================================================

COMMENT ON DATABASE postgres IS 'Propulseo CRM - Base de données complète pour la gestion d''agence SEO et Marketing Digital';

-- Fin du script de création des tables Propulseo CRM
-- Total: 15 tables principales + vues + fonctions + sécurité RLS
-- Prêt pour la production avec Supabase