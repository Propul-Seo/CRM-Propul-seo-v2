import { Mail, LayoutGrid, FileText, PenLine, FolderClosed, Clock3, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Badge } from '@/modules/EspaceClient/shared/components';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import type { AdminClientHealth } from '../../hooks/useAdminClients';
import { deriveClientStatus, clientInitials, clientAvatarTone, formatLastActivity } from './clientStatus';

const TABS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: '', label: 'Aperçu', icon: LayoutGrid },
  { key: 'factures', label: 'Factures', icon: FileText },
  { key: 'signatures', label: 'Signatures', icon: PenLine },
  { key: 'documents', label: 'Documents', icon: FolderClosed },
  { key: 'activite', label: 'Activité', icon: Clock3 },
];

type KpiKind = 'neutral' | 'rose' | 'amber';
function Kpi({ short, value, kind }: { short: string; value: string; kind: KpiKind }) {
  const chip = kind === 'rose'
    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
    : kind === 'amber'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      : 'border-border bg-surface-2 text-muted-foreground';
  const val = kind === 'rose' ? 'text-rose-300' : kind === 'amber' ? 'text-amber-300' : 'text-foreground';
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${chip}`}>
      {short}
      <span className={`font-semibold tabular-nums ${val}`}>{value}</span>
    </span>
  );
}

// En-tête unifié et collant du client (DA Atelier · variante V5) : identité (étage 1),
// puis onglets routés + KPI (étage 2). Reste collé en haut quand on scrolle le panneau.
export function CockpitClientHeader({ client }: { client: AdminClientHealth | null }) {
  const { basePath } = useAdminBasePath();
  if (!client) return null;
  const s = deriveClientStatus(client);
  const title = client.client_company ?? client.project_name;
  const overdue = client.invoices_overdue;
  const signatures = client.signatures_pending;
  const base = `${basePath}/clients/${client.project_id}`;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface-1/95 backdrop-blur">
      {/* Étage 1 — identité */}
      <div className="flex items-center gap-3 px-4 pb-2.5 pt-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-semibold ${clientAvatarTone(client.project_id)}`}>
          {clientInitials(client)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold leading-tight text-foreground">{title}</h1>
            <Badge tone={s.tone}>{s.label}</Badge>
          </div>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <span className="truncate">{client.project_name}</span>
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{client.portal_client_email ?? '—'}</span>
          </p>
        </div>
      </div>

      {/* Étage 2 — onglets routés + KPI */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-2">
        <nav className="flex flex-wrap gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <NavLink
              key={key}
              end={key === ''}
              to={key ? `${base}/${key}` : base}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'}`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-1.5">
          <Kpi short="Impayés" value={String(overdue)} kind={overdue > 0 ? 'rose' : 'neutral'} />
          <Kpi short="Signat." value={String(signatures)} kind={signatures > 0 ? 'amber' : 'neutral'} />
          <Kpi short="Docs" value={String(client.documents_count)} kind="neutral" />
          <Kpi short="Vu" value={formatLastActivity(client.last_client_login_at)} kind="neutral" />
        </div>
      </div>
    </header>
  );
}
