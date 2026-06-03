import { Routes, Route, useParams, Link } from 'react-router-dom';
import { AdminClientTabs } from '../components/AdminClientTabs';

function TabPlaceholder({ name }: { name: string }) {
  return <div className="py-10 text-center text-sm text-gray-400">Onglet « {name} » — à venir</div>;
}

function OverviewTab() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;
  // Phase 4 : infos client éditables + <PortalStatusSection projectId={projectId} />
  return <div className="py-6 text-sm text-gray-600">Aperçu du projet <code>{projectId}</code> — activation & infos client (Phase 4).</div>;
}

export function AdminClientPanel() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link to="/admin/propulspace/clients" className="text-sm text-violet-700 hover:underline">← Tous les clients</Link>
      <AdminClientTabs />
      <Routes>
        <Route index element={<OverviewTab />} />
        <Route path="factures" element={<TabPlaceholder name="Factures" />} />
        <Route path="signatures" element={<TabPlaceholder name="Signatures" />} />
        <Route path="documents" element={<TabPlaceholder name="Documents" />} />
        <Route path="jalons" element={<TabPlaceholder name="Jalons" />} />
        <Route path="activite" element={<TabPlaceholder name="Activité" />} />
      </Routes>
    </div>
  );
}
