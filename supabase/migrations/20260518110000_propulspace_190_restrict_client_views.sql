-- ============================================================================
-- Migration 190 — Sprint A.3.3 : restreindre les colonnes exposées au portail (R-012)
-- ============================================================================
-- Risque adressé : R-012 (🟠 Élevée).
--   Les 5 vues `propulspace_*_v2` consommées par le portail client faisaient
--   `SELECT * FROM propulspace.<table>` avec `security_invoker = true`.
--   La RLS filtre les *rows* par projet (portal_project_id()), mais toutes
--   les *colonnes* étaient exposées, dont des champs admin sensibles :
--     - invoices.internal_notes, stripe_payment_intent_id, created_by, is_locked
--     - documents.uploaded_by, parent_document_id, deleted_at, downloaded_by_client_at
--     - signatures.signer_ip, signer_user_agent, created_by, docuseal_submission_id/template_id
--
-- Approche : DROP + CREATE des 5 vues avec une whitelist explicite, alignée
-- sur les types TypeScript consommés par `usePortalData.ts` (PortalInvoice,
-- PortalInstallment, PortalDocument, PortalSignature, PortalProjectStep).
-- Aucun consommateur admin actuel — refacto admin reportée au Sprint C
-- (création de `propulspace_*_admin_v2` à ce moment-là).
--
-- Pré-requis :
--   - Sprint A.3.2 livré : authenticated seul a SELECT, anon n'a plus rien.
--   - Vérifié : aucune vue / fonction / policy ne dépend de ces 5 vues
--     (CASCADE inutile).
--   - qualification_leads_v2 NON touchée — admin only de fait, expose
--     volontairement toutes les colonnes (quality_score, pappers_enrichment, etc.)
--     aux admins via RLS is_admin().
--
-- Rollback : recréer les vues en `SELECT *` (voir section commentée).
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. invoices — whitelist alignée sur PortalInvoice (usePortalData.ts)
-- ───────────────────────────────────────────────────────────────────────────
-- Retirées : stripe_payment_link_id, stripe_payment_intent_id, stripe_paid_at,
--            pdf_hash_sha256, internal_notes, is_locked, created_by, updated_at.

DROP VIEW IF EXISTS public.propulspace_invoices_v2;
CREATE VIEW public.propulspace_invoices_v2
  WITH (security_invoker = true) AS
  SELECT
    id, invoice_number, project_id, client_snapshot,
    is_deposit, amount_subtotal, vat_rate, amount_vat, amount_total, currency,
    line_items, status, issue_date, due_date, paid_at,
    stripe_payment_link_url, pdf_url, client_visible_notes, created_at
  FROM propulspace.invoices;

-- ⚠️ Tout CREATE VIEW dans `public` ré-attribue les ACL Supabase par défaut
-- (ALL TO anon hérité). Il FAUT REVOKE anon explicitement après chaque CREATE
-- VIEW pour préserver l'effet de A.3.2 (migration 180). Voir 195 pour le hotfix
-- détecté par .planning/A3_TESTS.sql.
REVOKE ALL ON public.propulspace_invoices_v2 FROM anon;
GRANT SELECT ON public.propulspace_invoices_v2 TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. invoice_installments — whitelist alignée sur PortalInstallment
-- ───────────────────────────────────────────────────────────────────────────
-- Retirées : created_at, updated_at (non consommés côté client).

DROP VIEW IF EXISTS public.propulspace_invoice_installments_v2;
CREATE VIEW public.propulspace_invoice_installments_v2
  WITH (security_invoker = true) AS
  SELECT
    id, invoice_id, installment_number, label, amount, due_date, status,
    stripe_payment_link_url, paid_at
  FROM propulspace.invoice_installments;

REVOKE ALL ON public.propulspace_invoice_installments_v2 FROM anon;
GRANT SELECT ON public.propulspace_invoice_installments_v2 TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. documents — whitelist alignée sur PortalDocument
-- ───────────────────────────────────────────────────────────────────────────
-- Retirées : parent_document_id, downloaded_by_client_at (tracking interne),
--            uploaded_by (uuid admin), updated_at, deleted_at (soft-delete admin).

