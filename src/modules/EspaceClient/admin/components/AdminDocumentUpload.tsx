import { useEffect, useState, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { AdminFormDialog, AdminFormField, AdminSelect } from './kit';
import type { UploadDocumentInput } from '../hooks/useAdminDocuments';
import { DOC_TYPES } from './tabConstants';

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
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ajouter un document"
      formError={formError}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel="Téléverser"
    >
      <AdminFormField label="Fichier">
        <Input type="file" onChange={onFileChange} />
      </AdminFormField>
      <AdminFormField label="Nom">
        <Input value={name} onChange={e => setName(e.target.value)} />
      </AdminFormField>
      <AdminFormField label="Type">
        <AdminSelect options={DOC_TYPES} value={documentType} onChange={e => setDocumentType(e.target.value)} />
      </AdminFormField>
      <AdminFormField label="Description (optionnel)">
        <Input value={description} onChange={e => setDescription(e.target.value)} />
      </AdminFormField>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Visible par le client
      </label>
    </AdminFormDialog>
  );
}
