import { useEffect, useState, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud, FileUp, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AdminFormDialog, AdminFormField, AdminSelect } from './kit';
import type { UploadDocumentInput } from '../hooks/useAdminDocuments';
import { DOC_TYPES } from './tabConstants';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: UploadDocumentInput) => Promise<{ error: string | null }>;
}

const formatSize = (b: number) =>
  b < 1024 ? `${b} o` : b < 1048576 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1048576).toFixed(1)} Mo`;

export function AdminDocumentUpload({ open, onOpenChange, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('deliverable');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visible, setVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFile(null); setDocumentType('deliverable'); setName(''); setDescription(''); setVisible(true); setFormError(null); setDragActive(false);
  }, [open]);

  function applyFile(f: File | null) {
    setFile(f);
    if (f && !name) setName(f.name);
  }
  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    applyFile(e.target.files?.[0] ?? null);
  }
  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    applyFile(e.dataTransfer.files?.[0] ?? null);
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
        {file ? (
          // Fichier sélectionné : récap (nom + taille) + bouton retirer.
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileUp className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs tabular-nums text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={submitting}
              aria-label="Retirer le fichier"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          // Dropzone : clic ou glisser-déposer, état drag actif en violet.
          <label
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-7 text-center transition-colors ' +
              (dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border bg-surface-1 hover:border-primary/40 hover:bg-surface-2')}
          >
            <input type="file" className="sr-only" onChange={onFileChange} />
            {/* pointer-events-none : évite le clignotement du dragLeave sur les enfants. */}
            <UploadCloud className={'pointer-events-none h-6 w-6 ' + (dragActive ? 'text-primary' : 'text-muted-foreground')} />
            <span className="pointer-events-none text-sm text-muted-foreground">
              {dragActive
                ? 'Déposez le fichier ici'
                : <>Glissez un fichier ici ou <span className="font-medium text-primary">parcourez</span></>}
            </span>
          </label>
        )}
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
        <input
          type="checkbox"
          checked={visible}
          onChange={e => setVisible(e.target.checked)}
          className="h-4 w-4 accent-primary"
        /> Visible par le client
      </label>
    </AdminFormDialog>
  );
}
