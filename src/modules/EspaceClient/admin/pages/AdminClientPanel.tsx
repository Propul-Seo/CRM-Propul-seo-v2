import { Routes, Route, useParams, Link } from 'react-router-dom';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import { AdminClientTabs } from '../components/AdminClientTabs';
import { InvoicesTab } from '../components/InvoicesTab';
import { ProjectStepsTab } from '../components/ProjectStepsTab';
import { DocumentsTab } from '../components/DocumentsTab';
import { ActivityTab } from '../components/ActivityTab';
import { SignaturesTab } from '../components/SignaturesTab';
import { Building2 } from 'lucide-react';
import { AdminEmptyState } from '@/modules/EspaceClient/admin/components/kit';
import { Skeleton } from '@/modules/EspaceClient/shared/components';
import { OverviewActivityCard } from '../components/OverviewActivityCard';
import { useAdminClientEmail, useAdminProject } from '../hooks/useAdminClients';

// Squelette de chargement de l'Aperçu (mêmes proportions que la vue réelle).
function OverviewSkeleton() {
  return (
    <div className="space-y-4 py-2" aria-busy="true">
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-2.5 lg:border-l lg:border-border-subtle lg:pl-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  );
}

function OverviewTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, loading } = useAdminProject(projectId);
  if (!projectId) return null;
  if (loading) return <OverviewSkeleton />;
  if (!project) {
    return (
      <AdminEmptyState
        icon={Building2}
        title="Projet introuvable"
        body="Ce projet n'existe plus ou n'est pas accessible depuis ce compte."
      />
    );
  }
  return (
    <div className="space-y-4 py-2">
      {/* Jalons | Activité récente (Aperçu V1 — 2 colonnes) */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ProjectStepsTab projectId={projectId} />
        <OverviewActivityCard projectId={projectId} />
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
