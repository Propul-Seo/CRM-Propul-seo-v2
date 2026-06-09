import { Routes, Route, useParams, Link } from 'react-router-dom';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import { AdminClientTabs } from '../components/AdminClientTabs';
import { InvoicesTab } from '../components/InvoicesTab';
import { ProjectStepsTab } from '../components/ProjectStepsTab';
import { DocumentsTab } from '../components/DocumentsTab';
import { ActivityTab } from '../components/ActivityTab';
import { SignaturesTab } from '../components/SignaturesTab';
import { Building2, Mail } from 'lucide-react';
import { PortalStatusSection } from '../components/PortalStatusSection';
import { useAdminClientEmail, useAdminProject } from '../hooks/useAdminClients';

function OverviewTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, loading, refresh } = useAdminProject(projectId);
  if (!projectId) return null;
  if (loading) return <div className="py-6 text-sm text-muted-foreground">Chargement…</div>;
  if (!project) return <div className="py-6 text-sm text-muted-foreground">Projet introuvable.</div>;
  return (
    <div className="space-y-4 py-2">
      {/* Identité client (Atelier) */}
      <section className="rounded-xl border border-border bg-surface-2 p-5 shadow-glow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Client</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-foreground">{project.client_company ?? project.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{project.name}</p>
          </div>
        </div>
        {project.portal_client_email && (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2.5 py-1 text-xs text-foreground/70">
            <Mail className="h-3.5 w-3.5" />
            {project.portal_client_email}
          </span>
        )}
      </section>

      {/* Accès portail */}
      <div>
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Accès portail</p>
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

      {/* Jalons du projet (fusionnés dans l'Aperçu) */}
      <ProjectStepsTab projectId={projectId} />
    </div>
  );
}

function InvoicesRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const email = useAdminClientEmail(projectId);
  if (!projectId) return null;
  return <InvoicesTab projectId={projectId} clientEmail={email} />;
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

function AdminClientPanelContent({ showTabs }: { showTabs: boolean }) {
  return (
    <>
      {showTabs && <AdminClientTabs />}
      <Routes>
        <Route index element={<OverviewTab />} />
        <Route path="factures" element={<InvoicesRoute />} />
        <Route path="signatures" element={<SignaturesRoute />} />
        <Route path="documents" element={<DocumentsRoute />} />
        <Route path="activite" element={<ActiviteRoute />} />
      </Routes>
    </>
  );
}

// `embedded` : rendu dans la colonne centrale du cockpit (pas de wrapper centré
// ni de lien retour, qui sont assurés par AdminCockpitPage).
export function AdminClientPanel({ embedded = false }: { embedded?: boolean } = {}) {
  const { basePath } = useAdminBasePath();
  if (embedded) {
    return (
      <div className="space-y-5 px-4 py-5">
        <AdminClientPanelContent showTabs={false} />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link to={`${basePath}/clients`} className="text-sm text-primary hover:underline">← Tous les clients</Link>
      <AdminClientPanelContent showTabs={true} />
    </div>
  );
}
