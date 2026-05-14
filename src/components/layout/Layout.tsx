import React, { useRef, useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUsers } from '../../hooks/useUsers';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from '../mobile/BottomNav';
import { MobileNavFAB } from '../mobile/MobileNavFAB';
import { Dashboard } from '../../modules/Dashboard';
import { Lock, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProjectsV2Provider } from '../../modules/ProjectsManagerV2/context/ProjectsV2Context';
import { routes, getPermissionForPath, isAdminOnlyPath } from '../../lib/routes';

// Lazy load heavy modules
const CRM = lazy(() => import('../../modules/CRM').then(m => ({ default: m.CRM })));
const CRMBotOne = lazy(() => import('../../modules/CRMBotOne').then(m => ({ default: m.CRMBotOne })));
const ClientDetailsBotOne = lazy(() => import('../../pages/ClientDetailsBotOne').then(m => ({ default: m.ClientDetailsBotOne })));
const ProjectsManager = lazy(() => import('../../modules/ProjectsManager').then(m => ({ default: m.ProjectsManager })));
const CompletedProjectsManager = lazy(() => import('../../modules/CompletedProjectsManager').then(m => ({ default: m.CompletedProjectsManager })));
const Accounting = lazy(() => import('../../modules/Accounting').then(m => ({ default: m.Accounting })));
const Contacts = lazy(() => import('../../modules/Contacts'));
const Settings = lazy(() => import('../../modules/Settings').then(m => ({ default: m.Settings })));
const CRMERP = lazy(() => import('../../modules/CRMERP').then(m => ({ default: m.CRMERP })));
const CRMERPLeadDetails = lazy(() => import('../../modules/CRMERPLeadDetails').then(m => ({ default: m.CRMERPLeadDetails })));
const Communication = lazy(() => import('../../modules/Communication').then(m => ({ default: m.Communication })));
const CommunicationKPI = lazy(() => import('../../modules/CommunicationKPI').then(m => ({ default: m.CommunicationKPI })));
const PersonalTasks = lazy(() => import('../../modules/PersonalTasks').then(m => ({ default: m.PersonalTasks })));
const CommunicationClients = lazy(() => import('../../modules/CommunicationClients').then(m => ({ default: m.CommunicationClients })));
const ProjectsManagerV2 = lazy(() => import('../../modules/ProjectsManagerV2').then(m => ({ default: m.ProjectsManagerV2 })))
const DashboardV2 = lazy(() => import('../../modules/DashboardV2').then(m => ({ default: m.DashboardV2 })))
const SiteWebManager = lazy(() => import('../../modules/SiteWebManager').then(m => ({ default: m.SiteWebManager })))
const ERPManager = lazy(() => import('../../modules/ERPManager').then(m => ({ default: m.ERPManager })))
const CommunicationManager = lazy(() => import('../../modules/CommunicationManager').then(m => ({ default: m.CommunicationManager })))
const ProceduresManager = lazy(() => import('../../modules/ProceduresManager').then(m => ({ default: m.ProceduresManager })))
const ClientDetailsRoute = lazy(() => import('../routing/ClientDetailsRoute').then(m => ({ default: m.ClientDetailsRoute })))
const ProjectDetailsV3Preview = lazy(() => import('../../modules/ProjectDetailsV3Preview').then(m => ({ default: m.ProjectDetailsV3Preview })))
const AgencyVaultPage = lazy(() => import('../../modules/AgencyVault').then(m => ({ default: m.AgencyVaultPage })))
const ProjectsV3Page = lazy(() => import('../../modules/ProjectsV3').then(m => ({ default: m.ProjectsV3Page })))
const LeadsV3PlaceholderRoute = lazy(() => import('../../modules/LeadsV3').then(m => ({ default: m.LeadsV3Page })))
const ProjectsV3CompletedPage = lazy(() => import('../../modules/ProjectsV3Completed').then(m => ({ default: m.ProjectsV3CompletedPage })))

const ModuleLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
      <p className="text-muted-foreground text-sm">Chargement...</p>
    </div>
  </div>
);

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<ModuleLoader />}><Component /></Suspense>
);

const wrapWithProjects = (Component: React.ComponentType) => (
  <ProjectsV2Provider>
    <Suspense fallback={<ModuleLoader />}><Component /></Suspense>
  </ProjectsV2Provider>
);

