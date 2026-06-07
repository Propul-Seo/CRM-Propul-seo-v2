import { AdminRoutesShell } from './AdminRoutesShell';

// Module monté dans le shell CRM sous /portails/* (cf. Layout). Réutilise les
// pages admin Propul'Space, en thème CRM-dark, sans toucher au <html>.
export function PortailsModule() {
  return <AdminRoutesShell basePath="/portails" mountedInShell />;
}
