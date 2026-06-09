import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, Receipt, PenLine, FileText, ArrowUpRight, CheckCircle2, ArrowRight,
} from 'lucide-react';
import {
  SectionHead, ActivityRow, EmptyState, ProgressRing, Badge, StatusBadge, Skeleton,
} from '@/modules/EspaceClient/shared/components';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import {
  usePortalProjectSteps, usePortalInvoices, usePortalSignatures, usePortalDocuments,
} from '../hooks/usePortalData';
import { WelcomeBanner } from '../welcome/WelcomeBanner';

function formatShortDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});

const INVOICES_PATH = '/espace-client/invoices';
const SIGNATURES_PATH = '/espace-client/signatures';
const PROJECT_PATH = '/espace-client/project';

const UNPAID_STATUSES = new Set(['overdue', 'sent', 'partially_paid']);

export function DashboardPage() {
  const { email, project, previewMode } = usePortal();
  const firstName = project.client_name?.split(' ')[0] ?? email.split('@')[0] ?? 'Client';

  const steps      = usePortalProjectSteps();
  const invoices   = usePortalInvoices();
  const signatures = usePortalSignatures();
  const documents  = usePortalDocuments();

  const loading =
    steps.loading || invoices.loading || signatures.loading || documents.loading;

  // ── KPIs dérivés ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = steps.rows.length || 1;
    const done = steps.rows.filter(s => s.status === 'completed').length;
    const progressPct = Math.round((done / total) * 100);
    const inProgress = steps.rows.find(s => s.status === 'in_progress');
    const nextStep = inProgress ?? steps.rows.find(s => s.status === 'upcoming');
    const startDate = steps.rows.find(s => s.date_start)?.date_start ?? null;

    const totalDue = invoices.rows
      .filter(i => UNPAID_STATUSES.has(i.status))
      .reduce((sum, i) => sum + Number(i.amount_total ?? 0), 0);

    const lastDoc = documents.rows[0] ?? null;
    return { progressPct, done, total, nextStep, startDate, totalDue, lastDoc };
  }, [steps.rows, invoices.rows, documents.rows]);

  // ── Actions actionnables, triées par urgence ───────────────────
  const { priority, secondary } = useMemo(() => {
    type Action = {
      key: string; kind: 'invoice' | 'signature'; rank: number;
      label: string; title: string; meta: string; cta: string; to: string;
    };
    const list: Action[] = [];

    invoices.rows
      .filter(i => UNPAID_STATUSES.has(i.status))
      .forEach(i => list.push({
        key: `inv-${i.id}`,
        kind: 'invoice',
        rank: i.status === 'overdue' ? 0 : 2,
        label: 'Facture à régler',
        title: `Facture ${i.invoice_number ?? i.title ?? ''} · ${EUR.format(Number(i.amount_total ?? 0))}`.trim(),
        meta: i.status === 'overdue'
          ? `En retard · échéance ${formatShortDate(i.due_date)}`
          : `Échéance le ${formatShortDate(i.due_date)}`,
        cta: 'Payer',
        to: INVOICES_PATH,
      }));

    signatures.rows
      .filter(s => s.status === 'pending')
      .forEach(s => list.push({
        key: `sig-${s.id}`,
        kind: 'signature',
        rank: 1,
        label: 'Document à signer',
        title: s.name,
        meta: 'En attente de votre signature',
        cta: 'Signer',
        to: SIGNATURES_PATH,
      }));

    list.sort((a, b) => a.rank - b.rank);
    return { priority: list[0] ?? null, secondary: list.slice(1, 4) };
  }, [invoices.rows, signatures.rows]);

  // ── Activité récente : fusion docs + factures + signatures ──────
  const activity = useMemo(() => {
    type Row = { id: string; date: string; title: string; icon: typeof FileText; tint: 'violet' | 'green' | 'blue' | 'amber' };
    const items: Row[] = [];
    documents.rows.slice(0, 5).forEach(d => items.push({
      id: `doc-${d.id}`, date: d.created_at, title: `Document ajouté · ${d.name}`,
      icon: FileText, tint: 'violet',
    }));
    invoices.rows.slice(0, 5).forEach(i => items.push({
      id: `inv-${i.id}`, date: i.created_at,
      title: `Facture ${i.invoice_number ?? i.title ?? ''}`.trim(),
      icon: Receipt, tint: 'blue',
    }));
    signatures.rows.slice(0, 5).forEach(s => items.push({
      id: `sig-${s.id}`, date: s.created_at, title: `Signature · ${s.name}`,
      icon: PenLine, tint: 'amber',
    }));
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [documents.rows, invoices.rows, signatures.rows]);

  if (loading) return <DashboardSkeleton />;

  const headlineTail = stats.progressPct >= 100
    ? 'votre projet est finalisé.'
    : stats.nextStep
      ? 'la prochaine étape vous attend.'
      : 'tout avance comme prévu.';

  return (
    <div className="ps-fade-in space-y-6">
      {!previewMode && <WelcomeBanner />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ── Colonne principale ─────────────────────────────── */}
        <div className="space-y-5">
          {/* Hero + action prioritaire intégrée */}
          <section className="ps-surface relative overflow-hidden">
            <div
              aria-hidden
              className="ps-hero-glow pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full opacity-70 blur-3xl"
            />
            <div className="flex items-start justify-between gap-6 p-7 md:p-9">
              <div className="min-w-0 max-w-md">
                <p className="ps-eyebrow">Bonjour, {firstName}</p>
                <h1 className="ps-h1 mt-2 text-[24px] leading-tight md:text-[28px]">
                  Votre projet est à{' '}
                  <span className="ps-num text-[var(--ps-primary)]">{stats.progressPct} %</span>
                  {' — '}{headlineTail}
                </h1>
                <p className="ps-small mt-3">
                  {project.name ?? 'Votre projet'}
                  {stats.startDate && (
                    <> · démarré le {new Date(stats.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</>
                  )}
                </p>
              </div>
              <div className="hidden sm:block">
                <ProgressRing value={stats.progressPct} size={116} />
              </div>
            </div>

            {priority && (
              <Link
                to={priority.to}
                className="ps-tap group flex items-center gap-5 bg-[var(--ps-primary)] px-7 py-5 text-white transition-colors hover:bg-[var(--ps-primary-hover)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  {priority.kind === 'invoice'
                    ? <Receipt className="h-5 w-5" strokeWidth={2} />
                    : <PenLine className="h-5 w-5" strokeWidth={2} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/60">
                    Action prioritaire
                  </span>
                  <span className="mt-0.5 block truncate text-[16px] font-bold tracking-tight" style={{ fontFamily: 'var(--ps-font-display)' }}>
                    {priority.title}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-white/70">{priority.meta}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-[var(--ps-primary-text)]">
                  {priority.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </span>
              </Link>
            )}
          </section>

          {/* Actions secondaires */}
          {secondary.length > 0 && (
            <section className="space-y-3">
              <h2 className="ps-h3 flex items-center gap-2">
                {secondary.length > 1 ? 'Autres actions en attente' : 'Autre action en attente'}
                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--ps-primary)] px-1 text-[11px] font-bold text-white">
                  {secondary.length}
                </span>
              </h2>
              {secondary.map(a => (
                <Link
                  key={a.key}
                  to={a.to}
                  className="ps-surface ps-surface-hover ps-tap flex items-center gap-4 px-5 py-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]">
                    {a.kind === 'invoice'
                      ? <Receipt className="h-[18px] w-[18px]" strokeWidth={2} />
                      : <PenLine className="h-[18px] w-[18px]" strokeWidth={2} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-[var(--ps-fg)]">{a.title}</span>
                    <span className="block text-[12px] text-[var(--ps-fg-muted)]">{a.meta}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--ps-primary)] px-3.5 py-1.5 text-[12px] font-semibold text-white">
                    {a.cta}
                  </span>
                </Link>
              ))}
            </section>
          )}

          {/* Activité récente */}
          <section className="ps-surface overflow-hidden">
            <SectionHead
              title="Activité récente"
              action={
                <Link to={PROJECT_PATH} className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ps-primary-text)] hover:underline">
                  Voir le projet
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
            {activity.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={CheckCircle2}
                  title="Tout est calme"
                  body="Aucune activité récente. Les nouveautés apparaîtront ici."
                />
              </div>
            ) : (
              <ul className="divide-y divide-[var(--ps-border-soft)]">
                {activity.map(item => (
                  <li key={item.id}>
                    <ActivityRow icon={item.icon} tint={item.tint} title={item.title} meta={formatShortDate(item.date)} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="flex items-center gap-2 px-1 text-[11px] text-[var(--ps-fg-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-success)]" />
            Synchronisé avec votre équipe Propul'SEO
          </p>
        </div>

        {/* ── Colonne latérale KPI (sans « avancement global ») ── */}
        <aside className="space-y-3.5">
          <SideKpi
            label="Prochaine échéance"
            value={stats.nextStep ? (formatShortDate(stats.nextStep.date_planned_end) || '—') : '—'}
            sub={stats.nextStep?.label ?? 'Aucune à venir'}
            icon={Clock}
          />
          <SideKpi
            label="Montant dû"
            value={stats.totalDue > 0 ? EUR.format(stats.totalDue) : '0 €'}
            badge={stats.totalDue > 0
              ? <Badge tone="amber">À régler</Badge>
              : <Badge tone="green">À jour</Badge>}
            accent
          />
          <SideKpi
            label="Dernier livrable"
            value={stats.lastDoc?.name ?? '—'}
            valueSmall
            sub={stats.lastDoc ? `Ajouté le ${formatShortDate(stats.lastDoc.created_at)}` : 'Aucun pour l’instant'}
          />

          {/* Mini jalons */}
          <div className="ps-surface p-5">
            <p className="ps-eyebrow ps-eyebrow-muted">Jalons</p>
            {steps.rows.length === 0 ? (
              <p className="mt-2 text-[12px] text-[var(--ps-fg-muted)]">Aucun jalon défini.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {steps.rows.slice(0, 5).map(s => (
                  <li key={s.id} className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${
                      s.status === 'completed' ? 'bg-[var(--ps-success)]'
                        : s.status === 'in_progress' ? 'bg-[var(--ps-primary)]'
                        : 'bg-[var(--ps-border)]'
                    }`} />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--ps-fg)]">{s.label}</span>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
            <Link to={PROJECT_PATH} className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ps-primary-text)] hover:underline">
              Voir la frise complète
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Carte KPI latérale ────────────────────────────────────────────
interface SideKpiProps {
  label: string;
  value: string;
  sub?: string;
  badge?: ReactNode;
  icon?: typeof Clock;
  accent?: boolean;
  valueSmall?: boolean;
}

function SideKpi({ label, value, sub, badge, accent, valueSmall }: SideKpiProps) {
  return (
    <div className={`ps-surface p-5 ${accent ? 'border-l-[3px] border-l-[var(--ps-primary)]' : ''}`}>
      <p className="ps-eyebrow ps-eyebrow-muted">{label}</p>
      <p className={`ps-num mt-1.5 font-bold tracking-tight text-[var(--ps-fg)] ${valueSmall ? 'truncate text-[16px]' : 'ps-metric'}`}
         style={valueSmall ? { fontFamily: 'var(--ps-font-display)' } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[11.5px] text-[var(--ps-fg-muted)]">{sub}</p>}
      {badge && <div className="mt-2">{badge}</div>}
    </div>
  );
}

// ── Skeleton de chargement ────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <div className="ps-surface p-8">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="mt-3 h-7 w-3/4 rounded-md" />
          <Skeleton className="mt-2 h-7 w-1/2 rounded-md" />
          <Skeleton className="mt-4 h-4 w-40 rounded-md" />
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
      <div className="space-y-3.5">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    </div>
  );
}
