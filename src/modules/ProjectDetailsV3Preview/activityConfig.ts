import {
  Mail,
  Phone,
  CheckSquare,
  Calendar,
  Lightbulb,
  File,
  Key,
  ArrowRightLeft,
  Receipt,
  Settings,
} from 'lucide-react'
import type { ActionDef } from '@/components/activities-hub'
import type { ActivityType } from '@/types/project-v2'

// Actions visibles dans la QuickActionBar (4 boutons principaux).
// 'decision' remplace 'note' (le type 'note' n'existe pas dans v2.project_activities).
// 'task' retiré (doublon avec l'onglet Production qui gère les tâches projet).
export const PROJECT_V3_ACTIONS: ActionDef<ActivityType>[] = [
  { type: 'decision', label: 'Décision',   icon: Lightbulb,   colorClass: 'hover:bg-violet-500/15', iconColorClass: 'text-violet-400', description: 'Consigner une décision importante' },
  { type: 'email',    label: 'E-mail',     icon: Mail,        colorClass: 'hover:bg-green-500/15',  iconColorClass: 'text-green-400',  description: 'Enregistrer un e-mail envoyé ou reçu' },
  { type: 'call',     label: 'Appel',      icon: Phone,       colorClass: 'hover:bg-blue-500/15',   iconColorClass: 'text-blue-400',   description: 'Noter un appel passé ou reçu' },
  { type: 'meeting',  label: 'Réunion',    icon: Calendar,    colorClass: 'hover:bg-pink-500/15',   iconColorClass: 'text-pink-400',   description: 'Consigner une réunion ou un point projet' },
]

// Styles pour TOUS les types d'activités (incluant les automatiques : file/access/status/invoice/system).
export const PROJECT_V3_TIMELINE_STYLES: Record<ActivityType, { avatar: string; badge: string }> = {
  email:    { avatar: 'bg-green-500/15 border-green-500/25 text-green-400',     badge: 'bg-green-500/15 text-green-400 border-transparent' },
  call:     { avatar: 'bg-blue-500/15 border-blue-500/25 text-blue-400',        badge: 'bg-blue-500/15 text-blue-400 border-transparent' },
  meeting:  { avatar: 'bg-pink-500/15 border-pink-500/25 text-pink-400',        badge: 'bg-pink-500/15 text-pink-400 border-transparent' },
  decision: { avatar: 'bg-violet-500/15 border-violet-500/25 text-violet-400',  badge: 'bg-violet-500/15 text-violet-400 border-transparent' },
  task:     { avatar: 'bg-amber-500/15 border-amber-500/25 text-amber-400',     badge: 'bg-amber-500/15 text-amber-400 border-transparent' },
  file:     { avatar: 'bg-cyan-500/15 border-cyan-500/25 text-cyan-400',        badge: 'bg-cyan-500/15 text-cyan-400 border-transparent' },
  access:   { avatar: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400',  badge: 'bg-yellow-500/15 text-yellow-400 border-transparent' },
  status:   { avatar: 'bg-teal-500/15 border-teal-500/25 text-teal-400',        badge: 'bg-teal-500/15 text-teal-400 border-transparent' },
  invoice:  { avatar: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400 border-transparent' },
  system:   { avatar: 'bg-slate-500/15 border-slate-500/25 text-slate-400',     badge: 'bg-slate-500/15 text-slate-400 border-transparent' },
}

// Pour la timeline complète (toutes activités), on étend les actions du QuickActionBar
// avec celles produites automatiquement (system/file/etc) pour fournir labels + icônes.
// 'task' est ré-ajouté ici (sans bouton dans la barre) pour pouvoir afficher d'anciennes
// activités de type 'task' déjà stockées en BDD.
export const PROJECT_V3_ALL_ACTIONS: ActionDef<ActivityType>[] = [
  ...PROJECT_V3_ACTIONS,
  { type: 'task',    label: 'Tâche',       icon: CheckSquare,     colorClass: '' },
  { type: 'file',    label: 'Fichier',     icon: File,            colorClass: '' },
  { type: 'access',  label: 'Accès',       icon: Key,             colorClass: '' },
  { type: 'status',  label: 'Statut',      icon: ArrowRightLeft,  colorClass: '' },
  { type: 'invoice', label: 'Facture',     icon: Receipt,         colorClass: '' },
  { type: 'system',  label: 'Système',     icon: Settings,        colorClass: '' },
]
