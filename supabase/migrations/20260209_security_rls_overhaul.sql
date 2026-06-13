-- ============================================================================
-- MIGRATION: Security RLS Overhaul
-- Date: 2026-02-09
-- Description: Complete security hardening - deny-by-default RLS policies
--
-- IMPORTANT: This migration should be tested on a branch first.
-- To rollback, see 20260209_security_rls_rollback.sql
-- ============================================================================

-- ============================================================================
-- PART 1: DROP DANGEROUS FUNCTIONS
-- These functions are critical security vulnerabilities
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_admin_password_direct();
DROP FUNCTION IF EXISTS public.update_admin_password_direct(text, text);
DROP FUNCTION IF EXISTS public.update_admin_password_via_api(text, text, text, text);
DROP FUNCTION IF EXISTS public.call_admin_update_password_function(text, text, text);

-- ============================================================================
-- PART 2: FIX/CREATE HELPER FUNCTIONS
-- All with proper search_path and SECURITY DEFINER where needed
-- ============================================================================

-- 2a. is_admin() - Source of truth for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_role TEXT;
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

-- 2b. is_manager_or_admin() - Manager or admin check
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_role TEXT;
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

-- 2c. user_has_permission(perm_name) - Check a permission flag on the users table
CREATE OR REPLACE FUNCTION public.user_has_permission(perm_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_result boolean;
    v_role text;
    v_email text;
BEGIN
    -- Admin always has all permissions
    SELECT role, email INTO v_role, v_email
    FROM public.users
    WHERE auth_user_id = auth.uid();

    IF v_role = 'admin' OR v_email = 'team@propulseo-site.com' THEN
        RETURN true;
    END IF;

    -- Check specific permission column
    EXECUTE format(
        'SELECT COALESCE(%I, false) FROM public.users WHERE auth_user_id = $1',
        perm_name
    ) INTO v_result USING auth.uid();

    RETURN COALESCE(v_result, false);
EXCEPTION
    WHEN undefined_column THEN
        RETURN false;
END;
$$;

-- ============================================================================
-- PART 3: REVOKE ANON GRANTS ON BUSINESS TABLES
-- Only e-commerce catalog tables keep anon SELECT
-- ============================================================================

DO $$
DECLARE
    t text;
    business_tables text[] := ARRAY[
        'accounting_entries', 'activities', 'activity_log', 'admin_users',
        'archived_accounting_entries', 'archived_projects', 'archived_tasks',
        'channel_members', 'channel_read_status', 'channels',
        'clients', 'company_settings', 'contact_activities', 'contacts',
        'crm_bot_one_activities', 'crm_bot_one_columns', 'crm_bot_one_records',
        'crm_columns', 'crmerp_activities', 'crmerp_leads',
        'dashboard_metrics', 'events', 'google_tokens',
        'lead_notes', 'leads', 'message_reactions', 'messages',
        'monthly_accounting_metrics', 'notification_settings',
        'partner_transactions', 'partners',
        'project_checklists', 'projects', 'prospect_activities',
        'task_comments', 'tasks', 'user_activities',
        'user_permissions', 'user_profiles', 'users', 'yearly_stats'
    ];
BEGIN
    FOREACH t IN ARRAY business_tables LOOP
        EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    END LOOP;
END;
$$;

-- Keep anon SELECT on e-commerce catalog tables (public-facing)
-- categories, products, product_availability, product_themes, themes, delivery_zones
-- customers, addresses, reservations, reservation_items keep authenticated only

REVOKE ALL ON public.customers FROM anon;
REVOKE ALL ON public.addresses FROM anon;
REVOKE ALL ON public.reservations FROM anon;
REVOKE ALL ON public.reservation_items FROM anon;

-- For catalog tables, only allow SELECT for anon
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.categories FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.products FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.product_availability FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.product_themes FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.themes FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.delivery_zones FROM anon;

-- ============================================================================
-- PART 4: REVOKE ANON EXECUTE ON ALL PUBLIC FUNCTIONS
-- Then grant back only to authenticated where needed
-- ============================================================================

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public;

-- Grant execute to authenticated only for functions the app needs
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_channel(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_channels(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_channel_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_channel_unread_count(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_channel_as_read(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_channel_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reply_message_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bot_one_activities(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_bot_one_activity(uuid, text, text, timestamptz, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_bot_one_activity(uuid, text, text, timestamptz, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_bot_one_record_activity(uuid, text, text, timestamptz, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_bot_one_record_to_client(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_client_from_bot_one_record(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_client_from_bot_one_record(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_bot_one_to_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_bot_one_activity_to_main(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_if_missing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_daily_stats(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_commercial_kpis(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_commercial_chart_data(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_commercial_leaderboard(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.format_french_date(timestamptz) TO authenticated;

-- Trigger functions need to be executable by the trigger system
-- They run as the table owner, so no explicit grant needed for anon/authenticated

-- ============================================================================
-- PART 5: DROP ALL EXISTING POLICIES AND CREATE CLEAN ONES
-- Strategy: deny-by-default, admin sees all, users see own data
-- ============================================================================

-- ============================================================================
-- 5.1 USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own_or_admin" ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- All authenticated users can see basic user info (needed for UI: names, avatars)
-- But NOT permission columns - those are visible only to the user themselves or admin
CREATE POLICY "users_select_authenticated"
ON public.users FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- Users can insert their own profile (on signup)
CREATE POLICY "users_insert_own"
ON public.users FOR INSERT TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- Users can update their own non-permission fields; admin can update all
CREATE POLICY "users_update_own_or_admin"
ON public.users FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid() OR public.is_admin())
WITH CHECK (auth_user_id = auth.uid() OR public.is_admin());

-- Only admin can delete users
CREATE POLICY "users_delete_admin"
ON public.users FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.2 USER_PROFILES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_authenticated"
ON public.user_profiles FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "user_profiles_insert_own"
ON public.user_profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_own_or_admin"
ON public.user_profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "user_profiles_delete_admin"
ON public.user_profiles FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.3 USER_PERMISSIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "admin_can_manage_all_permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "users_can_view_own_permissions" ON public.user_permissions;

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions FORCE ROW LEVEL SECURITY;

CREATE POLICY "user_permissions_select_own_or_admin"
ON public.user_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "user_permissions_manage_admin"
ON public.user_permissions FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 5.4 CLIENTS TABLE (CRM Principal)
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;

CREATE POLICY "clients_select"
ON public.clients FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_leads')
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "clients_insert"
ON public.clients FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin()
    OR public.user_has_permission('can_view_leads')
);

CREATE POLICY "clients_update"
ON public.clients FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_edit_leads')
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_manager_or_admin())
    )
)
WITH CHECK (
    public.is_admin()
    OR (
        public.user_has_permission('can_edit_leads')
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "clients_delete"
ON public.clients FOR DELETE TO authenticated
USING (
    public.is_admin()
    OR (user_id = auth.uid() AND public.user_has_permission('can_view_leads'))
);

-- ============================================================================
-- 5.5 CONTACTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Allow insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow read contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow update contacts" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete" ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert" ON public.contacts;
DROP POLICY IF EXISTS "contacts_select" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update" ON public.contacts;
DROP POLICY IF EXISTS "users_can_delete_contacts" ON public.contacts;
DROP POLICY IF EXISTS "users_can_insert_contacts" ON public.contacts;
DROP POLICY IF EXISTS "users_can_see_all_contacts" ON public.contacts;
DROP POLICY IF EXISTS "users_can_update_contacts" ON public.contacts;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts FORCE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select"
ON public.contacts FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_leads')
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "contacts_insert"
ON public.contacts FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin()
    OR public.user_has_permission('can_view_leads')
);

CREATE POLICY "contacts_update"
ON public.contacts FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_edit_leads')
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_manager_or_admin())
    )
)
WITH CHECK (
    public.is_admin()
    OR (
        public.user_has_permission('can_edit_leads')
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "contacts_delete"
ON public.contacts FOR DELETE TO authenticated
USING (
    public.is_admin()
    OR (user_id = auth.uid() AND public.user_has_permission('can_view_leads'))
);

-- ============================================================================
-- 5.6 CONTACT_ACTIVITIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Allow all users to delete activities" ON public.contact_activities;
DROP POLICY IF EXISTS "Allow all users to insert activities" ON public.contact_activities;
DROP POLICY IF EXISTS "Allow all users to update activities" ON public.contact_activities;
DROP POLICY IF EXISTS "Allow all users to view activities" ON public.contact_activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON public.contact_activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.contact_activities;
DROP POLICY IF EXISTS "Users can update own activities" ON public.contact_activities;
DROP POLICY IF EXISTS "Users can view own activities" ON public.contact_activities;
DROP POLICY IF EXISTS "contact_activities_select_with_deleted_users" ON public.contact_activities;

ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_activities FORCE ROW LEVEL SECURITY;

CREATE POLICY "contact_activities_select"
ON public.contact_activities FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_leads')
        AND (
            user_id = auth.uid()
            OR user_id IS NULL
            OR public.is_manager_or_admin()
            OR EXISTS (
                SELECT 1 FROM public.contacts c
                WHERE c.id = contact_activities.contact_id
                AND (c.user_id = auth.uid() OR c.assigned_to = auth.uid())
            )
        )
    )
);

CREATE POLICY "contact_activities_insert"
ON public.contact_activities FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_leads')
        AND user_id = auth.uid()
    )
);

CREATE POLICY "contact_activities_update"
ON public.contact_activities FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_edit_leads')
        AND (
            user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.contacts c
                WHERE c.id = contact_activities.contact_id
                AND (c.user_id = auth.uid() OR c.assigned_to = auth.uid())
            )
        )
    )
);

CREATE POLICY "contact_activities_delete"
ON public.contact_activities FOR DELETE TO authenticated
USING (
    public.is_admin()
    OR (user_id = auth.uid() AND public.user_has_permission('can_view_leads'))
);

-- ============================================================================
-- 5.7 LEADS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "leads_delete" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

CREATE POLICY "leads_select"
ON public.leads FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_leads')
        AND (assigned_to = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "leads_insert"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin()
    OR public.user_has_permission('can_view_leads')
);

CREATE POLICY "leads_update"
ON public.leads FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_edit_leads')
        AND (assigned_to = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "leads_delete"
ON public.leads FOR DELETE TO authenticated
USING (
    public.is_admin()
    OR (assigned_to = auth.uid() AND public.user_has_permission('can_view_leads'))
);

-- ============================================================================
-- 5.8 LEAD_NOTES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "lead_notes_delete" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_insert" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_select" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_update" ON public.lead_notes;

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes FORCE ROW LEVEL SECURITY;

CREATE POLICY "lead_notes_select"
ON public.lead_notes FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_leads')
        AND (created_by = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "lead_notes_insert"
ON public.lead_notes FOR INSERT TO authenticated
WITH CHECK (
    public.user_has_permission('can_view_leads')
    AND created_by = auth.uid()
);

CREATE POLICY "lead_notes_update"
ON public.lead_notes FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "lead_notes_delete"
ON public.lead_notes FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.is_admin());

-- ============================================================================
-- 5.9 CRM BOT ONE
-- ============================================================================

-- crm_bot_one_records
DROP POLICY IF EXISTS "crm_bot_one_records_delete" ON public.crm_bot_one_records;
DROP POLICY IF EXISTS "crm_bot_one_records_insert" ON public.crm_bot_one_records;
DROP POLICY IF EXISTS "crm_bot_one_records_select" ON public.crm_bot_one_records;
DROP POLICY IF EXISTS "crm_bot_one_records_update" ON public.crm_bot_one_records;

ALTER TABLE public.crm_bot_one_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_bot_one_records FORCE ROW LEVEL SECURITY;

CREATE POLICY "crm_bot_one_records_select"
ON public.crm_bot_one_records FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_crm_bot_one')
        AND (user_id = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "crm_bot_one_records_insert"
ON public.crm_bot_one_records FOR INSERT TO authenticated
WITH CHECK (
    public.user_has_permission('can_view_crm_bot_one')
);

CREATE POLICY "crm_bot_one_records_update"
ON public.crm_bot_one_records FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_crm_bot_one')
        AND (user_id = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "crm_bot_one_records_delete"
ON public.crm_bot_one_records FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- crm_bot_one_activities
DROP POLICY IF EXISTS "crm_bot_one_activities_delete" ON public.crm_bot_one_activities;
DROP POLICY IF EXISTS "crm_bot_one_activities_insert" ON public.crm_bot_one_activities;
DROP POLICY IF EXISTS "crm_bot_one_activities_select" ON public.crm_bot_one_activities;
DROP POLICY IF EXISTS "crm_bot_one_activities_update" ON public.crm_bot_one_activities;

ALTER TABLE public.crm_bot_one_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_bot_one_activities FORCE ROW LEVEL SECURITY;

CREATE POLICY "crm_bot_one_activities_select"
ON public.crm_bot_one_activities FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_crm_bot_one')
        AND (
            public.is_manager_or_admin()
            OR EXISTS (
                SELECT 1 FROM public.crm_bot_one_records r
                WHERE r.id = crm_bot_one_activities.bot_one_record_id
                AND r.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "crm_bot_one_activities_insert"
ON public.crm_bot_one_activities FOR INSERT TO authenticated
WITH CHECK (
    public.user_has_permission('can_view_crm_bot_one')
);

CREATE POLICY "crm_bot_one_activities_update"
ON public.crm_bot_one_activities FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.crm_bot_one_records r
        WHERE r.id = crm_bot_one_activities.bot_one_record_id
        AND r.user_id = auth.uid()
    )
);

CREATE POLICY "crm_bot_one_activities_delete"
ON public.crm_bot_one_activities FOR DELETE TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.crm_bot_one_records r
        WHERE r.id = crm_bot_one_activities.bot_one_record_id
        AND r.user_id = auth.uid()
    )
);

-- crm_bot_one_columns (config table)
DROP POLICY IF EXISTS "crm_bot_one_columns_delete" ON public.crm_bot_one_columns;
DROP POLICY IF EXISTS "crm_bot_one_columns_insert" ON public.crm_bot_one_columns;
DROP POLICY IF EXISTS "crm_bot_one_columns_select" ON public.crm_bot_one_columns;
DROP POLICY IF EXISTS "crm_bot_one_columns_update" ON public.crm_bot_one_columns;

ALTER TABLE public.crm_bot_one_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_bot_one_columns FORCE ROW LEVEL SECURITY;

CREATE POLICY "crm_bot_one_columns_select"
ON public.crm_bot_one_columns FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_crm_bot_one'));

CREATE POLICY "crm_bot_one_columns_insert"
ON public.crm_bot_one_columns FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "crm_bot_one_columns_update"
ON public.crm_bot_one_columns FOR UPDATE TO authenticated
USING (public.is_admin());

CREATE POLICY "crm_bot_one_columns_delete"
ON public.crm_bot_one_columns FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.10 CRM ERP (crmerp_leads, crmerp_activities)
-- ============================================================================

-- crmerp_leads (uses assignee_id, not assigned_to)
DROP POLICY IF EXISTS "crmerp_leads_delete" ON public.crmerp_leads;
DROP POLICY IF EXISTS "crmerp_leads_insert" ON public.crmerp_leads;
DROP POLICY IF EXISTS "crmerp_leads_select" ON public.crmerp_leads;
DROP POLICY IF EXISTS "crmerp_leads_update" ON public.crmerp_leads;

ALTER TABLE public.crmerp_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crmerp_leads FORCE ROW LEVEL SECURITY;

CREATE POLICY "crmerp_leads_select"
ON public.crmerp_leads FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_crm_erp')
        AND (assignee_id = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "crmerp_leads_insert"
ON public.crmerp_leads FOR INSERT TO authenticated
WITH CHECK (
    public.user_has_permission('can_view_crm_erp')
);

CREATE POLICY "crmerp_leads_update"
ON public.crmerp_leads FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_crm_erp')
        AND (assignee_id = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "crmerp_leads_delete"
ON public.crmerp_leads FOR DELETE TO authenticated
USING (public.is_admin());

-- crmerp_activities (uses created_by, linked to lead_id)
DROP POLICY IF EXISTS "crmerp_activities_delete" ON public.crmerp_activities;
DROP POLICY IF EXISTS "crmerp_activities_insert" ON public.crmerp_activities;
DROP POLICY IF EXISTS "crmerp_activities_select" ON public.crmerp_activities;
DROP POLICY IF EXISTS "crmerp_activities_update" ON public.crmerp_activities;

ALTER TABLE public.crmerp_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crmerp_activities FORCE ROW LEVEL SECURITY;

CREATE POLICY "crmerp_activities_select"
ON public.crmerp_activities FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_crm_erp')
        AND (
            created_by = auth.uid()
            OR public.is_manager_or_admin()
            OR EXISTS (
                SELECT 1 FROM public.crmerp_leads l
                WHERE l.id = crmerp_activities.lead_id
                AND l.assignee_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "crmerp_activities_insert"
ON public.crmerp_activities FOR INSERT TO authenticated
WITH CHECK (
    public.user_has_permission('can_view_crm_erp')
    AND created_by = auth.uid()
);

CREATE POLICY "crmerp_activities_update"
ON public.crmerp_activities FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR (created_by = auth.uid() AND public.user_has_permission('can_view_crm_erp'))
);

CREATE POLICY "crmerp_activities_delete"
ON public.crmerp_activities FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.is_admin());

-- ============================================================================
-- 5.11 CRM_COLUMNS (config table, shared)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can modify CRM columns" ON public.crm_columns;
DROP POLICY IF EXISTS "Allow authenticated users to modify crm_columns" ON public.crm_columns;
DROP POLICY IF EXISTS "Allow authenticated users to read crm_columns" ON public.crm_columns;
DROP POLICY IF EXISTS "Allow insert columns" ON public.crm_columns;
DROP POLICY IF EXISTS "Allow read active columns" ON public.crm_columns;
DROP POLICY IF EXISTS "Allow update columns" ON public.crm_columns;
DROP POLICY IF EXISTS "Users can view CRM columns" ON public.crm_columns;

ALTER TABLE public.crm_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_columns FORCE ROW LEVEL SECURITY;

CREATE POLICY "crm_columns_select"
ON public.crm_columns FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_leads'));

CREATE POLICY "crm_columns_insert"
ON public.crm_columns FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "crm_columns_update"
ON public.crm_columns FOR UPDATE TO authenticated
USING (public.is_admin());

CREATE POLICY "crm_columns_delete"
ON public.crm_columns FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.12 PROJECTS TABLE (shared resource, no user_id column)
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

CREATE POLICY "projects_select"
ON public.projects FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_projects'));

CREATE POLICY "projects_insert"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (public.user_has_permission('can_create_projects'));

CREATE POLICY "projects_update"
ON public.projects FOR UPDATE TO authenticated
USING (public.user_has_permission('can_edit_projects') OR public.is_admin());

CREATE POLICY "projects_delete"
ON public.projects FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.13 PROJECT_CHECKLISTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "project_checklists_delete" ON public.project_checklists;
DROP POLICY IF EXISTS "project_checklists_insert" ON public.project_checklists;
DROP POLICY IF EXISTS "project_checklists_select" ON public.project_checklists;
DROP POLICY IF EXISTS "project_checklists_update" ON public.project_checklists;

ALTER TABLE public.project_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_checklists FORCE ROW LEVEL SECURITY;

CREATE POLICY "project_checklists_select"
ON public.project_checklists FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_projects'));

CREATE POLICY "project_checklists_insert"
ON public.project_checklists FOR INSERT TO authenticated
WITH CHECK (public.user_has_permission('can_view_projects'));

CREATE POLICY "project_checklists_update"
ON public.project_checklists FOR UPDATE TO authenticated
USING (public.user_has_permission('can_view_projects'));

CREATE POLICY "project_checklists_delete"
ON public.project_checklists FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.14 TASKS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own and assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view own and assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select"
ON public.tasks FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_tasks')
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "tasks_insert"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
    public.user_has_permission('can_view_tasks')
);

CREATE POLICY "tasks_update"
ON public.tasks FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_tasks')
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_manager_or_admin())
    )
);

CREATE POLICY "tasks_delete"
ON public.tasks FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 5.15 TASK_COMMENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "task_comments_delete" ON public.task_comments;
DROP POLICY IF EXISTS "task_comments_insert" ON public.task_comments;
DROP POLICY IF EXISTS "task_comments_select" ON public.task_comments;
DROP POLICY IF EXISTS "task_comments_update" ON public.task_comments;

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments FORCE ROW LEVEL SECURITY;

CREATE POLICY "task_comments_select"
ON public.task_comments FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_tasks')
        AND (
            user_id = auth.uid()
            OR public.is_manager_or_admin()
            OR EXISTS (
                SELECT 1 FROM public.tasks t
                WHERE t.id = task_comments.task_id
                AND (t.user_id = auth.uid() OR t.assigned_to = auth.uid())
            )
        )
    )
);

CREATE POLICY "task_comments_insert"
ON public.task_comments FOR INSERT TO authenticated
WITH CHECK (
    public.user_has_permission('can_view_tasks')
    AND user_id = auth.uid()
);

CREATE POLICY "task_comments_update"
ON public.task_comments FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "task_comments_delete"
ON public.task_comments FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 5.16 ACCOUNTING_ENTRIES TABLE (HIGH SENSITIVITY)
-- ============================================================================

DROP POLICY IF EXISTS "accounting_entries_delete" ON public.accounting_entries;
DROP POLICY IF EXISTS "accounting_entries_insert" ON public.accounting_entries;
DROP POLICY IF EXISTS "accounting_entries_select" ON public.accounting_entries;
DROP POLICY IF EXISTS "accounting_entries_update" ON public.accounting_entries;

ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries FORCE ROW LEVEL SECURITY;

CREATE POLICY "accounting_entries_select"
ON public.accounting_entries FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_finance'));

CREATE POLICY "accounting_entries_insert"
ON public.accounting_entries FOR INSERT TO authenticated
WITH CHECK (public.user_has_permission('can_view_finance'));

CREATE POLICY "accounting_entries_update"
ON public.accounting_entries FOR UPDATE TO authenticated
USING (public.is_admin());

CREATE POLICY "accounting_entries_delete"
ON public.accounting_entries FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.17 MONTHLY_ACCOUNTING_METRICS (HIGH SENSITIVITY)
-- ============================================================================

DROP POLICY IF EXISTS "monthly_accounting_metrics_delete" ON public.monthly_accounting_metrics;
DROP POLICY IF EXISTS "monthly_accounting_metrics_insert" ON public.monthly_accounting_metrics;
DROP POLICY IF EXISTS "monthly_accounting_metrics_select" ON public.monthly_accounting_metrics;
DROP POLICY IF EXISTS "monthly_accounting_metrics_update" ON public.monthly_accounting_metrics;

ALTER TABLE public.monthly_accounting_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_accounting_metrics FORCE ROW LEVEL SECURITY;

CREATE POLICY "monthly_accounting_metrics_select"
ON public.monthly_accounting_metrics FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_finance'));

CREATE POLICY "monthly_accounting_metrics_insert"
ON public.monthly_accounting_metrics FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "monthly_accounting_metrics_update"
ON public.monthly_accounting_metrics FOR UPDATE TO authenticated
USING (public.is_admin());

CREATE POLICY "monthly_accounting_metrics_delete"
ON public.monthly_accounting_metrics FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.18 PARTNERS & PARTNER_TRANSACTIONS (FINANCIAL)
-- ============================================================================

-- partners
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.partners;
DROP POLICY IF EXISTS "partners_delete" ON public.partners;
DROP POLICY IF EXISTS "partners_insert" ON public.partners;
DROP POLICY IF EXISTS "partners_select" ON public.partners;
DROP POLICY IF EXISTS "partners_update" ON public.partners;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners FORCE ROW LEVEL SECURITY;

CREATE POLICY "partners_select"
ON public.partners FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_finance'));

CREATE POLICY "partners_insert"
ON public.partners FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "partners_update"
ON public.partners FOR UPDATE TO authenticated
USING (public.is_manager_or_admin());

CREATE POLICY "partners_delete"
ON public.partners FOR DELETE TO authenticated
USING (public.is_admin());

-- partner_transactions
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.partner_transactions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.partner_transactions;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.partner_transactions;
DROP POLICY IF EXISTS "partner_transactions_delete" ON public.partner_transactions;
DROP POLICY IF EXISTS "partner_transactions_insert" ON public.partner_transactions;
DROP POLICY IF EXISTS "partner_transactions_select" ON public.partner_transactions;
DROP POLICY IF EXISTS "partner_transactions_update" ON public.partner_transactions;

ALTER TABLE public.partner_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_transactions FORCE ROW LEVEL SECURITY;

CREATE POLICY "partner_transactions_select"
ON public.partner_transactions FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_finance'));

CREATE POLICY "partner_transactions_insert"
ON public.partner_transactions FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "partner_transactions_update"
ON public.partner_transactions FOR UPDATE TO authenticated
USING (public.is_admin());

CREATE POLICY "partner_transactions_delete"
ON public.partner_transactions FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.19 DASHBOARD_METRICS (shared, no user_id)
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage dashboard metrics" ON public.dashboard_metrics;
DROP POLICY IF EXISTS "dashboard_metrics_delete" ON public.dashboard_metrics;
DROP POLICY IF EXISTS "dashboard_metrics_insert" ON public.dashboard_metrics;
DROP POLICY IF EXISTS "dashboard_metrics_select" ON public.dashboard_metrics;
DROP POLICY IF EXISTS "dashboard_metrics_update" ON public.dashboard_metrics;

ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_metrics FORCE ROW LEVEL SECURITY;

CREATE POLICY "dashboard_metrics_select"
ON public.dashboard_metrics FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_dashboard'));

CREATE POLICY "dashboard_metrics_insert"
ON public.dashboard_metrics FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "dashboard_metrics_update"
ON public.dashboard_metrics FOR UPDATE TO authenticated
USING (public.is_admin());

CREATE POLICY "dashboard_metrics_delete"
ON public.dashboard_metrics FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.20 EVENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own events" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events FORCE ROW LEVEL SECURITY;

CREATE POLICY "events_select"
ON public.events FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_manager_or_admin());

CREATE POLICY "events_insert"
ON public.events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "events_update"
ON public.events FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_manager_or_admin());

