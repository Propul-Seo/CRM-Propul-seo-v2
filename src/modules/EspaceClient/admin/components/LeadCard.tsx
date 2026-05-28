import { Building2, Mail, Phone, Sparkles } from 'lucide-react';
import { StatusBadge } from '@/modules/EspaceClient/shared/components';
import { SECTORS, BUDGET_RANGES } from '@/modules/EspaceClient/qualification/constants';
import type { QualificationLeadRow } from '../hooks/useQualificationLeads';

interface LeadCardProps {
  lead: QualificationLeadRow;
  onClick: () => void;
}

function labelOf<T extends ReadonlyArray<{ value: string; label: string }>>(arr: T, v: string | null | undefined): string {
  if (!v) return '—';
  return arr.find(o => o.value === v)?.label ?? v;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ps-surface ps-surface-hover w-full p-4 text-left transition-all duration-200 [transition-timing-function:var(--ps-ease)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14px] font-semibold tracking-tight text-[var(--ps-fg)]">
              {lead.full_name}
            </h3>
            {lead.quality_score != null && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700">
                <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
                {lead.quality_score}
              </span>
            )}
          </div>
          {lead.company_name && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-[var(--ps-fg-secondary)]">
              <Building2 className="h-3 w-3" />
              {lead.company_name}
            </p>
          )}
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-1.5 text-[11.5px] sm:grid-cols-2">
        <div className="inline-flex items-center gap-1.5">
          <Mail className="h-3 w-3 text-[var(--ps-fg-muted)]" />
          <span className="truncate text-[var(--ps-fg-secondary)]">{lead.email}</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Phone className="h-3 w-3 text-[var(--ps-fg-muted)]" />
          <span className="text-[var(--ps-fg-secondary)]">{lead.phone}</span>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded-full bg-[var(--ps-bg-subtle)] px-2 py-0.5 font-medium text-[var(--ps-fg-secondary)]">
          {labelOf(SECTORS, lead.business_sector)}
        </span>
        <span className="rounded-full bg-[var(--ps-primary-subtle)] px-2 py-0.5 font-semibold text-[var(--ps-primary-text)]">
          {labelOf(BUDGET_RANGES, lead.budget_range)}
        </span>
        <span className="ml-auto text-[var(--ps-fg-muted)]">
          {formatDate(lead.submitted_at ?? lead.created_at)}
        </span>
      </div>
    </button>
  );
}
