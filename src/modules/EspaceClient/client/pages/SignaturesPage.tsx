import { useEffect, useMemo, useState } from 'react';
import {
  PenLine, ExternalLink, Download, Maximize2, FileText, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EmptyState, SectionHead, StatusBadge, StatusPage, Skeleton, FilePreviewDialog,
} from '@/modules/EspaceClient/shared/components';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { usePortalSignatures, type PortalSignature } from '../hooks/usePortalData';
import { SignatureStepper } from '../components/SignatureStepper';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
}

const TYPE_LABELS: Record<string, string> = {
  quote: 'Devis', contract: 'Contrat', addendum: 'Avenant', other: 'Document',
};

export function SignaturesPage() {
  const { rows, loading, error } = usePortalSignatures();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sélection auto : on cible en priorité un document à signer, sinon le premier.
  useEffect(() => {
    if (rows.length === 0) { setSelectedId(null); return; }
    setSelectedId(prev => {
      if (prev && rows.some(r => r.id === prev)) return prev;
      return (rows.find(r => r.status === 'pending') ?? rows[0]).id;
    });
  }, [rows]);

  const selected = useMemo(
    () => rows.find(r => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  return (
    <div className="ps-fade-in space-y-6">
      {/* En-tête — titre encre pleine (pas de gradient) */}
      <header>
        <p className="ps-eyebrow">Signatures</p>
        <h1 className="ps-h1 mt-1.5 text-[26px] leading-tight text-[var(--ps-fg)] md:text-[30px]">
          Vos documents à signer
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--ps-fg-secondary)]">
          Consultez le document, vérifiez les informations, puis signez en ligne en toute sécurité.
        </p>
      </header>

      {loading && <SignaturesSkeleton />}

      {!loading && error && (
        <StatusPage icon={PenLine} tone="red" title="Chargement impossible" subtitle={error} />
      )}

      {!loading && !error && rows.length === 0 && (
        <EmptyState
          icon={PenLine}
          title="Aucun document à signer"
          body="Vos contrats et devis à signer apparaîtront ici dès que votre équipe Propul'SEO les aura préparés."
        />
      )}

      {!loading && !error && selected && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Liste à gauche/haut quand plusieurs documents */}
          {rows.length > 1 && (
            <section className="ps-surface overflow-hidden lg:col-span-2">
              <SectionHead title={`${rows.length} documents`} />
              <ul className="divide-y divide-[var(--ps-border-soft)]">
                {rows.map(sig => {
                  const active = sig.id === selectedId;
                  return (
                    <li key={sig.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(sig.id)}
                        aria-current={active}
                        className={`flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors ${
                          active
                            ? 'bg-[var(--ps-primary-subtle)]'
                            : 'hover:bg-[var(--ps-bg-subtle)]'
                        }`}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          active ? 'bg-[var(--ps-primary)] text-white' : 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]'
                        }`}>
                          <PenLine className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-[var(--ps-fg)]">{sig.name}</span>
                          <span className="block text-[12px] text-[var(--ps-fg-muted)]">
                            {TYPE_LABELS[sig.signature_type] ?? sig.signature_type}
                            {sig.sent_at && ` · Envoyé le ${formatDate(sig.sent_at)}`}
                          </span>
                        </span>
                        <StatusBadge status={sig.status} />
                        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ps-fg-muted)]" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Viewer du document sélectionné (gauche / au-dessus sur mobile) */}
          <SignatureViewer signature={selected} />

          {/* Rail d'action (droite / en-dessous sur mobile) */}
          <SignatureRail signature={selected} />
        </div>
      )}
    </div>
  );
}

// ── Viewer PDF sombre, fidèle Variante A ───────────────────────────
function SignatureViewer({ signature }: { signature: PortalSignature }) {
  const [preview, setPreview] = useState(false);
  const pdfUrl = signature.docuseal_signed_pdf_url;
  const filename = `${signature.name}.pdf`;

  return (
    <section className="ps-surface overflow-hidden p-0">
      {/* Barre type lecteur */}
      <div className="flex items-center justify-between gap-3 bg-[var(--ps-fg)] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-white/85">
          <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          <span className="ps-num truncate text-[12px] font-semibold">{filename}</span>
        </div>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1 text-[11.5px] font-medium text-white/80 transition-colors hover:bg-white/10"
        >
          <Maximize2 className="h-3 w-3" />
          Agrandir
        </button>
      </div>

      {/* Corps du viewer */}
      <div className="bg-[var(--ps-bg-subtle)] p-5">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title={filename}
            className="h-[520px] w-full rounded-lg border border-[var(--ps-border)] bg-white shadow-sm"
          />
        ) : (
          <div className="flex h-[520px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[var(--ps-border-strong)] bg-[var(--ps-bg-elevated)] px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]">
              <PenLine className="h-7 w-7" strokeWidth={1.6} />
            </span>
            <div>
              <p className="ps-h3 text-[var(--ps-fg)]">Document prêt à signer</p>
              <p className="mx-auto mt-1.5 max-w-[300px] text-[13px] leading-relaxed text-[var(--ps-fg-secondary)]">
                L'aperçu complet s'ouvre dans l'espace de signature sécurisé. Cliquez sur « Signer » dans le panneau de droite.
              </p>
            </div>
          </div>
        )}
      </div>

      {pdfUrl && (
        <FilePreviewDialog
          open={preview}
          onOpenChange={setPreview}
          name={filename}
          mime="application/pdf"
          resolveUrl={async () => pdfUrl}
        />
      )}
    </section>
  );
}

// ── Rail d'action droit ────────────────────────────────────────────
function SignatureRail({ signature }: { signature: PortalSignature }) {
  const { project } = usePortal();
  const signerName = project.client_name ?? 'Vous';
  const typeLabel = TYPE_LABELS[signature.signature_type] ?? signature.signature_type;

  const canSign = signature.status === 'pending' && !!signature.docuseal_signing_url;
  const hasSignedPdf = signature.status === 'signed' && !!signature.docuseal_signed_pdf_url;

  return (
    <aside className="ps-surface flex flex-col overflow-hidden p-0">
      {/* Hero / contexte */}
      <div className="relative overflow-hidden border-b border-[var(--ps-border-soft)] p-6">
        <div
          aria-hidden
          className="ps-hero-glow pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-50 blur-2xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="ps-eyebrow ps-eyebrow-muted">{typeLabel}</p>
            <h2 className="ps-h3 mt-1 text-[16px] leading-snug text-[var(--ps-fg)]">{signature.name}</h2>
          </div>
          <StatusBadge status={signature.status} />
        </div>
      </div>

      {/* Corps */}
      <div className="flex flex-col gap-6 p-6">
        {/* Frise d'avancement */}
        <div>
          <p className="ps-eyebrow ps-eyebrow-muted mb-3">Avancement</p>
          <SignatureStepper signature={signature} />
        </div>

        {/* Signataire */}
        <div>
          <p className="ps-eyebrow ps-eyebrow-muted mb-3">Signataire</p>
          <div className="flex items-center gap-3">
            <span className="ps-num flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] text-[12px] font-bold text-[var(--ps-primary-text)]">
              {initials(signerName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[var(--ps-fg)]">{signerName}</p>
              <p className="truncate text-[11.5px] text-[var(--ps-fg-muted)]">{project.name ?? 'Votre projet'}</p>
            </div>
            <StatusBadge status={signature.status} />
          </div>
        </div>

        {/* Dates */}
        <div>
          <p className="ps-eyebrow ps-eyebrow-muted mb-3">Suivi</p>
          <dl className="space-y-2.5 text-[12.5px]">
            <RailDate label="Envoyé le" value={formatDate(signature.sent_at)} />
            {signature.signed_at && <RailDate label="Signé le" value={formatDate(signature.signed_at)} />}
            {signature.expires_at && signature.status === 'pending' && (
              <RailDate label="À signer avant le" value={formatDate(signature.expires_at)} warn />
            )}
          </dl>
        </div>
      </div>

      {/* Pied : actions */}
      <div className="mt-auto flex flex-col gap-2.5 border-t border-[var(--ps-border-soft)] p-6">
        {canSign && (
          <Button asChild className="w-full bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]">
            <a href={signature.docuseal_signing_url ?? '#'} target="_blank" rel="noopener noreferrer">
              <PenLine className="mr-1.5 h-4 w-4" />
              Signer le document
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        {hasSignedPdf && (
          <Button
            variant="outline"
            asChild
            className="w-full border-[var(--ps-border-strong)] text-[var(--ps-fg)]"
          >
            <a href={signature.docuseal_signed_pdf_url ?? '#'} target="_blank" rel="noopener noreferrer">
              <Download className="mr-1.5 h-4 w-4" />
              Télécharger le document signé
            </a>
          </Button>
        )}
        {!canSign && !hasSignedPdf && (
          <p className="text-center text-[12px] leading-relaxed text-[var(--ps-fg-muted)]">
            {signature.status === 'declined'
              ? 'Cette signature a été refusée. Contactez votre équipe Propul\'SEO.'
              : signature.status === 'expired'
                ? 'Le délai de signature est dépassé. Une nouvelle demande peut être émise par votre équipe.'
                : 'Aucune action requise pour ce document.'}
          </p>
        )}
      </div>
    </aside>
  );
}

function RailDate({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--ps-fg-muted)]">{label}</dt>
      <dd className={`ps-num font-medium ${warn ? 'text-[var(--ps-warning-text)]' : 'text-[var(--ps-fg)]'}`}>{value}</dd>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────
function SignaturesSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Skeleton className="h-[580px] w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
