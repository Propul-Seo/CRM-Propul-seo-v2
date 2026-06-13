import type { PersonalTask, PersonalTaskStatus } from '../../types/personalTasks';

export interface TaskKanbanColumn {
  id: PersonalTaskStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  tasks: PersonalTask[];
}

export const TAG_COLORS: Record<string, string> = {
  Admin: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Tech: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Client: 'bg-green-500/20 text-green-300 border-green-500/30',
  Contenu: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  LinkedIn: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  SEO: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Design: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  Finance: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Team: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  Projet: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  Perso: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export const DEFAULT_TAG_COLOR = 'bg-slate-500/20 text-slate-300 border-slate-500/30';

// Palette cyclique pour les tags custom sans couleur prédéfinie
const TAG_COLOR_PALETTE = [
  'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-lime-500/20 text-lime-300 border-lime-500/30',
  'bg-red-500/20 text-red-300 border-red-500/30',
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
];

export function getTagColor(tag: string): string {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  // Hash le nom du tag pour attribuer une couleur stable
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLOR_PALETTE[Math.abs(hash) % TAG_COLOR_PALETTE.length];
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-500',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

export const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'À faire',
  in_progress: 'En cours',
  weekend: 'Week-end',
  done: 'Terminé',
};
