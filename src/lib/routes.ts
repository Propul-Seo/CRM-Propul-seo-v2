/**
 * Mapping centralisé des routes de l'application.
 * Source unique de vérité — tous les composants doivent importer d'ici
 * plutôt que d'écrire les paths en dur.
 */

export const routes = {
  home: '/',

  // CRM Propul'SEO (V3 officiel)
  dashboard: '/dashboard',
  projectsV3: '/projets-en-cours',
  projectsV3Completed: '/projets-v3-termines',
  projectV3Preview: (id: string) => `/projets-v3-preview/${id}`,
  leadsV3: '/leads-v3',
  communicationV3Production: '/communication-v3/production',
  communicationV3Kpi: '/communication-v3/kpi',

  // Portails clients (back-office Propul'Space monté dans le shell)
  portails: '/portails',

  // Procédures (wiki interne)
  procedures: '/procedures',
  procedureNew: '/procedures/new',
  procedureDetail: (slug: string) => `/procedures/${slug}`,
  procedureEdit: (slug: string) => `/procedures/${slug}/edit`,
  procedureRevisions: (slug: string) => `/procedures/${slug}/revisions`,

  // Fiches détail leads (fonctions mère utilisées par Leads V3)
  clientDetail: (id: string) => `/clients/${id}`,
  crmErpLead: (leadId: string) => `/crm-erp/leads/${leadId}`,

  // Admin
  personalTasks: '/mes-taches',
  agencyVault: '/coffre-fort',
  accounting: '/comptabilite',

  // Système
  settings: '/parametres',

  // Routes publiques (auth bypass)
  portal: (token: string) => `/portal/${token}`,
  brief: (token: string) => `/brief/${token}`,
  briefInvite: (token: string) => `/brief-invite/${token}`,
} as const

/**
 * Permission requise pour accéder à un path.
 * Match par préfixe (le plus spécifique d'abord).
 */
export const routePermissions: Array<{ path: string; permission: string }> = [
  { path: routes.dashboard, permission: 'can_view_dashboard' },
  { path: routes.projectsV3, permission: 'can_view_projects' },
  { path: routes.projectsV3Completed, permission: 'can_view_projects' },
  { path: '/projets-v3-preview', permission: 'can_view_projects' },
  { path: routes.leadsV3, permission: 'can_view_leads' },
  { path: routes.communicationV3Production, permission: 'can_view_communication' },
  { path: routes.communicationV3Kpi, permission: 'can_view_communication' },
  { path: routes.procedures, permission: 'can_view_procedures' },
  { path: '/clients', permission: 'can_view_leads' },
  { path: '/crm-erp/leads', permission: 'can_view_crm_erp' },
  { path: routes.personalTasks, permission: 'can_view_dashboard' },
  { path: routes.accounting, permission: 'can_view_finance' },
  { path: routes.settings, permission: 'can_view_settings' },
  // NB : `routes.portails` n'est VOLONTAIREMENT pas listé ici (ni dans ADMIN_ONLY_PATHS).
  // getPermissionForPath('/portails') renvoie donc `null` → le Layout laisse rendre, et
  // l'accès (admin/manager) est filtré par `PropulspaceAdminGuard` côté module (vérif Supabase).
  // Choix délibéré pour éviter une colonne de permission dédiée en base. Ne pas « corriger »
  // en ajoutant /portails ici, et ne pas retirer la garde du module en croyant à un doublon.
]

/**
 * Routes accessibles uniquement aux utilisateurs avec role='admin'.
 * Vérification appliquée AVANT le check de permissions booléennes :
 * un non-admin qui force l'URL est redirigé même s'il a can_view_dashboard.
 */
export const ADMIN_ONLY_PATHS: string[] = [
  routes.agencyVault,
]

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export function getPermissionForPath(pathname: string): string | null {
  const match = routePermissions
    .slice()
    .sort((a, b) => b.path.length - a.path.length)
    .find(r => pathname === r.path || pathname.startsWith(r.path + '/'))
  return match?.permission ?? null
}
