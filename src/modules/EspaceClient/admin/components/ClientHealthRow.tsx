import { useNavigate } from 'react-router-dom';
import { Badge, type BadgeTone } from '@/modules/EspaceClient/shared/components';
import type { AdminClientHealth } from '../hooks/useAdminClients';

function deriveStatus(c: AdminClientHealth): { label: string; tone: BadgeTone } {
  if (!c.portal_activated_at) return { label: 'Inactif', tone: 'gray' };
  if (c.invoices_overdue > 0) return { label: 'Impayé', tone: 'red' };
  if (c.signatures_pending > 0) return { label: 'Signature en attente', tone: 'amber' };
  if (c.invoices_pending > 0) return { label: 'Paiement en attente', tone: 'blue' };
  return { label: 'Actif', tone: 'green' };
}

export function ClientHealthRow({ client }: { client: AdminClientHealth }) {
  const navigate = useNavigate();
  const status = deriveStatus(client);
  return (
    <button
      onClick={() => navigate(`/admin/propulspace/clients/${client.project_id}`)}
      className="w-full flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:border-violet-300 hover:bg-violet-50/40 transition"
    >
      <div className="min-w-0">
        <div className="font-medium text-gray-900 truncate">{client.project_name}</div>
        <div className="text-sm text-gray-500 truncate">{client.portal_client_email ?? '— pas d\'email portail —'}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {client.invoices_overdue > 0 && <Badge tone="red">{client.invoices_overdue} en retard</Badge>}
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
    </button>
  );
}
