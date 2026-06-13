-- =====================================================
-- POLITIQUES RLS COMPLETES - CRM PROPUL'SEO (CORRIGE)
-- =====================================================
-- Script adapte a la structure reelle des tables
-- =====================================================

-- =====================================================
-- FONCTIONS HELPER (deja creees)
-- =====================================================

-- =====================================================
-- 1. TABLES UTILISATEURS
-- =====================================================

-- USERS (utilise auth_user_id au lieu de id)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_all" ON users;
CREATE POLICY "users_select_all" ON users
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "users_insert_admin" ON users;
CREATE POLICY "users_insert_admin" ON users
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "users_update_own_or_admin" ON users;
CREATE POLICY "users_update_own_or_admin" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id OR is_admin())
    WITH CHECK (auth.uid() = auth_user_id OR is_admin());

DROP POLICY IF EXISTS "users_delete_admin" ON users;
CREATE POLICY "users_delete_admin" ON users
    FOR DELETE USING (is_admin());

-- USER_PROFILES (id correspond a auth.users.id)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_all" ON user_profiles;
CREATE POLICY "user_profiles_select_all" ON user_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
CREATE POLICY "user_profiles_insert_own" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles
    FOR UPDATE USING (auth.uid() = id OR is_admin())
    WITH CHECK (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "user_profiles_delete_admin" ON user_profiles;
CREATE POLICY "user_profiles_delete_admin" ON user_profiles
    FOR DELETE USING (is_admin());

-- =====================================================
-- 2. CONTACTS & CLIENTS
-- =====================================================

-- CONTACTS (pas de created_by, utilise user_id et assigned_to)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select" ON contacts;
CREATE POLICY "contacts_select" ON contacts
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.uid() = assigned_to
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "contacts_insert" ON contacts;
CREATE POLICY "contacts_insert" ON contacts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "contacts_update" ON contacts;
CREATE POLICY "contacts_update" ON contacts
    FOR UPDATE USING (
        auth.uid() = user_id
        OR auth.uid() = assigned_to
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "contacts_delete" ON contacts;
CREATE POLICY "contacts_delete" ON contacts
    FOR DELETE USING (
        auth.uid() = user_id
        OR is_admin()
    );

-- CLIENTS (pas de created_by)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select" ON clients;
CREATE POLICY "clients_select" ON clients
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.uid() = assigned_to
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "clients_insert" ON clients;
CREATE POLICY "clients_insert" ON clients
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "clients_update" ON clients;
CREATE POLICY "clients_update" ON clients
    FOR UPDATE USING (
        auth.uid() = user_id
        OR auth.uid() = assigned_to
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "clients_delete" ON clients;
CREATE POLICY "clients_delete" ON clients
    FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- LEADS (pas de user_id ni created_by, seulement assigned_to)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select" ON leads;
CREATE POLICY "leads_select" ON leads
    FOR SELECT USING (
        auth.uid() = assigned_to
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "leads_insert" ON leads;
CREATE POLICY "leads_insert" ON leads
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "leads_update" ON leads;
CREATE POLICY "leads_update" ON leads
    FOR UPDATE USING (
        auth.uid() = assigned_to
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "leads_delete" ON leads;
CREATE POLICY "leads_delete" ON leads
    FOR DELETE USING (auth.uid() = assigned_to OR is_admin());

-- LEAD_NOTES (utilise created_by qui pointe vers user_profiles.id)
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_notes_select" ON lead_notes;
CREATE POLICY "lead_notes_select" ON lead_notes
    FOR SELECT USING (
        auth.uid() = created_by
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "lead_notes_insert" ON lead_notes;
CREATE POLICY "lead_notes_insert" ON lead_notes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lead_notes_update" ON lead_notes;
CREATE POLICY "lead_notes_update" ON lead_notes
    FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "lead_notes_delete" ON lead_notes;
CREATE POLICY "lead_notes_delete" ON lead_notes
    FOR DELETE USING (auth.uid() = created_by OR is_admin());

-- =====================================================
-- 3. ACTIVITES
-- =====================================================

-- ACTIVITIES (pas de user_id ni created_by)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select" ON activities;
CREATE POLICY "activities_select" ON activities
    FOR SELECT USING (is_manager_or_admin());

DROP POLICY IF EXISTS "activities_insert" ON activities;
CREATE POLICY "activities_insert" ON activities
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "activities_update" ON activities;
CREATE POLICY "activities_update" ON activities
    FOR UPDATE USING (is_manager_or_admin());

DROP POLICY IF EXISTS "activities_delete" ON activities;
CREATE POLICY "activities_delete" ON activities
    FOR DELETE USING (is_admin());

-- USER_ACTIVITIES
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_activities_select" ON user_activities;
CREATE POLICY "user_activities_select" ON user_activities
    FOR SELECT USING (auth.uid() = user_id OR is_manager_or_admin());

DROP POLICY IF EXISTS "user_activities_insert" ON user_activities;
CREATE POLICY "user_activities_insert" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "user_activities_update" ON user_activities;
CREATE POLICY "user_activities_update" ON user_activities
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_activities_delete" ON user_activities;
CREATE POLICY "user_activities_delete" ON user_activities
    FOR DELETE USING (is_admin());

-- PROSPECT_ACTIVITIES (pas de user_id ni created_by)
ALTER TABLE prospect_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prospect_activities_select" ON prospect_activities;
CREATE POLICY "prospect_activities_select" ON prospect_activities
    FOR SELECT USING (is_manager_or_admin());

DROP POLICY IF EXISTS "prospect_activities_insert" ON prospect_activities;
CREATE POLICY "prospect_activities_insert" ON prospect_activities
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "prospect_activities_update" ON prospect_activities;
CREATE POLICY "prospect_activities_update" ON prospect_activities
    FOR UPDATE USING (is_manager_or_admin());

DROP POLICY IF EXISTS "prospect_activities_delete" ON prospect_activities;
CREATE POLICY "prospect_activities_delete" ON prospect_activities
    FOR DELETE USING (is_admin());

-- ACTIVITY_LOG
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_log_select" ON activity_log;
CREATE POLICY "activity_log_select" ON activity_log
    FOR SELECT USING (auth.uid() = user_id OR is_manager_or_admin());

DROP POLICY IF EXISTS "activity_log_insert" ON activity_log;
CREATE POLICY "activity_log_insert" ON activity_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 4. CRM BOT ONE
-- =====================================================

-- CRM_BOT_ONE_RECORDS
ALTER TABLE crm_bot_one_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_bot_one_records_select" ON crm_bot_one_records;
CREATE POLICY "crm_bot_one_records_select" ON crm_bot_one_records
    FOR SELECT USING (
        auth.uid() = user_id
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "crm_bot_one_records_insert" ON crm_bot_one_records;
CREATE POLICY "crm_bot_one_records_insert" ON crm_bot_one_records
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm_bot_one_records_update" ON crm_bot_one_records;
CREATE POLICY "crm_bot_one_records_update" ON crm_bot_one_records
    FOR UPDATE USING (
        auth.uid() = user_id
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "crm_bot_one_records_delete" ON crm_bot_one_records;
CREATE POLICY "crm_bot_one_records_delete" ON crm_bot_one_records
    FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- CRM_BOT_ONE_ACTIVITIES (pas de user_id direct, via bot_one_record_id)
ALTER TABLE crm_bot_one_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_bot_one_activities_select" ON crm_bot_one_activities;
CREATE POLICY "crm_bot_one_activities_select" ON crm_bot_one_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM crm_bot_one_records
            WHERE crm_bot_one_records.id = crm_bot_one_activities.bot_one_record_id
            AND crm_bot_one_records.user_id = auth.uid()
        )
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "crm_bot_one_activities_insert" ON crm_bot_one_activities;
CREATE POLICY "crm_bot_one_activities_insert" ON crm_bot_one_activities
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm_bot_one_activities_update" ON crm_bot_one_activities;
CREATE POLICY "crm_bot_one_activities_update" ON crm_bot_one_activities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM crm_bot_one_records
            WHERE crm_bot_one_records.id = crm_bot_one_activities.bot_one_record_id
            AND crm_bot_one_records.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "crm_bot_one_activities_delete" ON crm_bot_one_activities;
CREATE POLICY "crm_bot_one_activities_delete" ON crm_bot_one_activities
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM crm_bot_one_records
            WHERE crm_bot_one_records.id = crm_bot_one_activities.bot_one_record_id
            AND crm_bot_one_records.user_id = auth.uid()
        )
        OR is_admin()
    );

-- CRM_BOT_ONE_COLUMNS
ALTER TABLE crm_bot_one_columns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_bot_one_columns_select" ON crm_bot_one_columns;
CREATE POLICY "crm_bot_one_columns_select" ON crm_bot_one_columns
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm_bot_one_columns_insert" ON crm_bot_one_columns;
CREATE POLICY "crm_bot_one_columns_insert" ON crm_bot_one_columns
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "crm_bot_one_columns_update" ON crm_bot_one_columns;
CREATE POLICY "crm_bot_one_columns_update" ON crm_bot_one_columns
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "crm_bot_one_columns_delete" ON crm_bot_one_columns;
CREATE POLICY "crm_bot_one_columns_delete" ON crm_bot_one_columns
    FOR DELETE USING (is_admin());

-- =====================================================
-- 5. CRM BYW
-- =====================================================

-- CRM_BYW_ACTIVITIES (pas de user_id direct, via byw_record_id)
ALTER TABLE crm_byw_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_byw_activities_select" ON crm_byw_activities;
CREATE POLICY "crm_byw_activities_select" ON crm_byw_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM crm_byw_records
            WHERE crm_byw_records.id = crm_byw_activities.byw_record_id
            AND (crm_byw_records.user_id = auth.uid() OR crm_byw_records.assigned_to = auth.uid())
        )
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "crm_byw_activities_insert" ON crm_byw_activities;
CREATE POLICY "crm_byw_activities_insert" ON crm_byw_activities
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm_byw_activities_update" ON crm_byw_activities;
CREATE POLICY "crm_byw_activities_update" ON crm_byw_activities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM crm_byw_records
            WHERE crm_byw_records.id = crm_byw_activities.byw_record_id
            AND (crm_byw_records.user_id = auth.uid() OR crm_byw_records.assigned_to = auth.uid())
        )
    );

DROP POLICY IF EXISTS "crm_byw_activities_delete" ON crm_byw_activities;
CREATE POLICY "crm_byw_activities_delete" ON crm_byw_activities
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM crm_byw_records
            WHERE crm_byw_records.id = crm_byw_activities.byw_record_id
            AND (crm_byw_records.user_id = auth.uid() OR crm_byw_records.assigned_to = auth.uid())
        )
        OR is_admin()
    );

