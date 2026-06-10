import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { AdminFormDialog, AdminFormField, AdminSelect } from './kit';
import type { CreateSignatureInput } from '../hooks/useAdminSignatures';
import type { PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData';

const TYPES = [
  { value: 'quote', label: 'Devis' },
  { value: 'contract', label: 'Contrat' },
  { value: 'addendum', label: 'Avenant' },
  { value: 'other', label: 'Autre' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail: string | null;
  documents: PortalDocument[];
  onSubmit: (input: CreateSignatureInput) => Promise<{ error: string | null }>;
}

export function AdminSignatureForm({ open, onOpenChange, defaultEmail, documents, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [signatureType, setSignatureType] = useState('contract');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Seuls les PDF sont signables (le PDF signé est généré à partir de la source).
  const pdfDocs = useMemo(
    () => documents.filter(d => d.file_mime_type === 'application/pdf' || d.name.toLowerCase().endsWith('.pdf')),
    [documents],
  );

  useEffect(() => {
    if (!open) return;
    setName(''); setSignatureType('contract'); setSignerEmail(defaultEmail ?? '');
    setSignerName(''); setDocumentId(''); setFormError(null);
  }, [open, defaultEmail]);

  function onPickDocument(id: string) {
    setDocumentId(id);
    const doc = pdfDocs.find(d => d.id === id);
    if (doc && !name.trim()) setName(doc.name);
  }

  async function handleSubmit() {
    if (!documentId) { setFormError('Choisissez le document à faire signer.'); return; }
    if (!name.trim()) { setFormError('Le nom du document est requis.'); return; }
    if (!signerEmail.trim()) { setFormError("L'email du signataire est requis."); return; }
    setSubmitting(true); setFormError(null);
    const { error } = await onSubmit({
      name: name.trim(), signatureType, signerEmail: signerEmail.trim(),
      signerName: signerName.trim() || undefined, documentId,
    });
    setSubmitting(false);
    if (error) { setFormError(error); return; }
    onOpenChange(false);
  }

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouvelle signature"
      formError={formError}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel="Envoyer à signer"
    >
      <AdminFormField
        label="Document à signer"
        hint={pdfDocs.length === 0
          ? "Aucun PDF dans ce projet. Ajoutez le devis/contrat dans l'onglet Documents."
          : undefined}
      >
        <AdminSelect
          value={documentId}
          onChange={e => onPickDocument(e.target.value)}
          placeholder="— Choisir un document —"
          options={pdfDocs.map(d => ({ value: d.id, label: d.name }))}
        />
      </AdminFormField>
      <AdminFormField label="Nom du document">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Contrat de prestation 2026" />
      </AdminFormField>
      <AdminFormField label="Type">
        <AdminSelect options={TYPES} value={signatureType} onChange={e => setSignatureType(e.target.value)} />
      </AdminFormField>
      <AdminFormField label="Email du signataire">
        <Input type="email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)} />
      </AdminFormField>
      <AdminFormField label="Nom du signataire (optionnel)">
        <Input value={signerName} onChange={e => setSignerName(e.target.value)} />
      </AdminFormField>
    </AdminFormDialog>
  );
}
