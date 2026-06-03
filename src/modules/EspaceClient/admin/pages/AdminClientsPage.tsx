import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { Hero, EmptyState } from '@/modules/EspaceClient/shared/components';
import { useAdminClients } from '../hooks/useAdminClients';
import { ClientHealthRow } from '../components/ClientHealthRow';
import { AdminTopNav } from '../components/AdminTopNav';

export function AdminClientsPage() {
  const { clients, loading, error } = useAdminClients();
  const [q, setQ] = useState('');
  const filtered = useMemo(
    () => clients.filter(c =>
      c.project_name.toLowerCase().includes(q.toLowerCase()) ||
      (c.portal_client_email ?? '').toLowerCase().includes(q.toLowerCase())),
    [clients, q],
  );

  return (
    <>
      <AdminTopNav />
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Hero eyebrow="Propul'Space" title="Clients & portails" subtitle="Pilotez chaque client de bout en bout." />
      <input
        value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un client…"
        aria-label="Rechercher un client"
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-violet-400 focus:outline-none"
      />
      {loading && <div className="text-sm text-gray-500">Chargement…</div>}
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon={Users} title="Aucun client" body="Les portails activés apparaîtront ici." />
      )}
        <div className="space-y-2">
          {filtered.map(c => <ClientHealthRow key={c.project_id} client={c} />)}
        </div>
      </div>
    </>
  );
}
