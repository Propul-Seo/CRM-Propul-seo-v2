-- 264 — Table de déduplication + journal des emails transactionnels Brevo
-- Pattern : INSERT 'pending' → POST Brevo → UPDATE 'sent'/'failed'.
-- UNIQUE(template_key, dedupe_key) garantit l'envoi unique atomiquement.
-- Catch 23505 dans le helper TS pour gérer les double-clics / webhook replays.

CREATE TABLE IF NOT EXISTS propulspace.transactional_emails_sent (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key    TEXT NOT NULL,
  dedupe_key      TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('pending','sent','failed')),
  brevo_message_id TEXT,
  error_message   TEXT,
  params_json     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_key, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_tx_emails_recipient
  ON propulspace.transactional_emails_sent(recipient_email);
CREATE INDEX IF NOT EXISTS idx_tx_emails_created
  ON propulspace.transactional_emails_sent(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_emails_status
  ON propulspace.transactional_emails_sent(status) WHERE status != 'sent';

-- Trigger updated_at
CREATE OR REPLACE FUNCTION propulspace.tx_emails_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_tx_emails_updated_at ON propulspace.transactional_emails_sent;
CREATE TRIGGER trg_tx_emails_updated_at
  BEFORE UPDATE ON propulspace.transactional_emails_sent
  FOR EACH ROW EXECUTE FUNCTION propulspace.tx_emails_set_updated_at();

-- RLS
ALTER TABLE propulspace.transactional_emails_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY tx_emails_team_select ON propulspace.transactional_emails_sent
  FOR SELECT TO authenticated USING (public.is_team_member());

COMMENT ON TABLE propulspace.transactional_emails_sent IS
  'Journal + déduplication des emails transactionnels Brevo. UNIQUE(template_key, dedupe_key) garantit envoi unique. Service role bypass RLS pour writes.';
