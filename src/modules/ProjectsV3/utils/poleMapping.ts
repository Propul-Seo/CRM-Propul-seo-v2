import { Megaphone, Settings2, Globe, type LucideIcon } from 'lucide-react'
import type { PrestaType } from '@/types/project-v2'

/**
 * 3 pôles V2 mappés depuis les presta_type.
 * Plusieurs presta_type peuvent matcher un même pôle (ex: 'web' + 'site_web' → web).
 */
export type V3Pole = 'comm' | 'erp' | 'web'

export const V3_POLE_ORDER: V3Pole[] = ['comm', 'erp', 'web']

export const V3_POLE_LABELS: Record<V3Pole, string> = {
  comm: 'Comm',
  erp: 'ERP',
  web: 'SiteWeb',
}

export const V3_POLE_ICONS: Record<V3Pole, LucideIcon> = {
  comm: Megaphone,
  erp: Settings2,
  web: Globe,
}

/** Couleurs distinctes par pôle (alignées sur la preview HTML validée). */
export const V3_POLE_COLORS: Record<V3Pole, string> = {
  comm: '#06b6d4',
  erp: '#f59e0b',
  web: '#10b981',
}

/**
 * Convertit la liste des presta_type d'un projet vers la liste des pôles V3 actifs.
 * Dédup automatique.
 */
export function getActivePoles(prestaTypes: PrestaType[] | null | undefined): V3Pole[] {
  if (!prestaTypes || prestaTypes.length === 0) return []
  const poles = new Set<V3Pole>()
  for (const t of prestaTypes) {
    if (t === 'communication') poles.add('comm')
    else if (t === 'erp' || t === 'erp_v2') poles.add('erp')
    else if (t === 'web' || t === 'site_web' || t === 'seo') poles.add('web')
    // 'saas' n'a pas de pôle dédié — ignoré
  }
  return V3_POLE_ORDER.filter(p => poles.has(p))
}
