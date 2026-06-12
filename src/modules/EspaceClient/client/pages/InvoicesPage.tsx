import { useEffect, useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import { EmptyState, InvoicePreviewDialog } from '@/modules/EspaceClient/shared/components';
import {
  usePortalInvoices, usePortalInstallments, getSignedStorageUrl,
  type PortalInvoice, type PortalInstallment,
} from '@/modules/EspaceClient/client/hooks/usePortalData';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { portalSupabase as supabase } from '@/lib/supabase';
import { num, UNPAID, STORAGE_BUCKET } from './invoices-sections/invoice-format';
import { PaymentBannerView, type PaymentBanner } from './invoices-sections/payment-banner';
import { InvoicesMasthead, type InvoiceStats } from './invoices-sections/invoices-masthead';
import { InvoicesTable } from './invoices-sections/invoices-table';
import { InvoiceDetail } from './invoices-sections/invoice-detail';
import { InvoicesFooter } from './invoices-sections/invoices-footer';
import { InvoicesSkeleton } from './invoices-sections/invoices-skeleton';

/**
 * Page Factures du portail — composition « Éditorial calme » (direction A) :
 * une de revue (phrase d'état + bande de gros chiffres sous filets), tableau
 * éditorial posé sur le fond, détail de la sélection en seule surface élevée,
 * clôture sur le total du projet. La page orchestre : données, retour Stripe
 * (bannière + polling), sélection, paiement, PDF et aperçu.
 */

async function startCheckout(
  target: 'invoice' | 'installment',
  target_id: string,
): Promise<{ url?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('portal-create-checkout-session', {
    body: { target, target_id },
  });
  if (error) return { error: error.message };
  const payload = data as { url?: string; error?: string };
  if (payload?.error) return { error: payload.error };
  if (!payload?.url) return { error: 'URL Stripe absente de la réponse' };
  return { url: payload.url };
}

export function InvoicesPage() {
  const { project, storage, previewMode } = usePortal();
  const { rows, loading, error, refresh } = usePortalInvoices();
  const invoiceIds = useMemo(() => rows.map(i => i.id), [rows]);
  const { rows: installments, refresh: refreshInstallments } = usePortalInstallments(invoiceIds);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<PaymentBanner | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Retour Stripe (paiement=reussi|annule). Le webhook peut arriver quelques
  // secondes après la redirection → on polle 4× / 2s pour rattraper le décalage.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('paiement');
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (result === 'reussi') {
      setBanner({ kind: 'success' });
      void refresh();
      void refreshInstallments();
      let count = 0;
      intervalId = setInterval(() => {
        void refresh();
        void refreshInstallments();
        count += 1;
        if (count >= 4 && intervalId) clearInterval(intervalId);
      }, 2000);
    } else if (result === 'annule') {
      setBanner({ kind: 'cancel' });
    }
    if (result) {
      params.delete('paiement');
      params.delete('session_id');
      const newSearch = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
    }
    // Cleanup : stoppe le polling si on quitte la page avant la fin (fuite C-1).
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [refresh, refreshInstallments]);

  const installmentsByInvoice = useMemo(() => {
    const map = new Map<string, PortalInstallment[]>();
    installments.forEach(i => {
      const arr = map.get(i.invoice_id) ?? [];
      arr.push(i);
      map.set(i.invoice_id, arr);
    });
    return map;
  }, [installments]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(inv =>
      (inv.invoice_number ?? '').toLowerCase().includes(q) ||
      (inv.title ?? '').toLowerCase().includes(q),
    );
  }, [rows, query]);

  // Sélection par défaut : première facture impayée, sinon la plus récente.
  useEffect(() => {
    if (selectedId && rows.some(r => r.id === selectedId)) return;
    const next = rows.find(r => UNPAID.has(r.status)) ?? rows[0];
    setSelectedId(next?.id ?? null);
  }, [rows, selectedId]);

  const selected = useMemo(
    () => rows.find(r => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  // ── Dérivés du masthead / footer (réglé, reste à régler, retard, échéance) ──
  const stats = useMemo<InvoiceStats>(() => {
    const due = rows.filter(i => UNPAID.has(i.status));
    const overdue = rows.filter(i => i.status === 'overdue');
    const nextDue = due
      .map(i => i.due_date)
      .filter((d): d is string => d != null)
      .sort()[0] ?? null;
    return {
      paidAmount: rows.filter(i => i.status === 'paid').reduce((s, i) => s + num(i.amount_total), 0),
      totalDue: due.reduce((s, i) => s + num(i.amount_total), 0),
      dueCount: due.length,
      overdueAmount: overdue.reduce((s, i) => s + num(i.amount_total), 0),
      overdueCount: overdue.length,
      nextDue,
    };
  }, [rows]);

  const oldestIssue = useMemo(
    () => rows.map(i => i.issue_date).filter((d): d is string => d != null).sort()[0] ?? null,
    [rows],
  );

  async function handlePay(target: 'invoice' | 'installment', target_id: string) {
    if (previewMode) return;
    setPayingId(target_id);
    const { url, error: payErr } = await startCheckout(target, target_id);
    if (payErr || !url) {
      setBanner({ kind: 'error', message: payErr ?? 'Échec de la création du paiement.' });
      setPayingId(null);
      return;
    }
    window.location.href = url;
  }

  async function downloadPdf(inv: PortalInvoice) {
    if (!inv.pdf_url) return;
    const url = await getSignedStorageUrl(storage, STORAGE_BUCKET, inv.pdf_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (loading) return <InvoicesSkeleton />;

  if (error) {
    return (
      <div className="ps-fade-in">
        <p className="rounded-[var(--ps-radius-input)] bg-[var(--ps-danger-subtle)] px-3.5 py-2.5 text-[13px] text-[var(--ps-danger-text)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="ps-fade-in mx-auto w-full max-w-[1080px]">
      {banner && (
        <div className="mb-4">
          <PaymentBannerView banner={banner} />
        </div>
      )}

      <InvoicesMasthead projectName={project.name} hasInvoices={rows.length > 0} stats={stats} />

      {rows.length === 0 ? (
        <div className="mt-10 sm:mt-14">
          <EmptyState
            icon={Receipt}
            title="Aucune facture"
            body="Vos factures apparaîtront ici dès qu'elles seront émises."
          />
        </div>
      ) : (
        <>
          <InvoicesTable
            rows={visibleRows}
            totalCount={rows.length}
            oldestIssue={oldestIssue}
            selectedId={selectedId}
            onSelect={setSelectedId}
            query={query}
            onQueryChange={setQuery}
          />

          {selected && (
            <InvoiceDetail
              invoice={selected}
              installments={installmentsByInvoice.get(selected.id) ?? []}
              payingId={payingId}
              onPay={handlePay}
              onDownload={downloadPdf}
              onPreview={() => setPreviewOpen(true)}
            />
          )}

          <InvoicesFooter paidAmount={stats.paidAmount} totalDue={stats.totalDue} />
        </>
      )}

      <InvoicePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invoice={selected}
        installments={selected ? installmentsByInvoice.get(selected.id) ?? [] : []}
      />
    </div>
  );
}
