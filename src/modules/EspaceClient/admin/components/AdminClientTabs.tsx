import { NavLink, useParams } from 'react-router-dom';
import { LayoutGrid, FileText, PenLine, FolderClosed, Clock3, type LucideIcon } from 'lucide-react';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';

const TABS: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: '', label: 'Aperçu', icon: LayoutGrid },
  { key: 'factures', label: 'Factures', icon: FileText },
  { key: 'signatures', label: 'Signatures', icon: PenLine },
  { key: 'documents', label: 'Documents', icon: FolderClosed },
  { key: 'activite', label: 'Activité', icon: Clock3 },
];

// Barre d'onglets du panneau client (DA Atelier) : pills à icônes, violet sur
// l'onglet actif. Routing conservé (NavLink).
export function AdminClientTabs() {
  const { projectId } = useParams<{ projectId: string }>();
  const { basePath } = useAdminBasePath();
  if (!projectId) return null;
  const base = `${basePath}/clients/${projectId}`;
  return (
    <nav className="rounded-xl border border-border bg-surface-2 p-2 shadow-glow-sm">
      <ul className="flex flex-wrap gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <li key={key}>
            <NavLink
              end={key === ''}
              to={key ? `${base}/${key}` : base}
              className={({ isActive }) =>
                isActive
                  ? 'inline-flex items-center gap-2 rounded-lg bg-primary/15 px-3.5 py-2 text-sm font-semibold text-primary ring-1 ring-primary/30'
                  : 'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground'
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
