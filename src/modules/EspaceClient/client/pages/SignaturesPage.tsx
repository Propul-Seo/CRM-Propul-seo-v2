import { useState } from 'react';
import { PenLine, Loader2, ExternalLink, Download } from 'lucide-react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Hero, EmptyState, SectionHead, StatusBadge,
} from '@/modules/EspaceClient/shared/components';
import { usePortalSignatures, type PortalSignature } from '../hooks/usePortalData';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_LABELS: Record<string, string> = {
  quote: 'Devis', contract: 'Contrat', addendum: 'Avenant', other: 'Autre',
};

export function SignaturesPage() {
  const { rows, loading, error } = usePortalSignatures();
  const [selected, setSelected] = useState<PortalSignature | null>(null);

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Signatures"
        title="Documents à signer"
        subtitle="Documents en attente de signature électronique."
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
              icon={PenLine}
              title="Aucun document à signer"
              body="Vos contrats et devis à signer apparaîtront ici."
            />
          </div>
        )}
        {!loading && rows.length > 0 && (
          <ul className="divide-y divide-[var(--ps-border-soft)]">
            {rows.map(sig => (
              <li key={sig.id}>
                <button
                  type="button"
                  onClick={() => setSelected(sig)}
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-[var(--ps-bg-subtle)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]">
                    <PenLine className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-[var(--ps-fg)]">{sig.name}</p>
                    <p className="text-[12px] text-[var(--ps-fg-muted)]">
                      {TYPE_LABELS[sig.signature_type] ?? sig.signature_type}
                      {sig.sent_at && ` · Envoyé le ${formatDate(sig.sent_at)}`}
                    </p>
                  </div>
                  <StatusBadge status={sig.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        {selected && (
          <SheetContent side="right" className="propulspace-portal w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>{selected.name}</SheetTitle>
              <SheetDescription>
                {TYPE_LABELS[selected.signature_type] ?? selected.signature_type}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">Statut</p>
                  <StatusBadge status={selected.status} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">Envoyé le</p>
                  <p className="text-[var(--ps-fg)]">{formatDate(selected.sent_at)}</p>
                </div>
                {selected.signed_at && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">Signé le</p>
                    <p className="text-[var(--ps-fg)]">{formatDate(selected.signed_at)}</p>
                  </div>
                )}
                {selected.expires_at && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[var(--ps-fg-muted)]">Expire le</p>
                    <p className="text-[var(--ps-fg)]">{formatDate(selected.expires_at)}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[var(--ps-border-soft)] pt-4">
                {selected.status === 'pending' && selected.docuseal_signing_url && (
                  <Button asChild className="ps-brand-gradient text-white">
                    <a href={selected.docuseal_signing_url} target="_blank" rel="noopener noreferrer">
                      Signer maintenant
                      <ExternalLink className="ml-1.5 h-4 w-4" />
                    </a>
                  </Button>
                )}
                {selected.status === 'signed' && selected.docuseal_signed_pdf_url && (
                  <Button variant="outline" asChild>
                    <a href={selected.docuseal_signed_pdf_url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-1.5 h-4 w-4" />
                      Télécharger le PDF signé
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
