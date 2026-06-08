import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import { AdminTopNav } from '../components/AdminTopNav';
import { AdminClientsTable } from '../components/cockpit/AdminClientsTable';
import { AdminClientKpiPanel } from '../components/cockpit/AdminClientKpiPanel';
import { useAdminClients } from '../hooks/useAdminClients';
import { AdminClientPanel } from './AdminClientPanel';

// Cockpit 3 colonnes (maquette Variante A, thème CRM sombre conservé) :
//   gauche  = table dense des clients
//   centre  = panneau client à onglets (AdminClientPanel)
//   droite  = chips KPI du client sélectionné
// La sélection reste pilotée par l'URL (/clients/:projectId/*) ; aucune route cassée.
export function AdminCockpitPage() {
  const { basePath } = useAdminBasePath();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { clients, loading, error } = useAdminClients();

  // Auto-sélection du 1er client à l'arrivée (URL /clients sans projet).
  useEffect(() => {
    if (projectId || loading || error || clients.length === 0) return;
    navigate(`${basePath}/clients/${clients[0].project_id}`, { replace: true });
  }, [projectId, loading, error, clients, basePath, navigate]);

  const selected = useMemo(
    () => clients.find(c => c.project_id === projectId) ?? null,
    [clients, projectId],
  );

  function handleSelect(id: string) {
    navigate(`${basePath}/clients/${id}`);
  }

  // Si un projectId d'URL ne correspond à aucun client chargé, on retombe sur la liste.
  if (projectId && !loading && !error && clients.length > 0 && !selected) {
    return <Navigate to={`${basePath}/clients`} replace />;
  }

  const table = (
    <AdminClientsTable
      clients={clients}
      loading={loading}
      error={error}
      selectedId={projectId ?? null}
      onSelect={handleSelect}
    />
  );

  return (
    <>
      <AdminTopNav />

      {/* ≥ lg : cockpit 3 colonnes persistant */}
      <div className="hidden h-[calc(100vh-3.5rem)] min-h-0 lg:flex">
        <aside className="w-[380px] shrink-0 border-r border-border xl:w-[460px]">
          {table}
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto border-r border-border">
          {projectId ? (
            <AdminClientPanel embedded />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {loading ? 'Chargement…' : 'Sélectionnez un client dans la liste.'}
            </div>
          )}
        </main>
        <aside className="w-[280px] shrink-0 xl:w-[320px]">
          <AdminClientKpiPanel client={selected} />
        </aside>
      </div>

      {/* < lg : navigation liste → détail (pas de 3 colonnes écrasées) */}
      <div className="lg:hidden">
        {projectId ? (
          <div className="px-4 py-4">
            <Link
              to={`${basePath}/clients`}
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Tous les clients
            </Link>
            <AdminClientPanel embedded />
          </div>
        ) : (
          <div className="h-[calc(100vh-3.5rem)] min-h-0">{table}</div>
        )}
      </div>
    </>
  );
}
