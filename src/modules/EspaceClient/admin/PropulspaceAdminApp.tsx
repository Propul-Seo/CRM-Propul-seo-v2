import { Routes, Route, Navigate } from 'react-router-dom';
import { PropulspaceAdminGuard } from './PropulspaceAdminGuard';
import { LeadsQualifiesPage } from './LeadsQualifiesPage';
import { AdminClientsPage } from './pages/AdminClientsPage';
import { AdminClientPanel } from './pages/AdminClientPanel';

// Sous-router /admin/*. Back-office Propul'Space :
//  - clients            : dashboard des portails (défaut)
//  - clients/:projectId : panneau client à onglets
//  - leads              : leads qualifiés (Vue 9, existant)
export function PropulspaceAdminApp() {
  return (
    <PropulspaceAdminGuard>
      <Routes>
        <Route index element={<Navigate to="clients" replace />} />
        <Route path="clients" element={<AdminClientsPage />} />
        <Route path="clients/:projectId/*" element={<AdminClientPanel />} />
        <Route path="leads" element={<LeadsQualifiesPage />} />
      </Routes>
    </PropulspaceAdminGuard>
  );
}
