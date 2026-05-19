import type { LucideIcon } from 'lucide-react';
import { Gem, Target, Wallet, Calendar, Shapes } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QualificationLead } from '../useWelcomeWizard';

// Génère un monogramme de 1-2 lettres à partir d'un nom complet
// ("Acme Corp" → "AC", "Précieuse" → "PR").
function monogram(name: string | null | undefined, fallback = '•'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Tint = 'blue' | 'green' | 'orange' | 'violet';

const TINT_BG: Record<Tint, string> = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  orange: 'bg-orange-50 text-orange-700',
  violet: 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]',
};

interface MiniCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tint: Tint;
}

function MiniCard({ icon: Icon, label, value, tint }: MiniCardProps) {
  return (
    <div className="ps-surface ps-lift rounded-lg p-2.5">
      <div className={cn('mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md', TINT_BG[tint])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="ps-eyebrow ps-eyebrow-muted">{label}</p>
      <p className="truncate text-[12.5px] font-semibold text-[var(--ps-fg)]">{value}</p>
    </div>
  );
}

interface Step1QualifRecapProps {
  qualif: QualificationLead;
}

export function Step1QualifRecap({ qualif }: Step1QualifRecapProps) {
  const features = qualif.desired_features ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="ps-eyebrow text-[var(--ps-primary-text)]">Récap de votre demande</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 ring-1 ring-emerald-200/60">
          <span className="h-1 w-1 rounded-full bg-emerald-500" aria-hidden />
          Pré-rempli
        </span>
      </div>

      {/* Carte hero projet */}
      <div className="ps-surface ps-lift rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-100 via-amber-150 to-amber-300 font-serif text-[19px] font-bold italic text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,.6),inset_0_-1px_0_rgba(146,64,14,.12),0_1px_2px_rgba(146,64,14,.08)]"
          >
            {monogram(qualif.company_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="ps-eyebrow ps-eyebrow-muted">Votre projet</p>
            <p className="truncate text-[17px] font-bold tracking-tight text-[var(--ps-fg)]">{qualif.company_name ?? '—'}</p>
            {qualif.business_sector && (
              <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--ps-fg-muted)]">
                <Gem className="h-3 w-3" />
                {qualif.business_sector}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grille 2×2 */}
      <div className="grid grid-cols-2 gap-2">
        <MiniCard icon={Target}   label="Objectif" value={qualif.main_goal ?? '—'}        tint="blue" />
        <MiniCard icon={Wallet}   label="Budget"   value={qualif.budget_range ?? '—'}     tint="green" />
        <MiniCard icon={Calendar} label="Délai"    value={qualif.desired_timeline ?? '—'} tint="orange" />
        <MiniCard icon={Shapes}   label="Modules"  value={`${features.length} à construire`} tint="violet" />
      </div>

      {/* Chips modules */}
      {features.length > 0 && (
        <div className="ps-surface rounded-xl p-3">
          <p className="ps-eyebrow ps-eyebrow-muted mb-2">Modules à construire</p>
          <div className="flex flex-wrap gap-1.5">
            {features.map(f => (
              <span
                key={f}
                className="ps-tap cursor-default rounded-full bg-[var(--ps-primary-subtle)] px-2.5 py-0.5 text-[11.5px] font-medium text-[var(--ps-primary-text)] transition-colors hover:bg-[var(--ps-primary)]/15"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
