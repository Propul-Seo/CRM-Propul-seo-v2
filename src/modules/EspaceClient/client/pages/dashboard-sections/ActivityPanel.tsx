import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { ActivityRow, EmptyState, SectionHead } from '@/modules/EspaceClient/shared/components';
import { formatShortDate, type DashboardActivityItem } from './lib';

// Fil d'activité récente (fusion documents + factures + signatures),
// repris tel quel de la page d'origine — rien ne disparaît.

interface ActivityPanelProps {
  items: DashboardActivityItem[];
  basePath: string;
}

export function ActivityPanel({ items, basePath }: ActivityPanelProps) {
  return (
    <section className="ps-surface overflow-hidden">
      <SectionHead
        title="Activité récente"
        action={
          <Link
            to={`${basePath}/project`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ps-primary-text)] hover:underline"
          >
            Voir le projet
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      />
      {items.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={CheckCircle2}
            title="Tout est calme"
            body="Aucune activité récente. Les nouveautés apparaîtront ici."
          />
        </div>
      ) : (
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          {items.map(item => (
            <li key={item.id}>
              <ActivityRow icon={item.icon} tint={item.tint} title={item.title} meta={formatShortDate(item.date)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
