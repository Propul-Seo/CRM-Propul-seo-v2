/**
 * Source unique de vérité pour les permissions de modules.
 * Utilisé par Settings (admin) et peut être référencé par Sidebar/Layout.
 *
 * Pour ajouter un nouveau module :
 * 1. Ajouter une entrée ici
 * 2. Ajouter la colonne `can_<key>` dans la table `users` (migration)
 * 3. Ajouter le champ dans l'interface User (useUsers.ts)
 * 4. Ajouter l'entrée dans la Sidebar (navigationItems)
 * 5. Ajouter l'entrée dans Layout (modulePermissions map)
 */

export interface ModulePermission {
  /** Clé de permission sans préfixe, ex: 'view_dashboard' → colonne DB 'can_view_dashboard' */
  key: string;
  /** Label affiché dans l'interface admin */
  label: string;
}

/** Permissions de pages (accès aux modules) */
export const PAGE_PERMISSIONS: ModulePermission[] = [
  { key: 'view_dashboard', label: 'Tableau de bord' },
  { key: 'view_leads', label: 'CRM Principal' },
  { key: 'view_crm_bot_one', label: 'CRM - Bot One' },
  { key: 'view_crm_erp', label: 'CRM - ERP' },
  { key: 'view_projects', label: 'Projets' },
  { key: 'view_communication', label: 'Communication' },
  { key: 'view_finance', label: 'Finance' },
  { key: 'view_settings', label: 'Réglages' },
];

/** Permissions d'actions */
export const ACTION_PERMISSIONS: ModulePermission[] = [
  { key: 'edit_leads', label: 'Actions sur leads' },
];

/** Toutes les permissions combinées */
export const ALL_PERMISSIONS: ModulePermission[] = [
  ...PAGE_PERMISSIONS,
  ...ACTION_PERMISSIONS,
];