function AccessDenied({ email, path }: { email?: string; path: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Lock className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">Accès non autorisé</h3>
      <p className="text-muted-foreground">
        Vous n'avez pas les permissions nécessaires pour accéder à ce module.
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Contactez l'administrateur pour obtenir l'accès.
      </p>
      {email && (
        <div className="mt-4 p-3 bg-surface-2 rounded-lg">
          <p className="text-sm text-muted-foreground"><strong>Utilisateur:</strong> {email}</p>
          <p className="text-sm text-muted-foreground"><strong>Page demandée:</strong> {path}</p>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const { user } = useAuth();
  const { getUserByAuthId } = useUsers();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo(0, 0);
    else window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userData = await getUserByAuthId(user.id);
        setCurrentUserData(userData);
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [user, getUserByAuthId]);

  // Redirection vers la première page accessible si l'utilisateur n'a pas accès
  useEffect(() => {
    if (!currentUserData || loading) return;
    if (currentUserData.role === 'admin') return;

    // Routes admin-only : redirect immédiat pour tout non-admin
    if (isAdminOnlyPath(location.pathname)) {
      console.log(`🔒 Route admin-only ${location.pathname} → redirect dashboard`);
      navigate(routes.dashboard, { replace: true });
      return;
    }

    const requiredPerm = getPermissionForPath(location.pathname);
    if (!requiredPerm) return;
    if (currentUserData[requiredPerm] === true) return;

    // Cherche la première route accessible (ordre de priorité = sidebar)
    const fallbackOrder = [
      routes.dashboard,
      routes.communication,
      routes.erp,
      routes.siteWeb,
      routes.projects,
      routes.procedures,
      routes.crm,
      routes.botOne,
      routes.crmErp,
      routes.projectsLegacy,
      routes.productionLegacy,
      routes.accounting,
      routes.settings,
    ];
    const firstAccessible = fallbackOrder.find(p => {
      const perm = getPermissionForPath(p);
      return !perm || currentUserData[perm] === true;
    });
    if (firstAccessible) {
      console.log(`🔄 Redirection: ${location.pathname} → ${firstAccessible} (permissions)`);
      navigate(firstAccessible, { replace: true });
    }
  }, [currentUserData, loading, location.pathname, navigate]);

  const canAccess = (perm: string | null) => {
    if (!perm) return true;
    if (!currentUserData) return true;
    if (currentUserData.role === 'admin') return true;
    return currentUserData[perm] === true;
  };

  const requiredPerm = getPermissionForPath(location.pathname);
  const isAdminRoute = isAdminOnlyPath(location.pathname);
  const allowed = isAdminRoute
    ? (currentUserData?.role === 'admin')
    : canAccess(requiredPerm);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-1">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-screen bg-surface-1 transition-colors duration-200 overflow-hidden",
      isMobile && "flex-col"
    )}>
      {!isMobile && <Sidebar />}

      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        isMobile && "h-full"
      )}>
        {!isMobile && <Header />}

        <main
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden scroll-touch branded-bg",
            isMobile && "pb-16"
          )}
          ref={mainRef}
        >
          {!allowed ? (
            <AccessDenied email={currentUserData?.email} path={location.pathname} />
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to={routes.dashboard} replace />} />

              {/* V2 (par défaut) */}
              <Route path={routes.dashboard} element={wrap(DashboardV2)} />
              {/* /projets/termines doit être DÉCLARÉ AVANT /projets/* pour gagner */}
              <Route path={routes.projectsCompleted} element={wrap(CompletedProjectsManager)} />
              {/* Projets V2 : sous-routes (list / :id) */}
              <Route path="/projets/*" element={wrap(ProjectsManagerV2)} />
              {/* Procédures : sous-routes gérées en interne (list/new/:slug/edit/revisions) */}
              <Route path="/procedures/*" element={wrap(ProceduresManager)} />

              {/* Pôles V2 — sous-routes (list / :id) gérées en interne */}
              <Route path="/communication/*" element={wrapWithProjects(CommunicationManager)} />
              <Route path="/erp/*" element={wrapWithProjects(ERPManager)} />
              <Route path="/site-web/*" element={wrapWithProjects(SiteWebManager)} />

              {/* Détail client / lead (depuis CRM) */}
              <Route path="/clients/:id" element={wrap(ClientDetailsRoute)} />

              {/* V3 Preview — chantier de refonte en cours, accessible pour validation */}
              <Route path="/projets-v3-preview/:id" element={wrap(ProjectDetailsV3Preview)} />

              {/* Coffre-fort agence (admin only — garde côté RPC) */}
              <Route path={routes.agencyVault} element={wrap(AgencyVaultPage)} />

              {/* Projets en cours V3 — refonte kanban 3 colonnes */}
              <Route path={routes.projectsV3} element={wrap(ProjectsV3Page)} />

              {/* Communication V3 — wiring vers modules V2 existants */}
              <Route path={routes.communicationV3Production} element={wrap(Communication)} />
              <Route path={routes.communicationV3Kpi} element={wrap(CommunicationKPI)} />

              {/* Projets V3 Terminés — module V3 dédié, vue liste compacte */}
              <Route path={routes.projectsV3Completed} element={wrap(ProjectsV3CompletedPage)} />

              {/* Leads V3 — module en cours de construction (Phase 4) */}
              <Route path={routes.leadsV3} element={wrap(LeadsV3PlaceholderRoute)} />

              {/* CRM v1 */}
              <Route path={routes.dashboardLegacy} element={<Dashboard />} />
              <Route path={routes.crm} element={wrap(CRM)} />
              <Route path={routes.botOne} element={wrap(CRMBotOne)} />
              <Route path="/bot-one/:recordId" element={wrap(ClientDetailsBotOne)} />
              <Route path={routes.crmErp} element={wrap(CRMERP)} />
              <Route path="/crm-erp/leads/:leadId" element={wrap(CRMERPLeadDetails)} />
              <Route path={routes.projectsLegacy} element={wrap(ProjectsManager)} />
              <Route path={routes.productionLegacy} element={wrap(Communication)} />
              <Route path={routes.productionKpi} element={wrap(CommunicationKPI)} />
              <Route path={routes.productionClients} element={wrap(CommunicationClients)} />

              {/* Personnel */}
              <Route path={routes.personalTasks} element={wrap(PersonalTasks)} />

              {/* Système */}
              <Route path={routes.contacts} element={wrap(Contacts)} />
              <Route path={routes.accounting} element={wrap(Accounting)} />
              <Route path={routes.settings} element={wrap(Settings)} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
            </Routes>
          )}
        </main>
      </div>

      {isMobile && <BottomNav />}
      <MobileNavFAB />
    </div>
  );
}
