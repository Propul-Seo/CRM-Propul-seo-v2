import { ArrowRight } from 'lucide-react';
import { EUR0 } from './invoice-format';

// Clôture de la une : total du projet + contact facturation.

interface InvoicesFooterProps {
  paidAmount: number;
  totalDue: number;
}

export function InvoicesFooter({ paidAmount, totalDue }: InvoicesFooterProps) {
  return (
    <footer className="mt-14 grid gap-6 border-t border-[var(--ps-border)] pt-6 sm:mt-20 sm:grid-cols-2 sm:items-end">
      <div>
        <p className="ps-tiny">Total du projet</p>
        <p className="ps-num mt-1 text-[15px] font-medium text-[var(--ps-fg)]">
          {EUR0.format(paidAmount + totalDue)} TTC
        </p>
        <p className="ps-tiny ps-num mt-0.5">
          {EUR0.format(paidAmount)} réglés · {EUR0.format(totalDue)} à venir
        </p>
      </div>
      <div className="sm:text-right">
        <p className="ps-small">Une question sur une facture ?</p>
        <a
          href="mailto:team@propulseo-site.com"
          className="group mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-150 hover:text-[var(--ps-primary-hover)]"
        >
          Contacter Propul'SEO
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
        </a>
      </div>
    </footer>
  );
}
