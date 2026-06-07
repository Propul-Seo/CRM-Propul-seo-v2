import { Routes, Route, useParams, Link } from 'react-router-dom';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import { AdminClientTabs } from '../components/AdminClientTabs';
import { InvoicesTab } from '../components/InvoicesTab';
import { ProjectStepsTab } from '../components/ProjectStepsTab';
import { DocumentsTab } from '../components/DocumentsTab';
import { ActivityTab } from '../components/ActivityTab';
import { SignaturesTab } from '../components/SignaturesTab';
import { PortalStatusSection } from '../components/PortalStatusSection';
import { useAdminClientEmail, useAdminProject } from '../hooks/useAdminClients';

function OverviewTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, loading, refresh } = useAdminProject(projectId);
  if (!projectId) return null;
  if (loading) return <div className="py-6 text-sm text-muted-foreground">Chargement…</div>;
  if (!project) return <div className="py-6 text-sm text-muted-foreground">Projet introuvable.</div>;
  return (
    <div className="space-y-5 py-2">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
        {project.client_company && <p className="text-sm text-muted-foreground">{project.client_company}</p>}
        {project.portal_client_email && <p className="text-sm text-muted-foreground">{project.portal_client_email}</p>}
      </div>
      <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
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

function ActiviteRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;
  return <ActivityTab projectId={projectId} />;
}

function SignaturesRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const email = useAdminClientEmail(projectId);
  if (!projectId) return null;
  return <SignaturesTab projectId={projectId} clientEmail={email} />;
}

export function AdminClientPanel() {
  const { basePath } = useAdminBasePath();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link to={`${basePath}/clients`} className="text-sm text-primary hover:underline">← Tous les clients</Link>
      <AdminClientTabs />
      <Routes>
        <Route index element={<OverviewTab />} />
        <Route path="factures" element={<InvoicesRoute />} />
        <Route path="signatures" element={<SignaturesRoute />} />
        <Route path="documents" element={<DocumentsRoute />} />
        <Route path="jalons" element={<JalonsRoute />} />
        <Route path="activite" element={<ActiviteRoute />} />
      </Routes>
    </div>
  );
}
