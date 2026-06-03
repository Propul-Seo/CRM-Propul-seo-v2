import { NavLink, useParams } from 'react-router-dom';

const TABS = [
  { key: '', label: 'Aperçu' },
  { key: 'factures', label: 'Factures' },
  { key: 'signatures', label: 'Signatures' },
  { key: 'documents', label: 'Documents' },
  { key: 'jalons', label: 'Jalons' },
  { key: 'activite', label: 'Activité' },
];

export function AdminClientTabs() {
  const { projectId } = useParams();
  const base = `/admin/propulspace/clients/${projectId}`;
  return (
    <nav className="flex gap-1 border-b border-gray-200">
      {TABS.map(t => (
        <NavLink
          key={t.key} end={t.key === ''} to={t.key ? `${base}/${t.key}` : base}
          className={({ isActive }) =>
            `px-3 py-2 text-sm border-b-2 -mb-px transition ${isActive ? 'border-violet-600 text-violet-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