CREATE POLICY "events_delete"
ON public.events FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 5.21 GOOGLE_TOKENS TABLE (CRITICAL - OAuth tokens)
-- ============================================================================

DROP POLICY IF EXISTS "Users can access Google tokens" ON public.google_tokens;

ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_tokens FORCE ROW LEVEL SECURITY;

-- Only own tokens (id = auth.uid())
CREATE POLICY "google_tokens_select"
ON public.google_tokens FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "google_tokens_insert"
ON public.google_tokens FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "google_tokens_update"
ON public.google_tokens FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "google_tokens_delete"
ON public.google_tokens FOR DELETE TO authenticated
USING (id = auth.uid());

-- ============================================================================
-- 5.22 CHANNELS / MESSAGES / CHAT
-- ============================================================================

-- channels
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Users can view channels" ON public.channels;
DROP POLICY IF EXISTS "channels_delete" ON public.channels;
DROP POLICY IF EXISTS "channels_insert" ON public.channels;
DROP POLICY IF EXISTS "channels_select" ON public.channels;
DROP POLICY IF EXISTS "channels_update" ON public.channels;

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels FORCE ROW LEVEL SECURITY;

CREATE POLICY "channels_select"
ON public.channels FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_chat'));

CREATE POLICY "channels_insert"
ON public.channels FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "channels_update"
ON public.channels FOR UPDATE TO authenticated
USING (public.is_manager_or_admin());

