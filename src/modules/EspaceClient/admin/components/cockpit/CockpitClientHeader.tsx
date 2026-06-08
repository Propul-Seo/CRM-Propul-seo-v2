import { Receipt, PenLine, FileText, Clock } from 'lucide-react';
import { Badge } from '@/modules/EspaceClient/shared/components';
import type { AdminClientHealth } from '../../hooks/useAdminClients';
import { deriveClientStatus, clientInitials, clientAvatarTone, formatLastActivity } from './clientStatus';

// En-tête du client sélectionné, posé au-dessus du panneau à onglets.
// Porte les KPI « en chips » (layout Variante 3 retenu).
export function CockpitClientHeader({ client }: { client: AdminClientHealth | null }) {
  if (!client) return null;
  const status = deriveClientStatus(client);
  return (
    <header className="border-b border-border px-6 py-5">
      <div className="flex items-start gap-3.5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${clientAvatarTone(client.project_id)}`}>
          {clientInitials(client)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {client.client_company ?? client.project_name}
          </h1>
          <p className="truncate text-[13px] text-muted-foreground">
            {client.project_name} · {client.portal_client_email ?? 'Pas d’accès portail'}
          </p>
        </div>
        <div className="ml-auto shrink-0"><Badge tone={status.tone}>{status.label}</Badge></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip icon={Receipt} label="Impayés" value={client.invoices_overdue} alert={client.invoices_overdue > 0} />
        <Chip icon={PenLine} label="Signatures dues" value={client.signatures_pending} alert={client.signatures_pending > 0} />
        <Chip icon={FileText} label="Documents" value={client.documents_count} />
        <Chip icon={Clock} label="Dernière connexion" value={formatLastActivity(client.last_client_login_at)} />
      </div>
    </header>
  );
}

function Chip({ icon: Icon, label, value, alert }: { icon: typeof Receipt; label: string; value: string | number; alert?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${
      alert ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-border bg-surface-2 text-muted-foreground'
    }`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-foreground/80">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}
