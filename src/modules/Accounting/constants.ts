import { Globe, Server, Megaphone, Bot, Users, Mail, MoreHorizontal } from 'lucide-react';

// =====================================================
// CONSTANTES - CATÉGORIES DE REVENUS
// =====================================================

export type RevenueCategory = 'site_internet' | 'erp' | 'communication';
export type RevenueSousCategorie = 'chatbot' | 'cm' | 'newsletter' | 'autre';
export type RevenuePeriodFilter = 'month' | 'quarter' | 'year';

export const REVENUE_CATEGORIES = [
  { value: 'site_internet' as const, label: 'Site Internet', color: '#06b6d4', icon: Globe },
  { value: 'erp' as const, label: 'ERP', color: '#8b5cf6', icon: Server },
  { value: 'communication' as const, label: 'Autres sources', color: '#f59e0b', icon: Megaphone },
] as const;

export const REVENUE_SOUS_CATEGORIES = [
  { value: 'chatbot' as const, label: 'Chatbot', icon: Bot },
  { value: 'cm' as const, label: 'Community Management', icon: Users },
  { value: 'newsletter' as const, label: 'Newsletter', icon: Mail },
  { value: 'autre' as const, label: 'Autre', icon: MoreHorizontal },
] as const;

export function getCategoryLabel(category: string | null | undefined): string {
  const found = REVENUE_CATEGORIES.find(c => c.value === category);
  return found?.label ?? '';
}

export function getCategoryColor(category: string | null | undefined): string {
  const found = REVENUE_CATEGORIES.find(c => c.value === category);
  return found?.color ?? '#94a3b8';
}

export function getCategoryColorClasses(category: string | null | undefined): string {
  switch (category) {
    case 'site_internet':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'erp':
      return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'communication':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-surface-2 text-muted-foreground border-border';
  }
}

export function getSousCategorieLabel(sc: string | null | undefined): string {
  const found = REVENUE_SOUS_CATEGORIES.find(c => c.value === sc);
  return found?.label ?? '';
}
