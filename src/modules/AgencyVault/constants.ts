import { Briefcase, Code2, Server, Banknote, Megaphone, Package, type LucideIcon } from 'lucide-react'
import type { CategoryConfig } from '@/components/v3/access-shared'

export type AgencyCategory = 'workspace' | 'dev' | 'infra' | 'finance' | 'marketing' | 'saas'

export const AGENCY_CATEGORY_ORDER: AgencyCategory[] = [
  'workspace', 'dev', 'infra', 'finance', 'marketing', 'saas',
]

export const AGENCY_CATEGORY_LABELS: Record<AgencyCategory, string> = {
  workspace: 'Workspace',
  dev: 'Développement',
  infra: 'Infrastructure',
  finance: 'Finance',
  marketing: 'Marketing',
  saas: 'SaaS divers',
}

export const AGENCY_CATEGORY_ICONS: Record<AgencyCategory, LucideIcon> = {
  workspace: Briefcase,
  dev: Code2,
  infra: Server,
  finance: Banknote,
  marketing: Megaphone,
  saas: Package,
}

export const AGENCY_CATEGORIES_CONFIG: CategoryConfig[] = AGENCY_CATEGORY_ORDER.map(c => ({
  value: c,
  label: AGENCY_CATEGORY_LABELS[c],
  icon: AGENCY_CATEGORY_ICONS[c],
}))
