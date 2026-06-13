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
  green:  'bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]',
  amber:  'bg-[var(--ps-warning-subtle)] text-[var(--ps-warning-text)]',
  red:    'bg-[var(--ps-danger-subtle)] text-[var(--ps-danger-text)]',
  blue:   'bg-[var(--ps-info-subtle)] text-[var(--ps-info-text)]',
  gray:   'bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-secondary)]',
};

const DOTS: Record<BadgeTone, string> = {
  violet: 'bg-[var(--ps-primary)]',
  green:  'bg-[var(--ps-success)]',
  amber:  'bg-[var(--ps-warning)]',
  red:    'bg-[var(--ps-danger)]',
  blue:   'bg-[var(--ps-info)]',
  gray:   'bg-[var(--ps-fg-muted)]',
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
  partially_paid: { tone: 'amber', label: 'Partiellement payée' },
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
