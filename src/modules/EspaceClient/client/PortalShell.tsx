import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PortalLayout } from '@/modules/EspaceClient/shared/layouts/PortalLayout';
import { resolveTeamWhatsapp, type PortalTab } from '@/modules/EspaceClient/shared/constants';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { portalBase } from '@/modules/EspaceClient/shared/portalHost';
import { usePortalProjectDetails } from './hooks/usePortalProjectDetails';
import { WelcomeWizardProvider } from './welcome/WelcomeWizardContext';
import { WelcomeWizard } from './welcome/WelcomeWizard';

// Segment relatif par onglet (vide = index). La base est injectable pour que le
// shell soit réutilisable sous la route d'aperçu admin (/portails/.../apercu-client).
const TAB_SEGMENT: Record<PortalTab, string> = {
  dashboard:  '',
  project:    'project',
  documents:  'documents',
  invoices:   'invoices',
  signatures: 'signatures',
  help:       'help',
};

function tabToPath(basePath: string, tab: PortalTab): string {
  const seg = TAB_SEGMENT[tab];
  return seg ? `${basePath}/${seg}` : basePath;
}

function pathToTab(pathname: string, basePath: string): PortalTab {
  // Match le plus spécifique (segment le plus long) d'abord, sinon dashboard.
  const entries = Object.entries(TAB_SEGMENT) as Array<[PortalTab, string]>;
  const sorted = entries.sort((a, b) => b[1].length - a[1].length);
  const found = sorted.find(([, seg]) => {
    const p = seg ? `${basePath}/${seg}` : basePath;
    return pathname === p || pathname.startsWith(`${p}/`);
  });
  return found?.[0] ?? 'dashboard';
}

export function PortalShell() {
  const { email, project, signOut, previewMode, basePath } = usePortal();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = pathToTab(location.pathname, basePath);
  // Profil : atteint via le bloc identité (sidebar/avatar), pas un onglet.
  const profileActive = location.pathname.startsWith(`${basePath}/profile`);
  // Contact WhatsApp = membre Propul'SEO assigné au projet (Aide + FAB).
  const { details } = usePortalProjectDetails();
  const whatsappNumber = resolveTeamWhatsapp(details?.assigned_name);

  // Préfère le nom client défini sur le projet, sinon dérive de l'email.
  const clientName = project.client_name ?? email.split('@')[0] ?? email;

  const layout = (
    <PortalLayout
      activeTab={activeTab}
      onTabChange={tab => navigate(tabToPath(basePath, tab))}
      clientName={clientName}
      projectName={project.name ?? undefined}
      profileActive={profileActive}
      onProfile={() => navigate(`${basePath}/profile`)}
      whatsappNumber={whatsappNumber}
      onLogout={async () => {
        await signOut();
        // En aperçu, signOut = retour cockpit (géré par le provider d'aperçu).
        if (!previewMode) navigate(`${portalBase()}/login`, { replace: true });
      }}
    >
      <Outlet />
    </PortalLayout>
  );

  // Aperçu admin : on ne monte pas le wizard d'accueil (auto-open + écritures
  // on-mount inutiles et indésirables en lecture seule). Le WelcomeBanner est
  // masqué côté DashboardPage en previewMode.
  if (previewMode) return layout;

  return (
    <WelcomeWizardProvider projectId={project.id}>
      {layout}
      {/* Wizard monté au niveau shell : une seule instance pour tout le portail,
          ouverture pilotée par le context (auto-open au login + bouton Reprendre
          de WelcomeBanner). */}
      <WelcomeWizard />
    </WelcomeWizardProvider>
  );
}
