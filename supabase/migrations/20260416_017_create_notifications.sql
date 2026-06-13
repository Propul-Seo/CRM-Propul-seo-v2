-- ============================================================
-- Migration 017 : Créer v2.notifications
-- ============================================================

CREATE TABLE v2.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES v2.projects(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
    'brief_received','invoice_overdue','task_assigned',
    'milestone_reached','access_expired','status_changed'
  )),
  title           TEXT NOT NULL,
  message         TEXT,
  is_read         BOOLEAN DEFAULT false,
  link            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_v2_notif_user      ON v2.notifications(user_id);
CREATE INDEX idx_v2_notif_user_read ON v2.notifications(user_id, is_read);
CREATE INDEX idx_v2_notif_project   ON v2.notifications(project_id) WHERE project_id IS NOT NULL;

ALTER TABLE v2.notifications ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur ne voit que ses propres notifications
CREATE POLICY "Users read own notifications"
  ON v2.notifications FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users update own notifications"
  ON v2.notifications FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Insert via triggers/fonctions uniquement (SECURITY DEFINER)
CREATE POLICY "Service insert notifications"
  ON v2.notifications FOR INSERT TO authenticated
  WITH CHECK (true);
