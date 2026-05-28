import { Routes, Route, Navigate } from 'react-router-dom';
import { PropulspaceAdminGuard } from './PropulspaceAdminGuard';
import { LeadsQualifiesPage } from './LeadsQualifiesPage';

// Sous-router /admin/*. V1 limité à /admin/leads (Vue 9). Les autres
// pages admin (dashboard portails, panel client, etc.) viendront en
// Sub-phase E du plan Phase 2.
export function PropulspaceAdminApp() {
  return (
    <PropulspaceAdminGuard>
      <Routes>
        <Route index element={<Navigate to="leads" replace />} />
        <Route path="leads" element={<LeadsQualifiesPage />} />
      </Routes>
    </PropulspaceAdminGuard>
  );
}
