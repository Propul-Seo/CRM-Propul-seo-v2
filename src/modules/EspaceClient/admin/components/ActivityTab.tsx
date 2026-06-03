import { useState } from 'react';
import { Activity, FileText, Receipt, PenLine, ChevronDown, type LucideIcon } from 'lucide-react';
import { ActivityRow, type BadgeTone } from '@/modules/EspaceClient/shared/components';
import { AdminTabScaffold } from './AdminTabScaffold';
import { useAdminAuditLog } from '../hooks/useAdminAuditLog';
import type { AuditLogRow } from '../lib/adminRpc';

const FILTERS: Array<{ label: string; value: string | null }> = [
  { label: 'Tous', value: null },
  { label: 'Documents', value: 'propulspace.documents' },
  { label: 'Factures', value: 'propulspace.invoices' },
  { label: 'Signatures', value: 'propulspace.signatures' },
];

const RESOURCE_META: Record<string, { icon: LucideIcon; tint: BadgeTone; noun: string }> = {
  'propulspace.documents':  { icon: FileText, tint: 'violet', noun: 'Document' },
  'propulspace.invoices':   { icon: Receipt,  tint: 'blue',   noun: 'Facture' },
  'propulspace.signatures': { icon: PenLine,  tint: 'amber',  noun: 'Signature' },
};
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

  return (
    <AdminTabScaffold
      title="Activité"
      loading={loading && rows.length === 0}
      error={error}
      isEmpty={false}
      emptyIcon={Activity}
      emptyTitle="Aucune activité"
    >
      <div className="space-y-3">
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button key={f.label} type="button" onClick={() => setResourceType(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${resourceType === f.value ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {f.label}
            </button>
          ))}
        </div>
        {!loading && rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Aucune activité pour ce filtre.</p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {rows.map(r => {
              const meta = RESOURCE_META[r.resource_type] ?? { icon: Activity, tint: 'gray' as BadgeTone, noun: r.resource_type };
              const name = rowName(r);
              const title = `${meta.noun} ${ACTION_VERB[r.action] ?? r.action}${name ? ` : ${name}` : ''}`;
              return (
                <li key={r.id}>
                  <ActivityRow
                    icon={meta.icon}
                    tint={meta.tint}
                    title={title}
                    meta={`${r.actor_label} · ${formatDateTime(r.created_at)}`}
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  />
                  {expanded === r.id && r.diff && (
                    <pre className="overflow-x-auto bg-gray-50 px-6 py-3 text-[11px] leading-relaxed text-gray-600">
                      {JSON.stringify(r.diff, null, 2)}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {hasMore && !loading && (
          <button type="button" onClick={() => void loadMore()} className="mx-auto flex items-center gap-1 text-sm text-violet-700 hover:underline">
            <ChevronDown className="h-4 w-4" /> Charger plus
          </button>
        )}
      </div>
    </AdminTabScaffold>
  );
}
