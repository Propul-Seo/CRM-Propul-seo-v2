import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Hero, EmptyState, FileIcon, SectionHead } from '@/modules/EspaceClient/shared/components';
import { Button } from '@/components/ui/button';
import { usePortalDocuments, getSignedStorageUrl, type PortalDocument } from '../hooks/usePortalData';

const STORAGE_BUCKET = 'propulspace-documents';

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadDocument(doc: PortalDocument) {
  // file_url stocke le path Storage (pas l'URL signée). On génère une
  // URL signée valable 1h pour le téléchargement.
  const url = await getSignedStorageUrl(STORAGE_BUCKET, doc.file_url);
  if (!url) {
    alert('Impossible de générer le lien de téléchargement. Réessayez plus tard.');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

const TYPE_LABELS: Record<string, string> = {
  quote: 'Devis', contract: 'Contrat', invoice: 'Facture',
  deliverable: 'Livrable', audit: 'Audit', report: 'Rapport',
  asset_logo: 'Logo', asset_charter: 'Charte', asset_content: 'Contenu',
  asset_access: 'Accès', legal: 'Légal', other: 'Autre',
};

function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function DocumentsPage() {
  const { rows, loading, error } = usePortalDocuments();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(doc: PortalDocument) {
    setDownloadingId(doc.id);
    await downloadDocument(doc);
    setDownloadingId(null);
  }

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Documents"
        title="Vos documents"
        subtitle="Tous vos livrables et documents en un seul endroit."
      />

      <section className="ps-surface overflow-hidden">
        <SectionHead title={`${rows.length} document${rows.length > 1 ? 's' : ''}`} />
        {loading && (
          <div className="flex items-center justify-center py-8 text-[var(--ps-fg-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {error && (
          <p className="m-4 rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}
        {!loading && rows.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="Aucun document pour l'instant"
              body="Les devis, contrats et livrables apparaîtront ici dès qu'ils seront ajoutés."
            />
          </div>
        )}
        {!loading && rows.length > 0 && (
          <ul className="divide-y divide-[var(--ps-border-soft)]">
            {rows.map(doc => (
              <li key={doc.id} className="flex items-center gap-4 px-6 py-3.5">
                <FileIcon ext={extOf(doc.name)} mime={doc.file_mime_type ?? undefined} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-[var(--ps-fg)]">{doc.name}</p>
                  <p className="text-[12px] text-[var(--ps-fg-muted)]">
                    {TYPE_LABELS[doc.document_type] ?? doc.document_type}
                    {doc.file_size_bytes ? ` · ${formatSize(doc.file_size_bytes)}` : ''}
                    {` · v${doc.version}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Télécharger
                    </>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
