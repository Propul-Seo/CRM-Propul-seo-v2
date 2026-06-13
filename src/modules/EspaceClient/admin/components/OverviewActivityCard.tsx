import { Link } from 'react-router-dom';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import { Skeleton } from '@/modules/EspaceClient/shared/components';
import { AUDIT_RESOURCES, AUDIT_FALLBACK, AUDIT_VERB, auditItemName, fmtAuditDateTime, fmtRelative } from './activityShared';
import { useAdminAuditLog } from '../hooks/useAdminAuditLog';

// Fil d'activité condensé pour l'Aperçu (6 événements récents + lien vers l'onglet).
export function OverviewActivityCard({ projectId }: { projectId: string }) {
  const { rows, loading } = useAdminAuditLog(projectId);
  const { basePath } = useAdminBasePath();
  const recent = rows.slice(0, 6);

  return (
    <section className="rounded-xl border border-border bg-surface-2 p-5 shadow-glow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Activité récente</p>
        <Link to={`${basePath}/clients/${projectId}/activite`} className="text-xs font-medium text-primary hover:underline">
          Voir tout
        </Link>
      </div>

      {loading && rows.length === 0 ? (
        <ul className="mt-3 space-y-2" aria-busy="true">
          {[0, 1, 2].map(i => (
            <li key={i} className="flex items-center gap-2.5">
              <Skeleton className="h-7 w-7 shrink-0" />
              <span className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </span>
            </li>
          ))}
        </ul>
      ) : recent.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucune activité pour le moment.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {recent.map(r => {
            const meta = AUDIT_RESOURCES[r.resource_type] ?? AUDIT_FALLBACK;
            const Icon = meta.icon;
            const name = auditItemName(r.diff);
            return (
              <li key={r.id} className="flex items-center gap-2.5">
                <span className={'grid h-7 w-7 shrink-0 place-items-center rounded-lg ' + meta.bubble}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] leading-5 text-foreground">
                    <span className="font-medium">{meta.label} {AUDIT_VERB[r.action]}</span>
                    {name && <span className="text-muted-foreground"> : {name}</span>}
                  </p>
                  <p className="truncate text-[11px] leading-4 text-muted-foreground" title={fmtAuditDateTime(r.created_at)}>
                    {r.actor_label} · {fmtRelative(r.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
