import { useMemo } from 'react';
import { FileText, PenLine, Receipt } from 'lucide-react';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import {
  usePortalProjectSteps, usePortalInvoices, usePortalSignatures, usePortalDocuments,
} from '@/modules/EspaceClient/client/hooks/usePortalData';
import { usePortalProjectDetails } from '@/modules/EspaceClient/client/hooks/usePortalProjectDetails';
import { WelcomeBanner } from '@/modules/EspaceClient/client/welcome/WelcomeBanner';
import { HeaderPanel } from './dashboard-sections/HeaderPanel';
import { ActionBanner, SecondaryActions } from './dashboard-sections/ActionBanner';
import { StepsPanel } from './dashboard-sections/StepsPanel';
import { ActivityPanel } from './dashboard-sections/ActivityPanel';
import { DashboardSkeleton } from './dashboard-sections/DashboardSkeleton';
import {
  EUR, formatShortDate, formatLongDate, prestaLabelOf,
  type DashboardAction, type DashboardActivityItem,
} from './dashboard-sections/lib';

const UNPAID_STATUSES = new Set(['overdue', 'sent', 'partially_paid']);

// Accueil portail — composition « Matière & panneaux » (variante B) :
// panneau d'en-tête porteur, bandeau d'action attendue, avancement + activité
// en colonne principale, rail latéral sticky.
export function DashboardPage() {
  const { email, project, previewMode, basePath } = usePortal();
  const firstName = project.client_name?.split(' ')[0] ?? email.split('@')[0] ?? 'Client';

  const steps      = usePortalProjectSteps();
  const invoices   = usePortalInvoices();
  const signatures = usePortalSignatures();
  const documents  = usePortalDocuments();
  const { details, loading: detailsLoading } = usePortalProjectDetails();

  const loading =
    steps.loading || invoices.loading || signatures.loading || documents.loading || detailsLoading;

  // ── KPIs dérivés ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = steps.rows.length || 1;
    const done = steps.rows.filter(s => s.status === 'completed').length;
    const progressPct = Math.round((done / total) * 100);
    const inProgress = steps.rows.find(s => s.status === 'in_progress') ?? null;
    const nextStep = inProgress ?? steps.rows.find(s => s.status === 'upcoming') ?? null;
    const startDate = steps.rows.find(s => s.date_start)?.date_start ?? null;

    const due = invoices.rows.filter(i => UNPAID_STATUSES.has(i.status));
    const dueTotal = due.reduce((sum, i) => sum + Number(i.amount_total ?? 0), 0);
    const pendingSignatures = signatures.rows.filter(s => s.status === 'pending').length;
    const lastDoc = documents.rows[0] ?? null;

    return { progressPct, inProgress, nextStep, startDate, dueCount: due.length, dueTotal, pendingSignatures, lastDoc };
  }, [steps.rows, invoices.rows, signatures.rows, documents.rows]);

  // ── Actions actionnables, triées par urgence (logique préservée) ─
  const { priority, secondary } = useMemo(() => {
    const list: DashboardAction[] = [];

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
        to: `${basePath}/invoices`,
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
        to: `${basePath}/signatures`,
      }));

    list.sort((a, b) => a.rank - b.rank);
    return { priority: list[0] ?? null, secondary: list.slice(1, 4) };
  }, [invoices.rows, signatures.rows, basePath]);

  // ── Activité récente : fusion docs + factures + signatures ──────
  const activity = useMemo(() => {
    const items: DashboardActivityItem[] = [];
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

  // ── Lignes du panneau d'en-tête ──────────────────────────────────
  const tail = stats.progressPct >= 100
    ? 'votre projet est finalisé.'
    : stats.inProgress
      ? `${stats.inProgress.label.toLowerCase()} en cours.`
      : stats.nextStep
        ? 'la prochaine étape vous attend.'
        : 'tout avance comme prévu.';

  const projectLine = [project.name ?? 'Votre projet', prestaLabelOf(details?.presta_type)]
    .filter(Boolean).join(' · ');

  const startDate = details?.start_date ?? stats.startDate;
  const endDate = details?.end_date ?? null;
  const scheduleLine = [
    startDate ? `Démarré le ${formatLongDate(startDate)}` : null,
    endDate ? `livraison estimée le ${formatLongDate(endDate)}` : null,
  ].filter(Boolean).join(' · ') || null;

  return (
    <div className="ps-fade-in space-y-5">
      {!previewMode && <WelcomeBanner />}

      {/* Panneau d'en-tête collant au scroll sur desktop (demande client). */}
      <div className="lg:sticky lg:top-0 lg:z-20">
        <HeaderPanel
          firstName={firstName}
          progressPct={stats.progressPct}
          tail={tail}
          projectLine={projectLine}
          scheduleLine={scheduleLine}
          referentName={details?.assigned_name ?? null}
          dueTotal={stats.dueTotal}
          dueCount={stats.dueCount}
          documentsCount={documents.rows.length}
          lastDocLine={stats.lastDoc
            ? `Dernier : ${stats.lastDoc.name} · ${formatShortDate(stats.lastDoc.created_at)}`
            : null}
          pendingSignatures={stats.pendingSignatures}
        />
      </div>

      {priority && <ActionBanner action={priority} />}
      {secondary.length > 0 && <SecondaryActions actions={secondary} />}

      <StepsPanel steps={steps.rows} basePath={basePath} />
      <ActivityPanel items={activity} basePath={basePath} />
      <p className="flex items-center gap-2 px-1 text-[11px] text-[var(--ps-fg-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-success)]" />
        Synchronisé avec votre équipe Propul'SEO
      </p>
    </div>
  );
}
