-- =====================================================
-- FONCTIONS HELPER POUR RLS - CRM PROPUL'SEO
-- =====================================================
-- Ces fonctions sont utilisees par les politiques RLS
-- pour verifier les droits d'acces des utilisateurs
-- =====================================================

-- Fonction pour verifier si l'utilisateur connecte est admin
-- Un admin est identifie par son email ou son role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    -- Recuperer le role et l'email de l'utilisateur connecte
    SELECT role, email INTO user_role, user_email
    FROM users
    WHERE auth_user_id = auth.uid();

    -- Verifier si admin par role OU par email specifique
    RETURN (
        user_role = 'admin'
        OR user_email = 'team@propulseo-site.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction pour verifier si l'utilisateur est manager ou admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    -- Recuperer le role et l'email de l'utilisateur connecte
    SELECT role, email INTO user_role, user_email
    FROM users
    WHERE auth_user_id = auth.uid();

    -- Verifier si admin/manager par role OU admin par email specifique
    RETURN (
        user_role IN ('admin', 'manager')
        OR user_email = 'team@propulseo-site.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Tester les fonctions (optionnel - decommenter pour debug)
-- SELECT is_admin();
-- SELECT is_manager_or_admin();
