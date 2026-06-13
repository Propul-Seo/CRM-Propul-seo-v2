-- Migration pour corriger le système de comptage des messages non lus
-- Création de la table de suivi des messages lus par canal et utilisateur

-- Table pour tracker le dernier message lu par utilisateur dans chaque canal
CREATE TABLE IF NOT EXISTS channel_read_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, channel_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_channel_read_status_user_channel ON channel_read_status(user_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_read_status_channel ON channel_read_status(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_read_status_last_read ON channel_read_status(last_read_at);

-- RLS pour la sécurité
ALTER TABLE channel_read_status ENABLE ROW LEVEL SECURITY;

-- Politique : utilisateur peut voir uniquement ses propres statuts de lecture
CREATE POLICY "Users can view own read status" ON channel_read_status
    FOR SELECT USING (auth.uid() = user_id);

-- Politique : utilisateur peut modifier uniquement ses propres statuts de lecture
CREATE POLICY "Users can update own read status" ON channel_read_status
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique : utilisateur peut insérer ses propres statuts de lecture
CREATE POLICY "Users can insert own read status" ON channel_read_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_channel_read_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER trigger_update_channel_read_status_updated_at
    BEFORE UPDATE ON channel_read_status
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_read_status_updated_at();

-- Fonction pour obtenir le nombre de messages non lus d'un canal pour un utilisateur
CREATE OR REPLACE FUNCTION get_channel_unread_count(
    p_channel_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    last_read_time TIMESTAMP WITH TIME ZONE;
    unread_count INTEGER;
BEGIN
    -- Récupérer le dernier message lu
    SELECT last_read_at INTO last_read_time
    FROM channel_read_status
    WHERE user_id = p_user_id AND channel_id = p_channel_id;
    
    -- Si pas de statut de lecture, compter tous les messages des autres utilisateurs
    IF last_read_time IS NULL THEN
        SELECT COUNT(*) INTO unread_count
        FROM messages
        WHERE channel_id = p_channel_id
        AND user_id != p_user_id;
    ELSE
        -- Compter les messages non lus (après le dernier message lu)
        SELECT COUNT(*) INTO unread_count
        FROM messages
        WHERE channel_id = p_channel_id
        AND user_id != p_user_id
        AND created_at > last_read_time;
    END IF;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer un canal comme lu
CREATE OR REPLACE FUNCTION mark_channel_as_read(
    p_channel_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO channel_read_status (user_id, channel_id, last_read_at, last_message_id)
    VALUES (p_user_id, p_channel_id, NOW(), 
            (SELECT id FROM messages WHERE channel_id = p_channel_id ORDER BY created_at DESC LIMIT 1))
    ON CONFLICT (user_id, channel_id)
    DO UPDATE SET 
        last_read_at = NOW(),
        last_message_id = EXCLUDED.last_message_id,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
