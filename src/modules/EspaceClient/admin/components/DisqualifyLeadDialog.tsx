import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdminPortalScope } from '@/modules/EspaceClient/admin/AdminBasePathContext';

interface DisqualifyLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  onConfirm: (reason: string) => Promise<void>;
}

// Vue 28 v2 — disqualifier un lead avec raison obligatoire (min 10 car.).
// La raison est sauvegardée dans la colonne `notes` du lead.
export function DisqualifyLeadDialog({ open, onOpenChange, leadName, onConfirm }: DisqualifyLeadDialogProps) {
  const portalScope = useAdminPortalScope();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (reason.trim().length < 10) return;
    setSubmitting(true);
    await onConfirm(reason.trim());
    setSubmitting(false);
    setReason('');
    onOpenChange(false);
  }

  const canConfirm = reason.trim().length >= 10 && !submitting;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={portalScope}>
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
            <AlertTriangle className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <AlertDialogTitle className="text-center">
            Disqualifier {leadName} ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Indiquez la raison de la disqualification. Elle restera dans l'historique du lead.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label htmlFor="disq-reason" className="text-[12.5px] font-semibold text-[var(--ps-fg)]">
            Raison <span className="text-[var(--ps-primary)]">*</span>
          </label>
          <Textarea
            id="disq-reason"
            rows={3}
            placeholder="Ex : Budget incompatible, secteur hors cible, contact injoignable depuis 3 relances…"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <p className="text-[11px] text-[var(--ps-fg-muted)]">
            Minimum 10 caractères ({reason.trim().length}/10).
          </p>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {submitting ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Disqualification…</>
            ) : (
              'Disqualifier'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
