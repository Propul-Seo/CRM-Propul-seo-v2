import { useState } from 'react';
import { Plus, Bell, X, FileDown, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/modules/EspaceClient/shared/components';
import { AdminTabScaffold } from './AdminTabScaffold';
import { AdminSignatureForm } from './AdminSignatureForm';
import { useAdminSignatures } from '../hooks/useAdminSignatures';
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

const TYPE_LABEL: Record<string, string> = { quote: 'Devis', contract: 'Contrat', addendum: 'Avenant', other: 'Autre' };
const formatDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '';

export function SignaturesTab({ projectId, clientEmail }: { projectId: string; clientEmail: string | null }) {
  const { signatures, loading, error, createEnabled, createSignature, remindSignature, cancelSignature } = useAdminSignatures(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onRemind(sig: PortalSignature) {
    setBusyId(sig.id); setActionError(null);
    const { error } = await remindSignature(sig, clientEmail);
    if (error) setActionError(error);
    setBusyId(null);
  }
  async function onCancel(sig: PortalSignature) {
    if (!window.confirm(`Annuler la signature « ${sig.name} » ?`)) return;
    setBusyId(sig.id); setActionError(null);
    const { error } = await cancelSignature(sig);
    if (error) setActionError(error);
    setBusyId(null);
  }

  return (
    <>
      <AdminTabScaffold
        title={`${signatures.length} signature${signatures.length > 1 ? 's' : ''}`}
        action={{
          label: 'Nouvelle signature', icon: Plus, onClick: () => setFormOpen(true),
          disabled: !createEnabled, disabledReason: 'DocuSeal non configuré',
        }}
        loading={loading} error={error} actionError={actionError}
        isEmpty={signatures.length === 0} emptyIcon={PenLine} emptyTitle="Aucune signature" emptyBody="Envoyez un document à signer au client."
      >
        <ul className="divide-y divide-gray-100">
          {signatures.map(sig => (
            <li key={sig.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{sig.name}<span className="ml-2 text-xs text-gray-400">{TYPE_LABEL[sig.signature_type] ?? sig.signature_type}</span></p>
                <p className="text-xs text-gray-500">
                  {sig.sent_at ? `Envoyé le ${formatDate(sig.sent_at)}` : ''}
                  {sig.signed_at ? ` · Signé le ${formatDate(sig.signed_at)}` : ''}
                </p>
              </div>
              <StatusBadge status={sig.status} />
              {sig.status === 'signed' && sig.docuseal_signed_pdf_url && (
                <Button variant="ghost" size="icon" title="PDF signé" onClick={() => window.open(sig.docuseal_signed_pdf_url!, '_blank', 'noopener,noreferrer')}><FileDown className="h-4 w-4" /></Button>
              )}
              {sig.status === 'pending' && (
                <>
                  <Button variant="outline" size="sm" disabled={busyId === sig.id || !clientEmail || !sig.docuseal_signing_url} title={!sig.docuseal_signing_url ? 'Lien de signature indisponible' : undefined} onClick={() => onRemind(sig)}><Bell className="mr-1 h-4 w-4" />Relancer</Button>
                  <Button variant="ghost" size="icon" title="Annuler" disabled={busyId === sig.id} onClick={() => onCancel(sig)}><X className="h-4 w-4" /></Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </AdminTabScaffold>
      <AdminSignatureForm open={formOpen} onOpenChange={setFormOpen} defaultEmail={clientEmail} onSubmit={createSignature} />
    </>
  );
}
