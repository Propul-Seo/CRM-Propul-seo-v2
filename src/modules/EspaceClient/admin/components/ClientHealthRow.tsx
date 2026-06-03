import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { AdminClientHealth } from '../hooks/useAdminClients';

function deriveStatus(c: AdminClientHealth): { label: string; tone: string } {
  if (!c.portal_activated_at) return { label: 'Inactif', tone: 'bg-gray-100 text-gray-700' };
  if (c.signatures_pending > 0) return { label: 'Signature en attente', tone: 'bg-amber-100 text-amber-800' };
  if (c.invoices_pending > 0) return { label: 'Paiement en attente', tone: 'bg-blue-100 text-blue-800' };
  return { label: 'Actif', tone: 'bg-emerald-100 text-emerald-800' };
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
        {client.invoices_overdue > 0 && <Badge className="bg-red-100 text-red-700">{client.invoices_overdue} en retard</Badge>}
        <Badge className={status.tone}>{status.label}</Badge>
      </div>
    </button>
  );
}
