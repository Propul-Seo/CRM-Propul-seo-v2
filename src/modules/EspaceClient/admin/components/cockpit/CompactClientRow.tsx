import type { BadgeTone } from '@/modules/EspaceClient/shared/components';
import type { AdminClientHealth } from '../../hooks/useAdminClients';
import { deriveClientStatus, clientInitials, clientAvatarTone } from './clientStatus';

// Statut « dot + label » (DA admin) — couleurs de dot alignées sur Badge.
const STATUS_DOTS: Record<BadgeTone, string> = {
  violet: 'bg-[var(--ps-primary)]',
  green:  'bg-[var(--ps-success)]',
  amber:  'bg-[var(--ps-warning)]',
  red:    'bg-[var(--ps-danger)]',
  blue:   'bg-[var(--ps-info)]',
  gray:   'bg-[var(--ps-fg-muted)]',
};

interface Props {
  client: AdminClientHealth;
  selected: boolean;
  onSelect: (projectId: string) => void;
}

// Ligne compacte (1 ligne) : avatar + société + email + dot de statut.
// Conçue pour un rail élargi — pas de tableau multi-colonnes qui déborde.
// Sélection : liseré violet à gauche + fond primary/10 (pas de layout shift,
// le liseré transparent est toujours présent).
export function CompactClientRow({ client, selected, onSelect }: Props) {
  const status = deriveClientStatus(client);
  return (
    <button
      type="button"
      onClick={() => onSelect(client.project_id)}
      aria-current={selected ? 'true' : undefined}
      className={`flex w-full items-center gap-3 border-b border-l-2 border-b-border px-3.5 py-2.5 text-left transition ${
        selected ? 'border-l-primary bg-primary/10' : 'border-l-transparent hover:bg-surface-2'
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
      <span className="flex shrink-0 items-center gap-1.5" title={status.label}>
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status.tone]}`} aria-hidden="true" />
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">{status.label}</span>
      </span>
    </button>
  );
}
