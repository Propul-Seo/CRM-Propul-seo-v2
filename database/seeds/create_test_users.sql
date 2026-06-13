-- Créer des utilisateurs de test pour le module commercial
INSERT INTO commercial_users (full_name, email, role, is_active) VALUES
('Jean Dupont', 'jean.dupont@example.com', 'commercial', true),
('Marie Martin', 'marie.martin@example.com', 'commercial', true),
('Pierre Durand', 'pierre.durand@example.com', 'commercial', true),
('Sophie Bernard', 'sophie.bernard@example.com', 'commercial', true)
ON CONFLICT (email) DO NOTHING;

-- Vérifier les utilisateurs créés
SELECT id, full_name, email, role, is_active, created_at 
FROM commercial_users 
ORDER BY created_at DESC;

