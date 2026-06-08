import { useState } from 'react';
import { Activity, FileText, Receipt, PenLine, ChevronDown, Loader2, type LucideIcon } from 'lucide-react';
import { AdminSectionHeader, AdminCard, AdminEmptyState, AdminFilterPills } from './kit';
import { useAdminAuditLog } from '../hooks/useAdminAuditLog';
import type { AuditLogRow } from '../lib/adminRpc';

const FILTERS: Array<{ label: string; value: string | null }> = [
  { label: 'Tous', value: null },
  { label: 'Documents', value: 'propulspace.documents' },
  { label: 'Factures', value: 'propulspace.invoices' },
  { label: 'Signatures', value: 'propulspace.signatures' },
];

// Icône + couleur sémantique par type de ressource (tokens CRM uniquement).
const RESOURCE_META: Record<string, { icon: LucideIcon; bubble: string; noun: string }> = {
  'propulspace.documents':  { icon: FileText, bubble: 'bg-primary/10 text-primary',           noun: 'Document' },
  'propulspace.invoices':   { icon: Receipt,  bubble: 'bg-blue-500/10 text-blue-300',         noun: 'Facture' },
  'propulspace.signatures': { icon: PenLine,  bubble: 'bg-amber-500/10 text-amber-300',       noun: 'Signature' },
};
const FALLBACK_META = { icon: Activity, bubble: 'bg-surface-3 text-muted-foreground', noun: '' };

const ACTION_VERB: Record<string, string> = { insert: 'ajouté', update: 'modifié', delete: 'supprimé' };

function rowName(r: AuditLogRow): string {
  const after = r.diff?.after;
  const before = r.diff?.before;
  // Un update qui ne touche pas le nom peut avoir after.name absent → retomber sur before.
  const value = after?.['name'] ?? before?.['name'] ?? after?.['invoice_number'] ?? before?.['invoice_number'];
  return typeof value === 'string' ? value : '';
}
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function ActivityTab({ projectId }: { projectId: string }) {
  const { rows, loading, error, hasMore, resourceType, setResourceType, loadMore } = useAdminAuditLog(projectId);
  const [expanded, setExpanded] = useState<string | null>(null);

  const subtitle =
    rows.length === 0 ? 'Journal d’audit' : `${rows.length} événement${rows.length > 1 ? 's' : ''}`;

  return (
    <div className="space-y-4 py-2">
      <AdminSectionHeader title="Activité" subtitle={subtitle} />

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <AdminFilterPills filters={FILTERS} current={resourceType} onChange={setResourceType} />

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
        <ul className="space-y-1.5">
          {rows.map(r => {
            const meta = RESOURCE_META[r.resource_type] ?? { ...FALLBACK_META, noun: r.resource_type };
            const name = rowName(r);
            const title = `${meta.noun} ${ACTION_VERB[r.action] ?? r.action}${name ? ` : ${name}` : ''}`;
            const isOpen = expanded === r.id;
            return (
              <li key={r.id}>
                <AdminCard
                  interactive
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="!px-3 !py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bubble}`}>
                      <meta.icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium tracking-tight text-foreground">{title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.actor_label} · {formatDateTime(r.created_at)}
                      </p>
                    </div>
                    {r.diff && (
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </div>
                </AdminCard>
                {isOpen && r.diff && (
                  <pre className="mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-surface-1 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
                    {JSON.stringify(r.diff, null, 2)}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && !loading && (
        <button
          type="button"
          onClick={() => void loadMore()}
          className="mx-auto flex items-center gap-1 text-sm text-primary transition hover:underline"
        >
          <ChevronDown className="h-4 w-4" /> Charger plus
        </button>
      )}
    </div>
  );
}
