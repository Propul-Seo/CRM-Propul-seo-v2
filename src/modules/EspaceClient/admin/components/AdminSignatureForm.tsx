import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateSignatureInput } from '../hooks/useAdminSignatures';

const TYPES: Array<{ value: string; label: string }> = [
  { value: 'quote', label: 'Devis' },
  { value: 'contract', label: 'Contrat' },
  { value: 'addendum', label: 'Avenant' },
  { value: 'other', label: 'Autre' },
];

const SELECT_CLASS = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail: string | null;
  onSubmit: (input: CreateSignatureInput) => Promise<{ error: string | null }>;
}

export function AdminSignatureForm({ open, onOpenChange, defaultEmail, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [signatureType, setSignatureType] = useState('contract');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(''); setSignatureType('contract'); setSignerEmail(defaultEmail ?? '');
    setSignerName(''); setTemplateId(''); setFormError(null);
  }, [open, defaultEmail]);

  async function handleSubmit() {
    if (!name.trim()) { setFormError('Le nom du document est requis.'); return; }
    if (!signerEmail.trim()) { setFormError("L'email du signataire est requis."); return; }
    if (!templateId.trim()) { setFormError('Le template DocuSeal est requis.'); return; }
    if (Number.isNaN(Number(templateId.trim()))) { setFormError('Le template DocuSeal doit être un identifiant numérique.'); return; }
    setSubmitting(true); setFormError(null);
    const { error } = await onSubmit({
      name: name.trim(), signatureType, signerEmail: signerEmail.trim(),
      signerName: signerName.trim() || undefined, templateId: templateId.trim(),
    });
    setSubmitting(false);
    if (error) { setFormError(error); return; }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nouvelle signature</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nom du document</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Contrat de prestation 2026" /></div>
          <div>
            <Label>Type</Label>
            <select className={SELECT_CLASS} value={signatureType} onChange={e => setSignatureType(e.target.value)}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><Label>Email du signataire</Label><Input type="email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)} /></div>
          <div><Label>Nom du signataire (optionnel)</Label><Input value={signerName} onChange={e => setSignerName(e.target.value)} /></div>
          <div><Label>Template DocuSeal (ID)</Label><Input value={templateId} onChange={e => setTemplateId(e.target.value)} placeholder="Ex. 12345" /></div>
          {formError && <p className="text-sm text-red-300">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Envoyer à signer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