CREATE POLICY "channels_delete"
ON public.channels FOR DELETE TO authenticated
USING (public.is_admin());

-- channel_members
DROP POLICY IF EXISTS "Ajout de membres par les admins du canal" ON public.channel_members;
DROP POLICY IF EXISTS "Membres visibles par les membres du canal" ON public.channel_members;
DROP POLICY IF EXISTS "Modification des rôles par les admins du canal" ON public.channel_members;
DROP POLICY IF EXISTS "Suppression de membres par les admins du canal" ON public.channel_members;

ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members FORCE ROW LEVEL SECURITY;

CREATE POLICY "channel_members_select"
ON public.channel_members FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = channel_members.channel_id
        AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "channel_members_insert"
ON public.channel_members FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = channel_members.channel_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
);

CREATE POLICY "channel_members_update"
ON public.channel_members FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = channel_members.channel_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
);

CREATE POLICY "channel_members_delete"
ON public.channel_members FOR DELETE TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = channel_members.channel_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
);

-- channel_read_status
DROP POLICY IF EXISTS "Users can insert own read status" ON public.channel_read_status;
DROP POLICY IF EXISTS "Users can update own read status" ON public.channel_read_status;
DROP POLICY IF EXISTS "Users can view own read status" ON public.channel_read_status;

ALTER TABLE public.channel_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_read_status FORCE ROW LEVEL SECURITY;

