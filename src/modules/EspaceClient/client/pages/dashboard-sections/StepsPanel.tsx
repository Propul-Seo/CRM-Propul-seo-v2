import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderKanban } from 'lucide-react';
import { EmptyState, StatusBadge } from '@/modules/EspaceClient/shared/components';
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData';
import { formatLongDate } from './lib';

// Panneau principal « Avancement du projet » : liste complète des jalons
// visibles client (dot statut + libellé + date + badge FR).

interface StepsPanelProps {
  steps: PortalProjectStep[];
  basePath: string;
}

export function StepsPanel({ steps, basePath }: StepsPanelProps) {
  const done = steps.filter(s => s.status === 'completed').length;

  return (
    <section className="ps-surface overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 border-b border-[var(--ps-border-soft)] px-6 py-4">
        <h2 className="ps-h2">Avancement du projet</h2>
        {steps.length > 0 && (
          <p className="ps-small ps-num text-[var(--ps-fg-secondary)]">
            {done} sur {steps.length} jalon{steps.length > 1 ? 's' : ''} terminé{done > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {steps.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={FolderKanban}
            title="Aucun jalon défini"
            body="Votre roadmap projet apparaîtra ici dès que l'équipe l'aura publiée."
          />
        </div>
      ) : (
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          {steps.map(step => <StepRow key={step.id} step={step} />)}
        </ul>
      )}

      <div className="border-t border-[var(--ps-border-soft)] px-6 py-3.5">
        <Link
          to={`${basePath}/project`}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ps-primary-text)] hover:underline"
        >
          Voir la frise complète
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}

const DOT: Record<string, string> = {
  completed: 'bg-[var(--ps-success)]',
  in_progress: 'bg-[var(--ps-primary)]',
  blocked: 'bg-[var(--ps-danger)]',
};

function stepDateLine(step: PortalProjectStep): string | null {
  if (step.status === 'completed') {
    const d = formatLongDate(step.date_actual_end ?? step.date_planned_end);
    return d ? `Terminé le ${d}` : null;
  }
  const d = formatLongDate(step.date_planned_end);
  return d ? `Échéance le ${d}` : null;
}

function StepRow({ step }: { step: PortalProjectStep }) {
  const dateLine = stepDateLine(step);
  return (
    <li className="flex min-h-[44px] items-center gap-3.5 px-6 py-3.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[step.status] ?? 'bg-[var(--ps-border-strong)]'}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-[var(--ps-fg)]">{step.label}</span>
        {dateLine && (
          <span className="ps-small block text-[var(--ps-fg-secondary)]">{dateLine}</span>
        )}
      </span>
      <StatusBadge status={step.status} />
    </li>
  );
}
