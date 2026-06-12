import type { CSSProperties } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { BenchData, BenchStep } from '../../fixtures';

const fmtJour = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'À planifier';

const fmtLong = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'À planifier';

type Statut = BenchStep['status'];

const STATUT_LIBELLE: Record<Statut, string> = {
  completed: 'Terminé',
  in_progress: 'En cours',
  upcoming: 'Prévu',
  blocked: 'Bloqué',
};

const STATUT_TEXTE: Record<Statut, string> = {
  completed: 'text-[var(--ps-success-text)]',
  in_progress: 'text-[var(--ps-primary-text)]',
  upcoming: 'text-[var(--ps-fg-secondary)]',
  blocked: 'text-[var(--ps-danger-text)]',
};

/**
 * Direction A — « Éditorial calme ».
 * Une de revue (kicker, titre display, méta composée sous filet-progression),
 * frise sur hairline verticale avec dates en marginalia, l'étape active est
 * la seule surface élevée et le moment riche de la page.
 */
export function ProjetA({ data }: { data: BenchData }) {
  const { project, referent, steps, nextAction } = data;
  const active = steps.find(s => s.status === 'in_progress') ?? null;
  const done = steps.filter(s => s.status === 'completed').length;
  const barStyle = { '--ps-bar-w': `${project.progress}%` } as CSSProperties;

  return (
    <div className="ps-fade-in mx-auto w-full max-w-[1080px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-12">
      {/* ── Une de revue : kicker unique, titre display, méta organisée ── */}
      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="ps-eyebrow">Suivi de projet</p>
          <p className="text-[12px] text-[var(--ps-fg-muted)]">
            {project.name} · {project.presta}
          </p>
        </div>
        <h1 className="mt-6 max-w-[22ch] text-[clamp(28px,4.2vw,42px)] font-bold leading-[1.12] tracking-[-0.025em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)] [text-wrap:balance] sm:mt-8">
          {active
            ? <>{active.title} en cours, votre projet est à <span className="ps-num">{project.progress}&nbsp;%</span>.</>
            : <>Votre projet est à <span className="ps-num">{project.progress}&nbsp;%</span>.</>}
        </h1>

        {/* Le filet supérieur de la méta est la barre d'avancement elle-même */}
        <div className="mt-10 h-0.5 w-full rounded-full bg-[var(--ps-primary-subtle)]" role="presentation">
          <div className="ps-progress-fill h-0.5 rounded-full bg-[var(--ps-primary)]" style={barStyle} />
        </div>
        <dl className="grid grid-cols-2 gap-y-5 border-b border-[var(--ps-border)] py-5 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[var(--ps-border-soft)]">
          <Meta label="Démarré le" valeur={fmtLong(project.startedAt)} num />
          <Meta label="Livraison estimée" valeur={fmtLong(project.estimatedEnd)} num />
          <Meta label="Jalons terminés" valeur={`${done} sur ${steps.length}`} num />
          <Meta label="Référent" valeur={referent.name} />
        </dl>
      </header>

      {/* ── Frise : marginalia de dates + hairline verticale ── */}
      <ol className="mt-10 sm:mt-14">
        {steps.map(step =>
          step.status === 'in_progress' ? (
            <EtapeActive key={step.id} step={step} referent={referent} nextAction={nextAction} />
          ) : (
            <EtapeLigne key={step.id} step={step} />
          ),
        )}
      </ol>

      {/* ── Clôture : prochaine échéance + signature du référent ── */}
      <footer className="mt-14 grid gap-6 border-t border-[var(--ps-border)] pt-6 sm:mt-20 sm:grid-cols-2 sm:items-end">
        <div>
          <p className="ps-tiny">Prochaine échéance</p>
          <p className="ps-num mt-1 text-[15px] font-medium text-[var(--ps-fg)]">
            {active ? `${active.title} · ${fmtJour(active.date)}` : `Livraison · ${fmtJour(project.estimatedEnd)}`}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="ps-small">
            Un doute sur une étape ?{' '}
            <span className="font-medium text-[var(--ps-fg)]">{referent.name}</span>,{' '}
            {referent.role.toLowerCase()}, vous répond sous 24 h.
          </p>
          <button
            type="button"
            className="group mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-150 hover:text-[var(--ps-primary-hover)]"
          >
            Écrire à {referent.name.split(' ')[0] ?? referent.name}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
          </button>
        </div>
      </footer>
    </div>
  );
}

