import { AlertTriangle, Check, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';
import { cn } from '@/lib/utils';
import type { ReceivablesData } from '@/modules/Accounting/hooks/useReceivables';
import { getEffectivePaymentStatus, PAYMENT_STATUS_META } from '@/modules/Accounting/lib/paymentStatus';

interface UnpaidSummaryProps {
  data: ReceivablesData;
}

export function UnpaidSummary({ data }: UnpaidSummaryProps) {
  if (data.count === 0) return null;

  return (
    <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-amber-300" />
          <h3 className="text-sm font-semibold text-white">Impayés</h3>
        </div>
        <span className="text-base font-bold text-amber-200">{formatCurrency(data.total)}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-violet-100/60">
        <span>
          En attente : <span className="font-semibold text-amber-200/90">{formatCurrency(data.pendingTotal)}</span>
        </span>
        {data.overdueTotal > 0 && (
          <span className="flex items-center gap-1 text-rose-300">
            <AlertTriangle className="h-3 w-3" />
            En retard : <span className="font-semibold">{formatCurrency(data.overdueTotal)}</span>
          </span>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {data.entries.map((entry) => {
          const meta = PAYMENT_STATUS_META[getEffectivePaymentStatus(entry)];
          return (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{entry.description}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-violet-100/55">
                  <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', meta.badgeClassName)}>
                    {meta.label}
                  </span>
                  {entry.due_date && <span>Échéance {formatDate(entry.due_date)}</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold text-amber-200">
                  {formatCurrency(parseFloat(String(entry.amount)) || 0)}
                </span>
                <button
                  type="button"
                  onClick={() => data.markPaid(entry.id)}
                  title="Marquer comme payé"
                  className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
