/**
 * Propul'Space portal — shared types
 *
 * All status unions mirror the CHECK constraints defined in the propulspace
 * schema (verified via MCP on 2026-05-15). If a value is added or removed
 * server-side, this file MUST be updated.
 *
 * Mapping notes:
 *  - PortalPhase           → public.projects_v2.portal_phase
 *  - InvoiceStatus         → propulspace.invoices.status
 *  - SignatureStatus       → propulspace.signatures.status
 *  - DocumentType          → propulspace.documents.document_type
 *  - ProjectStepStatus     → propulspace.project_steps.status
 *  - QualificationStatus   → propulspace.qualification_leads.status
 *  - ClientSnapshot.client_siret maps to public.projects_v2.siret
 *    (legacy column name, no `client_` prefix)
 */

export type PortalPhase =
  | 'qualification'
  | 'discovery'
  | 'proposal_sent'
  | 'proposal_signed'
  | 'contract_signed'
  | 'deposit_paid'
  | 'onboarding'
  | 'active_project'
  | 'completed'
  | 'churned';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export type SignatureStatus =
  | 'pending'
  | 'signed'
  | 'declined'
  | 'expired'
  | 'cancelled';

export type DocumentType =
  | 'quote'
  | 'contract'
  | 'invoice'
  | 'deliverable'
  | 'audit'
  | 'report'
  | 'asset_logo'
  | 'asset_charter'
  | 'asset_content'
  | 'asset_access'
  | 'legal'
  | 'other';

export type ProjectStepStatus =
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'blocked';

export type QualificationStatus =
  | 'draft'
  | 'submitted'
  | 'contacted'
  | 'qualified'
  | 'unqualified'
  | 'converted';

/**
 * Immutable client identity snapshot persisted on each invoice
 * (propulspace.invoices.client_snapshot JSONB). Once written it MUST NOT
 * change, even if the client info on the project is later updated — French
 * accounting law requires invoices to reflect the legal entity exactly
 * as it was at issuance.
 */
export interface ClientSnapshot {
  client_name: string;
  client_email: string;
  client_address?: string;
  client_siret?: string;
  client_vat_number?: string;
  client_represented_by?: string;
  snapshot_date: string;
}
