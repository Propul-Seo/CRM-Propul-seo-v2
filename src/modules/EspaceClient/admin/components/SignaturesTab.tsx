import { useState, type CSSProperties } from 'react';
import { FileSignature, FileDown, Bell, X, Plus, CalendarClock, Loader2 } from 'lucide-react';
import { StatusBadge, FilePreviewDialog, Skeleton } from '@/modules/EspaceClient/shared/components';
import { AdminFilterPills, AdminEmptyState } from '@/modules/EspaceClient/admin/components/kit';
import { AdminSignatureForm } from './AdminSignatureForm';
import { useAdminSignatures } from '../hooks/useAdminSignatures';
import { useAdminDocuments } from '../hooks/useAdminDocuments';
import { signedPdfPath } from '@/modules/EspaceClient/admin/lib/signaturePreview';
import { getAdminSignedUrl } from '@/modules/EspaceClient/admin/lib/adminStorage';
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

const BUCKET = 'propulspace-documents';

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '');
const TYPE_LABEL: Record<string, string> = { quote: 'Devis', contract: 'Contrat', addendum: 'Avenant', other: 'Autre' };
const TYPE_CHIP: Record<string, string> = {
  quote: 'bg-primary/10 text-primary',
  contract: 'bg-blue-500/10 text-blue-300',
  addendum: 'bg-amber-500/10 text-amber-300',
  other: 'bg-surface-3 text-muted-foreground',
};

type FilterKey = 'all' | 'pending' | 'signed' | 'expired';

// Date principale selon le statut + « Envoyé le » en secondaire dès que sent_at existe.
function dateLabels(s: PortalSignature): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  if (s.status === 'signed' && s.signed_at) out.push({ label: 'Signé le', value: fmtDate(s.signed_at) });
  else if (s.status === 'pending' && s.expires_at) out.push({ label: 'Expire le', value: fmtDate(s.expires_at) });
  else if (s.status === 'expired' && s.expires_at) out.push({ label: 'Expiré le', value: fmtDate(s.expires_at) });
  if (s.sent_at) out.push({ label: 'Envoyé le', value: fmtDate(s.sent_at) });
  return out;
}

