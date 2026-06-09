import { Mail } from 'lucide-react';
import { Badge } from '@/modules/EspaceClient/shared/components';
import type { AdminClientHealth } from '../../hooks/useAdminClients';
import { deriveClientStatus, clientInitials, clientAvatarTone, formatLastActivity } from './clientStatus';

interface KpiTileProps {
  label: string;
  value: string;
  hint: string;
  accent?: string;
}

function KpiTile({ label, value, hint, accent = 'text-foreground' }: KpiTileProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4 shadow-glow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums leading-none ${accent}`}>{value}</p>
      <p className="mt-2 text-xs text-foreground/70">{hint}</p>
    </div>
  );
}

// En-tête du client sélectionné, posé au-dessus du panneau à onglets (DA Atelier) :
// carte d'identité + KPI en tuiles espacées.
export function CockpitClientHeader({ client }: { client: AdminClientHealth | null }) {
  if (!client) return null;
  const s = deriveClientStatus(client);
  const title = client.client_company ?? client.project_name;
  const overdue = client.invoices_overdue;
  const signatures = client.signatures_pending;

  return (
    <div className="space-y-4 px-4 py-5">
      {/* Carte d'identité */}
      <section className="rounded-xl border border-border bg-surface-2 p-5 shadow-glow-sm">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-xl font-semibold ${clientAvatarTone(client.project_id)}`}
          >
            {clientInitials(client)}
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-xl font-semibold leading-tight text-foreground md:text-2xl">{title}</h1>
              <Badge tone={s.tone}>{s.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{client.project_name}</p>
            {client.portal_client_email && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2.5 py-1 text-xs text-foreground/70">
                <Mail className="h-3.5 w-3.5" />
                {client.portal_client_email}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* KPI en tuiles */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Impayés"
          value={String(overdue)}
          hint={overdue > 0 ? 'facture en retard' : 'à jour'}
          accent={overdue > 0 ? 'text-rose-300' : 'text-foreground'}
        />
        <KpiTile
          label="Signatures dues"
          value={String(signatures)}
          hint={signatures > 0 ? 'en attente de signature' : 'rien en attente'}
          accent={signatures > 0 ? 'text-amber-300' : 'text-foreground'}
        />
        <KpiTile label="Documents" value={String(client.documents_count)} hint="pièces partagées" />
        <KpiTile
          label="Dernière connexion"
          value={formatLastActivity(client.last_client_login_at)}
          hint="accès client au portail"
        />
      </section>
    </div>
  );
}
