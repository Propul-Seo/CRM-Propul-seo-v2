import { cn } from '@/lib/utils';
import type { AccountingEntry } from '@/hooks/useMonthlyAccounting';
import { getEffectivePaymentStatus, PAYMENT_STATUS_META } from '@/modules/Accounting/lib/paymentStatus';

interface PaymentStatusBadgeProps {
  entry: Pick<AccountingEntry, 'payment_status' | 'due_date'>;
  className?: string;
}

export function PaymentStatusBadge({ entry, className }: PaymentStatusBadgeProps) {
  const status = getEffectivePaymentStatus(entry);
  const meta = PAYMENT_STATUS_META[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        meta.badgeClassName,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClassName)} />
      {meta.label}
    </span>
  );
}
