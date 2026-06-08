import { Routes, Route, useParams, Link } from 'react-router-dom';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import { AdminClientTabs } from '../components/AdminClientTabs';
import { InvoicesTab } from '../components/InvoicesTab';
import { ProjectStepsTab } from '../components/ProjectStepsTab';
import { DocumentsTab } from '../components/DocumentsTab';
import { ActivityTab } from '../components/ActivityTab';
import { SignaturesTab } from '../components/SignaturesTab';
import { Building2, Mail } from 'lucide-react';
import { AdminSectionHeader } from '../components/kit';
import { PortalStatusSection } from '../components/PortalStatusSection';
import { useAdminClientEmail, useAdminProject } from '../hooks/useAdminClients';

function OverviewTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, loading, refresh } = useAdminProject(projectId);
  if (!projectId) return null;
  if (loading) return <div className="py-6 text-sm text-muted-foreground">Chargement…</div>;
  if (!project) return <div className="py-6 text-sm text-muted-foreground">Projet introuvable.</div>;
  return (
    <div className="space-y-6 py-2">
      {/* Identité client : société + projet + email portail */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-foreground">{project.name}</h2>
            {project.client_company && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{project.client_company}</p>
            )}
            {project.portal_client_email && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{project.portal_client_email}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Accès portail */}
      <div>
        <AdminSectionHeader
          title="Accès portail"
          subtitle="Gérez l'espace client externe et l'invitation par email."
        />
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
      <div className="border-t border-border pt-6">
        <ProjectStepsTab projectId={projectId} />
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

function AdminClientPanelContent() {
  return (
    <>
      <AdminClientTabs />
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
        <AdminClientPanelContent />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link to={`${basePath}/clients`} className="text-sm text-primary hover:underline">← Tous les clients</Link>
      <AdminClientPanelContent />
    </div>
  );
}
