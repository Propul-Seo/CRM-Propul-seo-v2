-- ============================================================================
-- PROPUL'SEO CRM — Script d'initialisation pour nouveau projet Supabase
-- Généré le 2026-04-05
--
-- Ce script crée TOUTES les tables manquantes dans un ordre correct
-- (tables référencées par FK en premier).
--
-- Tables V2 déjà existantes (NON recréées) :
--   automation_logs, checklist_items_v2, email_tracking, gmail_connections,
--   project_accesses_v2, project_activities_v2, project_briefs_v2,
--   project_documents_v2, project_email_rules, project_follow_ups_v2,
--   project_invoices_v2, projects_v2
--
-- Les politiques RLS sont volontairement EXCLUES de ce script.
-- Exécuter les politiques séparément une fois les tables créées.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TYPES ÉNUMÉRÉS
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'sales', 'marketing', 'developer', 'manager');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
        CREATE TYPE client_status AS ENUM ('prospect', 'devis', 'signe', 'livre', 'perdu');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'waiting', 'done');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        CREATE TYPE event_type AS ENUM ('rdv_client', 'deadline', 'livraison', 'suivi', 'marketing', 'formation', 'meeting');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
        CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'viewed', 'signed', 'rejected', 'expired');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
    END IF;
END$$;

-- ============================================================================
-- FONCTION update_updated_at_column (partagée par tous les triggers)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: users
-- Dépendances : auth.users (Supabase natif)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  auth_user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  role            user_role NOT NULL DEFAULT 'sales',
  avatar_url      TEXT,
  phone           TEXT,
  position        TEXT,
  bio             TEXT,
  timezone        TEXT DEFAULT 'Europe/Paris',
  language        TEXT DEFAULT 'fr-FR',
  is_active       BOOLEAN DEFAULT true,
  last_login      TIMESTAMPTZ,
  -- Multi-user management (FK ajoutées après la table teams)
  team_id         UUID,
  manager_id      UUID,
  permissions                JSONB DEFAULT '{}',
  notification_settings      JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
  -- Permissions granulaires module communication
  can_view_communication     BOOLEAN DEFAULT false,
  can_view_accounting        BOOLEAN DEFAULT false,
  can_view_crm               BOOLEAN DEFAULT true,
  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active    ON users(is_active);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: teams
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  leader_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Contraintes FK sur users (now teams exists)
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_team_id
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_manager_id
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_team_id    ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- ============================================================================
-- TABLE: user_profiles (compatibilité ancienne migration autumn_portal)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'sales',
  avatar_url  TEXT,
  phone       TEXT,
  company     TEXT DEFAULT 'Propulseo',
  position    TEXT,
  bio         TEXT,
  timezone    TEXT DEFAULT 'Europe/Paris',
  language    TEXT DEFAULT 'fr-FR',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: contacts (CRM principal)
-- Dépendances : users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  company             TEXT NOT NULL DEFAULT '',
  email               TEXT NOT NULL,
  phone               TEXT,
  address             TEXT,
  website             TEXT,
  sector              TEXT,
  status              TEXT NOT NULL DEFAULT 'prospect',
  total_revenue       DECIMAL(12,2) DEFAULT 0,
  project_price       DECIMAL(12,2),
  assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
  source              TEXT,
  lead_score          INTEGER DEFAULT 50 CHECK (lead_score >= 0 AND lead_score <= 100),
  notes               TEXT[],
  tags                TEXT[],
  next_activity_date  TIMESTAMPTZ,
  last_contact        TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id     ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status      ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_email       ON contacts(email);

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: clients (pipeline Supabase natif — table distincte de contacts)
-- Dépendances : auth.users, user_profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL DEFAULT '',
  address       TEXT NOT NULL DEFAULT '',
  sector        TEXT NOT NULL DEFAULT '',
  status        client_status NOT NULL DEFAULT 'prospect',
  total_revenue DECIMAL(10,2) DEFAULT 0,
  assigned_to   UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  last_contact  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id     ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status      ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: projects
-- Dépendances : users, contacts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id    UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  status       project_status NOT NULL DEFAULT 'planning',
  priority     task_priority NOT NULL DEFAULT 'medium',
  assigned_to  UUID REFERENCES users(id) NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE,
  deadline     DATE,
  budget       DECIMAL(12,2),
  actual_cost  DECIMAL(12,2) DEFAULT 0,
  progress     INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  category     TEXT NOT NULL DEFAULT '',
  tags         TEXT[],
  position     INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  is_archived  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id     ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id   ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status      ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_status_position ON projects(status, position);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: tasks