CREATE POLICY "channel_read_status_select"
ON public.channel_read_status FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "channel_read_status_insert"
ON public.channel_read_status FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "channel_read_status_update"
ON public.channel_read_status FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- messages
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;

CREATE POLICY "messages_select"
ON public.messages FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR (
        public.user_has_permission('can_view_chat')
        AND EXISTS (
            SELECT 1 FROM public.channel_members cm
            WHERE cm.channel_id = messages.channel_id
            AND cm.user_id = auth.uid()
        )
    )
);

CREATE POLICY "messages_insert"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND public.user_has_permission('can_view_chat')
);

CREATE POLICY "messages_update"
ON public.messages FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "messages_delete"
ON public.messages FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- message_reactions
DROP POLICY IF EXISTS "Tout le monde peut voir les réactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Utilisateurs peuvent gérer leurs réactions" ON public.message_reactions;

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions FORCE ROW LEVEL SECURITY;

CREATE POLICY "message_reactions_select"
ON public.message_reactions FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "message_reactions_manage_own"
ON public.message_reactions FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5.23 ACTIVITIES / PROSPECT_ACTIVITIES / USER_ACTIVITIES
-- ============================================================================

-- activities
DROP POLICY IF EXISTS "activities_delete" ON public.activities;
DROP POLICY IF EXISTS "activities_insert" ON public.activities;
DROP POLICY IF EXISTS "activities_select" ON public.activities;
DROP POLICY IF EXISTS "activities_update" ON public.activities;

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities FORCE ROW LEVEL SECURITY;

