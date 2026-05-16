import { Receipt } from 'lucide-react';
import { PlaceholderPage } from './_PlaceholderPage';

export function InvoicesPage() {
  return (
    <PlaceholderPage
      eyebrow="Factures"
      title="Vos factures"
      subtitle="Vos factures, échéances et historique de paiement."
      icon={Receipt}
    />
  );
}
