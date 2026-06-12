import { Gem } from 'lucide-react';
import type { QualificationLead } from '../useWelcomeWizard';

// Déclinaison monochrome (DA Aurora : un seul accent violet) — la hiérarchie
// passe par le contraste neutre/violet, plus par la teinte.
function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--ps-bg-subtle)] p-2.5">
      <p className="text-[9.5px] font-bold uppercase tracking-widest text-[var(--ps-primary-text)]">{label}</p>
      <p className="mt-1 truncate text-[12.5px] font-semibold text-[var(--ps-fg)]">{value}</p>
    </div>
  );
}

interface Step1QualifRecapProps { qualif: QualificationLead }

export function Step1QualifRecap({ qualif }: Step1QualifRecapProps) {
  const features = qualif.desired_features ?? [];
  return (
    <div className="flex h-full flex-col gap-3 rounded-3xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-elevated)] p-6 shadow-[var(--ps-shadow-floating)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--ps-primary-text)]">Votre projet</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-success-subtle)] px-2 py-0.5 text-[9.5px] font-bold text-[var(--ps-success-text)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-success)]" aria-hidden />
          Pré-rempli
        </span>
      </div>

      <div>
        <h2 className="text-[22px] font-semibold leading-tight text-[var(--ps-fg)]">
          {qualif.company_name ?? '—'}
        </h2>
        {qualif.business_sector && (
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--ps-fg-muted)]">
            <Gem className="h-3 w-3" />{qualif.business_sector}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniCard label="Objectif" value={qualif.main_goal ?? '—'} />
        <MiniCard label="Budget"   value={qualif.budget_range ?? '—'} />
        <MiniCard label="Délai"    value={qualif.desired_timeline ?? '—'} />
        <MiniCard label="Modules"  value={`${features.length} à construire`} />
      </div>

      {features.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5">
          {features.slice(0, 6).map(f => (
            <span key={f} className="rounded-full bg-[var(--ps-primary-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--ps-primary-text)]">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
