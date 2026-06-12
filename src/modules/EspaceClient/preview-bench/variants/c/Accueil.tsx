import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, FileText, PenLine } from 'lucide-react';
import type { BenchData, BenchStep } from '../../fixtures';
import { fmtDateFR, fmtEUR } from '../../fixtures';

/* ─────────────────────────────────────────────────────────────────
 * Variante C — « Récit vertical » · Accueil
 * Ouverture en numéraux géants (étape courante), puis la ligne
 * descend : prochaine action → jalons à venir → chiffres de clôture.
 * ──────────────────────────────────────────────────────────────── */

const STEP_FR: Record<BenchStep['status'], { label: string; dot: string; text: string }> = {
  completed: { label: 'Terminé', dot: 'bg-[var(--ps-success)]', text: 'text-[var(--ps-success-text)]' },
  in_progress: { label: 'En cours', dot: 'bg-[var(--ps-primary)]', text: 'text-[var(--ps-primary-text)]' },
  upcoming: { label: 'À venir', dot: 'bg-[var(--ps-fg-muted)]', text: 'text-[var(--ps-fg-secondary)]' },
  blocked: { label: 'Bloqué', dot: 'bg-[var(--ps-danger)]', text: 'text-[var(--ps-danger-text)]' },
};

function StepChip({ status }: { status: BenchStep['status'] }) {
  const s = STEP_FR[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${s.text}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/** Nœud accroché à la colonne vertébrale du récit. */
function SpineNode({ tone = 'idle', traveled = false, last = false, children }: {
  tone?: 'strong' | 'done' | 'idle';
  traveled?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  const dot =
    tone === 'strong'
      ? 'border-[3px] border-[var(--ps-primary-subtle)] bg-[var(--ps-primary)]'
      : tone === 'done'
        ? 'border-2 border-[var(--ps-bg)] bg-[var(--ps-success)]'
        : 'border-2 border-[var(--ps-border-strong)] bg-[var(--ps-bg-elevated)]';
  return (
    <section className="relative pb-12 pl-10 last:pb-0 md:pb-14 md:pl-14">
      {!last && (
        <span
          aria-hidden
          className={`absolute bottom-0 left-[7px] top-6 w-0.5 ${traveled ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-border-strong)]'}`}
        />
      )}
      <span aria-hidden className={`absolute left-0 top-1.5 h-4 w-4 rounded-full ${dot}`} />
      {children}
    </section>
  );
}

export function AccueilC({ data }: { data: BenchData }) {
  const steps = data.steps;
  const idxActive = steps.findIndex(s => s.status === 'in_progress');
  const safeIdx = idxActive >= 0 ? idxActive : Math.max(steps.findIndex(s => s.status === 'upcoming'), 0);
  const current = steps[safeIdx];
  const upcoming = steps.filter(s => s.status === 'upcoming').slice(0, 2);

  const billed = data.invoices.filter(i => i.status !== 'cancelled' && i.status !== 'refunded' && i.status !== 'draft');
  const paidTotal = billed.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount_ttc, 0);
  const dueTotal = billed.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.amount_ttc, 0);
  const billedTotal = billed.reduce((sum, i) => sum + i.amount_ttc, 0);
  const paidPct = billedTotal > 0 ? Math.round((paidTotal / billedTotal) * 100) : 0;

  return (
    <div className="ps-fade-in mx-auto w-full max-w-3xl px-4 pb-28 pt-10 md:px-12 md:pt-16">
      {/* ── En-tête de contenu ─────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="ps-eyebrow">Votre espace projet</p>
          <h1 className="ps-h1 mt-2">{data.project.name}</h1>
          <p className="ps-small mt-1">{data.project.presta}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] text-[13px] font-semibold text-[var(--ps-primary-text)]">
            {data.referent.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
          </span>
          <div>
            <p className="text-[13px] font-semibold text-[var(--ps-fg)]">{data.referent.name}</p>
            <p className="text-[12px] text-[var(--ps-fg-secondary)]">{data.referent.role}</p>
          </div>
        </div>
      </header>

      {/* ── Ouverture du récit : l'étape courante en numéraux géants ── */}
      <div className="mt-10 md:mt-14">
        <div className="flex items-end gap-3">
          <span className="ps-num text-[56px] font-bold leading-none tracking-[-0.03em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)] md:text-[64px]">
            {safeIdx + 1}
          </span>
          <span className="ps-h2 ps-num pb-1 text-[var(--ps-fg-secondary)]">sur {steps.length}</span>
        </div>
        <h2 className="ps-h2 mt-4">
          {current.title} — votre projet est à{' '}
          <span className="ps-num text-[var(--ps-primary-text)]">{data.project.progress} %</span>
        </h2>
        <p className="ps-small mt-1 max-w-md">
          Démarré le {fmtDateFR(data.project.startedAt)}, livraison estimée le {fmtDateFR(data.project.estimatedEnd)}.
        </p>
      </div>

      {/* ── La ligne démarre sous l'ouverture ──────────────────── */}
      <div className="mt-8 md:mt-10">
        <div aria-hidden className="mb-2 ml-[7px] h-10 w-0.5 bg-[var(--ps-border-strong)] md:h-14" />

        {/* Nœud fort : la prochaine action */}
        <SpineNode tone="strong" traveled>
          <p className="text-[12px] font-semibold text-[var(--ps-primary-text)]">À faire maintenant</p>
          <div className="ps-surface mt-3 p-5 md:p-6">
            <h3 className="ps-h2">{data.nextAction.title}</h3>
            <p className="ps-small mt-2 max-w-md">{data.nextAction.detail}</p>
            <button
              type="button"
              className="ps-tap mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)]"
            >
              {data.nextAction.cta}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </SpineNode>

        {/* Aperçu des deux prochains jalons (contenu indenté : asymétrie) */}
        <SpineNode>
          <h3 className="ps-h3">La suite du parcours</h3>
          <ul className="mt-4 space-y-4 md:ml-8">
            {upcoming.map(s => (
              <li key={s.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[13px] font-semibold text-[var(--ps-fg)]">{s.title}</span>
                <span className="ps-num text-[12px] text-[var(--ps-fg-secondary)]">{fmtDateFR(s.date)}</span>
                <StepChip status={s.status} />
              </li>
            ))}
          </ul>
        </SpineNode>

        {/* Clôture du récit : les chiffres clés */}
        <SpineNode last>
          <h3 className="ps-h3">Le projet en chiffres</h3>
          <div className="mt-5 flex flex-wrap items-end gap-x-12 gap-y-5">
            <div>
              <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Déjà réglé</p>
              <p className="ps-metric ps-num mt-2 text-[var(--ps-fg)]">{fmtEUR(paidTotal)}</p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Reste à régler</p>
              <p className="ps-metric ps-num mt-2 text-[var(--ps-fg)]">{fmtEUR(dueTotal)}</p>
            </div>
            <div className="w-full max-w-xs">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Règlements</span>
                <span className="ps-num text-[12px] font-semibold text-[var(--ps-fg)]">{paidPct} %</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ps-primary-subtle)]">
                <div
                  className="ps-progress-fill h-full rounded-full bg-[var(--ps-primary)]"
                  style={{ '--ps-bar-w': `${paidPct}%` } as CSSProperties}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3 border-t border-[var(--ps-border-soft)] pt-5">
            <p className="flex items-center gap-2.5 text-[13px] text-[var(--ps-fg-secondary)]">
              <FileText className="h-4 w-4 text-[var(--ps-fg-secondary)]" strokeWidth={2} />
              <span className="ps-num font-semibold text-[var(--ps-fg)]">{data.counts.documents}</span>
              documents partagés dans votre espace
            </p>
            {data.counts.pendingSignatures > 0 && (
              <p className="flex items-center gap-2.5 text-[13px] text-[var(--ps-fg-secondary)]">
                <PenLine className="h-4 w-4 text-[var(--ps-warning-text)]" strokeWidth={2} />
                <span className="ps-num font-semibold text-[var(--ps-fg)]">{data.counts.pendingSignatures}</span>
                {data.counts.pendingSignatures > 1
                  ? 'documents en attente de votre signature'
                  : 'document en attente de votre signature'}
              </p>
            )}
          </div>
        </SpineNode>
      </div>
    </div>
  );
}
