import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import { AdminTopNav } from '../components/AdminTopNav';
import { AdminClientsList } from '../components/cockpit/AdminClientsList';
import { CockpitClientHeader } from '../components/cockpit/CockpitClientHeader';
import { sortClients } from '../components/cockpit/clientSort';
import { useAdminClients } from '../hooks/useAdminClients';
import { AdminClientPanel } from './AdminClientPanel';

// Cockpit 2 colonnes (layout retenu : Variante 3 + sidebar groupée Variante 2,
// thème CRM sombre conservé) :
//   gauche = liste compacte groupée par palier (portails actifs / en cours / autres)
//   centre = en-tête client + KPI en chips, puis panneau à onglets
// Sélection pilotée par l'URL (/clients/:projectId/*).
export function AdminCockpitPage() {
  const { basePath } = useAdminBasePath();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { clients, loading, error } = useAdminClients();

  const sorted = useMemo(() => sortClients(clients), [clients]);

  // Auto-sélection du 1er client trié (un portail actif en tête, pas l'ordre alpha brut).
  useEffect(() => {
    if (projectId || loading || error || sorted.length === 0) return;
    navigate(`${basePath}/clients/${sorted[0].project_id}`, { replace: true });
  }, [projectId, loading, error, sorted, basePath, navigate]);

  const selected = useMemo(
    () => clients.find(c => c.project_id === projectId) ?? null,
    [clients, projectId],
  );

  function handleSelect(id: string) {
    navigate(`${basePath}/clients/${id}`);
  }

  // projectId d'URL inconnu → retour liste.
  if (projectId && !loading && !error && clients.length > 0 && !selected) {
    return <Navigate to={`${basePath}/clients`} replace />;
  }

  const list = (
    <AdminClientsList
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

      {/* ≥ lg : cockpit 2 colonnes (liste groupée + détail à KPI en tête) */}
      <div className="hidden h-[calc(100vh-3.5rem)] min-h-0 lg:flex">
        <aside className="w-[440px] shrink-0 border-r border-border">
          {list}
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto">
          {projectId ? (
            <>
              <CockpitClientHeader client={selected} />
              <AdminClientPanel embedded />
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {loading ? 'Chargement…' : 'Sélectionnez un client dans la liste.'}
            </div>
          )}
        </main>
      </div>

      {/* < lg : navigation liste → détail */}
      <div className="lg:hidden">
        {projectId ? (
          <div className="py-4">
            <Link
              to={`${basePath}/clients`}
              className="mb-3 ml-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Tous les clients
            </Link>
            <CockpitClientHeader client={selected} />
            <AdminClientPanel embedded />
          </div>
        ) : (
          <div className="h-[calc(100vh-3.5rem)] min-h-0">{list}</div>
        )}
      </div>
    </>
  );
}