-- =====================================================
-- 6. PROJETS & TACHES
-- =====================================================

-- PROJECTS (pas de user_id ni created_by)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects
    FOR SELECT USING (is_manager_or_admin());

DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects
    FOR UPDATE USING (is_manager_or_admin());

DROP POLICY IF EXISTS "projects_delete" ON projects;
CREATE POLICY "projects_delete" ON projects
    FOR DELETE USING (is_admin());

-- PROJECT_CHECKLISTS
ALTER TABLE project_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_checklists_select" ON project_checklists;
CREATE POLICY "project_checklists_select" ON project_checklists
    FOR SELECT USING (is_manager_or_admin());

DROP POLICY IF EXISTS "project_checklists_insert" ON project_checklists;
CREATE POLICY "project_checklists_insert" ON project_checklists
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "project_checklists_update" ON project_checklists;
CREATE POLICY "project_checklists_update" ON project_checklists
    FOR UPDATE USING (is_manager_or_admin());

DROP POLICY IF EXISTS "project_checklists_delete" ON project_checklists;
CREATE POLICY "project_checklists_delete" ON project_checklists
    FOR DELETE USING (is_admin());

-- TASKS (a user_id mais pas created_by)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select" ON tasks;
CREATE POLICY "tasks_select" ON tasks
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.uid() = assigned_to
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks
    FOR UPDATE USING (
        auth.uid() = user_id
        OR auth.uid() = assigned_to
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "tasks_delete" ON tasks;
CREATE POLICY "tasks_delete" ON tasks
    FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- TASK_COMMENTS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_comments_select" ON task_comments;
CREATE POLICY "task_comments_select" ON task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_comments.task_id
            AND (tasks.user_id = auth.uid() OR tasks.assigned_to = auth.uid())
        )
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "task_comments_insert" ON task_comments;
CREATE POLICY "task_comments_insert" ON task_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "task_comments_update" ON task_comments;
CREATE POLICY "task_comments_update" ON task_comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "task_comments_delete" ON task_comments;
CREATE POLICY "task_comments_delete" ON task_comments
    FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- =====================================================
