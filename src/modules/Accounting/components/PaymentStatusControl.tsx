import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AccountingEntry } from '@/hooks/useMonthlyAccounting';
import { getEffectivePaymentStatus, PAYMENT_STATUS_META } from '@/modules/Accounting/lib/paymentStatus';

interface PaymentStatusControlProps {
  entry: Pick<AccountingEntry, 'payment_status' | 'due_date'>;
  onChange: (status: 'paid' | 'pending', dueDate?: string | null) => void;
  className?: string;
}

export function PaymentStatusControl({ entry, onChange, className }: PaymentStatusControlProps) {
  const [open, setOpen] = useState(false);
  const [dueDate, setDueDate] = useState(entry.due_date?.slice(0, 10) ?? '');
  const status = getEffectivePaymentStatus(entry);
  const meta = PAYMENT_STATUS_META[status];
  const isPaid = status === 'paid';

  const handleOpenChange = (next: boolean) => {
    if (next) setDueDate(entry.due_date?.slice(0, 10) ?? ''); // resync à l'ouverture
    setOpen(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Changer le statut de paiement"
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition hover:brightness-110',
            meta.badgeClassName,
            className,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClassName)} />
          {meta.label}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[60] w-56 border-white/10 bg-[#14121f] p-2 text-violet-100">
        <button
          type="button"
          onClick={() => { onChange('paid'); setOpen(false); }}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition hover:bg-white/[0.06]',
            isPaid && 'bg-emerald-400/10',
          )}
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Payé (encaissé)
          </span>
          {isPaid && <Check className="h-3.5 w-3.5 text-emerald-300" />}
        </button>

        <div className="mt-1 rounded-lg px-2.5 py-2">
          <span className="flex items-center gap-2 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            En attente
          </span>
          <label className="mt-2 block text-[11px] text-violet-100/55">Échéance (optionnel)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 min-h-[34px] w-full rounded-lg border border-white/10 bg-white/[0.05] px-2 text-xs text-white outline-none focus:border-violet-300/40"
          />
          <button
            type="button"
            onClick={() => { onChange('pending', dueDate || null); setOpen(false); }}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20"
          >
            Marquer en attente
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
