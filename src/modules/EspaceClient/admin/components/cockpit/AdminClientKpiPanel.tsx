import { FileText, PenLine, Receipt, Clock } from 'lucide-react';
import { Badge } from '@/modules/EspaceClient/shared/components';
import type { AdminClientHealth } from '../../hooks/useAdminClients';
import { deriveClientStatus, formatLastActivity } from './clientStatus';

interface ChipProps {
  icon: typeof FileText;
  label: string;
  value: string;
  alert?: boolean;
}

function KpiChip({ icon: Icon, label, value, alert }: ChipProps) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        alert ? 'border-red-500/25 bg-red-500/10' : 'border-border bg-surface-2'
      }`}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={`text-lg font-bold leading-none ${alert ? 'text-red-300' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}

// Colonne droite du cockpit : panneau KPI du client sélectionné.
// N'affiche QUE des champs réellement fournis par useAdminClients (compteurs,
// pas de montants €) — voir le rapport pour les écarts avec la maquette.
export function AdminClientKpiPanel({ client }: { client: AdminClientHealth | null }) {
  if (!client) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
        Sélectionnez un client pour voir ses indicateurs.
      </div>
    );
  }

  const status = deriveClientStatus(client);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4">
      <div className="mb-3">
        <div className="truncate text-[15px] font-semibold text-foreground">
          {client.client_company ?? client.project_name}
        </div>
        <div className="truncate text-xs text-muted-foreground">{client.project_name}</div>
      </div>

      <div className="mb-4">
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <KpiChip
          icon={Receipt}
          label="Factures en retard"
          value={String(client.invoices_overdue)}
          alert={client.invoices_overdue > 0}
        />
        <KpiChip
          icon={Receipt}
          label="Paiement attendu"
          value={String(client.invoices_pending)}
        />
        <KpiChip
          icon={PenLine}
          label="Signatures dues"
          value={String(client.signatures_pending)}
          alert={client.signatures_pending > 0}
        />
        <KpiChip
          icon={FileText}
          label="Documents"
          value={String(client.documents_count)}
        />
      </div>

      <div className="mt-3 rounded-lg border border-border bg-surface-2 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3 w-3" />
          Dernière connexion client
        </div>
        <div className="text-[13px] font-medium text-foreground">
          {formatLastActivity(client.last_client_login_at)}
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Compteurs de santé portail. Les montants facturés / impayés en euros et le
        prochain jalon ne sont pas exposés par ce flux de données.
      </p>
    </div>
  );
}
