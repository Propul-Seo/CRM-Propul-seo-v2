import { NavLink } from 'react-router-dom';
import { Rocket, Users, Inbox, Settings } from 'lucide-react';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';

// Barre supérieure du back-office hors shell CRM : marque + fil d'Ariane de
// section (Clients = cockpit, Leads). Hauteur fixe 3.5rem — AdminCockpitPage
// calcule sa hauteur avec `calc(100vh - 3.5rem)`, ne pas la changer.
export function AdminTopNav() {
  const { basePath, mountedInShell } = useAdminBasePath();
  if (mountedInShell) return null; // la sidebar CRM remplace cette barre

  const links = [
    { to: `${basePath}/clients`, label: 'Clients', icon: Users },
    { to: `${basePath}/leads`, label: 'Leads', icon: Inbox },
    { to: `${basePath}/settings`, label: 'Réglages', icon: Settings },
  ];

  return (
    <nav className="flex h-14 items-center gap-3 border-b border-border bg-surface-1 px-4">
      <span className="inline-flex shrink-0 items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Rocket className="h-4 w-4" />
        </span>
        <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline">
          Propul'Space · Admin
        </span>
      </span>
      <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
      <div className="flex items-center gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" /> {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
