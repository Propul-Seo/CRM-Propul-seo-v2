import { Badge } from '@/modules/EspaceClient/shared/components';
import type { AdminClientHealth } from '../../hooks/useAdminClients';
import { deriveClientStatus, clientInitials, clientAvatarTone } from './clientStatus';

interface Props {
  client: AdminClientHealth;
  selected: boolean;
  onSelect: (projectId: string) => void;
}

// Ligne compacte (1 ligne) : avatar + société + email + pastille de statut.
// Conçue pour un rail élargi — pas de tableau multi-colonnes qui déborde.
export function CompactClientRow({ client, selected, onSelect }: Props) {
  const status = deriveClientStatus(client);
  return (
    <button
      type="button"
      onClick={() => onSelect(client.project_id)}
      aria-current={selected ? 'true' : undefined}
      className={`flex w-full items-center gap-3 border-b border-border px-3.5 py-2.5 text-left transition ${
        selected ? 'bg-primary/10' : 'hover:bg-surface-2'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${clientAvatarTone(client.project_id)}`}
      >
        {clientInitials(client)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">
          {client.client_company ?? client.project_name}
        </div>
        <div className="truncate text-[11.5px] text-muted-foreground">
          {client.portal_client_email ?? 'Pas d’accès portail'}
        </div>
      </div>
      <Badge tone={status.tone}>{status.label}</Badge>
    </button>
  );
}
