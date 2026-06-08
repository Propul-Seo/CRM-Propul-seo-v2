import { Dialog, DialogContent } from '@/components/ui/dialog';
import { InvoiceDocument } from './InvoiceDocument';
import type { PortalInvoice, PortalInstallment } from '@/modules/EspaceClient/client/hooks/usePortalData';

// Aperçu facture en dialog (utilisé côté admin). Côté client, le document est
// rendu directement inline via <InvoiceDocument> (pas de clic « Aperçu »).

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: PortalInvoice | null;
  installments?: PortalInstallment[];
}

export function InvoicePreviewDialog({ open, onOpenChange, invoice, installments = [] }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-y-auto p-0 sm:max-h-[85vh]">
        {invoice && <InvoiceDocument invoice={invoice} installments={installments} />}
      </DialogContent>
    </Dialog>
  );
}
