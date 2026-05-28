import { Gem } from 'lucide-react';
import type { QualificationLead } from '../useWelcomeWizard';

const TINT_BG: Record<string, { bg: string; text: string }> = {
  blue:   { bg: 'from-sky-50 to-sky-100/60',         text: 'text-sky-700' },
  green:  { bg: 'from-violet-50 to-violet-100/60',   text: 'text-violet-700' },
  orange: { bg: 'from-orange-50 to-orange-100/60',   text: 'text-orange-700' },
  violet: { bg: 'from-pink-50 to-pink-100/60',       text: 'text-pink-700' },
};

function MiniCard({ label, value, tint }: { label: string; value: string; tint: keyof typeof TINT_BG }) {
  const t = TINT_BG[tint];
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${t.bg} p-2.5`}>
      <p className={`text-[9.5px] font-bold uppercase tracking-widest ${t.text}`}>{label}</p>
      <p className="mt-1 truncate text-[12.5px] font-semibold text-stone-900">{value}</p>
    </div>
  );
}

interface Step1QualifRecapProps { qualif: QualificationLead }

export function Step1QualifRecap({ qualif }: Step1QualifRecapProps) {
  const features = qualif.desired_features ?? [];
  return (
    <div className="flex h-full flex-col gap-3 rounded-3xl bg-white p-6"
      style={{ boxShadow: '0 30px 60px -15px rgba(192,38,211,0.20), 0 0 0 1px rgba(192,38,211,0.06)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-600">Votre projet</p>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          ✓ PRÉ-REMPLI
        </span>
      </div>

      <div>
        <h2 className="text-[22px] font-semibold leading-tight text-stone-900">
          {qualif.company_name ?? '—'}
        </h2>
        {qualif.business_sector && (
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-stone-500">
            <Gem className="h-3 w-3" />{qualif.business_sector}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniCard label="Objectif" value={qualif.main_goal ?? '—'} tint="blue" />
        <MiniCard label="Budget"   value={qualif.budget_range ?? '—'} tint="green" />
        <MiniCard label="Délai"    value={qualif.desired_timeline ?? '—'} tint="orange" />
        <MiniCard label="Modules"  value={`${features.length} à construire`} tint="violet" />
      </div>

      {features.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5">
          {features.slice(0, 6).map(f => (
            <span key={f} className="rounded-full bg-gradient-to-r from-sky-100 via-violet-100 to-pink-100 px-2.5 py-0.5 text-[11px] font-medium text-violet-800 ring-1 ring-violet-200/50">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
