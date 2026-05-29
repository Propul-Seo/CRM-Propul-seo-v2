import type { ProjectStatusV2 } from '@/types/project-v2'

// Pipeline canonique (status général projet V2)
export const PROJECT_STATUS_ORDER: ProjectStatusV2[] = [
  'prospect',
  'brief_received',
  'quote_sent',
  'in_progress',
  'review',
  'delivered',
  'maintenance',
  'on_hold',
  'closed',
  'propulseo_internal',
]

export const PROJECT_STATUS_LABELS: Record<ProjectStatusV2, string> = {
  prospect: 'Prospect',
  brief_received: 'Brief reçu',
  quote_sent: 'Devis envoyé',
  in_progress: 'En cours',
  review: 'Recette',
  delivered: 'Livré',
  maintenance: 'Maintenance',
  on_hold: 'En pause',
  closed: 'Clôturé',
  propulseo_internal: 'Projet Propulseo',
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatusV2, { badge: string }> = {
  prospect:       { badge: 'bg-blue-500/15 text-blue-400' },
  brief_received: { badge: 'bg-cyan-500/15 text-cyan-400' },
  quote_sent:     { badge: 'bg-amber-500/15 text-amber-400' },
  in_progress:    { badge: 'bg-violet-500/15 text-violet-400' },
  review:         { badge: 'bg-pink-500/15 text-pink-400' },
  delivered:      { badge: 'bg-green-500/15 text-green-400' },
  maintenance:    { badge: 'bg-teal-500/15 text-teal-400' },
  on_hold:        { badge: 'bg-slate-500/15 text-slate-400' },
  closed:         { badge: 'bg-zinc-500/15 text-zinc-400' },
  propulseo_internal: { badge: 'bg-pink-500/15 text-pink-400' },
}

// Statuts spécifiques par module (sw_status / erp_status / comm_status).
// Inclus pour gérer les projets dont le champ `status` contient en réalité un statut spécifique.
const SPECIFIC_STATUS_LABELS: Record<string, string> = {
  // Site Web
  devis_envoye:     'Devis envoyé',
  signe:            'Signé',
  en_production:    'En production',
  livre:            'Livré',
  perdu:            'Perdu',
  // ERP
  analyse_besoins:  'Analyse des besoins',
  en_developpement: 'En développement',
  recette:          'Recette',
  // Communication
  brief_creatif:    'Brief créatif',
  actif:            'Actif',
  termine:          'Terminé',
}

const SPECIFIC_STATUS_COLORS: Record<string, { badge: string }> = {
  devis_envoye:     { badge: 'bg-amber-500/15 text-amber-400' },
  signe:            { badge: 'bg-indigo-500/15 text-indigo-400' },
  en_production:    { badge: 'bg-violet-500/15 text-violet-400' },
  livre:            { badge: 'bg-green-500/15 text-green-400' },
  perdu:            { badge: 'bg-red-500/15 text-red-400' },
  analyse_besoins:  { badge: 'bg-cyan-500/15 text-cyan-400' },
  en_developpement: { badge: 'bg-violet-500/15 text-violet-400' },
  recette:          { badge: 'bg-pink-500/15 text-pink-400' },
  brief_creatif:    { badge: 'bg-cyan-500/15 text-cyan-400' },
  actif:            { badge: 'bg-emerald-500/15 text-emerald-400' },
  termine:          { badge: 'bg-green-500/15 text-green-400' },
}

const FALLBACK_STATUS_STYLE = { badge: 'bg-slate-500/15 text-slate-400' }

export const getStatusStyle = (status: string | null | undefined): { badge: string } => {
  if (!status) return FALLBACK_STATUS_STYLE
  return (
    PROJECT_STATUS_COLORS[status as ProjectStatusV2] ||
    SPECIFIC_STATUS_COLORS[status] ||
    FALLBACK_STATUS_STYLE
  )
}

export const getStatusLabel = (status: string | null | undefined): string => {
  if (!status) return '—'
  return (
    PROJECT_STATUS_LABELS[status as ProjectStatusV2] ||
    SPECIFIC_STATUS_LABELS[status] ||
    status
  )
}

const PRESTA_LABELS: Record<string, string> = {
  web: 'Web',
  seo: 'SEO',
  erp: 'ERP',
  saas: 'SaaS',
  site_web: 'Site Web',
  erp_v2: 'ERP',
  communication: 'Communication',
}

export function formatPresta(types: string[] | null | undefined): string {
  if (!types || types.length === 0) return '—'
  return types.map((t) => PRESTA_LABELS[t] ?? t).join(' · ')
}
