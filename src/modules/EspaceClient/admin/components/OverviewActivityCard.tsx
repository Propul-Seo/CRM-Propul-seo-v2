import { Link } from 'react-router-dom';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import { AUDIT_RESOURCES, AUDIT_FALLBACK, AUDIT_VERB, auditItemName, fmtAuditDateTime } from './activityShared';
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
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      ) : recent.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucune activité pour le moment.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {recent.map(r => {
            const meta = AUDIT_RESOURCES[r.resource_type] ?? AUDIT_FALLBACK;
            const Icon = meta.icon;
            const name = auditItemName(r.diff);
            return (
              <li key={r.id} className="flex items-start gap-3">
                <span className={'grid h-8 w-8 shrink-0 place-items-center rounded-lg ' + meta.bubble}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    <span className="font-medium">{meta.label} {AUDIT_VERB[r.action]}</span>
                    {name && <span className="text-muted-foreground"> : {name}</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{r.actor_label} · {fmtAuditDateTime(r.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
