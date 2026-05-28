-- ============================================================================
-- Migration 254 — Vue unifiée des documents projet (CRM + portail)
-- ============================================================================
-- Bug observé en test E2E : les fichiers uploadés via /diagnostic (logo,
-- charte, screenshots) sont insérés par la RPC admin_convert_qualif_to_project
-- dans propulspace.documents (table portail client), mais le CRM (onglet
-- Documents fiche projet V3) lit public.project_documents_v2.
-- Conséquence : 2 silos parallèles, les fichiers qualif ne sont pas visibles
-- côté CRM.
--
-- Fix : créer une vue UNION ALL des 2 tables avec :
--   - colonnes normalisées (file_path, file_size, mime_type, etc.)
--   - colonnes ajoutées : source ('crm'|'portal'), bucket (bucket Storage cible)
--   - mapping document_type portail → category CRM (7 catégories)
-- Le front lit cette vue (read-only), mais continue d'écrire dans
-- project_documents_v2 pour les nouveaux uploads CRM (comportement actuel).
-- Les docs source='portal' sont read-only côté CRM (delete refusé).
-- ============================================================================

DROP VIEW IF EXISTS public.project_documents_unified_v2;

CREATE VIEW public.project_documents_unified_v2 AS
SELECT
  d.id,
  d.project_id,
  d.name,
  d.category::text  AS category,
  d.version,
  d.file_path,
  d.file_size,
  d.mime_type,
  d.uploaded_by,
  d.uploader_name,
  d.created_at,
  NULL::text        AS description,
  NULL::text        AS document_type,
  'crm'::text       AS source,
  'project-documents'::text AS bucket
FROM public.project_documents_v2 d

UNION ALL

SELECT
  d.id,
  d.project_id,
  d.name,
  CASE d.document_type
    WHEN 'quote'         THEN 'contract'
    WHEN 'contract'      THEN 'contract'
    WHEN 'legal'         THEN 'contract'
    WHEN 'invoice'       THEN 'invoice'
    WHEN 'audit'         THEN 'report'
    WHEN 'report'        THEN 'report'
    WHEN 'deliverable'   THEN 'deliverable'
    WHEN 'asset_logo'    THEN 'mockup'
    WHEN 'asset_charter' THEN 'mockup'
    WHEN 'asset_content' THEN 'mockup'
    ELSE 'other'
  END                                          AS category,
  d.version::text                              AS version,
  d.file_url                                   AS file_path,
  d.file_size_bytes                            AS file_size,
  d.file_mime_type                             AS mime_type,
  d.uploaded_by,
  NULL::text                                   AS uploader_name,
  d.created_at,
  d.description,
  d.document_type::text                        AS document_type,
  'portal'::text                               AS source,
  CASE
    WHEN d.file_url LIKE 'qualification/%' THEN 'propulspace-uploads'
    WHEN d.file_url LIKE 'http%'           THEN 'external'
    ELSE 'propulspace-documents'
  END                                          AS bucket
FROM propulspace.documents d;

COMMENT ON VIEW public.project_documents_unified_v2 IS
  'Vue unifiée des documents projet (CRM + portail). source=crm|portal, bucket indique où télécharger le fichier (project-documents, propulspace-uploads, propulspace-documents, ou external pour les liens).';

GRANT SELECT ON public.project_documents_unified_v2 TO authenticated;
