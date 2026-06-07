import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminBasePathProvider } from './AdminBasePathContext';
import { PropulspaceAdminGuard } from './PropulspaceAdminGuard';
import { LeadsQualifiesPage } from './LeadsQualifiesPage';
import { AdminClientsPage } from './pages/AdminClientsPage';
import { AdminClientPanel } from './pages/AdminClientPanel';

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
          <Route path="clients" element={<AdminClientsPage />} />
          <Route path="clients/:projectId/*" element={<AdminClientPanel />} />
          <Route path="leads" element={<LeadsQualifiesPage />} />
        </Routes>
      </PropulspaceAdminGuard>
    </AdminBasePathProvider>
  );
}
