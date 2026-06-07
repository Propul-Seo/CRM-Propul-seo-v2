import { NavLink } from 'react-router-dom';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';

export function AdminTopNav() {
  const { basePath, mountedInShell } = useAdminBasePath();
  if (mountedInShell) return null; // la sidebar CRM remplace cette barre

  const links = [
    { to: `${basePath}/clients`, label: 'Clients' },
    { to: `${basePath}/leads`, label: 'Leads' },
  ];

  return (
    <nav className="mx-auto max-w-4xl px-4 pt-6 flex gap-2">
      {links.map(l => (
        <NavLink
          key={l.to} to={l.to}
          className={({ isActive }) =>
            `rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground/80'}`}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