CREATE POLICY "activities_select"
ON public.activities FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_leads'));

CREATE POLICY "activities_insert"
ON public.activities FOR INSERT TO authenticated
WITH CHECK (public.user_has_permission('can_view_leads'));

CREATE POLICY "activities_update"
ON public.activities FOR UPDATE TO authenticated
USING (public.is_manager_or_admin());

CREATE POLICY "activities_delete"
ON public.activities FOR DELETE TO authenticated
USING (public.is_admin());

-- prospect_activities
DROP POLICY IF EXISTS "prospect_activities_delete" ON public.prospect_activities;
DROP POLICY IF EXISTS "prospect_activities_insert" ON public.prospect_activities;
DROP POLICY IF EXISTS "prospect_activities_select" ON public.prospect_activities;
DROP POLICY IF EXISTS "prospect_activities_update" ON public.prospect_activities;

ALTER TABLE public.prospect_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_activities FORCE ROW LEVEL SECURITY;

CREATE POLICY "prospect_activities_select"
ON public.prospect_activities FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_leads'));

CREATE POLICY "prospect_activities_insert"
ON public.prospect_activities FOR INSERT TO authenticated
WITH CHECK (public.user_has_permission('can_view_leads'));

CREATE POLICY "prospect_activities_update"
ON public.prospect_activities FOR UPDATE TO authenticated
USING (public.is_manager_or_admin());

