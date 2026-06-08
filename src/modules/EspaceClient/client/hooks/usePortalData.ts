import { useCallback, useEffect, useRef, useState } from 'react';
import { portalSupabase as supabase, v2Portal as v2 } from '@/lib/supabase';

// Hooks de lecture des entités portail (tables propulspace.* exposées via
// vues public.propulspace_*_v2 + RLS security_invoker). Les hooks
// retournent uniquement les rows visibles par le client portail courant
// (filtrage côté RLS via propulspace.portal_project_id()).

const SIGNED_URL_TTL_S = 3600; // 1 heure

interface ListResult<T> {
  rows: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function useList<T>(table: string, orderBy: string, ascending = false): ListResult<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Évite les setState après unmount (StrictMode + navigations rapides).
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await v2.from(table).select('*').order(orderBy, { ascending });
    if (!mountedRef.current) return;
    if (err) { setError(err.message); setRows([]); }
    else { setError(null); setRows((data ?? []) as T[]); }
    setLoading(false);
  }, [table, orderBy, ascending]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { rows, loading, error, refresh };
}

export interface PortalInvoice {
  id: string; invoice_number: string; project_id: string; client_snapshot: Record<string, unknown>;
  is_deposit: boolean; amount_subtotal: string | number; vat_rate: string | number;
  amount_vat: string | number; amount_total: string | number; currency: string;
  line_items: Array<Record<string, unknown>>; status: string;
  issue_date: string; due_date: string; paid_at: string | null;
  stripe_payment_link_url: string | null; pdf_url: string | null;
  client_visible_notes: string | null; created_at: string;
  title: string | null;
}

export interface PortalInstallment {
  id: string; invoice_id: string; installment_number: number; label: string;
  amount: string | number; due_date: string; status: string;
  stripe_payment_link_url: string | null; paid_at: string | null;
}

export interface PortalDocument {
  id: string; project_id: string; document_type: string; category: string | null;
  name: string; description: string | null; file_url: string;
  file_size_bytes: number | null; file_mime_type: string | null; version: number;
  visible_to_client: boolean; uploaded_by_client: boolean;
  viewed_by_client_at: string | null; created_at: string;
}

export interface PortalSignature {
  id: string; project_id: string; document_id: string | null; signature_type: string;
  name: string; docuseal_signing_url: string | null; docuseal_signed_pdf_url: string | null;
  status: string; sent_at: string | null; signed_at: string | null;
  expires_at: string | null; created_at: string;
}

export interface PortalProjectStep {
  id: string; project_id: string; step_order: number; label: string;
  description: string | null; status: string;
  date_start: string | null; date_planned_end: string | null; date_actual_end: string | null;
  visible_to_client: boolean;
}

export const usePortalInvoices       = () => useList<PortalInvoice>('propulspace_invoices', 'issue_date');
export const usePortalInstallments   = () => useList<PortalInstallment>('propulspace_invoice_installments', 'due_date', true);
export const usePortalDocuments      = () => useList<PortalDocument>('propulspace_documents', 'created_at');
export const usePortalSignatures     = () => useList<PortalSignature>('propulspace_signatures', 'created_at');
export const usePortalProjectSteps   = () => useList<PortalProjectStep>('propulspace_project_steps', 'step_order', true);

// Génère une URL signée temporaire pour un path Storage privé. Utilisé
// pour les téléchargements de documents / factures depuis le portail.
export async function getSignedStorageUrl(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_S);
  if (error || !data) return null;
  return data.signedUrl;
}
