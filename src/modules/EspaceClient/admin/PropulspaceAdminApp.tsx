import { AdminRoutesShell } from './AdminRoutesShell';

// Point d'entrée historique : /admin/propulspace/* (App.tsx). Conservé intact
// pendant la transition (liens d'invitation, favoris). Thème clair, hors shell.
export function PropulspaceAdminApp() {
  return <AdminRoutesShell basePath="/admin/propulspace" mountedInShell={false} />;
}
