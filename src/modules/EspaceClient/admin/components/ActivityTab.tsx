import { useState } from 'react';
import { Activity, FileText, Receipt, PenLine, ChevronDown, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/modules/EspaceClient/shared/components';
import { AdminFilterPills, AdminEmptyState } from './kit';
import { useAdminAuditLog } from '../hooks/useAdminAuditLog';
import type { AuditLogRow } from '../lib/adminRpc';

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

type Tone = 'primary' | 'blue' | 'amber';
interface ResourceMeta { icon: typeof FileText; tone: Tone; label: string }

const RESOURCES: Record<string, ResourceMeta> = {
  'propulspace.documents': { icon: FileText, tone: 'primary', label: 'Document' },
  'propulspace.invoices': { icon: Receipt, tone: 'blue', label: 'Facture' },
  'propulspace.signatures': { icon: PenLine, tone: 'amber', label: 'Signature' },
};
const VERBS: Record<AuditLogRow['action'], string> = { insert: 'ajouté', update: 'modifié', delete: 'supprimé' };
const BUBBLE: Record<Tone, string> = {
  primary: 'bg-primary/15 text-primary ring-1 ring-primary/30',
  blue: 'bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20',
};
const BADGE_TONE: Record<AuditLogRow['action'], 'green' | 'blue' | 'red'> = { insert: 'green', update: 'blue', delete: 'red' };

// Filtre piloté serveur (setResourceType refetche) — pas de filtrage client.
const FILTERS: Array<{ label: string; value: string | null }> = [
  { label: 'Tous', value: null },
  { label: 'Documents', value: 'propulspace.documents' },
  { label: 'Factures', value: 'propulspace.invoices' },
  { label: 'Signatures', value: 'propulspace.signatures' },
];

function itemName(diff: AuditLogRow['diff']): string {
  const pick = (src: Record<string, unknown> | undefined, key: string): string | null => {
    const v = src?.[key];
    return typeof v === 'string' && v.length > 0 ? v : null;
  };
  return pick(diff?.after, 'name') ?? pick(diff?.before, 'name')
    ?? pick(diff?.after, 'invoice_number') ?? pick(diff?.before, 'invoice_number') ?? 'Sans titre';
}

function EventCard({ row }: { row: AuditLogRow }) {
  const [open, setOpen] = useState(false);
  const meta = RESOURCES[row.resource_type] ?? { icon: FileText, tone: 'primary' as Tone, label: 'Élément' };
  const Icon = meta.icon;
  const name = itemName(row.diff);

  return (
    <article className="rounded-xl border border-border bg-surface-2 p-4 shadow-glow-sm sm:p-5">
      <div className="flex items-start gap-4">
        <span className={'grid h-11 w-11 shrink-0 place-items-center rounded-xl ' + BUBBLE[meta.tone]}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{meta.label}</p>
              <h3 className="mt-0.5 flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground">
                <span>{VERBS[row.action]}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-foreground/90">{name}</span>
              </h3>
            </div>
            <Badge tone={BADGE_TONE[row.action]}>{VERBS[row.action]}</Badge>
          </div>

          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">{row.actor_label}</span>
            <span className="text-foreground/30">•</span>
            <span className="tabular-nums">{fmtDateTime(row.created_at)}</span>
          </p>

          {row.diff && (
            <>
              <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="mt-3 -ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
              >
                <ChevronDown className={'h-3.5 w-3.5 transition-transform ' + (open ? 'rotate-180' : '')} />
                {open ? 'Masquer les détails' : 'Voir les détails'}
              </button>
              {open && (
                <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-surface-0 p-3.5 text-[11.5px] leading-relaxed text-foreground/70">
                  {JSON.stringify(row.diff, null, 2)}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function ActivityTab({ projectId }: { projectId: string }) {
  const { rows, loading, error, hasMore, resourceType, setResourceType, loadMore } = useAdminAuditLog(projectId);

  return (
    <div className="space-y-5 py-2">
      <header className="space-y-3.5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Journal d'activité</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {rows.length === 0
              ? 'Journal d’audit du dossier'
              : `${rows.length} événement${rows.length > 1 ? 's' : ''} tracé${rows.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <AdminFilterPills filters={FILTERS} current={resourceType} onChange={setResourceType} />
      </header>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : rows.length === 0 ? (
        <AdminEmptyState
          icon={Activity}
          title="Aucune activité"
          body="Les actions sur les documents, factures et signatures apparaîtront ici."
        />
      ) : (
        <div className="space-y-4">
          {rows.map(row => <EventCard key={row.id} row={row} />)}
        </div>
      )}

      {hasMore && !loading && (
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-surface-3 hover:text-foreground"
          >
            <ChevronDown className="h-4 w-4" /> Charger plus
          </button>
        </div>
      )}
    </div>
  );
}
