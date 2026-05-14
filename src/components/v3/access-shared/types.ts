import type { LucideIcon } from 'lucide-react'

/**
 * Modèle générique d'un accès chiffré (projet OU agence).
 * Le `category` est un string libre — les consommateurs (projet, agence)
 * fournissent leur propre union typée + la config de catégories.
 */
export interface AccessRecord {
  id: string
  category: string
  label: string
  url: string | null
  login: string | null
  password: string | null
  notes: string | null
  status: AccessStatusShared
  provided_by: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type AccessStatusShared =
  | 'active'
  | 'pending_validation'
  | 'missing'
  | 'broken'
  | 'expired'

/**
 * Convention secrets pour upsert (identique projet/agence) :
 *  - `undefined` ou `null` → préserve la valeur en BDD
 *  - `''` (string vide)    → efface la valeur en BDD
 *  - valeur                → chiffre et remplace
 */
export interface AccessFormValues {
  id?: string | null
  category: string
  label: string
  url?: string | null
  login?: string | null
  password?: string | null
  notes?: string | null
  status: AccessStatusShared
  provided_by?: string | null
  expires_at?: string | null
}

/**
 * Configuration d'une catégorie côté UI (label + icon).
 * Chaque consommateur fournit son propre set.
 */
export interface CategoryConfig {
  value: string
  label: string
  icon: LucideIcon
}

export const STATUS_LABELS: Record<AccessStatusShared, string> = {
  active: 'Actif',
  missing: 'Manquant',
  broken: 'Cassé',
  expired: 'Expiré',
  pending_validation: 'À valider',
}

export const STATUS_COLORS: Record<AccessStatusShared, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  missing: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  broken: 'bg-red-500/15 text-red-300 border-red-500/30',
  expired: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  pending_validation: 'bg-[rgba(139,92,246,0.18)] text-[#A78BFA] border-[rgba(139,92,246,0.4)]',
}

export const STATUS_ORDER: AccessStatusShared[] = [
  'active', 'pending_validation', 'missing', 'broken', 'expired',
]
