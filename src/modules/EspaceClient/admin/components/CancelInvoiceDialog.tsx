import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  invoiceNumber: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<{ error: string | null }>;
}

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
          <DialogTitle>Annuler la facture {invoiceNumber ?? ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            La facture passera en « Annulée ». Action réservée aux factures non payées.
          </p>
          <div>
            <Label>Motif (optionnel)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. erreur de montant" />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Retour</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Confirmer l'annulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
