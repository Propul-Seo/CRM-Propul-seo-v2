import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { AdminFormDialog, AdminFormField } from './kit';
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
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Modifier le document"
      formError={formError}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel="Enregistrer"
    >
      <AdminFormField label="Nom">
        <Input value={name} onChange={e => setName(e.target.value)} />
      </AdminFormField>
      <AdminFormField label="Catégorie (optionnel)">
        <Input value={category} onChange={e => setCategory(e.target.value)} />
      </AdminFormField>
      <AdminFormField label="Description (optionnel)">
        <Input value={description} onChange={e => setDescription(e.target.value)} />
      </AdminFormField>
    </AdminFormDialog>
  );
}
