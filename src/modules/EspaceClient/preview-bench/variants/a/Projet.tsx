import { Check } from 'lucide-react';
import type { BenchData, BenchStep } from '../../fixtures';

const fmtJour = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'À planifier';

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
 * Frise en liste typographique : dates en marge gauche, graisse des titres
 * selon le statut, l'étape active est la seule surface élevée.
 */
export function ProjetA({ data }: { data: BenchData }) {
  const { project, referent, steps } = data;
  const active = steps.find(s => s.status === 'in_progress') ?? null;
  const done = steps.filter(s => s.status === 'completed').length;

  return (
    <div className="ps-fade-in mx-auto w-full max-w-[1040px] px-5 pb-20 pt-10 sm:px-8 lg:px-12">
      {/* En-tête de contenu */}
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--ps-border-soft)] pb-4">
        <p className="text-[13px] font-medium text-[var(--ps-fg)]">{project.name}</p>
        <p className="text-[12px] text-[var(--ps-fg-secondary)]">{project.presta}</p>
      </header>

      {/* Phrase d'état */}
      <section className="mt-14 sm:mt-20">
        <h1 className="ps-h1 max-w-[30ch] [text-wrap:balance]">
          {active
            ? <>{active.title} en cours — votre projet est à <span className="ps-num">{project.progress} %</span>.</>
            : <>Votre projet est à <span className="ps-num">{project.progress} %</span>.</>}
        </h1>
        <p className="ps-small mt-4">
          Démarré le {fmtJour(project.startedAt)} · livraison estimée le {fmtJour(project.estimatedEnd)} ·{' '}
          <span className="ps-num">{done}</span> {done > 1 ? 'jalons terminés' : 'jalon terminé'} sur{' '}
          <span className="ps-num">{steps.length}</span>
        </p>
      </section>

      {/* Frise typographique */}
      <ol className="mt-12 border-t border-[var(--ps-border-soft)] sm:mt-16">
        {steps.map(step => (
          <li key={step.id} className="border-b border-[var(--ps-border-soft)]">
            <Etape step={step} />
          </li>
        ))}
      </ol>

      {/* Signature humaine */}
      <footer className="mt-14 pt-1">
        <p className="ps-small max-w-[60ch]">
          Un doute sur une étape ?{' '}
          <span className="font-medium text-[var(--ps-fg)]">{referent.name}</span>,{' '}
          {referent.role.toLowerCase()}, vous explique où on en est — réponse sous 24 h.
        </p>
      </footer>
    </div>
  );
}

// ── Une étape : date en marge, marqueur, titre gradué, description en retrait ──
function Etape({ step }: { step: BenchStep }) {
  const actif = step.status === 'in_progress';
  const fait = step.status === 'completed';

  const titreClasse = actif
    ? 'font-semibold text-[var(--ps-fg)]'
    : fait
      ? 'font-normal text-[var(--ps-fg)]'
      : 'font-normal text-[var(--ps-fg-secondary)]';

  return (
    <div
      className={`grid gap-2 py-7 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-8 ${
        actif ? 'ps-surface -mx-5 my-5 px-5 py-6 sm:-mx-7 sm:px-7' : ''
      }`}
    >
      {/* Marge gauche : date + statut en toutes lettres */}
      <div className="flex items-baseline gap-3 sm:block">
        <p className="ps-num text-[13px] font-medium text-[var(--ps-fg)]">{fmtJour(step.date)}</p>
        <p className={`text-[12px] font-medium sm:mt-1 ${STATUT_TEXTE[step.status]}`}>
          {STATUT_LIBELLE[step.status]}
        </p>
      </div>

      {/* Corps : marqueur discret + titre + description en retrait */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
            {fait ? (
              <Check className="h-4 w-4 text-[var(--ps-success)]" strokeWidth={2.5} />
            ) : actif ? (
              <span className="h-2 w-2 rounded-full bg-[var(--ps-primary)]" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-border-strong)]" />
            )}
          </span>
          <h2 className={`text-[15px] leading-[22px] [font-family:var(--ps-font-display)] ${titreClasse}`}>
            {step.title}
          </h2>
        </div>
        <p className="ps-small mt-1.5 max-w-[58ch] pl-[26px]">{step.description}</p>
      </div>
    </div>
  );
}
