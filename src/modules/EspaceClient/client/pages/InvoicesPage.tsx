import { useEffect, useMemo, useState } from 'react';
import { Receipt, Loader2, CreditCard, Download, CheckCircle2, AlertCircle } from 'lucide-react';
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
import { portalSupabase as supabase } from '@/lib/supabase';

const STORAGE_BUCKET = 'propulspace-documents';

function formatMoney(amount: string | number, currency: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

type PaymentBanner =
  | { kind: 'success' }
  | { kind: 'cancel' }
  | { kind: 'error'; message: string };

async function startCheckout(target: 'invoice' | 'installment', target_id: string): Promise<{ url?: string; error?: string }> {
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
  const { rows, loading, error, refresh } = usePortalInvoices();
  const { rows: installments, refresh: refreshInstallments } = usePortalInstallments();
  const [selected, setSelected] = useState<PortalInvoice | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<PaymentBanner | null>(null);

  // Lecture des query params au mount : paiement=reussi|annule (retour Stripe).
  // Code review H-4 : le webhook Stripe peut arriver quelques secondes après
  // la redirection. On polle 4× avec 2s d'intervalle pour rattraper le
  // décalage et afficher le bon statut sans erreur UX.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('paiement');
    if (result === 'reussi') {
      setBanner({ kind: 'success' });
      let count = 0;
      const id = setInterval(() => {
        void refresh();
        void refreshInstallments();
        count += 1;
        if (count >= 4) clearInterval(id);
      }, 2000);
      // Premier refresh immédiat aussi
      void refresh();
      void refreshInstallments();
    } else if (result === 'annule') {
      setBanner({ kind: 'cancel' });
    }
    if (result) {
      params.delete('paiement');
      params.delete('session_id');
      const newSearch = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
    }
  }, [refresh, refreshInstallments]);

  async function handlePay(target: 'invoice' | 'installment', target_id: string) {
    setPayingId(target_id);
    const { url, error: payErr } = await startCheckout(target, target_id);
    if (payErr || !url) {
      setBanner({ kind: 'error', message: payErr ?? 'Échec de la création du paiement.' });
      setPayingId(null);
      return;
    }
    // Redirige vers la page de paiement Stripe hébergée
    window.location.href = url;
  }

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

      {banner?.kind === 'success' && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Paiement reçu. La confirmation arrive dans quelques instants — votre facture sera mise à jour automatiquement.</span>
        </div>
      )}
      {banner?.kind === 'cancel' && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Paiement annulé. Votre facture reste impayée — vous pouvez réessayer quand vous voulez.</span>
        </div>
      )}
      {banner?.kind === 'error' && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{banner.message}</span>
        </div>
      )}

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
                    {inv.title && <p className="truncate text-[12px] font-medium text-[var(--ps-fg-secondary)]">{inv.title}</p>}
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
                {selected.title && <span className="block font-medium text-[var(--ps-fg-secondary)]">{selected.title}</span>}
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
                    {installmentsByInvoice.get(selected.id)?.map(inst => {
                      const isPayable = inst.status === 'pending' || inst.status === 'overdue';
                      return (
                        <li key={inst.id} className="flex items-center gap-3 px-3 py-2.5 text-[12.5px]">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[var(--ps-fg)]">{inst.label || `Échéance ${inst.installment_number}`}</p>
                            <p className="text-[11px] text-[var(--ps-fg-muted)]">Due le {formatDate(inst.due_date)}</p>
                          </div>
                          <span className="ps-num font-semibold text-[var(--ps-fg)]">
                            {formatMoney(inst.amount, selected.currency)}
                          </span>
                          <StatusBadge status={inst.status} />
                          {isPayable && (
                            <Button
                              size="sm"
                              onClick={() => handlePay('installment', inst.id)}
                              disabled={payingId === inst.id}
                              className="ps-brand-gradient text-white"
                            >
                              {payingId === inst.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <>Payer</>}
                            </Button>
                          )}
                        </li>
                      );
                    })}
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
                {/* Code review M-5 : on retire "Payer la facture entière" si
                    partially_paid pour éviter un trop-perçu (le client a déjà
                    réglé un ou plusieurs acomptes). On force à compléter
                    acompte par acompte via les boutons "Payer" individuels. */}
                {(selected.status === 'sent' || selected.status === 'overdue') && (
                  <Button
                    onClick={() => handlePay('invoice', selected.id)}
                    disabled={payingId === selected.id}
                    className="ps-brand-gradient text-white"
                  >
                    {payingId === selected.id
                      ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Redirection…</>
                      : <><CreditCard className="mr-1.5 h-4 w-4" />Payer la facture entière</>}
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
