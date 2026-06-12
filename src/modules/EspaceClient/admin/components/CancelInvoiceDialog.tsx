import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminFormField } from './kit';

interface Props {
  open: boolean;
  invoiceNumber: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<{ error: string | null }>;
}

// Dialog danger : annulation d'une facture (pattern aligné sur DeactivatePortalDialog).
export function CancelInvoiceDialog({ open, invoiceNumber, onOpenChange, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true); setError(null);
    const { error: err } = await onConfirm(reason.trim());
    setSubmitting(false);
    if (err) { setError(err); return; }
    setReason('');
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setReason(''); setError(null); } onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
            <AlertTriangle className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <DialogTitle className="text-center">
            {invoiceNumber ? `Annuler la facture ${invoiceNumber} ?` : 'Annuler la facture ?'}
          </DialogTitle>
          <DialogDescription className="text-center">
            La facture passera définitivement au statut « Annulée », sans retour en arrière possible.
            Action réservée aux factures non payées.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <AdminFormField label="Motif (optionnel)" htmlFor="cancel-invoice-reason" hint="Conservé sur la facture annulée.">
            <Input
              id="cancel-invoice-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex. erreur de montant"
              disabled={submitting}
            />
          </AdminFormField>
          {error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Conserver la facture
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Confirmer l'annulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
