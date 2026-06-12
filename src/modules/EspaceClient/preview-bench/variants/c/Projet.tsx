import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import type { BenchData, BenchStep } from '../../fixtures';
import { fmtDateFR } from '../../fixtures';

/* ─────────────────────────────────────────────────────────────────
 * Variante C — « Récit vertical » · Projet
 * La frise EST la page : chaque jalon est un chapitre accroché à la
 * ligne. Le jalon actif est le plus riche (description complète,
 * référent, action) ; les autres restent condensés.
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

/** Chapitre accroché à la colonne vertébrale (dot + segment de ligne). */
function SpineChapter({ status, active, last, children }: {
  status: BenchStep['status'];
  active: boolean;
  last: boolean;
  children: ReactNode;
}) {
  const dot = active
    ? 'border-[3px] border-[var(--ps-primary-subtle)] bg-[var(--ps-primary)]'
    : status === 'completed'
      ? 'border-2 border-[var(--ps-bg)] bg-[var(--ps-success)]'
      : status === 'blocked'
        ? 'border-2 border-[var(--ps-bg)] bg-[var(--ps-danger)]'
        : 'border-2 border-[var(--ps-border-strong)] bg-[var(--ps-bg-elevated)]';
  return (
    <section className="relative pb-12 pl-10 last:pb-0 md:pb-14 md:pl-14">
      {!last && (
        <span
          aria-hidden
          className={`absolute bottom-0 left-[7px] top-7 w-0.5 ${status === 'completed' ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-border-strong)]'}`}
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

export function ProjetC({ data }: { data: BenchData }) {
  const steps = data.steps;
  const idxActive = steps.findIndex(s => s.status === 'in_progress');
  const safeIdx = idxActive >= 0 ? idxActive : Math.max(steps.findIndex(s => s.status === 'upcoming'), 0);
  const current = steps[safeIdx];

  return (
    <div className="ps-fade-in mx-auto w-full max-w-3xl px-4 pb-28 pt-10 md:px-12 md:pt-16">
      {/* ── En-tête de contenu ─────────────────────────────────── */}
      <header>
        <p className="ps-eyebrow">Votre projet, chapitre par chapitre</p>
        <h1 className="ps-h1 mt-2">
          Étape <span className="ps-num">{safeIdx + 1}</span> sur {steps.length} — {current.title}
        </h1>
        <p className="ps-small mt-2">
          {data.project.name} · {data.project.presta}
        </p>
        <p className="ps-num mt-1 text-[13px] text-[var(--ps-fg-secondary)]">
          Démarré le {fmtDateFR(data.project.startedAt)} · livraison estimée le {fmtDateFR(data.project.estimatedEnd)} ·{' '}
          <span className="font-semibold text-[var(--ps-fg)]">{data.project.progress} % réalisés</span>
        </p>
      </header>

      {/* ── La frise-récit ─────────────────────────────────────── */}
      <div className="mt-10 md:mt-12">
        <div aria-hidden className="mb-2 ml-[7px] h-8 w-0.5 bg-[var(--ps-border-strong)] md:h-10" />

        {steps.map((step, i) => {
          const active = i === safeIdx && step.status !== 'completed';
          const last = i === steps.length - 1;

          if (active) {
            return (
              <SpineChapter key={step.id} status={step.status} active last={last}>
                <div className="flex items-start gap-4 md:gap-6">
                  <ChapterNumeral index={i} active />
                  <div className="ps-surface min-w-0 flex-1 p-5 md:p-7">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
                      <h2 className="ps-h2">{step.title}</h2>
                      <StepChip status={step.status} />
                    </div>
                    <p className="ps-body mt-3 max-w-lg">{step.description}</p>
                    <p className="ps-num mt-3 text-[12px] text-[var(--ps-fg-secondary)]">
                      Échéance le {fmtDateFR(step.date)} · suivi par {data.referent.name}, {data.referent.role.toLowerCase()}
                    </p>
                    <div className="mt-5 border-t border-[var(--ps-border-soft)] pt-5">
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

          const isDone = step.status === 'completed';
          return (
            <SpineChapter key={step.id} status={step.status} active={false} last={last}>
              <div className={`flex items-start gap-4 md:gap-6 ${!isDone ? 'md:ml-6' : ''}`}>
                <ChapterNumeral index={i} active={false} />
                <div className="min-w-0 flex-1 pt-1.5 md:pt-2.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="ps-h3">{step.title}</h2>
                    <StepChip status={step.status} />
                  </div>
                  <p className="ps-num mt-1 text-[12px] text-[var(--ps-fg-secondary)]">
                    {isDone ? `Terminé le ${fmtDateFR(step.date)}` : `Prévu pour le ${fmtDateFR(step.date)}`}
                  </p>
                  {!isDone && <p className="ps-small mt-1.5 max-w-md">{step.description}</p>}
                </div>
              </div>
            </SpineChapter>
          );
        })}
      </div>

      {/* ── Clôture du récit ───────────────────────────────────── */}
      <p className="mt-10 pl-10 text-[13px] text-[var(--ps-fg-secondary)] md:pl-14">
        Une question sur un jalon ? {data.referent.name}, votre {data.referent.role.toLowerCase()}, vous répond
        directement depuis la messagerie de votre espace.
      </p>
    </div>
  );
}
