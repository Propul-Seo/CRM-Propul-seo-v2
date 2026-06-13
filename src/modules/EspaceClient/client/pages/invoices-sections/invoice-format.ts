import type { PortalInvoice, PortalInstallment } from '@/modules/EspaceClient/client/hooks/usePortalData';

// Formats FR et calculs partagés de la page Factures (montants, dates, encaissé).

export const STORAGE_BUCKET = 'propulspace-documents';

/** Statuts « à régler » côté client (les brouillons ne sont jamais servis). */
export const UNPAID = new Set(['sent', 'overdue', 'partially_paid']);

/** Agrégats du masthead : montants ronds, lisibles de loin. */
export const EUR0 = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});

export function num(amount: string | number | null | undefined): number {
  const n = amount == null ? 0 : typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number.isNaN(n) ? 0 : n;
}

/** Montant au centime près (fmt FR existant de la page). */
export function money(amount: string | number | null | undefined, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(num(amount));
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatLongDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** Pourcentage encaissé d'une facture (acomptes payés / total). */
export function paidPercent(inv: PortalInvoice, insts: PortalInstallment[]): number {
  if (inv.status === 'paid') return 100;
  if (inv.status === 'draft' || inv.status === 'cancelled') return 0;
  const total = num(inv.amount_total);
  if (total <= 0) return 0;
  const paid = insts.filter(i => i.status === 'paid').reduce((s, i) => s + num(i.amount), 0);
  return Math.min(100, Math.round((paid / total) * 100));
}
