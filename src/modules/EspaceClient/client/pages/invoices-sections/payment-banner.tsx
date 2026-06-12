import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Bandeaux de retour Stripe (et erreurs de chargement) — pattern d'alerte
// existant de la page, copies conservées au mot près.

export type PaymentBanner =
  | { kind: 'success' }
  | { kind: 'cancel' }
  | { kind: 'error'; message: string };

const STYLES: Record<PaymentBanner['kind'], string> = {
  success: 'border-[var(--ps-success-subtle)] bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]',
  cancel:  'border-[var(--ps-warning-subtle)] bg-[var(--ps-warning-subtle)] text-[var(--ps-warning-text)]',
  error:   'border-[var(--ps-danger-subtle)] bg-[var(--ps-danger-subtle)] text-[var(--ps-danger-text)]',
};

export function PaymentBannerView({ banner }: { banner: PaymentBanner }) {
  const Icon = banner.kind === 'success' ? CheckCircle2 : AlertCircle;
  const message =
    banner.kind === 'success'
      ? 'Paiement reçu. La confirmation arrive dans quelques instants — votre facture sera mise à jour automatiquement.'
      : banner.kind === 'cancel'
        ? 'Paiement annulé. Votre facture reste impayée — vous pouvez réessayer quand vous voulez.'
        : banner.message;
  return (
    <div role="status" className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] ${STYLES[banner.kind]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