function Tile({ value, label, tint }: { value: number; label: string; tint?: string }) {
  return (
    <div className="rounded-lg bg-surface-1 p-3">
      <p className={'text-2xl font-semibold tabular-nums ' + (tint ?? 'text-foreground')}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function SignaturesTab({ projectId, clientEmail }: { projectId: string; clientEmail: string | null }) {
  const { signatures, loading, error, createSignature, remindSignature, cancelSignature } = useAdminSignatures(projectId);
  const { documents } = useAdminDocuments(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [pdfPreview, setPdfPreview] = useState<{ name: string; url: string } | null>(null);

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

  async function openPreview(s: PortalSignature) {
    const path = signedPdfPath(s);
    if (!path) return;
    const url = await getAdminSignedUrl(BUCKET, path);
    if (url) setPdfPreview({ name: s.name, url });
  }

  const total = signatures.length;
  const signed = signatures.filter(s => s.status === 'signed').length;
  const pending = signatures.filter(s => s.status === 'pending').length;
  const closed = signatures.filter(s => s.status === 'expired' || s.status === 'declined').length;
  const pct = total > 0 ? Math.round((signed / total) * 100) : 0;
  const rows = filter === 'all'
    ? signatures
    : filter === 'expired'
      ? signatures.filter(s => s.status === 'expired' || s.status === 'declined')
      : signatures.filter(s => s.status === filter);

  return (
    <div className="space-y-5 py-2 text-foreground">
      {/* Vitrine : avancement global + CTA */}
      <section className="rounded-xl border border-border bg-surface-2 p-5 shadow-glow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Signatures électroniques</p>
            <p className="mt-1.5 text-lg font-semibold tracking-tight">Suivi des documents</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="tabular-nums text-foreground">{signed}</span> sur <span className="tabular-nums text-foreground">{total}</span> documents signés
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white shadow-glow-sm transition-colors hover:bg-primary/85"
          >
            <Plus className="h-4 w-4" /> Nouvelle signature
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile value={total} label="Documents" />
          <Tile value={signed} label="Signés" tint="text-emerald-300" />
          <Tile value={pending} label="En attente" tint="text-amber-300" />
          <Tile value={closed} label="Clos" />
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Taux de signature</span>
            <span className="font-semibold tabular-nums text-foreground">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            {/* Largeur dynamique via la custom property --ps-bar-w (cf. .ps-progress-fill). */}
            <div
              className="ps-progress-fill h-full rounded-full bg-primary transition-all"
              style={{ '--ps-bar-w': `${pct}%` } as CSSProperties}
            />
          </div>
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {actionError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p>}

      {loading ? (
        // Squelette : reproduit la forme des cartes signature (icône + titre + dates + badge).
        <div className="space-y-3" aria-hidden="true">
          {[0, 1].map(i => (
            <div key={i} className="rounded-xl border border-border bg-surface-2 p-4">
              <div className="flex items-start gap-3.5">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2.5 pt-0.5">
                  <Skeleton className="h-4 w-2/5 rounded-md" />
                  <Skeleton className="h-3 w-3/5 rounded-md" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : total === 0 ? (
        <AdminEmptyState icon={FileSignature} title="Aucune signature" body="Envoyez un document à signer au client." />
      ) : (
        <>
          <AdminFilterPills<FilterKey>
            current={filter}
            onChange={setFilter}
            filters={[
              { label: 'Tous', value: 'all', count: total },
              { label: 'En attente', value: 'pending', count: pending },
              { label: 'Signés', value: 'signed', count: signed },
              { label: 'Clos', value: 'expired', count: closed },
            ]}
          />
          <div className="space-y-3">
            {rows.map(s => {
              const dates = dateLabels(s);
              const busy = busyId === s.id;
              return (
                <article
                  key={s.id}
                  onClick={() => openPreview(s)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPreview(s); } }}
                  className="cursor-pointer rounded-xl border border-border bg-surface-2 p-4 shadow-glow-sm transition-colors hover:bg-surface-3/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-muted-foreground">
                        <FileSignature className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold leading-tight">{s.name}</h3>
                          <span className={'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ' + (TYPE_CHIP[s.signature_type] ?? TYPE_CHIP.other)}>
                            {TYPE_LABEL[s.signature_type] ?? s.signature_type}
                          </span>
                        </div>
                        {dates.length > 0 && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {dates.map((d, i) => (
                                <span key={d.label}>
                                  {i > 0 && <span className="mx-1.5 text-muted-foreground/40">·</span>}
                                  {d.label} <span className="tabular-nums text-foreground/70">{d.value}</span>
                                </span>
                              ))}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  {(s.status === 'signed' || s.status === 'pending') && (
                    <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-border-subtle pt-3">
                      {s.status === 'signed' && s.signed_pdf_url && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const url = await getAdminSignedUrl(BUCKET, s.signed_pdf_url!);
                            if (url) window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-surface-3 hover:text-foreground"
                        >
                          <FileDown className="h-4 w-4" /> PDF signé
                        </button>
                      )}
                      {s.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onCancel(s); }}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                          >
                            <X className="h-4 w-4" /> Annuler
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRemind(s); }}
                            disabled={busy || !clientEmail}
                            title={!clientEmail ? 'Aucun email client associé' : undefined}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} Relancer
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      <FilePreviewDialog
        open={pdfPreview !== null}
        onOpenChange={(o) => { if (!o) setPdfPreview(null); }}
        name={pdfPreview?.name ?? ''}
        mime="application/pdf"
        resolveUrl={() => Promise.resolve(pdfPreview?.url ?? null)}
      />
      <AdminSignatureForm open={formOpen} onOpenChange={setFormOpen} defaultEmail={clientEmail} documents={documents} onSubmit={createSignature} />
    </div>
  );
}
