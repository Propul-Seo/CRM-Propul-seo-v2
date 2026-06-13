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

// Barre d'onglets du panneau client (mode pleine page, hors cockpit) :
// onglets soulignés, actif net (border-b-2 violet), hover doux.
// Routing conservé (NavLink).
export function AdminClientTabs() {
  const { projectId } = useParams<{ projectId: string }>();
  const { basePath } = useAdminBasePath();
  if (!projectId) return null;
  const base = `${basePath}/clients/${projectId}`;
  return (
    <nav className="border-b border-border">
      <ul className="-mb-px flex flex-wrap gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <li key={key}>
            <NavLink
              end={key === ''}
              to={key ? `${base}/${key}` : base}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1.5 text-sm transition-colors ${
                  isActive
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent font-medium text-muted-foreground hover:border-border hover:text-foreground'
                }`
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
