import { FileText, Receipt, PenLine, type LucideIcon } from 'lucide-react';
import type { AuditLogRow } from '../lib/adminRpc';

// Méta-données du journal d'audit, partagées par l'onglet Activité (vue complète)
// et le fil d'activité de l'Aperçu (vue condensée).
export interface ResourceMeta {
  icon: LucideIcon;
  bubble: string;
  label: string;
}

export const AUDIT_RESOURCES: Record<string, ResourceMeta> = {
  'propulspace.documents': { icon: FileText, bubble: 'bg-primary/15 text-primary ring-1 ring-primary/30', label: 'Document' },
  'propulspace.invoices': { icon: Receipt, bubble: 'bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20', label: 'Facture' },
  'propulspace.signatures': { icon: PenLine, bubble: 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20', label: 'Signature' },
};

export const AUDIT_FALLBACK: ResourceMeta = { icon: FileText, bubble: 'bg-surface-3 text-muted-foreground', label: 'Élément' };

export const AUDIT_VERB: Record<AuditLogRow['action'], string> = { insert: 'ajouté', update: 'modifié', delete: 'supprimé' };

export function auditItemName(diff: AuditLogRow['diff']): string {
  const pick = (src: Record<string, unknown> | undefined, key: string): string => {
    const v = src?.[key];
    return typeof v === 'string' ? v : '';
  };
  return pick(diff?.after, 'name') || pick(diff?.before, 'name')
    || pick(diff?.after, 'invoice_number') || pick(diff?.before, 'invoice_number');
}

export const fmtAuditDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

// Horodatage relatif FR discret, partagé par l'Aperçu et l'onglet Activité
// (arrondi plancher partout pour des libellés cohérents entre les deux vues).
export function fmtRelative(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  return `il y a ${Math.floor(days / 30)} mois`;
}
