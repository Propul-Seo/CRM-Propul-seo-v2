import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PortalLayout } from '@/modules/EspaceClient/shared/layouts/PortalLayout';
import type { PortalTab } from '@/modules/EspaceClient/shared/constants';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { WelcomeWizardProvider } from './welcome/WelcomeWizardContext';
import { WelcomeWizard } from './welcome/WelcomeWizard';

const TAB_PATH: Record<PortalTab, string> = {
  dashboard:  '/espace-client',
  project:    '/espace-client/project',
  documents:  '/espace-client/documents',
  invoices:   '/espace-client/invoices',
  signatures: '/espace-client/signatures',
  help:       '/espace-client/help',
};

function pathToTab(pathname: string): PortalTab {
  // Match le plus spécifique d'abord. Ordre des entrées non garanti côté
  // Object.entries, on prend la plus longue préfixe match pour éviter que
  // /espace-client matche avant /espace-client/project.
  const entries = Object.entries(TAB_PATH) as Array<[PortalTab, string]>;
  const sorted = entries.sort((a, b) => b[1].length - a[1].length);
  const found = sorted.find(([, p]) => pathname === p || pathname.startsWith(`${p}/`));
  return found?.[0] ?? 'dashboard';
}

export function PortalShell() {
  const { email, project, signOut } = usePortal();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = pathToTab(location.pathname);

  // Préfère le nom client défini sur le projet, sinon dérive de l'email.
  const clientName = project.client_name ?? email.split('@')[0] ?? email;

  return (
    <WelcomeWizardProvider projectId={project.id}>
      <PortalLayout
        activeTab={activeTab}
        onTabChange={tab => navigate(TAB_PATH[tab])}
        clientName={clientName}
        projectName={project.name ?? undefined}
        onLogout={async () => {
          await signOut();
          navigate('/espace-client/login', { replace: true });
        }}
      >
        <Outlet />
      </PortalLayout>
      {/* Wizard monté au niveau shell : une seule instance pour tout le portail,
          ouverture pilotée par le context (auto-open au login + bouton Reprendre
          de WelcomeBanner). */}
      <WelcomeWizard />
    </WelcomeWizardProvider>
  );
}
