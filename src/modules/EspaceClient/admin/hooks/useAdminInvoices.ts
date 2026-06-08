import { useCallback, useEffect, useState } from 'react';
import { v2, supabase } from '@/lib/supabase';
import { adminRpc } from '../lib/adminRpc';
import type { PortalInvoice, PortalInstallment } from '@/modules/EspaceClient/client/hooks/usePortalData';

/** Facture telle que lue par l'admin via la vue `propulspace_invoices_admin_v2`
 *  (toutes colonnes) : PortalInvoice + champs réservés admin. Cf. migration 296. */
export interface AdminInvoice extends PortalInvoice {
  cancellation_reason: string | null;
  cancelled_at: string | null;
}

export interface CreateInvoiceInput {
  amountSubtotal: number;
  isDeposit: boolean;
  vatRate: number;                       // 0 par défaut (franchise art. 293 B)
  lineItems: Array<{ label: string; amount: number }>;
  issueDate: string;                     // 'YYYY-MM-DD'
  dueDate?: string | null;
  clientVisibleNotes?: string | null;
  title?: string | null;                 // intitulé libre (ex. « Paiement 1/2 »)
  installments: Array<{ label: string; amount: number; due_date: string }>;
}

export interface UpdateInvoiceInput {
  amountSubtotal: number;
  vatRate: number;
  lineItems: Array<{ label: string; amount: number }>;
  dueDate?: string | null;
  clientVisibleNotes?: string | null;
  title?: string | null;
}

interface UseAdminInvoicesResult {
  invoices: AdminInvoice[];
  installmentsByInvoice: Map<string, PortalInstallment[]>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createInvoice: (input: CreateInvoiceInput) => Promise<{ id: string | null; error: string | null }>;
  updateInvoice: (invoiceId: string, input: UpdateInvoiceInput) => Promise<{ error: string | null }>;
  deleteInvoice: (invoiceId: string) => Promise<{ error: string | null }>;
  cancelInvoice: (invoiceId: string, reason: string) => Promise<{ error: string | null }>;
  sendInvoice: (invoice: PortalInvoice, clientEmail: string | null) => Promise<{ error: string | null }>;
  remindInvoice: (invoice: PortalInvoice, clientEmail: string | null) => Promise<{ error: string | null }>;
}

export function useAdminInvoices(projectId: string): UseAdminInvoicesResult {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [installmentsByInvoice, setMap] = useState<Map<string, PortalInstallment[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const inv = await v2.from('propulspace_invoices_admin').select('*').eq('project_id', projectId).order('issue_date', { ascending: false });
    if (inv.error) { setError(inv.error.message); setInvoices([]); setMap(new Map()); setLoading(false); return; }
    setError(null);
    const rows = (inv.data ?? []) as unknown as AdminInvoice[];
    setInvoices(rows);
    const ids = rows.map(r => r.id);
    const map = new Map<string, PortalInstallment[]>();
    if (ids.length > 0) {
      const inst = await v2.from('propulspace_invoice_installments').select('*').in('invoice_id', ids).order('due_date', { ascending: true });
      ((inst.data ?? []) as unknown as PortalInstallment[]).forEach(i => {
        const arr = map.get(i.invoice_id) ?? [];
        arr.push(i); map.set(i.invoice_id, arr);
      });
    }
    setMap(map);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createInvoice = useCallback<UseAdminInvoicesResult['createInvoice']>(async (input) => {
    const { data, error: err } = await adminRpc('admin_create_invoice', {
      p_project_id: projectId,
      p_amount_subtotal: input.amountSubtotal,
      p_is_deposit: input.isDeposit,
      p_vat_rate: input.vatRate,
      p_line_items: input.lineItems,
      p_issue_date: input.issueDate,
      p_due_date: input.dueDate ?? null,
      p_client_visible_notes: input.clientVisibleNotes ?? null,
      p_installments: input.installments,
      p_title: input.title ?? null,
    });
    if (err) return { id: null, error: err.message };
    await refresh();
    return { id: typeof data === 'string' ? data : null, error: null };
  }, [projectId, refresh]);

  const updateInvoice = useCallback<UseAdminInvoicesResult['updateInvoice']>(async (invoiceId, input) => {
    const { error: err } = await adminRpc('admin_update_invoice', {
      p_invoice_id: invoiceId,
      p_amount_subtotal: input.amountSubtotal,
      p_vat_rate: input.vatRate,
      p_line_items: input.lineItems,
      p_due_date: input.dueDate ?? null,
      p_client_visible_notes: input.clientVisibleNotes ?? null,
      p_title: input.title ?? null,
    });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const deleteInvoice = useCallback<UseAdminInvoicesResult['deleteInvoice']>(async (invoiceId) => {
    const { error: err } = await adminRpc('admin_delete_invoice', { p_invoice_id: invoiceId });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const cancelInvoice = useCallback<UseAdminInvoicesResult['cancelInvoice']>(async (invoiceId, reason) => {
    const { error: err } = await adminRpc('admin_cancel_invoice', { p_invoice_id: invoiceId, p_reason: reason || null });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const sendInvoice = useCallback<UseAdminInvoicesResult['sendInvoice']>(async (invoice, clientEmail) => {
    const { data, error: err } = await adminRpc('admin_send_invoice', { p_invoice_id: invoice.id });
    if (err) return { error: err.message };
    const invoiceNumber = typeof data === 'string' ? data : invoice.invoice_number;
    await supabase.functions.invoke('generate-invoice-pdf', { body: { invoice_id: invoice.id } }).catch(() => undefined);
    if (clientEmail) {
      await supabase.functions.invoke('send-portal-email', {
        body: {
          template_key: 'invoice-sent',
          to: { email: clientEmail },
          params: { invoice_number: invoiceNumber ?? '', amount_total: String(invoice.amount_total) },
          dedupe_key: `${invoice.id}-sent`,
        },
      }).catch(() => undefined);
    }
    await refresh();
    return { error: null };
  }, [refresh]);

  const remindInvoice = useCallback<UseAdminInvoicesResult['remindInvoice']>(async (invoice, clientEmail) => {
    if (!clientEmail) return { error: 'Pas d\'email client' };
    const today = new Date().toISOString().slice(0, 10);
    const { error: err } = await supabase.functions.invoke('send-portal-email', {
      body: {
        template_key: 'invoice-reminder',
        to: { email: clientEmail },
        params: { invoice_number: invoice.invoice_number, amount_total: String(invoice.amount_total) },
        dedupe_key: `${invoice.id}-reminder-${today}`,
      },
    });
    return { error: err ? (err.message ?? 'Échec') : null };
  }, []);

  return { invoices, installmentsByInvoice, loading, error, refresh, createInvoice, updateInvoice, deleteInvoice, cancelInvoice, sendInvoice, remindInvoice };
}
