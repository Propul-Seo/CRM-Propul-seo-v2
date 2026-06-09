import { Mail } from 'lucide-react';
import { Badge } from '@/modules/EspaceClient/shared/components';
import type { AdminClientHealth } from '../../hooks/useAdminClients';
import { deriveClientStatus, clientInitials, clientAvatarTone, formatLastActivity } from './clientStatus';

function Stat({ label, value, accent = 'text-foreground' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-lg bg-surface-1 px-2.5 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${accent}`}>{value}</span>
    </div>
  );
}

// En-tête compact du client sélectionné (DA Atelier) : carte d'identité + KPI en pastilles.
export function CockpitClientHeader({ client }: { client: AdminClientHealth | null }) {
  if (!client) return null;
  const s = deriveClientStatus(client);
  const title = client.client_company ?? client.project_name;
  const overdue = client.invoices_overdue;
  const signatures = client.signatures_pending;

  return (
    <div className="px-4 py-4">
      <section className="rounded-xl border border-border bg-surface-2 p-4 shadow-glow-sm">
        {/* Identité */}
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${clientAvatarTone(client.project_id)}`}>
            {clientInitials(client)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold leading-tight text-foreground">{title}</h1>
              <Badge tone={s.tone}>{s.label}</Badge>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <span className="truncate">{client.project_name}</span>
              {client.portal_client_email && (
                <>
                  <span className="text-border">·</span>
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{client.portal_client_email}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* KPI en pastilles compactes */}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border-subtle pt-3">
          <Stat label="Impayés" value={String(overdue)} accent={overdue > 0 ? 'text-rose-300' : 'text-foreground'} />
          <Stat label="Signatures dues" value={String(signatures)} accent={signatures > 0 ? 'text-amber-300' : 'text-foreground'} />
          <Stat label="Documents" value={String(client.documents_count)} />
          <Stat label="Dernière connexion" value={formatLastActivity(client.last_client_login_at)} />
        </div>
      </section>
    </div>
  );
}
