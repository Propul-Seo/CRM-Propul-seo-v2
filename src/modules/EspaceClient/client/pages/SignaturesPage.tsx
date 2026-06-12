import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, PenLine } from 'lucide-react';
import { EmptyState, Skeleton, StatusPage } from '@/modules/EspaceClient/shared/components';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { usePortalSignatures, getSignedStorageUrl, type PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';
import { SignatureSignModal } from '@/modules/EspaceClient/client/components/SignatureSignModal';
import { SignaturesMasthead, type SignatureStats } from './signatures-sections/signatures-masthead';
import { SignaturesTable } from './signatures-sections/signatures-table';
import { SignatureDetail } from './signatures-sections/signature-detail';
import { toSignatureStatus } from './signatures-sections/signatures-lib';

const BUCKET = 'propulspace-documents';

/**
 * Page Signatures du portail — composition « Éditorial calme » (parité
 * Factures) : masthead (phrase d'état + bande de chiffres), liste éditoriale
 * posée sur le fond, détail de la sélection en seule surface élevée, clôture
 * contact. Le modal de signature (SES maison) et sa logique sont intacts.
 */
export function SignaturesPage() {
  const { rows, loading, error, refresh } = usePortalSignatures();
  const { project, previewMode, storage } = usePortal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signing, setSigning] = useState<PortalSignature | null>(null);

  const stats = useMemo<SignatureStats>(() => {
    const pending = rows.filter(r => toSignatureStatus(r.status) === 'pending');
    const nextExpiry = pending
      .map(r => r.expires_at)
      .filter((d): d is string => d != null)
      .sort()[0] ?? null;
    return {
      total: rows.length,
      pending: pending.length,
      signed: rows.filter(r => toSignatureStatus(r.status) === 'signed').length,
      nextExpiry,
    };
  }, [rows]);

  const oldestSent = useMemo(
    () => rows.map(r => r.sent_at ?? r.created_at).filter(Boolean).sort()[0] ?? null,
    [rows],
  );

  // Sélection par défaut : premier document en attente, sinon le plus récent.
  useEffect(() => {
    if (selectedId && rows.some(r => r.id === selectedId)) return;
    const next = rows.find(r => toSignatureStatus(r.status) === 'pending') ?? rows[0];
    setSelectedId(next?.id ?? null);
  }, [rows, selectedId]);

  const selected = useMemo(
    () => rows.find(r => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  async function downloadSigned(sig: PortalSignature) {
    if (!sig.signed_pdf_url) return;
    const url = await getSignedStorageUrl(storage, BUCKET, sig.signed_pdf_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (loading) return <SignaturesSkeleton />;

  if (error) {
    return (
      <div className="ps-fade-in">
        <StatusPage icon={PenLine} tone="red" title="Chargement impossible" subtitle={error} />
      </div>
    );
  }

  return (
    <div className="ps-fade-in w-full">
      <SignaturesMasthead projectName={project.name} stats={stats} />

      {rows.length === 0 ? (
        <div className="mt-10 sm:mt-14">
          <EmptyState
            icon={PenLine}
            title="Aucun document à signer"
            body="Vos contrats et devis à signer apparaîtront ici dès que votre équipe Propul'SEO les aura préparés."
          />
        </div>
      ) : (
        <>
          <SignaturesTable
            rows={rows}
            oldestSent={oldestSent}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {selected && (
            <SignatureDetail
              signature={selected}
              previewMode={previewMode}
              onSign={() => { if (!previewMode) setSigning(selected); }}
              onDownloadSigned={() => { void downloadSigned(selected); }}
            />
          )}

          <footer className="mt-4 grid gap-4 border-t border-[var(--ps-border)] pt-4 sm:grid-cols-2 sm:items-end">
            <div>
              <p className="ps-tiny">Documents du projet</p>
              <p className="ps-num mt-1 text-[15px] font-medium text-[var(--ps-fg)]">
                {stats.signed} signé{stats.signed > 1 ? 's' : ''} sur {stats.total}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="ps-small">Une question sur un document ?</p>
              <a
                href="mailto:team@propulseo-site.com"
                className="group mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-150 hover:text-[var(--ps-primary-hover)]"
              >
                Contacter Propul'SEO
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
              </a>
            </div>
          </footer>
        </>
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

// ── Squelette épousant la composition (masthead, liste, carte) ──────────
function SignaturesSkeleton() {
  return (
    <div className="w-full" aria-hidden>
      <Skeleton className="h-[120px] w-full rounded-[var(--ps-radius-card)]" />
      <div className="mt-6">
        <Skeleton className="h-5 w-44 rounded-md" />
        <div className="mt-5 space-y-2">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-[52px] w-full rounded-lg" />
          ))}
        </div>
      </div>
      <Skeleton className="mt-6 h-[200px] w-full rounded-[var(--ps-radius-card)]" />
    </div>
  );
}
