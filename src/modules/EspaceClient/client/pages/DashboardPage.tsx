import { useMemo } from 'react';
import {
  TrendingUp, Clock, CheckCircle2, Receipt, PenLine, FileText, ArrowUpRight,
} from 'lucide-react';
import {
  Hero, KpiTile, SectionHead, ActivityRow, EmptyState,
} from '@/modules/EspaceClient/shared/components';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import {
  usePortalProjectSteps, usePortalInvoices, usePortalSignatures, usePortalDocuments,
} from '../hooks/usePortalData';

function formatShortDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function DashboardPage() {
  const { userRow, project } = usePortal();
  const firstName = userRow.email.split('@')[0] ?? 'Client';

  const steps      = usePortalProjectSteps();
  const invoices   = usePortalInvoices();
  const signatures = usePortalSignatures();
  const documents  = usePortalDocuments();

  // KPIs dérivés
  const stats = useMemo(() => {
    const total = steps.rows.length || 1;
    const done = steps.rows.filter(s => s.status === 'completed').length;
    const progressPct = Math.round((done / total) * 100);
    const inProgress = steps.rows.find(s => s.status === 'in_progress');
    const nextStep = inProgress ?? steps.rows.find(s => s.status === 'upcoming');
    const overdueInvoices = invoices.rows.filter(i => i.status === 'overdue').length;
    const pendingSignatures = signatures.rows.filter(s => s.status === 'pending').length;
    return { progressPct, done, total, nextStep, overdueInvoices, pendingSignatures };
  }, [steps.rows, invoices.rows, signatures.rows]);

  // Activité récente : fusion documents + factures + signatures, 5 plus récents
  const activity = useMemo(() => {
    type Row = { id: string; date: string; title: string; icon: typeof FileText; tint: 'violet' | 'green' | 'blue' | 'amber' };
    const items: Row[] = [];
    documents.rows.slice(0, 5).forEach(d => items.push({
      id: `doc-${d.id}`, date: d.created_at, title: `Document ajouté · ${d.name}`,
      icon: FileText, tint: 'violet',
    }));
    invoices.rows.slice(0, 5).forEach(i => items.push({
      id: `inv-${i.id}`, date: i.created_at, title: `Facture ${i.invoice_number} · ${i.status}`,
      icon: Receipt, tint: 'blue',
    }));
    signatures.rows.slice(0, 5).forEach(s => items.push({
      id: `sig-${s.id}`, date: s.created_at, title: `Signature · ${s.name}`,
      icon: PenLine, tint: 'amber',
    }));
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [documents.rows, invoices.rows, signatures.rows]);

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Tableau de bord"
        title={`Bon retour, ${firstName}`}
        subtitle={`Voici un aperçu de ${project.name ?? 'votre projet'} aujourd'hui.`}
        phasePill={project.status ? `Phase · ${project.status}` : undefined}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiTile
          eyebrow="Avancement"
          value={`${stats.progressPct}%`}
          delta={`${stats.done} / ${stats.total} étapes`}
          icon={TrendingUp}
          tint="violet"
        />
        <KpiTile
          eyebrow="Prochain jalon"
          value={stats.nextStep?.label ?? '—'}
          delta={stats.nextStep ? formatShortDate(stats.nextStep.date_planned_end) : 'Aucun à venir'}
          icon={Clock}
          tint="blue"
        />
        <KpiTile
          eyebrow="À traiter"
          value={String(stats.pendingSignatures + stats.overdueInvoices)}
          delta={`${stats.pendingSignatures} signature(s) · ${stats.overdueInvoices} facture(s)`}
          icon={CheckCircle2}
          tint={stats.overdueInvoices > 0 ? 'red' : 'green'}
        />
      </section>

      <section className="ps-surface overflow-hidden">
        <SectionHead
          title="Activité récente"
          action={
            <a href="/espace-client/project" className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ps-primary-text)] hover:underline">
              Voir le projet
              <ArrowUpRight className="h-3 w-3" />
            </a>
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
    </div>
  );
}
