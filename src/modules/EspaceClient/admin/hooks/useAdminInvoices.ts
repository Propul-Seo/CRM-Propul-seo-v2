import { useCallback, useEffect, useState } from 'react';
import { v2, supabase } from '@/lib/supabase';
import { adminRpc } from '../lib/adminRpc';
import type { PortalInvoice, PortalInstallment } from '@/modules/EspaceClient/client/hooks/usePortalData';

export interface CreateInvoiceInput {
  amountSubtotal: number;
  isDeposit: boolean;
  vatRate: number;                       // 0 par défaut (franchise art. 293 B)
  lineItems: Array<{ label: string; amount: number }>;
  issueDate: string;                     // 'YYYY-MM-DD'
  dueDate?: string | null;
  clientVisibleNotes?: string | null;
  installments: Array<{ label: string; amount: number; due_date: string }>;
}

interface UseAdminInvoicesResult {
  invoices: PortalInvoice[];
  installmentsByInvoice: Map<string, PortalInstallment[]>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createInvoice: (input: CreateInvoiceInput) => Promise<{ id: string | null; error: string | null }>;
  sendInvoice: (invoice: PortalInvoice, clientEmail: string | null) => Promise<{ error: string | null }>;
  remindInvoice: (invoice: PortalInvoice, clientEmail: string | null) => Promise<{ error: string | null }>;
}

export function useAdminInvoices(projectId: string): UseAdminInvoicesResult {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [installmentsByInvoice, setMap] = useState<Map<string, PortalInstallment[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [inv, inst] = await Promise.all([
      v2.from('propulspace_invoices').select('*').eq('project_id', projectId).order('issue_date', { ascending: false }),
      v2.from('propulspace_invoice_installments').select('*').order('due_date', { ascending: true }),
    ]);
    if (inv.error) { setError(inv.error.message); setInvoices([]); setLoading(false); return; }
    setError(null);
    const rows = (inv.data ?? []) as unknown as PortalInvoice[];
    setInvoices(rows);
    const ids = new Set(rows.map(r => r.id));
    const map = new Map<string, PortalInstallment[]>();
    ((inst.data ?? []) as unknown as PortalInstallment[]).forEach(i => {
      if (!ids.has(i.invoice_id)) return;
      const arr = map.get(i.invoice_id) ?? [];
      arr.push(i); map.set(i.invoice_id, arr);
    });
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
    });
    if (err) return { id: null, error: err.message };
    await refresh();
    return { id: typeof data === 'string' ? data : null, error: null };
  }, [projectId, refresh]);

  const sendInvoice = useCallback<UseAdminInvoicesResult['sendInvoice']>(async (invoice, clientEmail) => {
    const { error: err } = await adminRpc('admin_send_invoice', { p_invoice_id: invoice.id });
    if (err) return { error: err.message };
    await supabase.functions.invoke('generate-invoice-pdf', { body: { invoice_id: invoice.id } }).catch(() => undefined);
    if (clientEmail) {
      await supabase.functions.invoke('send-portal-email', {
        body: {
          template_key: 'invoice-sent',
          to: { email: clientEmail },
          params: { invoice_number: invoice.invoice_number, amount_total: String(invoice.amount_total) },
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

  return { invoices, installmentsByInvoice, loading, error, refresh, createInvoice, sendInvoice, remindInvoice };
}
