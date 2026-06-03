import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UpdateDocumentPatch } from '../hooks/useAdminDocuments';
import type { PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: PortalDocument | null;
  onSubmit: (patch: UpdateDocumentPatch) => Promise<{ error: string | null }>;
}

export function AdminDocumentEditDialog({ open, onOpenChange, doc, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(doc?.name ?? '');
    setCategory(doc?.category ?? '');
    setDescription(doc?.description ?? '');
    setFormError(null);
  }, [open, doc]);

  async function handleSubmit() {
    if (!name.trim()) { setFormError('Le nom est requis.'); return; }
    setSubmitting(true); setFormError(null);
    const { error } = await onSubmit({
      name: name.trim(),
      category: category.trim() || null,
      description: description.trim() || null,
    });
    setSubmitting(false);
    if (error) { setFormError(error); return; }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Modifier le document</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nom</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>Catégorie (optionnel)</Label><Input value={category} onChange={e => setCategory(e.target.value)} /></div>
          <div><Label>Description (optionnel)</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
