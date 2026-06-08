import { NavLink, useParams } from 'react-router-dom';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';

const TABS = [
  { key: '', label: 'Aperçu' },
  { key: 'factures', label: 'Factures' },
  { key: 'signatures', label: 'Signatures' },
  { key: 'documents', label: 'Documents' },
  { key: 'activite', label: 'Activité' },
];

export function AdminClientTabs() {
  const { projectId } = useParams();
  const { basePath } = useAdminBasePath();
  const base = `${basePath}/clients/${projectId}`;
  return (
    <nav className="flex gap-1 border-b border-border">
      {TABS.map(t => (
        <NavLink
          key={t.key} end={t.key === ''} to={t.key ? `${base}/${t.key}` : base}
          className={({ isActive }) =>
            `px-3 py-2 text-sm border-b-2 -mb-px transition ${isActive ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground/80'}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
