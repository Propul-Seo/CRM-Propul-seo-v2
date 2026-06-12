import { useState } from 'react';
import { PenLine } from 'lucide-react';
import { EmptyState, Skeleton, StatusPage } from '@/modules/EspaceClient/shared/components';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { usePortalSignatures, getSignedStorageUrl, type PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';
import { SignatureSignModal } from '@/modules/EspaceClient/client/components/SignatureSignModal';
import { SignaturesHeader } from './signatures-sections/signatures-header';
import { SignaturesCard } from './signatures-sections/signatures-card';
import { toSignatureStatus } from './signatures-sections/signatures-lib';

const BUCKET = 'propulspace-documents';

/**
 * Page Signatures du portail — forme compacte calquée sur l'aperçu admin
 * (couleurs Aurora) : en-tête masthead + carte dense unique (dot + libellé FR,
 * date, action « Signer »). Le modal de signature et sa logique sont intacts.
 */
export function SignaturesPage() {
  const { rows, loading, error, refresh } = usePortalSignatures();
  const { project, previewMode, storage } = usePortal();
  const [signing, setSigning] = useState<PortalSignature | null>(null);

  const pending = rows.filter(r => toSignatureStatus(r.status) === 'pending').length;
  const signed = rows.filter(r => toSignatureStatus(r.status) === 'signed').length;

  async function downloadSigned(sig: PortalSignature) {
    if (!sig.signed_pdf_url) return;
    const url = await getSignedStorageUrl(storage, BUCKET, sig.signed_pdf_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (!loading && error) {
    return (
      <div className="ps-fade-in">
        <StatusPage icon={PenLine} tone="red" title="Chargement impossible" subtitle={error} />
      </div>
    );
  }

  return (
    <div className="ps-fade-in space-y-4">
      <SignaturesHeader total={rows.length} pending={pending} signed={signed} loading={loading} />

      {loading && (
        <section className="ps-surface overflow-hidden" aria-hidden>
          <div className="border-b border-[var(--ps-border-soft)] px-5 py-3.5">
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>
          <div className="divide-y divide-[var(--ps-border-soft)]">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-1/2 rounded-md" />
                  <Skeleton className="mt-2 h-3 w-1/3 rounded-md" />
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && rows.length === 0 && (
        <EmptyState
          icon={PenLine}
          title="Aucun document à signer"
          body="Vos contrats et devis à signer apparaîtront ici dès que votre équipe Propul'SEO les aura préparés."
        />
      )}

      {!loading && rows.length > 0 && (
        <SignaturesCard
          rows={rows}
          previewMode={previewMode}
          onSign={setSigning}
          onDownloadSigned={(sig) => { void downloadSigned(sig); }}
        />
      )}

      {signing && (
        <SignatureSignModal
          open={signing !== null}
          onOpenChange={(open) => { if (!open) setSigning(null); }}
          signature={signing}
          signerDefaultName={project.client_name ?? ''}
          onSigned={() => { void refresh(); }}
        />
      )}
    </div>
  );
}
