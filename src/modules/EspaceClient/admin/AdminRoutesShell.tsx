import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminBasePathProvider } from './AdminBasePathContext';
import { PropulspaceAdminGuard } from './PropulspaceAdminGuard';
import { LeadsQualifiesPage } from './LeadsQualifiesPage';
import { AdminCockpitPage } from './pages/AdminCockpitPage';
import { AdminPortalSettingsPage } from './pages/AdminPortalSettingsPage';
import { AdminPortalPreviewPage } from './preview/AdminPortalPreviewPage';

interface AdminRoutesShellProps {
  basePath: string;
  mountedInShell: boolean;
}

// Sous-routes back-office Propul'Space (relatives) :
//  - clients              : dashboard des portails (défaut)
//  - clients/:projectId/* : panneau client à onglets
//  - leads                : leads qualifiés
// Réutilisé par PropulspaceAdminApp (/admin/propulspace) ET PortailsModule (/portails).
export function AdminRoutesShell({ basePath, mountedInShell }: AdminRoutesShellProps) {
  return (
    <AdminBasePathProvider basePath={basePath} mountedInShell={mountedInShell}>
      <PropulspaceAdminGuard>
        <Routes>
          <Route index element={<Navigate to="clients" replace />} />
          {/* Cockpit 3 colonnes : capte la liste seule ET la sélection client. */}
          <Route path="clients" element={<AdminCockpitPage />} />
          {/* Aperçu client (lecture seule) — plus spécifique, déclaré avant le cockpit. */}
          <Route path="clients/:projectId/apercu-client/*" element={<AdminPortalPreviewPage />} />
          <Route path="clients/:projectId/*" element={<AdminCockpitPage />} />
          <Route path="leads" element={<LeadsQualifiesPage />} />
          <Route path="settings" element={<AdminPortalSettingsPage />} />
        </Routes>
      </PropulspaceAdminGuard>
    </AdminBasePathProvider>
  );
}
