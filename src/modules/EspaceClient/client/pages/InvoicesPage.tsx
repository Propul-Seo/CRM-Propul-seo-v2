import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Receipt, Loader2, CreditCard, Download, CheckCircle2, AlertCircle,
  Search, Eye, MessageSquare, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EmptyState, StatusBadge, Badge, Skeleton, InvoicePreviewDialog,
} from '@/modules/EspaceClient/shared/components';
import {
  usePortalInvoices, usePortalInstallments, getSignedStorageUrl,
  type PortalInvoice, type PortalInstallment,
} from '../hooks/usePortalData';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { portalSupabase as supabase } from '@/lib/supabase';
import { InvoiceTimeline } from '../components/InvoiceTimeline';

const STORAGE_BUCKET = 'propulspace-documents';

const EUR0 = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});

function num(amount: string | number | null | undefined): number {
  const n = amount == null ? 0 : typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number.isNaN(n) ? 0 : n;
}

function money(amount: string | number | null | undefined, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(num(amount));
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatLongDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const UNPAID = new Set(['sent', 'overdue', 'partially_paid']);

type PaymentBanner =
  | { kind: 'success' }
  | { kind: 'cancel' }
  | { kind: 'error'; message: string };

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
  const { project } = usePortal();
  const { rows, loading, error, refresh } = usePortalInvoices();
  const { rows: installments, refresh: refreshInstallments } = usePortalInstallments();

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

  // Sélection par défaut : première facture impayée, sinon la plus récente.
  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(inv =>
      (inv.invoice_number ?? '').toLowerCase().includes(q) ||
      (inv.title ?? '').toLowerCase().includes(q),
    );
  }, [rows, query]);

  useEffect(() => {
    if (selectedId && rows.some(r => r.id === selectedId)) return;
    const next = rows.find(r => UNPAID.has(r.status)) ?? rows[0];
    setSelectedId(next?.id ?? null);
  }, [rows, selectedId]);

  const selected = useMemo(
    () => rows.find(r => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  // KPIs en-tête (Total dû / En retard / Payé).
  const stats = useMemo(() => {
    const totalDue = rows.filter(i => UNPAID.has(i.status)).reduce((s, i) => s + num(i.amount_total), 0);
    const overdue = rows.filter(i => i.status === 'overdue');
    const overdueAmount = overdue.reduce((s, i) => s + num(i.amount_total), 0);
    const paidAmount = rows.filter(i => i.status === 'paid').reduce((s, i) => s + num(i.amount_total), 0);
    const dueCount = rows.filter(i => UNPAID.has(i.status)).length;
    return { totalDue, overdue, overdueAmount, paidAmount, dueCount };
  }, [rows]);

  async function handlePay(target: 'invoice' | 'installment', target_id: string) {
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
    const url = await getSignedStorageUrl(STORAGE_BUCKET, inv.pdf_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (loading) return <InvoicesSkeleton />;

  return (
    <div className="ps-fade-in space-y-6">
      {/* En-tête encre pleine (pas de gradient-text) */}
      <header>
        <h1 className="ps-h1 text-[var(--ps-fg)]">Factures</h1>
        <p className="ps-small mt-1">
          {project.name ?? 'Votre projet'} — échéances, paiements et historique.
        </p>
      </header>

      {banner?.kind === 'success' && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--ps-success-subtle)] bg-[var(--ps-success-subtle)] px-3.5 py-2.5 text-[13px] text-[var(--ps-success-text)]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Paiement reçu. La confirmation arrive dans quelques instants — votre facture sera mise à jour automatiquement.</span>
        </div>
      )}
      {banner?.kind === 'cancel' && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--ps-warning-subtle)] bg-[var(--ps-warning-subtle)] px-3.5 py-2.5 text-[13px] text-[var(--ps-warning-text)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Paiement annulé. Votre facture reste impayée — vous pouvez réessayer quand vous voulez.</span>
        </div>
      )}
      {banner?.kind === 'error' && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--ps-danger-subtle)] bg-[var(--ps-danger-subtle)] px-3.5 py-2.5 text-[13px] text-[var(--ps-danger-text)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{banner.message}</span>
        </div>
      )}

      {/* Cartes statistiques */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Receipt}
          label="Total dû"
          value={EUR0.format(stats.totalDue)}
          sub={`${stats.dueCount} facture${stats.dueCount > 1 ? 's' : ''} en cours`}
        />
        <StatCard
          icon={Clock}
          label="En retard"
          value={EUR0.format(stats.overdueAmount)}
          tone="danger"
          badge={stats.overdue.length > 0
            ? <Badge tone="red">{stats.overdue.length} facture{stats.overdue.length > 1 ? 's' : ''}</Badge>
            : <Badge tone="green">Aucune</Badge>}
        />
        <StatCard
          icon={CheckCircle2}
          label="Payé"
          value={EUR0.format(stats.paidAmount)}
          tone="success"
          sub="Total réglé à ce jour"
        />
      </div>

      {rows.length === 0 ? (
        <section className="ps-surface p-6">
          <EmptyState icon={Receipt} title="Aucune facture" body="Vos factures apparaîtront ici dès qu'elles seront émises." />
        </section>
      ) : (
        <div className="grid items-stretch gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* ── MASTER : liste des factures ── */}
          <section className="ps-surface flex flex-col overflow-hidden">
            <div className="border-b border-[var(--ps-border-soft)] p-4">
              <h2 className="ps-h3 mb-3">Toutes les factures</h2>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ps-fg-muted)]" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Chercher une facture…"
                  className="h-9 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg-subtle)] pl-9 pr-3 text-[13.5px] text-[var(--ps-fg)] outline-none"
                />
              </div>
            </div>

            <ul className="max-h-[640px] flex-1 overflow-y-auto py-2">
              {visibleRows.length === 0 && (
                <li className="px-5 py-6 text-center text-[12.5px] text-[var(--ps-fg-muted)]">
                  Aucune facture ne correspond.
                </li>
              )}
              {visibleRows.map(inv => {
                const isSel = inv.id === selectedId;
                const insts = installmentsByInvoice.get(inv.id) ?? [];
                const pct = paidPercent(inv, insts);
                return (
                  <li key={inv.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(inv.id)}
                      className={`flex w-full flex-col gap-1.5 border-l-[3px] px-5 py-3 text-left transition-colors ${
                        isSel
                          ? 'border-[var(--ps-primary)] bg-[var(--ps-primary-subtle)]'
                          : 'border-transparent hover:bg-[var(--ps-bg-subtle)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="truncate text-[13px] font-semibold text-[var(--ps-fg)]"
                          style={{ fontFamily: 'var(--ps-font-display)' }}
                        >
                          {inv.invoice_number ?? 'Brouillon'}
                        </span>
                        <span className="ps-num shrink-0 text-[13px] font-semibold text-[var(--ps-fg)]">
                          {inv.status === 'draft' ? '—' : money(inv.amount_total, inv.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={inv.status} />
                        <span className="ps-num shrink-0 text-[11px] text-[var(--ps-fg-muted)]">
                          {inv.status === 'paid' && inv.paid_at
                            ? formatDate(inv.paid_at)
                            : `Éch. ${formatDate(inv.due_date)}`}
                        </span>
                      </div>
                      <div className="mt-0.5 h-[3px] overflow-hidden rounded-full bg-[var(--ps-primary-subtle)]">
                        <div
                          className={`h-full rounded-full ${pct >= 100 ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-primary)]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ── DETAIL ── */}
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
        </div>
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

// ── Pourcentage encaissé d'une facture (acomptes payés / total) ──────
function paidPercent(inv: PortalInvoice, insts: PortalInstallment[]): number {
  if (inv.status === 'paid') return 100;
  if (inv.status === 'draft' || inv.status === 'cancelled') return 0;
  const total = num(inv.amount_total);
  if (total <= 0) return 0;
  const paid = insts.filter(i => i.status === 'paid').reduce((s, i) => s + num(i.amount), 0);
  return Math.min(100, Math.round((paid / total) * 100));
}

// ── Carte statistique en-tête ─────────────────────────────────────────
interface StatCardProps {
  icon: typeof Receipt;
  label: string;
  value: string;
  sub?: string;
  badge?: ReactNode;
  tone?: 'danger' | 'success';
}

function StatCard({ icon: Icon, label, value, sub, badge, tone }: StatCardProps) {
  const valueColor =
    tone === 'danger' ? 'text-[var(--ps-danger)]'
      : tone === 'success' ? 'text-[var(--ps-success-text)]'
        : 'text-[var(--ps-fg)]';
  return (
    <div className="ps-surface p-5">
      <p className="ps-eyebrow ps-eyebrow-muted flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </p>
      <p className={`ps-metric mt-2.5 ${valueColor}`}>{value}</p>
      {sub && <p className="mt-1.5 text-[12px] text-[var(--ps-fg-secondary)]">{sub}</p>}
      {badge && <div className="mt-2">{badge}</div>}
    </div>
  );
}

// ── Détail (colonne droite) ───────────────────────────────────────────
interface InvoiceDetailProps {
  invoice: PortalInvoice;
  installments: PortalInstallment[];
  payingId: string | null;
  onPay: (target: 'invoice' | 'installment', target_id: string) => void;
  onDownload: (inv: PortalInvoice) => void;
  onPreview: () => void;
}

function InvoiceDetail({ invoice, installments, payingId, onPay, onDownload, onPreview }: InvoiceDetailProps) {
  const currency = invoice.currency || 'EUR';
  const fmtMoney = (a: string | number) => money(a, currency);

  const total = num(invoice.amount_total);
  const paidAmount = installments.filter(i => i.status === 'paid').reduce((s, i) => s + num(i.amount), 0);
  const remaining = invoice.status === 'paid' ? 0 : Math.max(0, total - paidAmount);
  const pct = paidPercent(invoice, installments);

  const isCancelled = invoice.status === 'cancelled';
  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';

  // On privilégie le paiement échéance par échéance dès qu'il existe des
  // installments (garde anti-trop-perçu : pas de "facture entière" si elle est
  // découpée en acomptes).
  const canPayWhole = (invoice.status === 'sent' || invoice.status === 'overdue') && installments.length === 0;

  return (
    <section className="ps-surface flex flex-col overflow-hidden p-7 md:p-8">
      {/* Entête détail */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--ps-border-soft)] pb-5">
        <div className="min-w-0">
          <p className="ps-eyebrow ps-eyebrow-muted">Facture {invoice.invoice_number ?? 'Brouillon'}</p>
          <h2 className="ps-h2 mt-1.5 text-[var(--ps-fg)]">{invoice.title ?? 'Facture'}</h2>
          <div className="mt-2.5">
            <StatusBadge status={invoice.status} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-[var(--ps-fg-muted)]">Montant total TTC</p>
          <p className="ps-num mt-0.5 text-[28px] font-bold tracking-tight text-[var(--ps-fg)]" style={{ fontFamily: 'var(--ps-font-display)' }}>
            {fmtMoney(invoice.amount_total)}
          </p>
          {!isPaid && !isCancelled && (
            <p className={`mt-1 text-[12px] ${isOverdue ? 'font-semibold text-[var(--ps-danger)]' : 'text-[var(--ps-fg-secondary)]'}`}>
              Échéance&nbsp;: {formatLongDate(invoice.due_date)}
            </p>
          )}
        </div>
      </div>

      {/* Grille méta */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetaCell label="Émission" value={formatLongDate(invoice.issue_date)} />
        <MetaCell label="Échéance" value={formatLongDate(invoice.due_date)} tone={isOverdue ? 'danger' : undefined} />
        <MetaCell label="Montant TTC" value={fmtMoney(invoice.amount_total)} />
        <MetaCell
          label="Restant dû"
          value={isCancelled ? '—' : fmtMoney(remaining)}
          tone={!isCancelled && remaining > 0 ? 'primary' : undefined}
        />
      </div>

      {/* Ligne de vie du paiement */}
      {!isCancelled && (
        <div className="mt-7">
          <p className="ps-eyebrow ps-eyebrow-muted mb-4">Ligne de vie du paiement</p>
          <InvoiceTimeline
            issueDate={invoice.issue_date}
            installments={installments}
            invoiceStatus={invoice.status}
            paidAt={invoice.paid_at}
            formatDate={formatDate}
            formatMoney={fmtMoney}
          />
        </div>
      )}

      {/* Progression encaissée */}
      {!isCancelled && total > 0 && (
        <div className="mt-7">
          <p className="ps-eyebrow ps-eyebrow-muted mb-2.5">Progression globale</p>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--ps-fg-secondary)]">Encaissé sur total</span>
            <span className="ps-num text-[13px] font-semibold text-[var(--ps-fg)]">
              {fmtMoney(isPaid ? total : paidAmount)} / {fmtMoney(total)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ps-primary-subtle)]">
            <div
              className={`h-full rounded-full ${pct >= 100 ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-primary)]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="ps-num mt-1.5 text-right text-[12px] text-[var(--ps-fg-muted)]">
            {pct}% encaissé{pct < 100 ? ` · ${100 - pct}% restant` : ''}
          </p>
        </div>
      )}

      {/* Récap chiffré + échéances payables */}
      <div className="mt-7 overflow-hidden rounded-xl border border-[var(--ps-border-soft)]">
        <RecapRow label="Montant TTC" amount={fmtMoney(invoice.amount_total)} />
        {paidAmount > 0 && !isPaid && (
          <RecapRow label="Déjà réglé" amount={`− ${fmtMoney(paidAmount)}`} tone="credit" />
        )}
        <div className="flex items-center justify-between bg-[var(--ps-primary-subtle)] px-4 py-3">
          <span className="text-[13.5px] font-semibold text-[var(--ps-primary-text)]">
            {isPaid ? 'Payée intégralement' : isCancelled ? 'Facture annulée' : 'Restant dû'}
          </span>
          <span className="ps-num text-[14px] font-semibold text-[var(--ps-primary-text)]">
            {isPaid ? fmtMoney(0) : isCancelled ? '—' : fmtMoney(remaining)}
          </span>
        </div>
      </div>

      {/* Échéances individuelles avec paiement */}
      {installments.length > 0 && (
        <div className="mt-6">
          <p className="ps-eyebrow ps-eyebrow-muted mb-2.5">Échéances</p>
          <ul className="divide-y divide-[var(--ps-border-soft)] overflow-hidden rounded-xl border border-[var(--ps-border-soft)]">
            {installments.map(inst => {
              const isPayable = !isCancelled && (inst.status === 'pending' || inst.status === 'overdue');
              return (
                <li key={inst.id} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--ps-fg)]">{inst.label || `Échéance ${inst.installment_number}`}</p>
                    <p className="ps-num text-[11px] text-[var(--ps-fg-muted)]">
                      {inst.status === 'paid' && inst.paid_at ? `Réglé le ${formatDate(inst.paid_at)}` : `Due le ${formatDate(inst.due_date)}`}
                    </p>
                  </div>
                  <span className="ps-num shrink-0 font-semibold text-[var(--ps-fg)]">{fmtMoney(inst.amount)}</span>
                  <StatusBadge status={inst.status} />
                  {isPayable && (
                    <Button
                      size="sm"
                      onClick={() => onPay('installment', inst.id)}
                      disabled={payingId === inst.id}
                      className="bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
                    >
                      {payingId === inst.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Payer'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex flex-wrap items-center gap-2.5 border-t border-[var(--ps-border-soft)] pt-5">
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="mr-1.5 h-4 w-4" />
          Aperçu
        </Button>
        {invoice.pdf_url && (
          <Button variant="outline" size="sm" onClick={() => onDownload(invoice)}>
            <Download className="mr-1.5 h-4 w-4" />
            Télécharger le PDF
          </Button>
        )}
        <a
          href="mailto:team@propulseo-site.com"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3.5 text-[13px] font-medium text-[var(--ps-fg-secondary)] transition-colors hover:bg-[var(--ps-bg-subtle)]"
        >
          <MessageSquare className="h-4 w-4" />
          Contacter Propul'SEO
        </a>
        {canPayWhole && (
          <Button
            onClick={() => onPay('invoice', invoice.id)}
            disabled={payingId === invoice.id}
            className="ml-auto bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
          >
            {payingId === invoice.id
              ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Redirection…</>
              : <><CreditCard className="mr-1.5 h-4 w-4" />Payer ({fmtMoney(remaining)})</>}
          </Button>
        )}
      </div>
    </section>
  );
}

// ── Cellule méta ──────────────────────────────────────────────────────
function MetaCell({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'primary' }) {
  const color =
    tone === 'danger' ? 'text-[var(--ps-danger)]'
      : tone === 'primary' ? 'text-[var(--ps-primary-text)]'
        : 'text-[var(--ps-fg)]';
  return (
    <div className="rounded-lg border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] px-3.5 py-3">
      <p className="ps-eyebrow ps-eyebrow-muted">{label}</p>
      <p className={`ps-num mt-1 text-[13.5px] font-semibold ${color}`} style={{ fontFamily: 'var(--ps-font-display)' }}>
        {value}
      </p>
    </div>
  );
}

// ── Ligne de récap chiffré ────────────────────────────────────────────
function RecapRow({ label, amount, tone }: { label: string; amount: string; tone?: 'credit' }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--ps-border-soft)] px-4 py-3 last:border-b-0">
      <span className="text-[13.5px] text-[var(--ps-fg-secondary)]">{label}</span>
      <span className={`ps-num text-[14px] font-semibold ${tone === 'credit' ? 'text-[var(--ps-success-text)]' : 'text-[var(--ps-fg)]'}`}>
        {amount}
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────
function InvoicesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="mt-2 h-4 w-72 rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Skeleton className="h-[480px] w-full rounded-2xl" />
        <Skeleton className="h-[480px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
