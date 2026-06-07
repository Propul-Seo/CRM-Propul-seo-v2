import { useNavigate } from 'react-router-dom';
import { Badge, type BadgeTone } from '@/modules/EspaceClient/shared/components';
import type { AdminClientHealth } from '../hooks/useAdminClients';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';

function deriveStatus(c: AdminClientHealth): { label: string; tone: BadgeTone } {
  if (!c.portal_activated_at) return { label: 'Pas de portail', tone: 'gray' };
  if (c.invoices_overdue > 0) return { label: 'Impayé', tone: 'red' };
  if (c.signatures_pending > 0) return { label: 'Signature en attente', tone: 'amber' };
  if (c.invoices_pending > 0) return { label: 'Paiement en attente', tone: 'blue' };
  return { label: 'Actif', tone: 'green' };
}

export function ClientHealthRow({ client }: { client: AdminClientHealth }) {
  const navigate = useNavigate();
  const { basePath } = useAdminBasePath();
  const status = deriveStatus(client);
  return (
    <button
      onClick={() => navigate(`${basePath}/clients/${client.project_id}`)}
      className="w-full flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-2 px-4 py-3 text-left hover:border-primary/30 hover:bg-primary/10 transition"
    >
      <div className="min-w-0">
        <div className="font-medium text-foreground truncate">{client.project_name}</div>
        <div className="text-sm text-muted-foreground truncate">{client.client_company ?? client.portal_client_email ?? '—'}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {client.invoices_overdue > 0 && <Badge tone="red">{client.invoices_overdue} en retard</Badge>}
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
    </button>
  );
}
