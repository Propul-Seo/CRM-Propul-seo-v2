/**
 * Mapping centralisé des routes de l'application.
 * Source unique de vérité — tous les composants doivent importer d'ici
 * plutôt que d'écrire les paths en dur.
 */

export const routes = {
  home: '/',

  // V2 (par défaut)
  dashboard: '/dashboard',
  projects: '/projets',
  projectDetail: (id: string) => `/projets/${id}`,
  projectsCompleted: '/projets/termines',

  // Procédures (wiki interne)
  procedures: '/procedures',
  procedureNew: '/procedures/new',
  procedureDetail: (slug: string) => `/procedures/${slug}`,
  procedureEdit: (slug: string) => `/procedures/${slug}/edit`,
  procedureRevisions: (slug: string) => `/procedures/${slug}/revisions`,

  // Pôles V2
  communication: '/communication',
  communicationProject: (id: string) => `/communication/${id}`,
  erp: '/erp',
  erpProject: (id: string) => `/erp/${id}`,
  siteWeb: '/site-web',
  siteWebProject: (id: string) => `/site-web/${id}`,

  // Détail client (lead/contact CRM)
  clientDetail: (id: string) => `/clients/${id}`,

  // CRM v1
  dashboardLegacy: '/dashboard-v1',
  crm: '/crm',
  botOne: '/bot-one',
  botOneRecord: (recordId: string) => `/bot-one/${recordId}`,
  crmErp: '/crm-erp',
  crmErpLead: (leadId: string) => `/crm-erp/leads/${leadId}`,
  projectsLegacy: '/projets-v1',
  productionLegacy: '/production',
  productionKpi: '/production/kpi',
  productionClients: '/production/clients',

  // Personnel
  personalTasks: '/mes-taches',

  // Système
  contacts: '/contacts',
  accounting: '/comptabilite',
  settings: '/parametres',

  // Routes publiques (auth bypass)
  portal: (token: string) => `/portal/${token}`,
  brief: (token: string) => `/brief/${token}`,
  briefInvite: (token: string) => `/brief-invite/${token}`,

  // V3 Preview (chantier en cours — à valider avant bascule officielle)
  projectV3Preview: (id: string) => `/projets-v3-preview/${id}`,
} as const

/**
 * Mapping legacy moduleId → route.
 * Utilisé pour migrer progressivement les anciens appels setActiveModule.
 */
export const moduleToRoute: Record<string, string> = {
  'dashboard-v2': routes.dashboard,
  'dashboard': routes.dashboardLegacy,
  'crm': routes.crm,
  'crm-bot-one': routes.botOne,
  'client-details-bot-one': routes.botOne,
  'crm-erp': routes.crmErp,
  'crm-erp-lead-details': routes.crmErp,
  'projects': routes.projectsLegacy,
  'projects-v2': routes.projects,
  'completed-projects': routes.projectsCompleted,
  'project-details': routes.projects,
  'communication': routes.productionLegacy,
  'communication-kpi': routes.productionKpi,
  'communication-clients': routes.productionClients,
  'personal-tasks': routes.personalTasks,
  'comm-manager': routes.communication,
  'erp-manager': routes.erp,
  'site-web': routes.siteWeb,
  'procedures': routes.procedures,
  'contacts': routes.contacts,
  'accounting': routes.accounting,
  'settings': routes.settings,
}

/**
 * Permission requise pour accéder à un path.
 * Match par préfixe (le plus spécifique d'abord).
 */
export const routePermissions: Array<{ path: string; permission: string }> = [
  { path: routes.dashboard, permission: 'can_view_dashboard' },
  { path: routes.dashboardLegacy, permission: 'can_view_dashboard' },
  { path: routes.crm, permission: 'can_view_leads' },
  { path: routes.botOne, permission: 'can_view_crm_bot_one' },
  { path: routes.crmErp, permission: 'can_view_crm_erp' },
  { path: routes.projects, permission: 'can_view_projects' },
  { path: routes.projectsLegacy, permission: 'can_view_projects' },
  { path: routes.communication, permission: 'can_view_projects' },
  { path: routes.erp, permission: 'can_view_projects' },
  { path: routes.siteWeb, permission: 'can_view_projects' },
  { path: routes.productionLegacy, permission: 'can_view_communication' },
  { path: routes.contacts, permission: 'can_view_leads' },
  { path: routes.accounting, permission: 'can_view_finance' },
  { path: routes.settings, permission: 'can_view_settings' },
  { path: routes.procedures, permission: 'can_view_procedures' },
  { path: routes.personalTasks, permission: 'can_view_dashboard' },
  { path: '/projets-v3-preview', permission: 'can_view_projects' },
]

export function getPermissionForPath(pathname: string): string | null {
  const match = routePermissions
    .slice()
    .sort((a, b) => b.path.length - a.path.length)
    .find(r => pathname === r.path || pathname.startsWith(r.path + '/'))
  return match?.permission ?? null
}