-- 7. COMMUNICATION
-- =====================================================

-- MESSAGES (pas de sender_id/recipient_id, utilise user_id)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
    FOR SELECT USING (
        auth.uid() = user_id
        OR is_manager_or_admin()
    );

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_delete" ON messages;
CREATE POLICY "messages_delete" ON messages
    FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- CHANNELS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "channels_select" ON channels;
CREATE POLICY "channels_select" ON channels
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "channels_insert" ON channels;
CREATE POLICY "channels_insert" ON channels
    FOR INSERT WITH CHECK (is_manager_or_admin());

DROP POLICY IF EXISTS "channels_update" ON channels;
CREATE POLICY "channels_update" ON channels
    FOR UPDATE USING (is_manager_or_admin());

DROP POLICY IF EXISTS "channels_delete" ON channels;
CREATE POLICY "channels_delete" ON channels
    FOR DELETE USING (is_admin());

-- EVENTS (a user_id mais pas created_by)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON events;
CREATE POLICY "events_select" ON events
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "events_insert" ON events;
CREATE POLICY "events_insert" ON events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "events_update" ON events;
CREATE POLICY "events_update" ON events
    FOR UPDATE USING (auth.uid() = user_id OR is_manager_or_admin());

DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_delete" ON events
    FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- =====================================================
