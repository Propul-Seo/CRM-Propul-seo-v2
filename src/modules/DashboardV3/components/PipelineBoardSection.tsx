import { motion } from 'framer-motion';
import { Clock, Pause, Play, Sparkles, UsersRound, type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { itemVariants } from '../lib/animations';
import { statusToColumn, V3_COLUMN_LABELS, V3_COLUMN_ORDER, type V3Column } from '../../ProjectsV3/utils/statusMapping';
import type { ProjectV2 } from '../../../types/project-v2';
import type { SiteWebLead } from '../../LeadsV3/hooks/useLeadsV3SiteWeb';

type PipelineItem =
  | {
      id: string;
      title: string;
      meta: string;
      activityAt: string | null | undefined;
      activityLabel: string;
      kind: 'lead';
    }
  | {
      id: string;
      title: string;
      meta: string;
      progress?: number | null;
      kind: 'project';
    };

interface PipelineBoardSectionProps {
  crmOfferLeads: SiteWebLead[] | null | undefined;
  projects: ProjectV2[] | null | undefined;
  isPrivacyMode: boolean;
  isMobile: boolean;
  onNavigateToCRM: () => void;
  onNavigateToLead: (id: string) => void;
  onNavigateToProjects: () => void;
  onNavigateToProject: (id: string) => void;
}

const PROJECT_COLUMN_ICONS: Record<V3Column, LucideIcon> = {
  planification: Clock,
  en_cours: Play,
  en_pause: Pause,
  propulseo: Sparkles,
};

const PROJECT_COLUMN_STYLES: Record<V3Column, { accent: string; border: string; glow: string }> = {
  planification: {
    accent: 'text-violet-200',
    border: 'border-violet-400/20',
    glow: 'from-violet-400/12',
  },
  en_cours: {
    accent: 'text-emerald-300',
    border: 'border-emerald-400/20',
    glow: 'from-emerald-400/10',
  },
  en_pause: {
    accent: 'text-amber-300',
    border: 'border-amber-400/20',
    glow: 'from-amber-400/10',
  },
  propulseo: {
    accent: 'text-pink-300',
    border: 'border-pink-400/20',
    glow: 'from-pink-400/10',
  },
};

function toLeadItem(lead: SiteWebLead): PipelineItem {
  return {
    id: lead.id,
    title: lead.company || lead.name || 'Lead sans nom',
    meta: lead.name || lead.source || 'CRM',
    activityAt: getLeadActivityDate(lead),
    activityLabel: getLeadActivityLabel(lead),
    kind: 'lead',
  };
}

function toProjectItem(project: ProjectV2): PipelineItem {
  return {
    id: project.id,
    title: project.name,
    meta: project.client_name || V3_COLUMN_LABELS[statusToColumn(project.status)],
    progress: project.progress,
    kind: 'project',
  };
}

function getLeadActivityDate(lead: SiteWebLead) {
  return lead.last_activity_at ?? lead.next_activity_date ?? lead.updated_at ?? lead.created_at;
}

function getLeadActivityLabel(lead: SiteWebLead) {
  if (lead.last_activity_type === 'follow_up') return 'Dernière relance';
  if (lead.last_activity_at) return 'Dernière activité';
  if (lead.next_activity_date) return 'Relance prévue';
  return 'Mis à jour';
}

function getLeadActivityTimestamp(lead: SiteWebLead) {
  const timestamp = new Date(getLeadActivityDate(lead) ?? 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatActivityDate(value: string | null | undefined) {
  if (!value) return 'date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'date inconnue';

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PipelineBoardSection({
  crmOfferLeads,
  projects,
  isPrivacyMode,
  isMobile,
  onNavigateToCRM,
  onNavigateToLead,
  onNavigateToProjects,
  onNavigateToProject,
}: PipelineBoardSectionProps) {
  const leadRows = crmOfferLeads ?? [];
  const projectRows = projects ?? [];

  const latestOfferLeads = [...leadRows].sort((a, b) => getLeadActivityTimestamp(b) - getLeadActivityTimestamp(a));
  const projectsByColumn = V3_COLUMN_ORDER.reduce<Record<V3Column, ProjectV2[]>>((acc, column) => {
    acc[column] = [];
    return acc;
  }, {} as Record<V3Column, ProjectV2[]>);

  projectRows.forEach(project => {
    projectsByColumn[statusToColumn(project.status)].push(project);
  });

  const columns = [
    {
      title: 'CRM',
      subtitle: 'Offres envoyées',
      count: latestOfferLeads.length,
      icon: UsersRound,
      accent: 'text-cyan-300',
      border: 'border-cyan-400/20',
      glow: 'from-cyan-400/10',
      items: latestOfferLeads.slice(0, 3).map(toLeadItem),
      onClick: onNavigateToCRM,
    },
    ...V3_COLUMN_ORDER.map((column) => {
      const style = PROJECT_COLUMN_STYLES[column];
      const items = projectsByColumn[column];

      return {
        title: V3_COLUMN_LABELS[column],
        subtitle: 'Projets actifs',
        count: items.length,
        icon: PROJECT_COLUMN_ICONS[column],
        accent: style.accent,
        border: style.border,
        glow: style.glow,
        items: items.slice(0, 3).map(toProjectItem),
        onClick: onNavigateToProjects,
      };
    }),
  ];

  return (
    <motion.section variants={itemVariants} className="col-span-2 lg:col-span-12">
      <div className="rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,14,26,0.78),rgba(7,7,13,0.86))] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-4">
        <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-5')}>
          {columns.map(({ title, subtitle, count, icon: Icon, accent, border, glow, items, onClick }) => (
            <article
              key={title}
              className={cn(
                'relative min-h-[190px] overflow-hidden rounded-xl border bg-white/[0.025] p-3',
                border
              )}
            >
              <div className={cn('absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent', glow)} />

              <div className="relative z-10 mb-3 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
                <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-2 text-left">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-black/20">
                    <Icon className={cn('h-4 w-4', accent)} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{title}</span>
                    <span className="block text-xs text-violet-100/45">{subtitle}</span>
                  </span>
                </button>
                <span className="rounded-full border border-white/[0.08] bg-black/20 px-2 py-1 text-xs font-bold tabular-nums text-violet-100/70">
                  {isPrivacyMode ? '**' : count}
                </span>
              </div>

              <div className="relative z-10 space-y-2">
                {items.length > 0 ? (
                  items.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => (item.kind === 'project' ? onNavigateToProject(item.id) : onNavigateToLead(item.id))}
                      className="group flex w-full items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-left transition hover:border-white/[0.14] hover:bg-white/[0.06]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-violet-50">
                          {isPrivacyMode ? '********' : item.title}
                        </span>
                        <span className="block truncate text-xs text-violet-100/45">
                          {isPrivacyMode
                            ? 'donnees masquees'
                            : item.kind === 'lead'
                              ? `${item.activityLabel} · ${formatActivityDate(item.activityAt)}`
                              : `${item.progress ?? 0}% · ${item.meta}`}
                        </span>
                      </span>
                      <Sparkles className={cn('h-3.5 w-3.5 shrink-0 opacity-45 transition group-hover:opacity-100', accent)} />
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-white/[0.08] px-3 py-5 text-center text-xs text-violet-100/42">
                    Aucun element a afficher
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
