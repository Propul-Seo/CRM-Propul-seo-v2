import { motion } from 'framer-motion';
import { BriefcaseBusiness, FileText, PackageCheck, Sparkles, UsersRound } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { itemVariants } from '../lib/animations';
import type { LeadRow, ProjectRow } from '../../../types/supabase-types';

type PipelineItem =
  | {
      id: string;
      title: string;
      meta: string;
      value?: number | null;
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
  leads: LeadRow[] | null | undefined;
  projects: ProjectRow[] | null | undefined;
  leadsCount: number | undefined;
  activeProjectsCount: number;
  isPrivacyMode: boolean;
  isMobile: boolean;
  onNavigateToCRM: () => void;
  onNavigateToProjects: () => void;
  onNavigateToProject: (id: string) => void;
}

const LEAD_QUOTE_STAGES = ['devis', 'proposal', 'quote', 'negotiation', 'negociation', 'qualified'];
const CLOSED_LEAD_STAGES = ['won', 'lost', 'perdu', 'signe', 'signed'];
const PRODUCTION_PROJECT_STATUSES = ['active', 'in_progress', 'ongoing', 'started', 'planning'];
const DELIVERY_PROJECT_STATUSES = ['review', 'delivery', 'to_deliver', 'ready', 'completed'];

function normalise(value: string | null | undefined) {
  return (value ?? '').toLowerCase().trim();
}

function formatPotential(value: number | null | undefined) {
  if (!value) return 'potentiel a definir';
  return `${value.toLocaleString('fr-FR')} EUR`;
}

function leadStage(lead: LeadRow) {
  return normalise(lead.pipeline_stage || lead.status);
}

function projectStage(project: ProjectRow) {
  return normalise(project.status);
}

function toLeadItem(lead: LeadRow): PipelineItem {
  return {
    id: lead.id,
    title: lead.company_name || lead.contact_name || 'Lead sans nom',
    meta: lead.contact_name || lead.source || 'Lead CRM',
    value: lead.value,
    kind: 'lead',
  };
}

function toProjectItem(project: ProjectRow): PipelineItem {
  return {
    id: project.id,
    title: project.name,
    meta: project.status || 'Projet',
    progress: project.progress,
    kind: 'project',
  };
}

function isQuoteLead(lead: LeadRow) {
  const stage = leadStage(lead);
  return LEAD_QUOTE_STAGES.some(item => stage.includes(item));
}

function isOpenLead(lead: LeadRow) {
  const stage = leadStage(lead);
  return !isQuoteLead(lead) && !CLOSED_LEAD_STAGES.some(item => stage.includes(item));
}

function isDeliveryProject(project: ProjectRow) {
  const stage = projectStage(project);
  return (
    DELIVERY_PROJECT_STATUSES.some(item => stage.includes(item)) ||
    ((project.progress ?? 0) >= 80 && !stage.includes('archived'))
  );
}

function isProductionProject(project: ProjectRow) {
  const stage = projectStage(project);
  return (
    !isDeliveryProject(project) &&
    PRODUCTION_PROJECT_STATUSES.some(item => stage.includes(item))
  );
}

export function PipelineBoardSection({
  leads,
  projects,
  leadsCount,
  activeProjectsCount,
  isPrivacyMode,
  isMobile,
  onNavigateToCRM,
  onNavigateToProjects,
  onNavigateToProject,
}: PipelineBoardSectionProps) {
  const leadRows = leads ?? [];
  const projectRows = projects ?? [];

  const openLeads = leadRows.filter(isOpenLead);
  const quoteLeads = leadRows.filter(isQuoteLead);
  const productionProjects = projectRows.filter(isProductionProject);
  const deliveryProjects = projectRows.filter(isDeliveryProject);

  const columns = [
    {
      title: 'Leads',
      count: openLeads.length || leadsCount || 0,
      icon: UsersRound,
      accent: 'text-cyan-300',
      border: 'border-cyan-400/20',
      glow: 'from-cyan-400/10',
      items: openLeads.slice(0, 3).map(toLeadItem),
      onClick: onNavigateToCRM,
    },
    {
      title: 'Devis',
      count: quoteLeads.length,
      icon: FileText,
      accent: 'text-violet-200',
      border: 'border-violet-400/20',
      glow: 'from-violet-400/12',
      items: quoteLeads.slice(0, 3).map(toLeadItem),
      onClick: onNavigateToCRM,
    },
    {
      title: 'Production',
      count: productionProjects.length || activeProjectsCount,
      icon: BriefcaseBusiness,
      accent: 'text-emerald-300',
      border: 'border-emerald-400/20',
      glow: 'from-emerald-400/10',
      items: productionProjects.slice(0, 3).map(toProjectItem),
      onClick: onNavigateToProjects,
    },
    {
      title: 'A livrer',
      count: deliveryProjects.length,
      icon: PackageCheck,
      accent: 'text-amber-300',
      border: 'border-amber-400/20',
      glow: 'from-amber-400/10',
      items: deliveryProjects.slice(0, 3).map(toProjectItem),
      onClick: onNavigateToProjects,
    },
  ];

  return (
    <motion.section variants={itemVariants} className="col-span-2 lg:col-span-12">
      <div className="rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,14,26,0.78),rgba(7,7,13,0.86))] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-4">
        <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-4')}>
          {columns.map(({ title, count, icon: Icon, accent, border, glow, items, onClick }) => (
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
                    <span className="block text-xs text-violet-100/45">Vue rapide</span>
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
                      onClick={() => (item.kind === 'project' ? onNavigateToProject(item.id) : onNavigateToCRM())}
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
                              ? formatPotential(item.value)
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
