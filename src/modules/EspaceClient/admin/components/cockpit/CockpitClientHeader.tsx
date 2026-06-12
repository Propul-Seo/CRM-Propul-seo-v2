import { Mail, LayoutGrid, FileText, PenLine, FolderClosed, Clock3, Eye, type LucideIcon } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/modules/EspaceClient/shared/components';
import { useAdminBasePath } from '@/modules/EspaceClient/admin/AdminBasePathContext';
import type { AdminClientHealth } from '../../hooks/useAdminClients';
import { deriveClientStatus, clientInitials, clientAvatarTone, formatLastActivity } from './clientStatus';
import { PortalAccessControl } from './PortalAccessControl';

const TABS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: '', label: 'Aperçu', icon: LayoutGrid },
  { key: 'factures', label: 'Factures', icon: FileText },
  { key: 'signatures', label: 'Signatures', icon: PenLine },
  { key: 'documents', label: 'Documents', icon: FolderClosed },
  { key: 'activite', label: 'Activité', icon: Clock3 },
];

type KpiKind = 'neutral' | 'rose' | 'amber';
// Cellule KPI compacte (strip segmenté) : libellé en eyebrow, valeur en
// Space Grotesk tabular-nums. Les états d'alerte ne colorent que la valeur.
function Kpi({ short, value, kind }: { short: string; value: string; kind: KpiKind }) {
  const val = kind === 'rose' ? 'text-rose-300' : kind === 'amber' ? 'text-amber-300' : 'text-foreground';
  return (
    <div className="flex min-w-[64px] flex-col items-center justify-center gap-0.5 px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{short}</span>
      <span className={`ps-num whitespace-nowrap font-[family-name:var(--ps-font-display)] text-[13.5px] font-semibold leading-none ${val}`}>
        {value}
      </span>
    </div>
  );
}

// En-tête unifié et collant du client (inspiré fiche projet V3 du CRM) :
// identité en grand + statut + KPI strip + action rapide (étage 1), puis
// onglets routés soulignés (étage 2). Reste collé en haut au scroll du panneau.
export function CockpitClientHeader({ client }: { client: AdminClientHealth | null }) {
  const { basePath } = useAdminBasePath();
  if (!client) return null;
  const s = deriveClientStatus(client);
  const title = client.client_company ?? client.project_name;
  const overdue = client.invoices_overdue;
  const signatures = client.signatures_pending;
  const base = `${basePath}/clients/${client.project_id}`;
  const email = client.portal_client_email;
  const copyEmail = () => {
    if (!email) return;
    void navigator.clipboard.writeText(email);
    toast.success('Email copié', { description: email });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface-1">
      {/* Étage 1 — identité (gauche) + KPI strip + action rapide (droite) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-4 pb-2.5 pt-3.5">
        <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-semibold ${clientAvatarTone(client.project_id)}`}>
            {clientInitials(client)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h1 className="truncate font-[family-name:var(--ps-font-display)] text-xl font-semibold leading-tight tracking-tight text-foreground">
                {title}
              </h1>
              <Badge tone={s.tone}>{s.label}</Badge>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
              <span className="truncate">{client.project_name}</span>
              {email ? (
                <button
                  type="button"
                  onClick={copyEmail}
                  title="Copier l'email"
                  className="inline-flex min-w-0 items-center gap-1 truncate rounded transition-colors hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{email}</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 shrink-0" />—
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex divide-x divide-border overflow-hidden rounded-lg border border-border bg-surface-2">
            <Kpi short="Impayés" value={String(overdue)} kind={overdue > 0 ? 'rose' : 'neutral'} />
            <Kpi short="Signat." value={String(signatures)} kind={signatures > 0 ? 'amber' : 'neutral'} />
            <Kpi short="Docs" value={String(client.documents_count)} kind="neutral" />
            <Kpi short="Vu" value={formatLastActivity(client.last_client_login_at)} kind="neutral" />
          </div>
          <PortalAccessControl
            projectId={client.project_id}
            projectName={client.project_name}
            portalClientEmail={client.portal_client_email ?? null}
          />
          <Link
            to={`${base}/apercu-client`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-surface-3"
          >
            <Eye className="h-3.5 w-3.5 text-primary" /> Voir comme le client
          </Link>
        </div>
      </div>

      {/* Étage 2 — onglets routés soulignés (l'actif s'aligne sur le border-b du header) */}
      <nav className="flex gap-1 overflow-x-auto px-3">
        {TABS.map(({ key, label, icon: Icon }) => (
          <NavLink
            key={key}
            end={key === ''}
            to={key ? `${base}/${key}` : base}
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 pb-2 pt-1 text-[13px] font-medium transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`
            }
          >
            <Icon className="h-4 w-4" /> {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
