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
            `rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-gray-800'}`}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