// ── Cellule de méta d'en-tête (libellé sur valeur) ─────────────────
function Meta({ label, valeur, num }: { label: string; valeur: string; num?: boolean }) {
  return (
    <div className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <dt className="ps-tiny">{label}</dt>
      <dd className={`mt-1 text-[14px] font-medium text-[var(--ps-fg)] ${num ? 'ps-num' : ''}`}>{valeur}</dd>
    </div>
  );
}

// ── Étape ordinaire : date en marge droite-alignée, marqueur sur la ligne ──
function EtapeLigne({ step }: { step: BenchStep }) {
  const fait = step.status === 'completed';
  return (
    <li className="grid gap-1.5 py-5 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-0 sm:py-0">
      <div className="flex items-baseline gap-3 sm:block sm:pr-10 sm:pt-6 sm:text-right">
        <p className="ps-num text-[13px] font-medium text-[var(--ps-fg)]">{fmtJour(step.date)}</p>
        <p className={`text-[12px] font-medium sm:mt-0.5 ${STATUT_TEXTE[step.status]}`}>
          {STATUT_LIBELLE[step.status]}
        </p>
      </div>
      <div className="relative sm:border-l sm:border-[var(--ps-border)] sm:py-6 sm:pl-10">
        <span
          className="absolute top-[27px] hidden h-[18px] w-[18px] -translate-x-1/2 items-center justify-center rounded-full bg-[var(--ps-bg)] sm:left-0 sm:flex"
          aria-hidden
        >
          {fait ? (
            <Check className="h-3.5 w-3.5 text-[var(--ps-success)]" strokeWidth={2.5} />
          ) : step.status === 'blocked' ? (
            <span className="h-2 w-2 rounded-full bg-[var(--ps-danger)]" />
          ) : (
            <span className="h-2 w-2 rounded-full border border-[var(--ps-border-strong)] bg-[var(--ps-bg)]" />
          )}
        </span>
        <h2
          className={`text-[16px] leading-[24px] [font-family:var(--ps-font-display)] ${
            fait ? 'font-medium text-[var(--ps-fg)]' : 'font-normal text-[var(--ps-fg-secondary)]'
          }`}
        >
          {step.title}
        </h2>
        <p className="mt-1 max-w-[62ch] text-[13px] leading-[20px] text-[var(--ps-fg-secondary)]">
          {step.description}
        </p>
      </div>
    </li>
  );
}

// ── Étape active : LA carte de l'écran, le moment riche ────────────
interface EtapeActiveProps {
  step: BenchStep;
  referent: BenchData['referent'];
  nextAction: BenchData['nextAction'];
}

function EtapeActive({ step, referent, nextAction }: EtapeActiveProps) {
  return (
    <li className="my-4 sm:my-6">
      <div className="ps-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[12px] font-semibold text-[var(--ps-primary-text)]">
              <span className="ps-pulse h-2 w-2 rounded-full bg-[var(--ps-primary)]" aria-hidden />
              En cours en ce moment
            </p>
            <h2 className="mt-3 text-[20px] font-semibold leading-[28px] tracking-[-0.02em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)]">
              {step.title}
            </h2>
            <p className="ps-body mt-2 max-w-[58ch]">{step.description}</p>
          </div>
          <dl className="grid shrink-0 grid-cols-2 gap-x-10 gap-y-4 sm:block sm:space-y-4 sm:text-right">
            <div>
              <dt className="ps-tiny">Échéance</dt>
              <dd className="ps-num mt-1 text-[14px] font-medium text-[var(--ps-fg)]">{fmtJour(step.date)}</dd>
            </div>
            <div>
              <dt className="ps-tiny">Référent</dt>
              <dd className="mt-1 text-[14px] font-medium text-[var(--ps-fg)]">{referent.name}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-6 flex flex-col gap-4 border-t border-[var(--ps-border-soft)] pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="ps-tiny">Action attendue de votre part</p>
            <p className="mt-1.5 text-[14px] font-semibold text-[var(--ps-fg)]">{nextAction.title}</p>
            <p className="ps-small mt-1 max-w-[52ch]">{nextAction.detail}</p>
          </div>
          <button
            type="button"
            className="group ps-tap inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)] sm:w-auto"
          >
            {nextAction.cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </li>
  );
}
