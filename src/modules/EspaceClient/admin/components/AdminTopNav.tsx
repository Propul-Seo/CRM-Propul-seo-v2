import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/admin/propulspace/clients', label: 'Clients' },
  { to: '/admin/propulspace/leads', label: 'Leads' },
];

export function AdminTopNav() {
  return (
    <nav className="mx-auto max-w-4xl px-4 pt-6 flex gap-2">
      {LINKS.map(l => (
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
