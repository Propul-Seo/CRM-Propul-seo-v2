import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PortalLayout } from '@/modules/EspaceClient/shared/layouts/PortalLayout';
import type { PortalTab } from '@/modules/EspaceClient/shared/constants';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';

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
  const { userRow, project, signOut } = usePortal();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = pathToTab(location.pathname);

  const clientName = userRow.email.split('@')[0] ?? userRow.email;

  return (
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
  );
}
