import { useCallback, useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { V2Client } from '@/lib/supabase';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';

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

type ListFilter = readonly [op: 'eq' | 'neq', col: string, val: string | boolean];

function useList<T>(
  db: V2Client, table: string, orderBy: string, ascending: boolean,
  projectId: string, filters: readonly ListFilter[] = [],
): ListResult<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Évite les setState après unmount (StrictMode + navigations rapides).
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Filtre explicite par projet + prédicats de parité client : redondant avec la
  // RLS pour un vrai client, indispensable en aperçu admin (RLS permissive).
  const filterKey = filters.map(f => f.join(':')).join('|');
  const refresh = useCallback(async () => {
    setLoading(true);
    let q = db.from(table).select('*').eq('project_id', projectId);
    for (const [op, col, val] of filters) {
      q = op === 'eq' ? q.eq(col, val) : q.neq(col, val);
    }
    const { data, error: err } = await q.order(orderBy, { ascending });
    if (!mountedRef.current) return;
    if (err) { setError(err.message); setRows([]); }
    else { setError(null); setRows((data ?? []) as T[]); }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, table, orderBy, ascending, projectId, filterKey]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { rows, loading, error, refresh };
}

export interface PortalInvoice {
  id: string; invoice_number: string | null; project_id: string; client_snapshot: Record<string, unknown>;
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

export interface PortalActivity {
  id: string; project_id: string; type: string; content: string;
  author_name: string | null; realized_at: string | null; next_actions: string | null;
  is_auto: boolean; created_at: string;
}

export const usePortalInvoices = () => {
  const { project, db } = usePortal();
  return useList<PortalInvoice>(db, 'propulspace_invoices', 'issue_date', false, project.id, [['neq', 'status', 'draft']]);
};

// Les échéances n'ont pas de project_id : on les scope par les ids des factures
// du projet (parité admin ; la RLS scoperait déjà côté client réel).
export const usePortalInstallments = (invoiceIds: string[]) => {
  const { db } = usePortal();
  const [rows, setRows] = useState<PortalInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const idsKey = invoiceIds.join(',');
  const refresh = useCallback(async () => {
    setLoading(true);
    if (invoiceIds.length === 0) {
      if (mountedRef.current) { setRows([]); setError(null); setLoading(false); }
      return;
    }
    const { data, error: err } = await db.from('propulspace_invoice_installments')
      .select('*').in('invoice_id', invoiceIds).order('due_date', { ascending: true });
    if (!mountedRef.current) return;
    if (err) { setError(err.message); setRows([]); }
    else { setError(null); setRows((data ?? []) as PortalInstallment[]); }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, db]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { rows, loading, error, refresh };
};

export const usePortalDocuments = () => {
  const { project, db } = usePortal();
  return useList<PortalDocument>(db, 'propulspace_documents', 'created_at', false, project.id, [['eq', 'visible_to_client', true]]);
};
export const usePortalSignatures = () => {
  const { project, db } = usePortal();
  return useList<PortalSignature>(db, 'propulspace_signatures', 'created_at', false, project.id, []);
};
export const usePortalProjectSteps = () => {
  const { project, db } = usePortal();
  return useList<PortalProjectStep>(db, 'propulspace_project_steps', 'step_order', true, project.id, [['eq', 'visible_to_client', true]]);
};
// SP5 : fil d'activité visible du projet (vue propulspace_activities). Renvoie
// vide tant que la migration 297 n'est pas appliquée (erreur silencieuse → []).
export const usePortalProjectActivities = () => {
  const { project, db } = usePortal();
  return useList<PortalActivity>(db, 'propulspace_activities', 'created_at', false, project.id, []);
};

// Génère une URL signée temporaire pour un path Storage privé. Utilisé
// pour les téléchargements de documents / factures depuis le portail.
export async function getSignedStorageUrl(storage: SupabaseClient<Database>, bucket: string, path: string): Promise<string | null> {
  const { data, error } = await storage.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_S);
  if (error || !data) return null;
  return data.signedUrl;
}