CREATE POLICY "prospect_activities_delete"
ON public.prospect_activities FOR DELETE TO authenticated
USING (public.is_admin());

-- user_activities
DROP POLICY IF EXISTS "user_activities_delete" ON public.user_activities;
DROP POLICY IF EXISTS "user_activities_insert" ON public.user_activities;
DROP POLICY IF EXISTS "user_activities_select" ON public.user_activities;
DROP POLICY IF EXISTS "user_activities_select_all_with_deleted_users" ON public.user_activities;
DROP POLICY IF EXISTS "user_activities_update" ON public.user_activities;

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities FORCE ROW LEVEL SECURITY;

CREATE POLICY "user_activities_select"
ON public.user_activities FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR public.is_manager_or_admin()
);

CREATE POLICY "user_activities_insert"
ON public.user_activities FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_activities_update"
ON public.user_activities FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "user_activities_delete"
ON public.user_activities FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.24 ACTIVITY_LOG
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_select_all_with_deleted_users" ON public.activity_log;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select"
ON public.activity_log FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR public.is_manager_or_admin()
);

CREATE POLICY "activity_log_insert"
ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 5.25 ARCHIVED TABLES
-- ============================================================================

-- archived_accounting_entries
DROP POLICY IF EXISTS "Users can delete own archived_accounting_entries" ON public.archived_accounting_entries;
DROP POLICY IF EXISTS "Users can insert own archived_accounting_entries" ON public.archived_accounting_entries;
DROP POLICY IF EXISTS "Users can update own archived_accounting_entries" ON public.archived_accounting_entries;
DROP POLICY IF EXISTS "Users can view own archived_accounting_entries" ON public.archived_accounting_entries;

