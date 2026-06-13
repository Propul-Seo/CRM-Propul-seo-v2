import { useState } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/modules/EspaceClient/shared/components';
import { AdminFilterPills, AdminEmptyState } from './kit';
import { AUDIT_RESOURCES, AUDIT_FALLBACK, AUDIT_VERB, auditItemName, fmtAuditDateTime, fmtRelative } from './activityShared';
import { useAdminAuditLog } from '../hooks/useAdminAuditLog';
import type { AuditLogRow } from '../lib/adminRpc';

// Filtre piloté serveur (setResourceType refetche) — pas de filtrage client.
const FILTERS: Array<{ label: string; value: string | null }> = [
  { label: 'Tous', value: null },
  { label: 'Documents', value: 'propulspace.documents' },
  { label: 'Factures', value: 'propulspace.invoices' },
  { label: 'Signatures', value: 'propulspace.signatures' },
];

// Article FR devant le type de ressource ("a ajouté le document « X »").
const ARTICLE: Record<string, string> = {
  Document: 'le document',
  Facture: 'la facture',
  Signature: 'la signature',
};

// Libellé de jour pour les en-têtes de groupe.
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Horodatage discret : relatif si récent (helper partagé), sinon heure du jour
// (le groupe porte déjà la date complète).
function relTime(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 24 * 60) return fmtRelative(iso);
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

interface DayGroup {
  key: string;
  label: string;
  items: AuditLogRow[];
}

// Regroupe les lignes (déjà triées par date) par jour calendaire.
function groupByDay(rows: AuditLogRow[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const row of rows) {
    const key = new Date(row.created_at).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(row);
    else groups.push({ key, label: dayLabel(row.created_at), items: [row] });
  }
  return groups;
}

function TimelineItem({ row, isLast }: { row: AuditLogRow; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const meta = AUDIT_RESOURCES[row.resource_type] ?? AUDIT_FALLBACK;
  const Icon = meta.icon;
  const name = auditItemName(row.diff) || 'Sans titre';

  return (
    <li className={`relative flex gap-3.5 ${isLast ? '' : 'pb-5'}`}>
      {/* Trait vertical reliant les bulles du même jour. */}
      {!isLast && <span aria-hidden="true" className="absolute bottom-0 left-[17px] top-10 w-px bg-border" />}
      <span className={'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ' + meta.bubble}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 pt-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 break-words text-sm leading-snug text-foreground/80">
            <span className="font-semibold text-foreground">{row.actor_label}</span>
            {' a '}{AUDIT_VERB[row.action]}{' '}
            {ARTICLE[meta.label] ?? "l'élément"}{' '}
            <span className="font-medium text-foreground">« {name} »</span>
          </p>
          <time
            dateTime={row.created_at}
            title={fmtAuditDateTime(row.created_at)}
            className="shrink-0 text-xs tabular-nums text-muted-foreground"
          >
            {relTime(row.created_at)}
          </time>
        </div>

        {row.diff && (
          <>
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="-ml-2 mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
            >
              <ChevronDown className={'h-3.5 w-3.5 transition-transform ' + (open ? 'rotate-180' : '')} />
              {open ? 'Masquer les détails' : 'Voir les détails'}
            </button>
            {open && (
              <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-border-subtle bg-surface-0 p-3 text-[11.5px] leading-relaxed text-foreground/70">
                {JSON.stringify(row.diff, null, 2)}
              </pre>
            )}
          </>
        )}
      </div>
    </li>
  );
}

export function ActivityTab({ projectId }: { projectId: string }) {
  const { rows, loading, error, hasMore, resourceType, setResourceType, loadMore } = useAdminAuditLog(projectId);
  const groups = groupByDay(rows);

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
        // Squelette : reproduit la forme de la timeline (bulle + ligne de texte).
        <ol className="space-y-5" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <li key={i} className="flex gap-3.5">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2 pt-1.5">
                <Skeleton className="h-4 w-3/5 rounded-md" />
                <Skeleton className="h-3 w-2/5 rounded-md" />
              </div>
            </li>
          ))}
        </ol>
      ) : rows.length === 0 ? (
        <AdminEmptyState
          icon={Activity}
          title="Aucune activité"
          body="Les actions sur les documents, factures et signatures apparaîtront ici."
        />
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <section key={group.key}>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </h3>
              <ol>
                {group.items.map((row, i) => (
                  <TimelineItem key={row.id} row={row} isLast={i === group.items.length - 1} />
                ))}
              </ol>
            </section>
          ))}
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
