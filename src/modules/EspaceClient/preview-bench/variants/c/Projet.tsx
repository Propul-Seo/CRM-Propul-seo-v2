import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import type { BenchData, BenchStep } from '../../fixtures';
import { fmtDateFR } from '../../fixtures';

/* ─────────────────────────────────────────────────────────────────
 * Variante C — « Récit vertical » · Projet
 * La frise EST la page : ouverture art-dirigée (numéral géant +
 * méta composées), chaque jalon est un chapitre accroché à la ligne
 * (l'actif est le plus riche), et un chapitre final clôt le récit
 * (bilan + contact du référent).
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

/** Chapitre accroché à la colonne vertébrale (dot + segment de ligne). */
function SpineChapter({ tone, traveled, last = false, children }: {
  tone: 'strong' | 'done' | 'alert' | 'idle';
  traveled: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  const dot =
    tone === 'strong'
      ? 'border-[3px] border-[var(--ps-primary-subtle)] bg-[var(--ps-primary)]'
      : tone === 'done'
        ? 'border-2 border-[var(--ps-bg)] bg-[var(--ps-success)]'
        : tone === 'alert'
          ? 'border-2 border-[var(--ps-bg)] bg-[var(--ps-danger)]'
          : 'border-2 border-[var(--ps-border-strong)] bg-[var(--ps-bg-elevated)]';
  return (
    <section className="relative pb-12 pl-10 last:pb-0 md:pb-14 md:pl-14">
      {!last && (
        <span
          aria-hidden
          className={`absolute bottom-0 left-[7px] top-7 w-0.5 ${traveled ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-border-strong)]'}`}
        />
      )}
      <span aria-hidden className={`absolute left-0 top-2.5 h-4 w-4 rounded-full ${dot}`} />
      {children}
    </section>
  );
}

/** Numéral de chapitre — ici la séquence EST l'information (ordre réel des jalons). */
function ChapterNumeral({ index, active }: { index: number; active: boolean }) {
  return (
    <span
      aria-hidden
      className={`ps-num shrink-0 leading-none tracking-[-0.03em] [font-family:var(--ps-font-display)] ${
        active
          ? 'text-[48px] font-bold text-[var(--ps-fg)] md:text-[56px]'
          : 'text-[40px] font-semibold text-[var(--ps-fg-secondary)] md:text-[48px]'
      }`}
    >
      {String(index + 1).padStart(2, '0')}
    </span>
  );
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function ProjetC({ data }: { data: BenchData }) {
  const steps = data.steps;
  const idxActive = steps.findIndex(s => s.status === 'in_progress');
  const safeIdx = idxActive >= 0 ? idxActive : Math.max(steps.findIndex(s => s.status === 'upcoming'), 0);
  const current = steps[safeIdx];
  const doneCount = steps.filter(s => s.status === 'completed').length;
  const weeks = Math.max(
    1,
    Math.round((new Date(data.project.estimatedEnd).getTime() - new Date(data.project.startedAt).getTime()) / WEEK_MS),
  );
  const phrase = current.description.charAt(0).toLowerCase() + current.description.slice(1);
  const initials = data.referent.name.split(' ').map(p => p[0]).join('').slice(0, 2);

  return (
    <div className="ps-fade-in mx-auto w-full max-w-4xl px-4 pb-28 pt-10 md:px-12 md:pt-16">
      {/* ── Ouverture du chapitre courant ──────────────────────── */}
      <header className="md:flex md:items-end md:justify-between md:gap-12">
        <div className="min-w-0">
          <p className="ps-eyebrow">Votre projet, chapitre par chapitre</p>
          <div className="mt-5 flex items-end gap-4">
            <span className="ps-num text-[64px] font-bold leading-none tracking-[-0.03em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)] md:text-[80px]">
              {String(safeIdx + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 pb-1 md:pb-2">
              <p className="ps-num text-[12px] font-semibold text-[var(--ps-fg-secondary)]">
                sur {String(steps.length).padStart(2, '0')} chapitres
              </p>
              <h1 className="ps-h1 mt-1">{current.title}</h1>
            </div>
          </div>
          <p className="ps-body mt-5 max-w-lg">
            Votre projet est à{' '}
            <span className="ps-num font-semibold text-[var(--ps-primary-text)]">{data.project.progress} %</span> de son
            parcours — en ce moment, {phrase}
          </p>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 md:mt-0 md:block md:w-60 md:shrink-0 md:space-y-5 md:border-l md:border-[var(--ps-border-soft)] md:pl-8">
          <Meta label="Démarré le">{fmtDateFR(data.project.startedAt)}</Meta>
          <Meta label="Livraison estimée">{fmtDateFR(data.project.estimatedEnd)}</Meta>
          <Meta label="Référent">{data.referent.name}</Meta>
        </dl>
      </header>

      {/* ── La frise-récit ─────────────────────────────────────── */}
      <div className="mt-10 md:mt-12">
        <div
          aria-hidden
          className={`mb-2 ml-[7px] h-8 w-0.5 md:h-10 ${steps[0]?.status === 'completed' ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-border-strong)]'}`}
        />

        {steps.map((step, i) => {
          const active = i === safeIdx && step.status !== 'completed';
          const isDone = step.status === 'completed';
          const tone = active ? 'strong' : isDone ? 'done' : step.status === 'blocked' ? 'alert' : 'idle';

          if (active) {
            return (
              <SpineChapter key={step.id} tone="strong" traveled={false}>
                <div className="flex items-start gap-4 md:gap-6">
                  <ChapterNumeral index={i} active />
                  <div className="ps-surface min-w-0 flex-1 p-5 md:p-7">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
                      <h2 className="ps-h2">{step.title}</h2>
                      <StepChip status={step.status} />
                    </div>
                    <div className="mt-4 md:grid md:grid-cols-[minmax(0,1fr)_190px] md:gap-8">
                      <p className="ps-body min-w-0">{step.description}</p>
                      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-4 md:mt-0 md:block md:space-y-4 md:border-l md:border-[var(--ps-border-soft)] md:pl-6">
                        <Meta label="Échéance">{fmtDateFR(step.date)}</Meta>
                        <Meta label="Chapitre suivant">{steps[i + 1]?.title ?? 'Mise en ligne'}</Meta>
                      </dl>
                    </div>
                    <div className="mt-6 border-t border-[var(--ps-border-soft)] pt-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--ps-fg)]">{data.nextAction.title}</p>
                          <p className="mt-0.5 text-[12px] text-[var(--ps-fg-secondary)]">{data.nextAction.detail}</p>
                        </div>
                        <button
                          type="button"
                          className="ps-tap inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)]"
                        >
                          {data.nextAction.cta}
                          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </SpineChapter>
            );
          }

          return (
            <SpineChapter key={step.id} tone={tone} traveled={isDone}>
              <div className="flex items-start gap-4 md:gap-6">
                <ChapterNumeral index={i} active={false} />
                <div className="min-w-0 flex-1 pt-1.5 md:flex md:items-start md:justify-between md:gap-8 md:pt-2.5">
                  <div className="min-w-0">
                    <h2 className="ps-h3">{step.title}</h2>
                    <p className="ps-small mt-1.5 max-w-md">{step.description}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:mt-0.5 md:shrink-0 md:flex-col md:items-end md:gap-1.5">
                    <StepChip status={step.status} />
                    <p className="ps-num whitespace-nowrap text-[12px] text-[var(--ps-fg-secondary)]">
                      {isDone ? `Terminé le ${fmtDateFR(step.date)}` : `Prévu pour le ${fmtDateFR(step.date)}`}
                    </p>
                  </div>
                </div>
              </div>
            </SpineChapter>
          );
        })}

        {/* ── Chapitre final : bilan + contact ───────────────────── */}
        <SpineChapter tone="idle" traveled={false} last>
          <div className="pt-1.5 md:pt-2.5">
            <h2 className="ps-h3">Là où nous en sommes</h2>
            <div className="mt-5 flex flex-wrap items-end gap-x-12 gap-y-5">
              <div>
                <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Chapitres terminés</p>
                <p className="ps-metric ps-num mt-2 text-[var(--ps-fg)]">
                  {doneCount}
                  <span className="text-[15px] font-medium text-[var(--ps-fg-secondary)]"> sur {steps.length}</span>
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Durée du parcours</p>
                <p className="ps-metric ps-num mt-2 text-[var(--ps-fg)]">
                  ≈ {weeks}
                  <span className="text-[15px] font-medium text-[var(--ps-fg-secondary)]"> semaines</span>
                </p>
              </div>
              <div className="w-full max-w-xs">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Avancement</span>
                  <span className="ps-num text-[12px] font-semibold text-[var(--ps-fg)]">{data.project.progress} %</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ps-primary-subtle)]">
                  <div
                    className="ps-progress-fill h-full rounded-full bg-[var(--ps-primary)]"
                    style={{ '--ps-bar-w': `${data.project.progress}%` } as CSSProperties}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-[var(--ps-border-soft)] pt-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] text-[13px] font-semibold text-[var(--ps-primary-text)]">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--ps-fg)]">{data.referent.name}</p>
                  <p className="text-[12px] text-[var(--ps-fg-secondary)]">
                    {data.referent.role} — vous répond depuis la messagerie
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="ps-tap inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[var(--ps-radius-input)] border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] px-5 text-[13px] font-semibold text-[var(--ps-fg-secondary)] transition-colors duration-200 hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
                Poser une question
              </button>
            </div>
          </div>
        </SpineChapter>
      </div>
    </div>
  );
}
