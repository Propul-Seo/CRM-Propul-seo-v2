import { useEffect, useState, type ChangeEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UploadDocumentInput } from '../hooks/useAdminDocuments';
import { DOC_TYPES } from './tabConstants';

const SELECT_CLASS = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: UploadDocumentInput) => Promise<{ error: string | null }>;
}

export function AdminDocumentUpload({ open, onOpenChange, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('deliverable');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visible, setVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null); setDocumentType('deliverable'); setName(''); setDescription(''); setVisible(true); setFormError(null);
  }, [open]);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !name) setName(f.name);
  }

  async function handleSubmit() {
    if (!file) { setFormError('Sélectionnez un fichier.'); return; }
    if (!name.trim()) { setFormError('Le nom est requis.'); return; }
    setSubmitting(true); setFormError(null);
    const { error } = await onSubmit({
      file, documentType, name: name.trim(),
      description: description.trim() || null, visibleToClient: visible,
    });
    setSubmitting(false);
    if (error) { setFormError(error); return; }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Ajouter un document</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Fichier</Label><Input type="file" onChange={onFileChange} /></div>
          <div><Label>Nom</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div>
            <Label>Type</Label>
            <select className={SELECT_CLASS} value={documentType} onChange={e => setDocumentType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><Label>Description (optionnel)</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Visible par le client
          </label>
          {formError && <p className="text-sm text-red-300">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Téléverser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
