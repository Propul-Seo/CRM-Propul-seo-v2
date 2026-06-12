import type { LucideIcon } from 'lucide-react';
import type { BadgeTone } from '@/modules/EspaceClient/shared/components';

// Helpers et types partagés des sections du tableau de bord portail.

export const EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});

export function formatShortDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatLongDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Clés = valeurs réelles de PrestaType (cf. src/types/project-v2.ts) — même
// mapping que ProjectPage (constante locale non exportée là-bas).
const PRESTA_LABELS: Record<string, string> = {
  web: 'Site web', site_web: 'Site web',
  erp: 'ERP / Outil métier', erp_v2: 'ERP / Outil métier',
  saas: 'SaaS', seo: 'SEO', communication: 'Communication',
};

export function prestaLabelOf(presta: string[] | null | undefined): string | null {
  if (!presta || presta.length === 0) return null;
  return PRESTA_LABELS[presta[0]] ?? presta[0];
}

/** Action actionnable côté client (facture à régler / document à signer). */
export interface DashboardAction {
  key: string;
  kind: 'invoice' | 'signature';
  rank: number;
  label: string;
  title: string;
  meta: string;
  cta: string;
  to: string;
}

/** Entrée du fil d'activité récente (fusion docs + factures + signatures). */
export interface DashboardActivityItem {
  id: string;
  date: string;
  title: string;
  icon: LucideIcon;
  tint: BadgeTone;
}
