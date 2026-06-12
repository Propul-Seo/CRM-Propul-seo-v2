import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, Check, FileText, PenLine } from 'lucide-react';
import type { BenchData, BenchStep } from '../../fixtures';
import { fmtDateFR, fmtEUR } from '../../fixtures';

/* ─────────────────────────────────────────────────────────────────
 * Variante C — « Récit vertical » · Accueil
 * Ouverture en numéral géant (chapitre courant + méta composées),
 * puis la ligne déroule le récit : l'accompli → l'action attendue →
 * la suite du parcours → le bilan chiffré qui clôt la page.
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

/** Paire libellé/valeur des méta composées (à poser dans un <dl>). */
function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-[var(--ps-fg-secondary)]">{label}</dt>
      <dd className="ps-num mt-1 text-[13px] font-semibold text-[var(--ps-fg)]">{children}</dd>
    </div>
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
  const completed = steps.filter(s => s.status === 'completed');
  const upcoming = steps.filter(s => s.status === 'upcoming').slice(0, 2);
  const initials = data.referent.name.split(' ').map(p => p[0]).join('').slice(0, 2);

  const billed = data.invoices.filter(i => i.status !== 'cancelled' && i.status !== 'refunded' && i.status !== 'draft');
  const paidTotal = billed.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount_ttc, 0);
  const dueTotal = billed.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.amount_ttc, 0);
  const billedTotal = billed.reduce((sum, i) => sum + i.amount_ttc, 0);
  const paidPct = billedTotal > 0 ? Math.round((paidTotal / billedTotal) * 100) : 0;

  return (
    <div className="ps-fade-in mx-auto w-full max-w-4xl px-4 pb-28 pt-10 md:px-12 md:pt-16">
      {/* ── En-tête de contenu ─────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="ps-eyebrow">Votre espace projet</p>
          <h1 className="ps-h1 mt-2">{data.project.name}</h1>
          <p className="ps-small mt-1">{data.project.presta}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] text-[13px] font-semibold text-[var(--ps-primary-text)]">
            {initials}
          </span>
          <div>
            <p className="text-[13px] font-semibold text-[var(--ps-fg)]">{data.referent.name}</p>
            <p className="text-[12px] text-[var(--ps-fg-secondary)]">{data.referent.role}</p>
          </div>
        </div>
      </header>

      {/* ── Ouverture du récit : chapitre courant en numéral géant ── */}
      <div className="mt-10 md:mt-14 md:flex md:items-end md:justify-between md:gap-12">
        <div className="min-w-0">
          <div className="flex items-end gap-4">
            <span className="ps-num text-[64px] font-bold leading-none tracking-[-0.03em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)] md:text-[80px]">
              {safeIdx + 1}
            </span>
            <div className="min-w-0 pb-1 md:pb-2">
              <p className="text-[12px] font-semibold text-[var(--ps-fg-secondary)]">chapitre en cours</p>
              <p className="ps-h2 ps-num text-[var(--ps-fg-secondary)]">sur {steps.length}</p>
            </div>
          </div>
          <h2 className="ps-h2 mt-5 max-w-md">
            {current.title} — votre projet est à{' '}
            <span className="ps-num text-[var(--ps-primary-text)]">{data.project.progress} %</span>
          </h2>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 md:mt-0 md:block md:w-60 md:shrink-0 md:space-y-5 md:border-l md:border-[var(--ps-border-soft)] md:pl-8">
          <Meta label="Démarré le">{fmtDateFR(data.project.startedAt)}</Meta>
          <Meta label="Livraison estimée">{fmtDateFR(data.project.estimatedEnd)}</Meta>
          <Meta label="Chapitres terminés">{completed.length} sur {steps.length}</Meta>
        </dl>
      </div>

      {/* ── La ligne démarre sous l'ouverture ──────────────────── */}
      <div className="mt-10 md:mt-12">
        <div
          aria-hidden
          className={`mb-2 ml-[7px] h-10 w-0.5 md:h-14 ${completed.length > 0 ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-border-strong)]'}`}
        />

        {/* Chapitres parcourus : le chemin déjà fait */}
        {completed.length > 0 && (
          <SpineNode tone="done" traveled>
            <h3 className="ps-h3">Déjà accompli</h3>
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 md:gap-6">
              {completed.map(s => (
                <li key={s.id} className="min-w-0">
                  <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--ps-fg)]">
                    <Check aria-hidden className="h-3.5 w-3.5 shrink-0 text-[var(--ps-success-text)]" strokeWidth={2.5} />
                    {s.title}
                  </p>
                  <p className="ps-num mt-1 text-[12px] text-[var(--ps-fg-secondary)]">Terminé le {fmtDateFR(s.date)}</p>
                  <p className="ps-small mt-1 max-w-xs">{s.description}</p>
                </li>
              ))}
            </ul>
          </SpineNode>
        )}

        {/* Nœud fort : la prochaine action */}
        <SpineNode tone="strong">
          <p className="text-[12px] font-semibold text-[var(--ps-primary-text)]">À faire maintenant</p>
          <div className="ps-surface mt-3 p-5 md:p-7">
            <div className="md:grid md:grid-cols-[minmax(0,1fr)_190px] md:gap-8">
              <div className="min-w-0">
                <h3 className="ps-h2">{data.nextAction.title}</h3>
                <p className="ps-small mt-2 max-w-md">{data.nextAction.detail}</p>
              </div>
              <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-4 md:mt-1 md:block md:space-y-4 md:border-l md:border-[var(--ps-border-soft)] md:pl-6">
                <Meta label="Échéance">{fmtDateFR(current.date)}</Meta>
                <Meta label="Votre référent">{data.referent.name}</Meta>
              </dl>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--ps-border-soft)] pt-5">
              <button
                type="button"
                className="ps-tap inline-flex min-h-[44px] items-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)]"
              >
                {data.nextAction.cta}
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <p className="text-[12px] text-[var(--ps-fg-muted)]">Quelques minutes suffisent — tout se passe ici.</p>
            </div>
          </div>
        </SpineNode>

        {/* La suite du parcours, numérotée comme les chapitres */}
        {upcoming.length > 0 && (
          <SpineNode>
            <h3 className="ps-h3">La suite du parcours</h3>
            <ul className="mt-5 space-y-6 md:ml-8">
              {upcoming.map(s => (
                <li key={s.id} className="flex items-start gap-4 md:gap-5">
                  <span
                    aria-hidden
                    className="ps-num w-10 shrink-0 text-[28px] font-semibold leading-none tracking-[-0.02em] text-[var(--ps-fg-secondary)] [font-family:var(--ps-font-display)]"
                  >
                    {String(steps.indexOf(s) + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1 md:flex md:items-start md:justify-between md:gap-8">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--ps-fg)]">{s.title}</p>
                      <p className="ps-small mt-1 max-w-md">{s.description}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:mt-0.5 md:shrink-0 md:flex-col md:items-end md:gap-1.5">
                      <StepChip status={s.status} />
                      <p className="ps-num whitespace-nowrap text-[12px] text-[var(--ps-fg-secondary)]">
                        Prévu pour le {fmtDateFR(s.date)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </SpineNode>
        )}

        {/* Clôture du récit : le bilan chiffré */}
        <SpineNode last>
          <h3 className="ps-h3">Le projet en chiffres</h3>
          <div className="mt-6 md:grid md:grid-cols-[minmax(0,1fr)_260px] md:gap-12">
            <div className="min-w-0">
              <div className="flex flex-wrap items-end gap-x-12 gap-y-5">
                <div>
                  <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Déjà réglé</p>
                  <p className="ps-metric ps-num mt-2 text-[var(--ps-fg)]">{fmtEUR(paidTotal)}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Reste à régler</p>
                  <p className="ps-metric ps-num mt-2 text-[var(--ps-fg)]">{fmtEUR(dueTotal)}</p>
                </div>
              </div>
              <div className="mt-6 max-w-xs">
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
            <div className="mt-8 space-y-2 md:mt-0 md:border-l md:border-[var(--ps-border-soft)] md:pl-8">
              <button
                type="button"
                className="group flex min-h-[44px] w-full items-center gap-3 rounded-[var(--ps-radius-input)] text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--ps-radius-input)] bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-secondary)]">
                  <FileText className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-[var(--ps-fg)] transition-colors duration-150 group-hover:text-[var(--ps-primary-text)]">
                    <span className="ps-num">{data.counts.documents}</span> documents partagés
                  </span>
                  <span className="block text-[12px] text-[var(--ps-fg-secondary)]">Contrats, maquettes et livrables</span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-[var(--ps-fg-muted)] transition-transform duration-150 group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </button>
              {data.counts.pendingSignatures > 0 && (
                <button
                  type="button"
                  className="group flex min-h-[44px] w-full items-center gap-3 rounded-[var(--ps-radius-input)] text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--ps-radius-input)] bg-[var(--ps-warning-subtle)] text-[var(--ps-warning-text)]">
                    <PenLine className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-[var(--ps-fg)] transition-colors duration-150 group-hover:text-[var(--ps-primary-text)]">
                      <span className="ps-num">{data.counts.pendingSignatures}</span>{' '}
                      {data.counts.pendingSignatures > 1 ? 'documents à signer' : 'document à signer'}
                    </span>
                    <span className="block text-[12px] text-[var(--ps-fg-secondary)]">Votre signature est attendue</span>
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-[var(--ps-fg-muted)] transition-transform duration-150 group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </button>
              )}
            </div>
          </div>
          <p className="mt-8 border-t border-[var(--ps-border-soft)] pt-5 text-[13px] text-[var(--ps-fg-secondary)]">
            Une question ? <span className="font-semibold text-[var(--ps-fg)]">{data.referent.name}</span>, votre{' '}
            {data.referent.role.toLowerCase()}, vous répond directement depuis la messagerie de votre espace.
          </p>
        </SpineNode>
      </div>
    </div>
  );
}