-- Dépendances : users, projects, contacts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id     UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  status         task_status NOT NULL DEFAULT 'todo',
  priority       task_priority NOT NULL DEFAULT 'medium',
  assigned_to    UUID REFERENCES users(id) NOT NULL,
  deadline       TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours   DECIMAL(5,2) DEFAULT 0,
  category       TEXT NOT NULL DEFAULT '',
  tags           TEXT[],
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id     ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id  ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline    ON tasks(deadline);

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: personal_tasks (tâches personnelles Kanban)
-- Dépendances : users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.personal_tasks (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'todo'
                 CHECK (status IN ('backlog','todo','in_progress','weekend','done','archived')),
  priority     TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low','medium','high','urgent')),
  tags         TEXT[] DEFAULT '{}',
  deadline     TIMESTAMPTZ,
  assigned_to  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_tasks_status      ON personal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_assigned_to ON personal_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_created_by  ON personal_tasks(created_by);

CREATE TRIGGER update_personal_tasks_updated_at
  BEFORE UPDATE ON personal_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: calendar_events
-- Dépendances : auth.users, user_profiles, clients
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  event_type  event_type NOT NULL,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES user_profiles(id) NOT NULL,
  is_all_day  BOOLEAN DEFAULT false,
  category    TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id     ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned_to ON calendar_events(assigned_to);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time  ON calendar_events(start_time);

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: quotes
-- Dépendances : users, contacts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id    UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  quote_number TEXT UNIQUE,
  title        TEXT NOT NULL,
  status       quote_status NOT NULL DEFAULT 'draft',
  subtotal     DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate     DECIMAL(5,2) DEFAULT 20.00,
  tax          DECIMAL(12,2) NOT NULL DEFAULT 0,
  total        DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency     TEXT DEFAULT 'EUR',
  valid_until  DATE NOT NULL,
  sent_at      TIMESTAMPTZ,
  viewed_at    TIMESTAMPTZ,
  signed_at    TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id    ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id  ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status     ON quotes(status);

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TABLE: quote_items
CREATE TABLE IF NOT EXISTS public.quote_items (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id    UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  DECIMAL(10,2) NOT NULL,
  total       DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: accounting_entries
-- Dépendances : users (ou auth.users selon migration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type                   TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  amount                 DECIMAL(12,2) NOT NULL,
  description            TEXT NOT NULL,
  category               TEXT,
  client_id              UUID,         -- référence souple (contacts ou clients)
  entry_date             DATE NOT NULL,
  month_key              TEXT,         -- format 'YYYY-MM' pour requêtes rapides
  is_recurring           BOOLEAN DEFAULT false,
  created_by             UUID,
  revenue_category       TEXT CHECK (revenue_category IS NULL OR revenue_category IN ('site_internet','erp','communication')),
  revenue_sous_categorie TEXT CHECK (
    revenue_sous_categorie IS NULL
    OR (revenue_category = 'communication' AND revenue_sous_categorie IN ('chatbot','cm','newsletter','autre'))
  ),
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounting_entries_type      ON accounting_entries(type);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_entry_date ON accounting_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_month     ON accounting_entries(month_key);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_user_id   ON accounting_entries(user_id);

CREATE TRIGGER update_accounting_entries_updated_at
  BEFORE UPDATE ON accounting_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: monthly_accounting_metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.monthly_accounting_metrics (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month           VARCHAR(7) NOT NULL UNIQUE,
  month_label     VARCHAR(20) NOT NULL,
  total_revenue   DECIMAL(12,2) DEFAULT 0,
  total_expenses  DECIMAL(12,2) DEFAULT 0,
  net_result      DECIMAL(12,2) DEFAULT 0,
  revenue_count   INTEGER DEFAULT 0,
  expense_count   INTEGER DEFAULT 0,
  is_current_month BOOLEAN DEFAULT false,
  is_closed       BOOLEAN DEFAULT false,
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_metrics_month ON monthly_accounting_metrics(month);

CREATE TRIGGER update_monthly_metrics_updated_at
  BEFORE UPDATE ON monthly_accounting_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: revenue_allocations
-- Dépendances : accounting_entries
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.revenue_allocations (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id               UUID NOT NULL REFERENCES accounting_entries(id) ON DELETE CASCADE,
  revenue_category       TEXT NOT NULL CHECK (revenue_category IN ('site_internet','erp','communication')),
  revenue_sous_categorie TEXT CHECK (
    revenue_sous_categorie IS NULL
    OR (revenue_category = 'communication' AND revenue_sous_categorie IN ('chatbot','cm','newsletter','autre'))
  ),
  amount                 NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_allocations_entry_id ON revenue_allocations(entry_id);

-- ============================================================================
-- TABLE: channels (Chat équipe)
-- Dépendances : users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.channels (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  is_private  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channels_name       ON channels(name);
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);

CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données initiales (canaux par défaut)
INSERT INTO channels (name, description)
SELECT 'général', 'Canal principal pour les discussions générales de l''équipe'
WHERE NOT EXISTS (SELECT 1 FROM channels WHERE name = 'général');

INSERT INTO channels (name, description)
SELECT 'projets', 'Canal dédié aux discussions sur les projets en cours'
WHERE NOT EXISTS (SELECT 1 FROM channels WHERE name = 'projets');

INSERT INTO channels (name, description)
SELECT 'support', 'Canal pour le support technique et l''entraide'
WHERE NOT EXISTS (SELECT 1 FROM channels WHERE name = 'support');

-- ============================================================================
-- TABLE: messages
-- Dépendances : channels, users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id   UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content      TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','file','image','audio')),
  attachments  JSONB DEFAULT '[]',
  mentions     UUID[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id    ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_mentions   ON messages USING GIN(mentions);

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: channel_members
-- Dépendances : channels, users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.channel_members (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role       TEXT DEFAULT 'member' CHECK (role IN ('admin','member')) NOT NULL,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id    ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_role       ON channel_members(role);

-- ============================================================================
-- TABLE: channel_read_status
-- Dépendances : auth.users, channels, messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.channel_read_status (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ DEFAULT NOW(),
  last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_read_status_user_channel ON channel_read_status(user_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_read_status_channel      ON channel_read_status(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_read_status_last_read    ON channel_read_status(last_read_at);

CREATE TRIGGER update_channel_read_status_updated_at
  BEFORE UPDATE ON channel_read_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: activities (Calendrier centralisé)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT,
  date_utc       TIMESTAMPTZ NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('projet','prospect')),
  priority       TEXT NOT NULL CHECK (priority IN ('haute','moyenne','basse')),
  status         TEXT NOT NULL CHECK (status IN ('a_faire','en_cours','termine')),
  related_id     UUID NOT NULL,
  related_module TEXT NOT NULL CHECK (related_module IN ('projet','crm')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activities_date_idx    ON activities(date_utc);
CREATE INDEX IF NOT EXISTS activities_type_idx    ON activities(type);
CREATE INDEX IF NOT EXISTS activities_status_idx  ON activities(status);
CREATE INDEX IF NOT EXISTS activities_related_idx ON activities(related_id, related_module);

CREATE TRIGGER handle_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: prospect_activities (activités CRM prospects)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prospect_activities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id    UUID NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  activity_date  TIMESTAMPTZ NOT NULL,
  activity_type  VARCHAR(50) NOT NULL
                   CHECK (activity_type IN ('call','meeting','email','follow_up','demo','proposal','other')),
  priority       VARCHAR(20) NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low','medium','high')),
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','completed','cancelled')),
  assigned_to    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prospect_activities_prospect_id_idx    ON prospect_activities(prospect_id);
CREATE INDEX IF NOT EXISTS prospect_activities_activity_date_idx  ON prospect_activities(activity_date);
CREATE INDEX IF NOT EXISTS prospect_activities_status_idx         ON prospect_activities(status);
CREATE INDEX IF NOT EXISTS prospect_activities_type_idx           ON prospect_activities(activity_type);
CREATE INDEX IF NOT EXISTS prospect_activities_assigned_to_idx    ON prospect_activities(assigned_to);

CREATE TRIGGER handle_prospect_activities_updated_at
  BEFORE UPDATE ON prospect_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: posts (Module Communication — posts agence)
-- Dépendances : users, contacts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title               TEXT NOT NULL,
  type                TEXT NOT NULL CHECK (type IN ('agence','perso','client','informatif')),
  platform            TEXT NOT NULL CHECK (platform IN ('linkedin','instagram','newsletter','multi')),
  status              TEXT NOT NULL DEFAULT 'idea'
                        CHECK (status IN ('idea','drafting','review','scheduled','published')),
  strategic_angle     TEXT,
  hook                TEXT,
  content             TEXT,
  objective           TEXT,
  scheduled_at        TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id           UUID REFERENCES contacts(id) ON DELETE SET NULL,
  external_url        TEXT,
  external_id         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_status             ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_platform           ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_type               ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_responsible_user   ON posts(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at       ON posts(scheduled_at);

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: post_assets
-- Dépendances : posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_assets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id      UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  asset_url    TEXT,
  storage_path TEXT,
  asset_type   TEXT NOT NULL CHECK (asset_type IN ('image','video','document')),
  file_name    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_assets_post_id ON post_assets(post_id);

-- ============================================================================
-- TABLE: post_comments
-- Dépendances : posts, users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_comments (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);

-- ============================================================================
-- TABLE: post_metrics (KPI Communication)
-- Dépendances : posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_metrics (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  impressions       INTEGER DEFAULT 0,
  reach             INTEGER DEFAULT 0,
  engagement        INTEGER DEFAULT 0,
  clicks            INTEGER DEFAULT 0,
  shares            INTEGER DEFAULT 0,
  comments_count    INTEGER DEFAULT 0,
  saves             INTEGER DEFAULT 0,
  leads_count       INTEGER DEFAULT 0,
  revenue           DECIMAL(12,2) DEFAULT 0,
  engagement_rate   DECIMAL(8,4) DEFAULT 0,
  performance_score DECIMAL(8,4) DEFAULT 0,
  source            TEXT DEFAULT 'manual' CHECK (source IN ('manual','linkedin_api','meta_api')),
  measured_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_metrics_post_id    ON post_metrics(post_id);
CREATE INDEX IF NOT EXISTS idx_post_metrics_measured_at ON post_metrics(measured_at);

CREATE TRIGGER update_post_metrics_updated_at
  BEFORE UPDATE ON post_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: client_posts (posts produits pour les clients)
-- Dépendances : users, contacts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.client_posts (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title               TEXT NOT NULL,
  type                TEXT NOT NULL CHECK (type IN ('agence','perso','client','informatif')),
  platform            TEXT NOT NULL CHECK (platform IN ('linkedin','instagram','newsletter','multi')),
  status              TEXT NOT NULL DEFAULT 'idea'
                        CHECK (status IN ('idea','drafting','review','scheduled','published')),
  strategic_angle     TEXT,
  hook                TEXT,
  content             TEXT,
  objective           TEXT,
  scheduled_at        TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id           UUID REFERENCES contacts(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_posts_status    ON client_posts(status);
CREATE INDEX IF NOT EXISTS idx_client_posts_client_id ON client_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_posts_platform  ON client_posts(platform);

CREATE TRIGGER update_client_posts_updated_at
  BEFORE UPDATE ON client_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: client_post_assets
-- Dépendances : client_posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.client_post_assets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id      UUID NOT NULL REFERENCES client_posts(id) ON DELETE CASCADE,
  asset_url    TEXT,
  storage_path TEXT,
  asset_type   TEXT NOT NULL CHECK (asset_type IN ('image','video','document')),
  file_name    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_post_assets_post_id ON client_post_assets(post_id);

-- ============================================================================
-- TABLE: client_post_comments
-- Dépendances : client_posts, users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.client_post_comments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID NOT NULL REFERENCES client_posts(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_post_comments_post_id ON client_post_comments(post_id);

-- ============================================================================
-- TABLE: social_connections (OAuth tokens réseaux sociaux)
-- Dépendances : users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.social_connections (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform         TEXT NOT NULL CHECK (platform IN ('linkedin','instagram')),
  account_type     TEXT NOT NULL DEFAULT 'company' CHECK (account_type IN ('company','creator')),
  account_name     TEXT NOT NULL DEFAULT '',
  account_id       TEXT,
  access_token     TEXT NOT NULL,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ NOT NULL,
  connected_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  last_sync_at     TIMESTAMPTZ,
  sync_status      TEXT NOT NULL DEFAULT 'active' CHECK (sync_status IN ('active','error','expired')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_connections_platform    ON social_connections(platform);
CREATE INDEX IF NOT EXISTS idx_social_connections_sync_status ON social_connections(sync_status);

CREATE TRIGGER update_social_connections_updated_at
  BEFORE UPDATE ON social_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: crm_columns (configuration colonnes Kanban CRM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crm_columns (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  color        TEXT NOT NULL,
  header_color TEXT NOT NULL,
  is_active    BOOLEAN DEFAULT true,
  position     INTEGER NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_columns_active   ON crm_columns(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_columns_position ON crm_columns(position);

CREATE TRIGGER update_crm_columns_updated_at
  BEFORE UPDATE ON crm_columns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Colonnes CRM par défaut
INSERT INTO crm_columns (id, title, color, header_color, position) VALUES
  ('prospect',              'Prospects',           'bg-blue-50 border-blue-200',   'bg-blue-500',   1),
  ('presentation_envoyee',  'Présentation Envoyée','bg-purple-50 border-purple-200','bg-purple-500', 2),
  ('meeting_booke',         'Meeting Booké',        'bg-orange-50 border-orange-200','bg-orange-500', 3),
  ('offre_envoyee',         'Offre Envoyée',        'bg-yellow-50 border-yellow-200','bg-yellow-500', 4),
  ('en_attente',            'En Attente',           'bg-gray-50 border-gray-200',   'bg-gray-500',   5),
  ('signe',                 'Signés',               'bg-green-50 border-green-200', 'bg-green-500',  6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TABLE: crm_bot_one_columns (colonnes Kanban CRM Bot One)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crm_bot_one_columns (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  column_name   TEXT NOT NULL,
  column_type   TEXT NOT NULL DEFAULT 'text',
  is_required   BOOLEAN DEFAULT false,
  default_value TEXT,
  options       JSONB,
  column_order  INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_bot_one_columns_order ON crm_bot_one_columns(column_order);

CREATE TRIGGER update_crm_bot_one_columns_updated_at
  BEFORE UPDATE ON crm_bot_one_columns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: crm_bot_one_records (enregistrements CRM Bot One — données dynamiques)
-- Dépendances : users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crm_bot_one_records (
  id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  data               JSONB NOT NULL DEFAULT '{}',
  status             TEXT NOT NULL DEFAULT 'active',
  tags               TEXT[] DEFAULT '{}',
  next_activity_date TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_bot_one_records_user_id ON crm_bot_one_records(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_records_status  ON crm_bot_one_records(status);
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_records_tags    ON crm_bot_one_records USING GIN(tags);

CREATE TRIGGER update_crm_bot_one_records_updated_at
  BEFORE UPDATE ON crm_bot_one_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: crm_bot_one_activities
-- Dépendances : crm_bot_one_records
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crm_bot_one_activities (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  record_id      UUID NOT NULL REFERENCES crm_bot_one_records(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  activity_date  TIMESTAMPTZ NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('call','email','meeting','note','task')),
  status         TEXT NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','completed','cancelled')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_bot_one_activities_record_id    ON crm_bot_one_activities(record_id);
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_activities_activity_date ON crm_bot_one_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_activities_status        ON crm_bot_one_activities(status);

CREATE TRIGGER update_crm_bot_one_activities_updated_at
  BEFORE UPDATE ON crm_bot_one_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: crmerp_leads (pipeline ERP — séparé du CRM principal)
-- Dépendances : users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crmerp_leads (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name     TEXT,
  contact_name     TEXT,
  email            TEXT,
  phone            TEXT,
  source           TEXT,
  status           TEXT NOT NULL DEFAULT 'leads_contactes'
                     CHECK (status IN ('leads_contactes','rendez_vous_effectues','en_attente','signes')),
  assignee_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  notes            TEXT,
  last_activity_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crmerp_leads_status      ON crmerp_leads(status);
CREATE INDEX IF NOT EXISTS idx_crmerp_leads_assignee_id ON crmerp_leads(assignee_id);

CREATE TRIGGER update_crmerp_leads_updated_at
  BEFORE UPDATE ON crmerp_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: crmerp_activities (activités liées aux leads ERP)
-- Dépendances : crmerp_leads, users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crmerp_activities (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id    UUID NOT NULL REFERENCES crmerp_leads(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('call','email','meeting','note','task')),
  content    TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crmerp_activities_lead_id    ON crmerp_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crmerp_activities_created_by ON crmerp_activities(created_by);
CREATE INDEX IF NOT EXISTS idx_crmerp_activities_type       ON crmerp_activities(type);

-- ============================================================================
-- TABLE: notifications
-- Dépendances : users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('assignment','deadline','mention','system','project_update')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  is_read     BOOLEAN DEFAULT false,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type       ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: user_assignments
-- Dépendances : users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_assignments (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assigned_by     UUID REFERENCES users(id) NOT NULL,
  assigned_to     UUID REFERENCES users(id) NOT NULL,
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('task','project','client','event')),
  entity_id       UUID NOT NULL,
  assignment_date TIMESTAMPTZ DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_assignments_assigned_by ON user_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_assignments_assigned_to ON user_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_user_assignments_entity      ON user_assignments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_status      ON user_assignments(status);

CREATE TRIGGER update_user_assignments_updated_at
  BEFORE UPDATE ON user_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLES D'ARCHIVE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.archived_accounting_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year          INTEGER NOT NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_id   UUID,
  entry_date    DATE,
  description   TEXT,
  amount        DECIMAL(10,2),
  type          VARCHAR(20),
  category      VARCHAR(100),
  month_key     VARCHAR(7),
  client_id     UUID,
  created_by    UUID,
  archived_at   TIMESTAMPTZ DEFAULT NOW(),
  original_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_archived_accounting_entries_year        ON archived_accounting_entries(year);
CREATE INDEX IF NOT EXISTS idx_archived_accounting_entries_user_id     ON archived_accounting_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_accounting_entries_original_id ON archived_accounting_entries(original_id);

CREATE TABLE IF NOT EXISTS public.archived_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year          INTEGER NOT NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_id   UUID,
  name          VARCHAR(255),
  client_id     UUID,
  client_name   VARCHAR(255),
  status        VARCHAR(50),
  start_date    DATE,
  end_date      DATE,
  budget        DECIMAL(10,2),
  total_amount  DECIMAL(10,2),
  assigned_to   UUID,
  archived_at   TIMESTAMPTZ DEFAULT NOW(),
  original_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_archived_projects_year        ON archived_projects(year);
CREATE INDEX IF NOT EXISTS idx_archived_projects_user_id     ON archived_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_projects_original_id ON archived_projects(original_id);

CREATE TABLE IF NOT EXISTS public.archived_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year          INTEGER NOT NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_id   UUID,
  title         VARCHAR(255),
  project_id    UUID,
  client_id     UUID,
  status        VARCHAR(50),
  assigned_to   UUID,
  completed_at  DATE,
  archived_at   TIMESTAMPTZ DEFAULT NOW(),
  original_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_archived_tasks_year        ON archived_tasks(year);
CREATE INDEX IF NOT EXISTS idx_archived_tasks_user_id     ON archived_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_tasks_original_id ON archived_tasks(original_id);

-- ============================================================================
-- TABLE: yearly_stats
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.yearly_stats (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year               INTEGER NOT NULL,
  total_income       DECIMAL(12,2) DEFAULT 0,
  total_expenses     DECIMAL(12,2) DEFAULT 0,
  net_profit         DECIMAL(12,2) DEFAULT 0,
  projects_completed INTEGER DEFAULT 0,
  tasks_completed    INTEGER DEFAULT 0,
  new_clients        INTEGER DEFAULT 0,
  stats_data         JSONB,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);

CREATE INDEX IF NOT EXISTS idx_yearly_stats_year    ON yearly_stats(year);
CREATE INDEX IF NOT EXISTS idx_yearly_stats_user_id ON yearly_stats(user_id);

CREATE TRIGGER trigger_yearly_stats_updated_at
  BEFORE UPDATE ON yearly_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: google_tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.google_tokens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLES COMPLÉMENTAIRES (compatibilité ancienne migration autumn_portal)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  company     TEXT,
  source      TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'new',
  score       INTEGER DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id     ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.lead_notes (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id    UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  note       TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VUES MATÉRIALISÉES KPI (Communication)
-- ============================================================================

-- Vue matérialisée : aperçu mensuel des KPI
CREATE MATERIALIZED VIEW IF NOT EXISTS kpi_monthly_overview AS
SELECT
  date_trunc('month', pm.measured_at)::DATE                AS month,
  p.platform,
  p.type,
  p.responsible_user_id,
  COUNT(DISTINCT p.id)                                      AS posts_count,
  COALESCE(SUM(pm.impressions), 0)                          AS total_impressions,
  COALESCE(SUM(pm.reach), 0)                                AS total_reach,
  COALESCE(SUM(pm.engagement), 0)                           AS total_engagement,
  COALESCE(SUM(pm.clicks), 0)                               AS total_clicks,
  COALESCE(SUM(pm.leads_count), 0)                          AS total_leads,
  COALESCE(SUM(pm.revenue), 0)                              AS total_revenue,
  COALESCE(AVG(pm.engagement_rate), 0)                      AS avg_engagement_rate,
  COALESCE(AVG(pm.performance_score), 0)                    AS avg_performance_score,
  CASE WHEN COUNT(DISTINCT p.id) > 0
       THEN COALESCE(SUM(pm.revenue), 0) / COUNT(DISTINCT p.id)
       ELSE 0 END                                           AS roi_per_post
FROM posts p
JOIN post_metrics pm ON pm.post_id = p.id
WHERE p.status = 'published'
GROUP BY 1, 2, 3, 4;

CREATE UNIQUE INDEX IF NOT EXISTS idx_kpi_monthly_overview
  ON kpi_monthly_overview(month, platform, type, responsible_user_id);

-- Vue matérialisée : métriques journalières
CREATE MATERIALIZED VIEW IF NOT EXISTS kpi_daily_metrics AS
SELECT
  pm.measured_at::DATE           AS day,
  p.platform,
  p.type,
  COUNT(DISTINCT p.id)           AS posts_count,
  SUM(pm.impressions)            AS impressions,
  SUM(pm.reach)                  AS reach,
  SUM(pm.engagement)             AS engagement,
  AVG(pm.engagement_rate)        AS avg_engagement_rate,
  SUM(pm.leads_count)            AS leads_count,
  SUM(pm.revenue)                AS revenue
FROM posts p
JOIN post_metrics pm ON pm.post_id = p.id
WHERE p.status = 'published'
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX IF NOT EXISTS idx_kpi_daily_metrics
  ON kpi_daily_metrics(day, platform, type);

-- Vue matérialisée : top posts par performance
CREATE MATERIALIZED VIEW IF NOT EXISTS kpi_top_posts AS
SELECT
  p.id,
  p.title,
  p.platform,
  p.type,
  p.responsible_user_id,
  p.published_at,
  pm.impressions,
  pm.engagement,
  pm.engagement_rate,
  pm.leads_count,
  pm.revenue,
  pm.performance_score
FROM posts p
JOIN post_metrics pm ON pm.post_id = p.id
WHERE p.status = 'published'
ORDER BY pm.performance_score DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_kpi_top_posts ON kpi_top_posts(id);

-- ============================================================================
-- FONCTIONS HELPER : is_admin / is_manager_or_admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_role  TEXT;
    v_email TEXT;
BEGIN
    SELECT role, email INTO v_role, v_email
    FROM public.users
    WHERE auth_user_id = auth.uid();

    RETURN COALESCE(
        v_role = 'admin' OR v_email = 'team@propulseo-site.com',
        false
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_role  TEXT;
    v_email TEXT;
BEGIN
    SELECT role, email INTO v_role, v_email
    FROM public.users
    WHERE auth_user_id = auth.uid();

    RETURN COALESCE(
        v_role IN ('admin', 'manager') OR v_email = 'team@propulseo-site.com',
        false
    );
END;
$$;

-- ============================================================================
-- FONCTION : handle_new_user (trigger auth.users -> users)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_role user_role;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'sales'::user_role
  );

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id) THEN
    INSERT INTO public.users (auth_user_id, name, email, role, is_active, created_at, updated_at)
    VALUES (NEW.id, v_name, NEW.email, v_role, true, NOW(), NOW());
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error for % (%): %', NEW.email, NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger auth → users (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;

-- ============================================================================
-- FONCTIONS UTILITAIRES CHANNEL READ STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_channel_unread_count(
  p_channel_id UUID,
  p_user_id    UUID
)
RETURNS INTEGER AS $$
DECLARE
  last_read_time TIMESTAMPTZ;
  unread_count   INTEGER;
BEGIN
  SELECT last_read_at INTO last_read_time
  FROM channel_read_status
  WHERE user_id = p_user_id AND channel_id = p_channel_id;

  IF last_read_time IS NULL THEN
    SELECT COUNT(*) INTO unread_count
    FROM messages
    WHERE channel_id = p_channel_id AND user_id != p_user_id;
  ELSE
    SELECT COUNT(*) INTO unread_count
    FROM messages
    WHERE channel_id = p_channel_id
      AND user_id != p_user_id
      AND created_at > last_read_time;
  END IF;

  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_channel_as_read(
  p_channel_id UUID,
  p_user_id    UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO channel_read_status (user_id, channel_id, last_read_at, last_message_id)
  VALUES (
    p_user_id,
    p_channel_id,
    NOW(),
    (SELECT id FROM messages WHERE channel_id = p_channel_id ORDER BY created_at DESC LIMIT 1)
  )
  ON CONFLICT (user_id, channel_id) DO UPDATE SET
    last_read_at    = NOW(),
    last_message_id = EXCLUDED.last_message_id,
    updated_at      = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION : refresh_kpi_views (appelée par le front après upsert métriques)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_kpi_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_monthly_overview;
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_daily_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_top_posts;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'refresh_kpi_views error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTIONS CRM BOT ONE (RPCs appelées par le front)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_bot_one_activity(
  p_record_id    UUID,
  p_title        TEXT,
  p_description  TEXT DEFAULT NULL,
  p_activity_date TIMESTAMPTZ DEFAULT NOW(),
  p_type         TEXT DEFAULT 'note',
  p_status       TEXT DEFAULT 'scheduled'
)
RETURNS SETOF crm_bot_one_activities AS $$
  INSERT INTO crm_bot_one_activities
    (record_id, title, description, activity_date, type, status)
  VALUES
    (p_record_id, p_title, p_description, p_activity_date, p_type, p_status)
  RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_bot_one_activities(p_record_id UUID)
RETURNS SETOF crm_bot_one_activities AS $$
  SELECT * FROM crm_bot_one_activities
  WHERE record_id = p_record_id
  ORDER BY activity_date DESC;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_bot_one_activity(
  p_activity_id   UUID,
  p_title         TEXT DEFAULT NULL,
  p_description   TEXT DEFAULT NULL,
  p_activity_date TIMESTAMPTZ DEFAULT NULL,
  p_type          TEXT DEFAULT NULL,
  p_status        TEXT DEFAULT NULL
)
RETURNS SETOF crm_bot_one_activities AS $$
  UPDATE crm_bot_one_activities SET
    title          = COALESCE(p_title,         title),
    description    = COALESCE(p_description,   description),
    activity_date  = COALESCE(p_activity_date, activity_date),
    type           = COALESCE(p_type,          type),
    status         = COALESCE(p_status,        status),
    updated_at     = NOW()
  WHERE id = p_activity_id
  RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_bot_one_activity(p_activity_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM crm_bot_one_activities WHERE id = p_activity_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER : monthly_accounting_metrics auto-update (sur accounting_entries)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_monthly_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_month_key   VARCHAR(7);
  v_month_label VARCHAR(20);
BEGIN
  v_month_key   := to_char(NEW.entry_date, 'YYYY-MM');
  v_month_label := to_char(NEW.entry_date, 'Month YYYY');

  INSERT INTO monthly_accounting_metrics (
    month, month_label,
    total_revenue, total_expenses, net_result,
    revenue_count, expense_count, is_current_month
  ) VALUES (
    v_month_key, v_month_label,
    CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE -NEW.amount END,
    CASE WHEN NEW.type = 'revenue' THEN 1 ELSE 0 END,
    CASE WHEN NEW.type = 'expense' THEN 1 ELSE 0 END,
    v_month_key = to_char(CURRENT_DATE, 'YYYY-MM')
  )
  ON CONFLICT (month) DO UPDATE SET
    total_revenue  = monthly_accounting_metrics.total_revenue
                     + CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE 0 END,
    total_expenses = monthly_accounting_metrics.total_expenses
                     + CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END,
    net_result     = monthly_accounting_metrics.net_result
                     + CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE -NEW.amount END,
    revenue_count  = monthly_accounting_metrics.revenue_count
                     + CASE WHEN NEW.type = 'revenue' THEN 1 ELSE 0 END,
    expense_count  = monthly_accounting_metrics.expense_count
                     + CASE WHEN NEW.type = 'expense' THEN 1 ELSE 0 END,
    updated_at     = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_monthly_metrics'
  ) THEN
    CREATE TRIGGER trigger_update_monthly_metrics
      AFTER INSERT ON accounting_entries
      FOR EACH ROW EXECUTE FUNCTION update_monthly_metrics();
  END IF;
END$$;

-- ============================================================================
-- COMPANY SETTINGS (paramètres entreprise)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.company_settings (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name        TEXT NOT NULL DEFAULT 'Propulseo',
  company_logo        TEXT,
  company_address     TEXT,
  company_phone       TEXT,
  company_email       TEXT,
  company_website     TEXT,
  tax_number          TEXT,
  default_currency    TEXT DEFAULT 'EUR',
  default_tax_rate    DECIMAL(5,2) DEFAULT 20.00,
  invoice_prefix      TEXT DEFAULT 'PROP-INV',
  quote_prefix        TEXT DEFAULT 'PROP-QUO',
  fiscal_year_start   INTEGER DEFAULT 1,
  settings            JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO company_settings (company_name, company_email, company_website, default_currency, default_tax_rate)
VALUES ('Propulseo', 'contact@propulseo.com', 'https://propulseo.com', 'EUR', 20.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Tables créées dans ce fichier :
--   users, teams, user_profiles,
--   contacts, clients,
--   projects, tasks, personal_tasks,
--   calendar_events, quotes, quote_items,
--   accounting_entries, monthly_accounting_metrics, revenue_allocations,
--   channels, messages, channel_members, channel_read_status,
--   activities, prospect_activities,
--   posts, post_assets, post_comments, post_metrics,
--   client_posts, client_post_assets, client_post_comments,
--   social_connections,
--   crm_columns,
--   crm_bot_one_columns, crm_bot_one_records, crm_bot_one_activities,
--   crmerp_leads, crmerp_activities,
--   notifications, user_assignments,
--   archived_accounting_entries, archived_projects, archived_tasks,
--   yearly_stats, google_tokens,
--   leads, lead_notes, company_settings
--
-- Vues matérialisées :
--   kpi_monthly_overview, kpi_daily_metrics, kpi_top_posts
--
-- Fonctions :
--   update_updated_at_column, is_admin, is_manager_or_admin,
--   handle_new_user, get_channel_unread_count, mark_channel_as_read,
--   refresh_kpi_views, update_monthly_metrics,
--   create/get/update/delete_bot_one_activity
-- ============================================================================
