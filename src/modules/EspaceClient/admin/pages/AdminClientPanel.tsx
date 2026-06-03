import { Routes, Route, useParams, Link } from 'react-router-dom';
import { AdminClientTabs } from '../components/AdminClientTabs';
import { InvoicesTab } from '../components/InvoicesTab';
import { ProjectStepsTab } from '../components/ProjectStepsTab';
import { DocumentsTab } from '../components/DocumentsTab';
import { PortalStatusSection } from '../components/PortalStatusSection';
import { useAdminClientEmail, useAdminProject } from '../hooks/useAdminClients';

function TabPlaceholder({ name }: { name: string }) {
  return <div className="py-10 text-center text-sm text-gray-400">Onglet « {name} » — à venir</div>;
}

function OverviewTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, loading, refresh } = useAdminProject(projectId);
  if (!projectId) return null;
  if (loading) return <div className="py-6 text-sm text-gray-500">Chargement…</div>;
  if (!project) return <div className="py-6 text-sm text-gray-500">Projet introuvable.</div>;
  return (
    <div className="space-y-5 py-2">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
        {project.client_company && <p className="text-sm text-gray-500">{project.client_company}</p>}
        {project.portal_client_email && <p className="text-sm text-gray-500">{project.portal_client_email}</p>}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <PortalStatusSection
          project={{
            id: project.id,
            name: project.name,
            portal_client_email: project.portal_client_email,
            portal_previous_client_email: project.portal_previous_client_email,
            portal_activated_at: project.portal_activated_at,
          }}
          isAdmin
          suggestedEmail={project.portal_client_email}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}

function InvoicesRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const email = useAdminClientEmail(projectId);
  if (!projectId) return null;
  return <InvoicesTab projectId={projectId} clientEmail={email} />;
}

function JalonsRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;
  return <ProjectStepsTab projectId={projectId} />;
}

function DocumentsRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;
  return <DocumentsTab projectId={projectId} />;
}

export function AdminClientPanel() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link to="/admin/propulspace/clients" className="text-sm text-violet-700 hover:underline">← Tous les clients</Link>
      <AdminClientTabs />
      <Routes>
        <Route index element={<OverviewTab />} />
        <Route path="factures" element={<InvoicesRoute />} />
        <Route path="signatures" element={<TabPlaceholder name="Signatures" />} />
        <Route path="documents" element={<DocumentsRoute />} />
        <Route path="jalons" element={<JalonsRoute />} />
        <Route path="activite" element={<TabPlaceholder name="Activité" />} />
      </Routes>
    </div>
  );
}
