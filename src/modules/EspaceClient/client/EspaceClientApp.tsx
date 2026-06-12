import { Routes, Route } from 'react-router-dom';
import { useForcePortalSurface } from '@/modules/EspaceClient/shared/hooks/useForcePortalSurface';
import { PortalGuard } from '@/modules/EspaceClient/shared/guards/PortalGuard';
import { ClientLoginPage } from './ClientLoginPage';
import { PortalShell } from './PortalShell';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectPage } from './pages/ProjectPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { SignaturesPage } from './pages/SignaturesPage';
import { HelpPage } from './pages/HelpPage';
import { ProfilePage } from './pages/ProfilePage';
import { MagicLinkExpiredPage } from './pages/MagicLinkExpiredPage';
import { PortalSuspendedPage } from './pages/PortalSuspendedPage';
import { NotFoundPortalPage } from './pages/NotFoundPortalPage';
import { SetupPasswordPage } from './pages/SetupPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Sous-router /espace-client/*. Routes publiques (login + statuts) en dehors
// du PortalGuard ; routes protégées via PortalGuard → PortalShell → Outlet.
export function EspaceClientApp() {
  // Force la surface NUIT (#0B0A0F) du portail : retire la classe `dark` du CRM
  // et pose `ps-night-surface` sur <html>. Indispensable sur le sous-domaine
  // espace.* (où le portail est toute l'app) ET sous crm./espace-client.
  // Chaque scope .propulspace-portal de ce sous-router porte `ps-theme-night`.
  useForcePortalSurface('night');
  return (
    <Routes>
      <Route path="login" element={<ClientLoginPage />} />
      <Route path="setup-password" element={<SetupPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="expired" element={<div className="propulspace-portal ps-theme-night min-h-screen"><MagicLinkExpiredPage /></div>} />
      <Route path="suspended" element={<div className="propulspace-portal ps-theme-night min-h-screen"><PortalSuspendedPage /></div>} />

      <Route element={<PortalGuard><PortalShell /></PortalGuard>}>
        <Route index element={<DashboardPage />} />
        <Route path="project" element={<ProjectPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="signatures" element={<SignaturesPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<div className="propulspace-portal ps-theme-night min-h-screen"><NotFoundPortalPage /></div>} />
    </Routes>
  );
}