-- 8. COMPTABILITE & FINANCE
-- =====================================================

-- ACCOUNTING_ENTRIES
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounting_entries_select" ON accounting_entries;
CREATE POLICY "accounting_entries_select" ON accounting_entries
    FOR SELECT USING (is_manager_or_admin());

DROP POLICY IF EXISTS "accounting_entries_insert" ON accounting_entries;
CREATE POLICY "accounting_entries_insert" ON accounting_entries
    FOR INSERT WITH CHECK (is_manager_or_admin());

DROP POLICY IF EXISTS "accounting_entries_update" ON accounting_entries;
CREATE POLICY "accounting_entries_update" ON accounting_entries
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "accounting_entries_delete" ON accounting_entries;
CREATE POLICY "accounting_entries_delete" ON accounting_entries
    FOR DELETE USING (is_admin());

-- MONTHLY_ACCOUNTING_METRICS
ALTER TABLE monthly_accounting_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_accounting_metrics_select" ON monthly_accounting_metrics;
CREATE POLICY "monthly_accounting_metrics_select" ON monthly_accounting_metrics
    FOR SELECT USING (is_manager_or_admin());

DROP POLICY IF EXISTS "monthly_accounting_metrics_insert" ON monthly_accounting_metrics;
CREATE POLICY "monthly_accounting_metrics_insert" ON monthly_accounting_metrics
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "monthly_accounting_metrics_update" ON monthly_accounting_metrics;
CREATE POLICY "monthly_accounting_metrics_update" ON monthly_accounting_metrics
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "monthly_accounting_metrics_delete" ON monthly_accounting_metrics;
CREATE POLICY "monthly_accounting_metrics_delete" ON monthly_accounting_metrics
    FOR DELETE USING (is_admin());

-- PARTNER_TRANSACTIONS
ALTER TABLE partner_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_transactions_select" ON partner_transactions;
CREATE POLICY "partner_transactions_select" ON partner_transactions
    FOR SELECT USING (is_manager_or_admin());

DROP POLICY IF EXISTS "partner_transactions_insert" ON partner_transactions;
CREATE POLICY "partner_transactions_insert" ON partner_transactions
    FOR INSERT WITH CHECK (is_manager_or_admin());

DROP POLICY IF EXISTS "partner_transactions_update" ON partner_transactions;
CREATE POLICY "partner_transactions_update" ON partner_transactions
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "partner_transactions_delete" ON partner_transactions;
CREATE POLICY "partner_transactions_delete" ON partner_transactions
    FOR DELETE USING (is_admin());

-- =====================================================
-- 9. CONFIGURATION & PARAMETRES
-- =====================================================

-- COMPANY_SETTINGS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_settings_select" ON company_settings;
CREATE POLICY "company_settings_select" ON company_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "company_settings_insert" ON company_settings;
CREATE POLICY "company_settings_insert" ON company_settings
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "company_settings_update" ON company_settings;
CREATE POLICY "company_settings_update" ON company_settings
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "company_settings_delete" ON company_settings;
CREATE POLICY "company_settings_delete" ON company_settings
    FOR DELETE USING (is_admin());

-- DASHBOARD_METRICS
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_metrics_select" ON dashboard_metrics;
CREATE POLICY "dashboard_metrics_select" ON dashboard_metrics
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "dashboard_metrics_insert" ON dashboard_metrics;
CREATE POLICY "dashboard_metrics_insert" ON dashboard_metrics
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "dashboard_metrics_update" ON dashboard_metrics;
CREATE POLICY "dashboard_metrics_update" ON dashboard_metrics
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "dashboard_metrics_delete" ON dashboard_metrics;
CREATE POLICY "dashboard_metrics_delete" ON dashboard_metrics
    FOR DELETE USING (is_admin());

-- =====================================================
-- 10. PARTENAIRES
-- =====================================================

-- PARTNERS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_select" ON partners;
CREATE POLICY "partners_select" ON partners
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "partners_insert" ON partners;
CREATE POLICY "partners_insert" ON partners
    FOR INSERT WITH CHECK (is_manager_or_admin());

DROP POLICY IF EXISTS "partners_update" ON partners;
CREATE POLICY "partners_update" ON partners
    FOR UPDATE USING (is_manager_or_admin());

DROP POLICY IF EXISTS "partners_delete" ON partners;
CREATE POLICY "partners_delete" ON partners
    FOR DELETE USING (is_admin());
