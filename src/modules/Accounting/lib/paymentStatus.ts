import type { AccountingEntry } from '@/hooks/useMonthlyAccounting';

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

type StatusInput = Pick<AccountingEntry, 'payment_status' | 'due_date'>;

// Clé jour en heure LOCALE (évite le décalage de fuseau de toISOString).
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Statut effectif d'une écriture. « overdue » n'est PAS stocké en base :
 * une écriture « pending » dont l'échéance est passée est considérée en retard.
 */
export function getEffectivePaymentStatus(entry: StatusInput): PaymentStatus {
  const status = entry.payment_status ?? 'paid';
  if (status !== 'pending') return status;
  if (entry.due_date && entry.due_date.slice(0, 10) < todayKey()) return 'overdue';
  return 'pending';
}

export function isUnpaid(entry: StatusInput): boolean {
  return getEffectivePaymentStatus(entry) !== 'paid';
}

/**
 * Champs à écrire pour passer une écriture en payé / en attente.
 * « paid » date l'encaissement à aujourd'hui et oublie l'échéance ;
 * « pending » efface la date d'encaissement et pose (ou non) l'échéance.
 */
export function paymentStatusUpdates(
  status: 'paid' | 'pending',
  dueDate?: string | null,
): { payment_status: PaymentStatus; payment_date: string | null; due_date: string | null } {
  if (status === 'paid') {
    return { payment_status: 'paid', payment_date: todayKey(), due_date: null };
  }
  return { payment_status: 'pending', payment_date: null, due_date: dueDate || null };
}

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; badgeClassName: string; dotClassName: string }
> = {
  paid: {
    label: 'Payé',
    badgeClassName: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    dotClassName: 'bg-emerald-400',
  },
  pending: {
    label: 'En attente',
    badgeClassName: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    dotClassName: 'bg-amber-400',
  },
  overdue: {
    label: 'En retard',
    badgeClassName: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    dotClassName: 'bg-rose-400',
  },
};
