import { FolderKanban, Loader2 } from 'lucide-react';
import { Hero, TimelineStep, EmptyState } from '@/modules/EspaceClient/shared/components';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import { usePortalProjectSteps } from '../hooks/usePortalData';
import type { ProjectStepStatus } from '@/modules/EspaceClient/shared/types/portal.types';

function formatLong(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ProjectPage() {
  const { project } = usePortal();
  const { rows, loading, error } = usePortalProjectSteps();

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Projet"
        title={project.name ?? 'Mon projet'}
        subtitle="Les étapes de votre projet et l'avancement temps réel."
      />

      <section className="ps-surface p-6 md:p-8">
        {loading && (
          <div className="flex items-center justify-center py-8 text-[var(--ps-fg-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}
        {!loading && !error && rows.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="Pas encore d'étapes"
            body="Votre roadmap projet sera publiée ici dès que l'équipe l'aura validée."
          />
        )}
        {!loading && rows.length > 0 && (
          <ol className="space-y-0">
            {rows.map((s, i) => (
              <TimelineStep
                key={s.id}
                status={s.status as ProjectStepStatus}
                label={s.label}
                startedAt={formatLong(s.date_start)}
                completedAt={formatLong(s.date_actual_end)}
                isLast={i === rows.length - 1}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