ALTER TABLE public.archived_accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_accounting_entries FORCE ROW LEVEL SECURITY;

CREATE POLICY "archived_accounting_entries_select"
ON public.archived_accounting_entries FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_finance'));

CREATE POLICY "archived_accounting_entries_insert"
ON public.archived_accounting_entries FOR INSERT TO authenticated
WITH CHECK (public.user_has_permission('can_view_finance'));

CREATE POLICY "archived_accounting_entries_update"
ON public.archived_accounting_entries FOR UPDATE TO authenticated
USING (public.is_admin());

CREATE POLICY "archived_accounting_entries_delete"
ON public.archived_accounting_entries FOR DELETE TO authenticated
USING (public.is_admin());

-- archived_projects
DROP POLICY IF EXISTS "Users can insert own archived_projects" ON public.archived_projects;
DROP POLICY IF EXISTS "Users can view own archived_projects" ON public.archived_projects;

ALTER TABLE public.archived_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_projects FORCE ROW LEVEL SECURITY;

CREATE POLICY "archived_projects_select"
ON public.archived_projects FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_projects'));

CREATE POLICY "archived_projects_insert"
ON public.archived_projects FOR INSERT TO authenticated
WITH CHECK (public.user_has_permission('can_view_projects'));

CREATE POLICY "archived_projects_delete"
ON public.archived_projects FOR DELETE TO authenticated
USING (public.is_admin());

-- archived_tasks
DROP POLICY IF EXISTS "Users can insert own archived_tasks" ON public.archived_tasks;
DROP POLICY IF EXISTS "Users can view own archived_tasks" ON public.archived_tasks;

ALTER TABLE public.archived_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY "archived_tasks_select"
ON public.archived_tasks FOR SELECT TO authenticated
USING (public.user_has_permission('can_view_tasks'));