DROP VIEW IF EXISTS public.propulspace_documents_v2;
CREATE VIEW public.propulspace_documents_v2
  WITH (security_invoker = true) AS
  SELECT
    id, project_id, document_type, category, name, description,
    file_url, file_size_bytes, file_mime_type, version,
    visible_to_client, uploaded_by_client, viewed_by_client_at, created_at
  FROM propulspace.documents;

REVOKE ALL ON public.propulspace_documents_v2 FROM anon;
GRANT SELECT ON public.propulspace_documents_v2 TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. signatures — whitelist alignée sur PortalSignature
-- ───────────────────────────────────────────────────────────────────────────
-- Retirées : docuseal_submission_id, docuseal_template_id (refs API privées),
--            declined_at, decline_reason (réserve V2 côté UX si besoin),
--            signer_ip, signer_user_agent (audit RGPD admin),
--            created_by, updated_at.

DROP VIEW IF EXISTS public.propulspace_signatures_v2;
CREATE VIEW public.propulspace_signatures_v2
  WITH (security_invoker = true) AS
  SELECT
    id, project_id, document_id, signature_type, name,
    docuseal_signing_url, docuseal_signed_pdf_url, status,
    sent_at, signed_at, expires_at, created_at
  FROM propulspace.signatures;

REVOKE ALL ON public.propulspace_signatures_v2 FROM anon;
GRANT SELECT ON public.propulspace_signatures_v2 TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. project_steps — whitelist alignée sur PortalProjectStep
-- ───────────────────────────────────────────────────────────────────────────
-- Retirées : created_at, updated_at (non consommés côté client).

DROP VIEW IF EXISTS public.propulspace_project_steps_v2;
CREATE VIEW public.propulspace_project_steps_v2
  WITH (security_invoker = true) AS
  SELECT
    id, project_id, step_order, label, description, status,
    date_start, date_planned_end, date_actual_end, visible_to_client
  FROM propulspace.project_steps;

REVOKE ALL ON public.propulspace_project_steps_v2 FROM anon;
GRANT SELECT ON public.propulspace_project_steps_v2 TO authenticated;

-- ============================================================================
-- ROLLBACK (commenté — à exécuter manuellement si nécessaire)
-- ============================================================================
-- DROP VIEW IF EXISTS public.propulspace_invoices_v2;
-- CREATE VIEW public.propulspace_invoices_v2 WITH (security_invoker = true) AS
--   SELECT * FROM propulspace.invoices;
-- GRANT SELECT, INSERT, UPDATE ON public.propulspace_invoices_v2 TO authenticated;
-- DROP VIEW IF EXISTS public.propulspace_invoice_installments_v2;
-- CREATE VIEW public.propulspace_invoice_installments_v2 WITH (security_invoker = true) AS
--   SELECT * FROM propulspace.invoice_installments;
-- GRANT SELECT, INSERT, UPDATE ON public.propulspace_invoice_installments_v2 TO authenticated;
-- DROP VIEW IF EXISTS public.propulspace_documents_v2;
-- CREATE VIEW public.propulspace_documents_v2 WITH (security_invoker = true) AS
--   SELECT * FROM propulspace.documents;
-- GRANT SELECT, INSERT, UPDATE ON public.propulspace_documents_v2 TO authenticated;
-- DROP VIEW IF EXISTS public.propulspace_signatures_v2;
-- CREATE VIEW public.propulspace_signatures_v2 WITH (security_invoker = true) AS
--   SELECT * FROM propulspace.signatures;
-- GRANT SELECT, INSERT, UPDATE ON public.propulspace_signatures_v2 TO authenticated;
-- DROP VIEW IF EXISTS public.propulspace_project_steps_v2;
-- CREATE VIEW public.propulspace_project_steps_v2 WITH (security_invoker = true) AS
--   SELECT * FROM propulspace.project_steps;
-- GRANT SELECT, INSERT, UPDATE ON public.propulspace_project_steps_v2 TO authenticated;
