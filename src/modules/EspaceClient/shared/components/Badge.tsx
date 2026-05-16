import type { ReactNode } from 'react';
import type { InvoiceStatus, SignatureStatus, ProjectStepStatus } from '@/modules/EspaceClient/shared/types/portal.types';

export type BadgeTone = 'violet' | 'green' | 'amber' | 'red' | 'blue' | 'gray';

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}

const TONES: Record<BadgeTone, string> = {
  violet: 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]',
  green:  'bg-emerald-50 text-emerald-700',
  amber:  'bg-amber-50 text-amber-700',
  red:    'bg-red-50 text-red-700',
  blue:   'bg-blue-50 text-blue-700',
  gray:   'bg-zinc-100 text-zinc-700',
};

const DOTS: Record<BadgeTone, string> = {
  violet: 'bg-[var(--ps-primary)]',
  green:  'bg-emerald-500',
  amber:  'bg-amber-500',
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  gray:   'bg-zinc-400',
};

export function Badge({ tone = 'violet', dot = true, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONES[tone]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} />}
      {children}
    </span>
  );
}

type AnyStatus = InvoiceStatus | SignatureStatus | ProjectStepStatus | string;

interface StatusBadgeProps {
  status: AnyStatus;
}

// Mapping statuts métier → tonalité + libellé FR. Centralisé pour cohérence
// visuelle entre toutes les pages portail/admin.
const STATUS_MAP: Record<string, { tone: BadgeTone; label: string }> = {
  // invoices
  draft:      { tone: 'gray',  label: 'Brouillon' },
  sent:       { tone: 'blue',  label: 'Envoyée' },
  paid:       { tone: 'green', label: 'Payée' },
  overdue:    { tone: 'red',   label: 'En retard' },
  cancelled:  { tone: 'gray',  label: 'Annulée' },
  refunded:   { tone: 'amber', label: 'Remboursée' },
  // signatures
  pending:    { tone: 'amber', label: 'En attente' },
  signed:     { tone: 'green', label: 'Signé' },
  declined:   { tone: 'red',   label: 'Refusé' },
  expired:    { tone: 'gray',  label: 'Expiré' },
  // project_steps
  upcoming:    { tone: 'gray',   label: 'À venir' },
  in_progress: { tone: 'violet', label: 'En cours' },
  completed:   { tone: 'green',  label: 'Terminé' },
  blocked:     { tone: 'red',    label: 'Bloqué' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const entry = STATUS_MAP[status] ?? { tone: 'gray' as BadgeTone, label: status };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