CREATE POLICY "archived_tasks_insert"
ON public.archived_tasks FOR INSERT TO authenticated
WITH CHECK (public.user_has_permission('can_view_tasks'));

CREATE POLICY "archived_tasks_delete"
ON public.archived_tasks FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.26 COMPANY_SETTINGS
-- ============================================================================

DROP POLICY IF EXISTS "company_settings_delete" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_insert" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_select" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_update" ON public.company_settings;

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY "company_settings_select"
ON public.company_settings FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "company_settings_insert"
ON public.company_settings FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "company_settings_update"
ON public.company_settings FOR UPDATE TO authenticated
USING (public.is_admin());

CREATE POLICY "company_settings_delete"
ON public.company_settings FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5.27 NOTIFICATION_SETTINGS
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own notification settings" ON public.notification_settings;

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings FORCE ROW LEVEL SECURITY;

-- notification_settings.user_id references users.id (not auth.uid())
-- So we need to join through users table
CREATE POLICY "notification_settings_manage_own"
ON public.notification_settings FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = notification_settings.user_id
        AND u.auth_user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = notification_settings.user_id
        AND u.auth_user_id = auth.uid()
    )
);

-- ============================================================================
-- 5.28 ADMIN_USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_select"
ON public.admin_users FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "admin_users_manage"
ON public.admin_users FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 5.29 YEARLY_STATS
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own yearly_stats" ON public.yearly_stats;

ALTER TABLE public.yearly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_stats FORCE ROW LEVEL SECURITY;

CREATE POLICY "yearly_stats_manage_own"
ON public.yearly_stats FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 5.30 E-COMMERCE TABLES (keep existing policies, they're mostly fine)
-- ============================================================================

-- categories - keep anon SELECT true (public catalog)
-- products - keep anon SELECT where is_active (public catalog)
-- product_availability - keep anon SELECT true (public catalog)
-- product_themes - keep anon SELECT true (public catalog)
-- themes - keep anon SELECT true (public catalog)
-- delivery_zones - keep anon SELECT where is_active (public catalog)
-- customers - keep authenticated own-id policies
-- addresses - keep authenticated own-customer policies
-- reservations - keep authenticated own-customer policies
-- reservation_items - keep authenticated via-reservation policies

-- No changes needed for e-commerce tables - policies are already correct

-- ============================================================================
-- PART 6: FIX REMAINING SECURITY DEFINER FUNCTIONS
-- Add SET search_path = '' to all that are missing it
-- ============================================================================

-- Fix can_access_channel
CREATE OR REPLACE FUNCTION public.can_access_channel(channel_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = channel_uuid
        AND user_id = user_uuid
    ) OR EXISTS (
        SELECT 1 FROM public.channels
        WHERE id = channel_uuid
        AND is_public = true
    );
END;
$$;

-- Fix get_users_list - also add admin check
CREATE OR REPLACE FUNCTION public.get_users_list()
RETURNS TABLE(id uuid, email text, name text, avatar_url text, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Only authenticated users can list users
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT u.id, u.email, u.name, u.avatar_url, u.created_at
    FROM public.users u
    WHERE u.is_active = true
    ORDER BY u.name;
END;
$$;

-- Fix create_user_profile_if_missing - add admin check
CREATE OR REPLACE FUNCTION public.create_user_profile_if_missing(auth_user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Only allow creating own profile or admin
    IF auth.uid() != auth_user_uuid AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Check if profile exists
    IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth_user_uuid) THEN
        RETURN false;
    END IF;

    -- Create profile from auth user
    INSERT INTO public.users (auth_user_id, email, name)
    SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email)
    FROM auth.users
    WHERE id = auth_user_uuid;

    RETURN true;
END;
$$;

-- Fix handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 7: ENSURE FORCE ROW LEVEL SECURITY ON ALL PUBLIC TABLES
-- This ensures even table owners (postgres role) are subject to RLS
-- ============================================================================

DO $$
DECLARE
    t text;
    all_public_tables text[] := ARRAY[
        'accounting_entries', 'activities', 'activity_log', 'addresses',
        'admin_users', 'archived_accounting_entries', 'archived_projects',
        'archived_tasks', 'categories', 'channel_members', 'channel_read_status',
        'channels', 'clients', 'company_settings', 'contact_activities',
        'contacts', 'crm_bot_one_activities', 'crm_bot_one_columns',
        'crm_bot_one_records', 'crm_columns', 'crmerp_activities',
        'crmerp_leads', 'customers', 'dashboard_metrics', 'delivery_zones',
        'events', 'google_tokens', 'lead_notes', 'leads',
        'message_reactions', 'messages', 'monthly_accounting_metrics',
        'notification_settings', 'partner_transactions', 'partners',
        'product_availability', 'product_themes', 'products',
        'project_checklists', 'projects', 'prospect_activities',
        'reservation_items', 'reservations', 'task_comments', 'tasks',
        'themes', 'user_activities', 'user_permissions', 'user_profiles',
        'users', 'yearly_stats'
    ];
BEGIN
    FOREACH t IN ARRAY all_public_tables LOOP
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    END LOOP;
END;
$$;
