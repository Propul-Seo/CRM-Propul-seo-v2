import { Circle, Clock, CheckCircle2 } from 'lucide-react'
import type { ChecklistPhase, ChecklistStatus, PrestaType } from '@/types/project-v2'

export const PHASE_LABELS: Record<ChecklistPhase, string> = {
  onboarding:     'Onboarding',
  conception:     'Conception',
  developpement:  'Développement',
  recette:        'Recette',
  post_livraison: 'Post-livraison',
  general:        'Général',
}

export const PHASE_ORDER: ChecklistPhase[] = [
  'onboarding', 'conception', 'developpement', 'recette', 'post_livraison', 'general',
]

export const STATUS_CONFIG: Record<ChecklistStatus, { label: string; icon: typeof Circle; color: string }> = {
  todo:        { label: 'À faire',  icon: Circle,       color: 'text-muted-foreground' },
  in_progress: { label: 'En cours', icon: Clock,        color: 'text-blue-400' },
  done:        { label: 'Terminé',  icon: CheckCircle2, color: 'text-green-400' },
  skipped:     { label: 'Ignoré',   icon: Circle,       color: 'text-muted-foreground' },
}

export const PRIORITY_CLASS: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-300 border-red-600',
  high:   'bg-red-500/20 text-red-300 border-red-600',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-600',
  low:    'bg-gray-500/20 text-gray-400 border-gray-600',
}

export const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urg.',
  high:   'Haute',
  medium: 'Moy.',
  low:    'Basse',
}

export const PRESTA_LABELS: Record<PrestaType, string> = {
  web:           'Web',
  seo:           'SEO',
  erp:           'ERP',
  saas:          'SaaS',
  site_web:      'Site Web',
  erp_v2:        'ERP v2',
  communication: 'Communication',
}

