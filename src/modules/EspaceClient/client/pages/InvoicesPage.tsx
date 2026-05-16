import { useMemo, useState } from 'react';
import { Receipt, Loader2, ExternalLink, Download } from 'lucide-react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Hero, EmptyState, SectionHead, StatusBadge,
} from '@/modules/EspaceClient/shared/components';
import {
  usePortalInvoices, usePortalInstallments, getSignedStorageUrl,
  type PortalInvoice, type PortalInstallment,
} from '../hooks/usePortalData';

const STORAGE_BUCKET = 'propulspace-documents';

function formatMoney(amount: string | number, currency: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function InvoicesPage() {
  const { rows, loading, error } = usePortalInvoices();
  const { rows: installments } = usePortalInstallments();
  const [selected, setSelected] = useState<PortalInvoice | null>(null);

  const installmentsByInvoice = useMemo(() => {
    const map = new Map<string, PortalInstallment[]>();
    installments.forEach(i => {
      const arr = map.get(i.invoice_id) ?? [];
      arr.push(i);
      map.set(i.invoice_id, arr);
    });
    return map;
  }, [installments]);

  async function downloadPdf(inv: PortalInvoice) {
    if (!inv.pdf_url) return;
    const url = await getSignedStorageUrl(STORAGE_BUCKET, inv.pdf_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Factures"
        title="Vos factures"
        subtitle="Vos factures, échéances et historique de paiement."
      />

      <section className="ps-surface overflow-hidden">
        <SectionHead title={`${rows.length} facture${rows.length > 1 ? 's' : ''}`} />
        {loading && (
          <div className="flex items-center justify-center py-8 text-[var(--ps-fg-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {error && (
          <p className="m-4 rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}
        {!loading && rows.length === 0 && (
          <div className="p-6">
            <EmptyState icon={Receipt} title="Aucune facture" body="Vos factures apparaîtront ici dès qu'elles seront émises." />
          </div>
        )}
        {!loading && rows.length > 0 && (
          <ul className="divide-y divide-[var(--ps-border-soft)]">
            {rows.map(inv => (
              <li key={inv.id}>
                <button
                  type="button"
                  onClick={() => setSelected(inv)}
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-[var(--ps-bg-subtle)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-[var(--ps-fg)]">
                      {inv.invoice_number}
                      {inv.is_deposit && <span className="ml-2 text-[11px] font-medium text-[var(--ps-fg-muted)]">Acompte</span>}
                    </p>
                    <p className="text-[12px] text-[var(--ps-fg-muted)]">
                      Émise le {formatDate(inv.issue_date)} · Échéance {formatDate(inv.due_date)}
                    </p>
                  </div>
                  <p className="ps-num text-[14px] font-bold text-[var(--ps-fg)]">
                    {formatMoney(inv.amount_total, inv.currency)}
                  </p>
                  <StatusBadge status={inv.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        {selected && (
          <SheetContent side="right" className="propulspace-portal w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>{selected.invoice_number}</SheetTitle>
              <SheetDescription>
                Émise le {formatDate(selected.issue_date)} · Échéance {formatDate(selected.due_date)}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] p-4">
                <p className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">Total TTC</p>
                <p className="ps-num text-[26px] font-bold text-[var(--ps-fg)]">
                  {formatMoney(selected.amount_total, selected.currency)}
                </p>
                <p className="mt-1 text-[12px] text-[var(--ps-fg-muted)]">
                  HT {formatMoney(selected.amount_subtotal, selected.currency)}
                  {' · '}TVA {selected.vat_rate}%
                </p>
                <div className="mt-2"><StatusBadge status={selected.status} /></div>
              </div>

              {selected.client_visible_notes && (
                <div className="rounded-xl border border-[var(--ps-border-soft)] p-3 text-[13px] text-[var(--ps-fg-secondary)]">
                  {selected.client_visible_notes}
                </div>
              )}

              {(installmentsByInvoice.get(selected.id)?.length ?? 0) > 0 && (
                <div>
                  <p className="ps-eyebrow ps-eyebrow-muted mb-2">Échéances</p>
                  <ul className="divide-y divide-[var(--ps-border-soft)] rounded-xl border border-[var(--ps-border-soft)]">
                    {installmentsByInvoice.get(selected.id)?.map(inst => (
                      <li key={inst.id} className="flex items-center gap-3 px-3 py-2.5 text-[12.5px]">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--ps-fg)]">{inst.label || `Échéance ${inst.installment_number}`}</p>
                          <p className="text-[11px] text-[var(--ps-fg-muted)]">Due le {formatDate(inst.due_date)}</p>
                        </div>
                        <span className="ps-num font-semibold text-[var(--ps-fg)]">
                          {formatMoney(inst.amount, selected.currency)}
                        </span>
                        <StatusBadge status={inst.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 border-t border-[var(--ps-border-soft)] pt-4">
                {selected.pdf_url && (
                  <Button variant="outline" onClick={() => downloadPdf(selected)}>
                    <Download className="mr-1.5 h-4 w-4" />
                    Télécharger le PDF
                  </Button>
                )}
                {selected.stripe_payment_link_url && (selected.status === 'sent' || selected.status === 'overdue') && (
                  <Button asChild className="ps-brand-gradient text-white">
                    <a href={selected.stripe_payment_link_url} target="_blank" rel="noopener noreferrer">
                      Payer en ligne
                      <ExternalLink className="ml-1.5 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
