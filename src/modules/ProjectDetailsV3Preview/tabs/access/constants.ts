import { Server, Globe, BarChart3, Share2, Wrench, Palette, type LucideIcon } from 'lucide-react'
import type { AccessCategory, AccessStatus } from '@/types/project-v2'

export const CATEGORY_ORDER: AccessCategory[] = [
  'hosting', 'cms', 'analytics', 'social', 'tools', 'design',
]

export const CATEGORY_LABELS: Record<AccessCategory, string> = {
  hosting: 'Hébergement',
  cms: 'CMS',
  analytics: 'Analytics',
  social: 'Réseaux sociaux',
  tools: 'Outils',
  design: 'Design',
}

export const CATEGORY_ICONS: Record<AccessCategory, LucideIcon> = {
  hosting: Server,
  cms: Globe,
  analytics: BarChart3,
  social: Share2,
  tools: Wrench,
  design: Palette,
}

export const STATUS_ORDER: AccessStatus[] = [
  'active', 'pending_validation', 'missing', 'broken', 'expired',
]

export const STATUS_LABELS: Record<AccessStatus, string> = {
  active: 'Actif',
  missing: 'Manquant',
  broken: 'Cassé',
  expired: 'Expiré',
  pending_validation: 'À valider',
}

export const STATUS_COLORS: Record<AccessStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  missing: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  broken: 'bg-red-500/15 text-red-300 border-red-500/30',
  expired: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  pending_validation: 'bg-[rgba(139,92,246,0.18)] text-[#A78BFA] border-[rgba(139,92,246,0.4)]',
}
