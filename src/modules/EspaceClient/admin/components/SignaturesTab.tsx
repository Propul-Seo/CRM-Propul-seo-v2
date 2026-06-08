import { useState } from 'react';
import { Plus, Bell, X, FileDown, PenLine, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/modules/EspaceClient/shared/components';
import { AdminSectionHeader, AdminCard, AdminEmptyState } from '@/modules/EspaceClient/admin/components/kit';
import { AdminSignatureForm } from './AdminSignatureForm';
import { useAdminSignatures } from '../hooks/useAdminSignatures';
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

const TYPE_LABEL: Record<string, string> = { quote: 'Devis', contract: 'Contrat', addendum: 'Avenant', other: 'Autre' };
const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '');

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
    <div className="py-2">
      <AdminSectionHeader
        title={`${signatures.length} signature${signatures.length > 1 ? 's' : ''}`}
        action={{
          label: 'Nouvelle signature',
          icon: Plus,
          onClick: () => setFormOpen(true),
          disabled: !createEnabled,
          title: !createEnabled ? 'DocuSeal non configuré' : undefined,
        }}
      />

      {loading && (
        <div className="py-6 text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Chargement…</div>
      )}
      {error && <p className="mb-3 rounded bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {actionError && <p className="mb-3 rounded bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p>}

      {!loading && !error && signatures.length === 0 && (
        <AdminEmptyState icon={PenLine} title="Aucune signature" body="Envoyez un document à signer au client." />
      )}

      {!loading && signatures.length > 0 && (
        <div className="space-y-2">
          {signatures.map((sig) => (
            <AdminCard key={sig.id}>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{sig.name}</p>
                    <span className="shrink-0 rounded-full border border-border bg-surface-3 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {TYPE_LABEL[sig.signature_type] ?? sig.signature_type}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[
                      sig.sent_at ? `Envoyé le ${formatDate(sig.sent_at)}` : null,
                      sig.signed_at ? `Signé le ${formatDate(sig.signed_at)}` : null,
                      sig.expires_at && sig.status === 'pending' ? `Expire le ${formatDate(sig.expires_at)}` : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>

                <StatusBadge status={sig.status} />

                <div className="flex shrink-0 items-center gap-1">
                  {sig.status === 'signed' && sig.docuseal_signed_pdf_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="PDF signé"
                      onClick={() => window.open(sig.docuseal_signed_pdf_url!, '_blank', 'noopener,noreferrer')}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                  )}
                  {sig.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === sig.id || !clientEmail || !sig.docuseal_signing_url}
                        title={!sig.docuseal_signing_url ? 'Lien de signature indisponible' : undefined}
                        onClick={() => onRemind(sig)}
                      >
                        {busyId === sig.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Bell className="mr-1 h-4 w-4" />Relancer</>}
                      </Button>
                      <Button variant="ghost" size="icon" title="Annuler" disabled={busyId === sig.id} onClick={() => onCancel(sig)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AdminSignatureForm open={formOpen} onOpenChange={setFormOpen} defaultEmail={clientEmail} onSubmit={createSignature} />
    </div>
  );
}
