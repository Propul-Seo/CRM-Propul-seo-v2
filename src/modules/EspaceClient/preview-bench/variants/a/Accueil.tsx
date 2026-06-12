import { ArrowRight, PenLine } from 'lucide-react';
import type { BenchData, BenchStep } from '../../fixtures';
import { fmtEUR } from '../../fixtures';

const fmtJour = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—';

const fmtCourt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

/**
 * Direction A — « Éditorial calme ».
 * La typographie porte tout : contenus posés sur le fond, filets 1px,
 * une seule surface élevée (l'action attendue).
 */
export function AccueilA({ data }: { data: BenchData }) {
  const { project, referent, steps, invoices, counts, nextAction } = data;

  const active = steps.find(s => s.status === 'in_progress') ?? null;
  const done = steps.filter(s => s.status === 'completed').length;
  const aVenir = steps.filter(s => s.status !== 'completed');
  const resteARegler = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((somme, i) => somme + i.amount_ttc, 0);

  // Phrase d'état dérivée des données : attention > action attendue > générique.
  const pointAttention =
    steps.some(s => s.status === 'blocked') || invoices.some(i => i.status === 'overdue');
  const phraseEtat = pointAttention
    ? 'Votre projet a besoin de vous.'
    : nextAction
      ? 'Votre projet avance — une action vous attend.'
      : 'Votre projet avance bien.';

  return (
    <div className="ps-fade-in mx-auto w-full max-w-[1040px] px-5 pb-20 pt-10 sm:px-8 lg:px-12">
      {/* En-tête de contenu — une ligne, un filet */}
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--ps-border-soft)] pb-4">
        <p className="text-[13px] font-medium text-[var(--ps-fg)]">{project.name}</p>
        <p className="text-[12px] text-[var(--ps-fg-secondary)]">{project.presta}</p>
      </header>

      {/* Phrase d'état — l'ouverture magazine */}
      <section className="mt-14 sm:mt-20">
        <h1 className="max-w-[16ch] text-[clamp(28px,4.6vw,40px)] font-bold leading-[1.15] tracking-[-0.025em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)] [text-wrap:balance]">
          {phraseEtat}
        </h1>
        <p className="ps-body mt-5 max-w-[54ch]">
          {active ? `${active.title} est en cours` : 'Toutes les étapes sont terminées'}
          {active?.date && (
            <>
              {' '}— prochain jalon le{' '}
              <span className="ps-num font-medium text-[var(--ps-fg)]">{fmtJour(active.date)}</span>
            </>
          )}
          . Livraison estimée le {fmtJour(project.estimatedEnd)}.
        </p>
      </section>

      {/* KPI en colonnes typographiques — pas de tuiles */}
      <section className="mt-12 sm:mt-16">
        <dl className="grid grid-cols-2 gap-y-10 border-t border-[var(--ps-border-soft)] pt-8 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[var(--ps-border-soft)]">
          <Kpi valeur={`${project.progress} %`} libelle="Avancement global" />
          <Kpi valeur={active?.date ? fmtJour(active.date) : '—'} libelle="Prochain jalon" />
          <Kpi valeur={fmtEUR(resteARegler)} libelle="Reste à régler" />
          <Kpi valeur={String(counts.documents)} libelle="Documents partagés" />
        </dl>
      </section>

      {/* L'action attendue — la seule surface élevée de la page */}
      <section className="mt-14 sm:mt-20">
        <div className="ps-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="ps-eyebrow">Action attendue de votre part</p>
              <h2 className="ps-h2 mt-2">{nextAction.title}</h2>
              <p className="ps-small mt-2 max-w-[58ch]">{nextAction.detail}</p>
            </div>
            <button
              type="button"
              className="ps-tap inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)]"
            >
              {nextAction.cta}
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
          {counts.pendingSignatures > 0 && (
            <p className="mt-6 flex items-center gap-2 border-t border-[var(--ps-border-soft)] pt-4 text-[12px] text-[var(--ps-fg-secondary)]">
              <PenLine className="h-3.5 w-3.5 shrink-0 text-[var(--ps-fg-muted)]" strokeWidth={2} />
              {counts.pendingSignatures === 1
                ? 'Un document attend aussi votre signature.'
                : `${counts.pendingSignatures} documents attendent aussi votre signature.`}
            </p>
          )}
        </div>
      </section>

      {/* La suite — liste typographique nue */}
      <section className="mt-16 sm:mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--ps-border-soft)] pb-3">
          <h2 className="ps-h3">La suite du projet</h2>
          <p className="ps-num text-[12px] text-[var(--ps-fg-secondary)]">
            {done} {done > 1 ? 'jalons terminés' : 'jalon terminé'} sur {steps.length}
          </p>
        </div>
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          {aVenir.map(step => (
            <JalonLigne key={step.id} step={step} />
          ))}
        </ul>
      </section>

      {/* Signature humaine */}
      <footer className="mt-16 border-t border-[var(--ps-border-soft)] pt-5">
        <p className="ps-small max-w-[60ch]">
          Une question ?{' '}
          <span className="font-medium text-[var(--ps-fg)]">{referent.name}</span>,{' '}
          {referent.role.toLowerCase()}, suit votre projet et vous répond sous 24 h.
        </p>
      </footer>
    </div>
  );
}

// ── Colonne KPI typographique ──────────────────────────────────────
function Kpi({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div className="flex flex-col-reverse gap-2.5 sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <dt className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">{libelle}</dt>
      <dd className="ps-metric ps-num text-[var(--ps-fg)]">{valeur}</dd>
    </div>
  );
}

// ── Ligne de jalon à venir (date en marge, titre gradué) ──────────
function JalonLigne({ step }: { step: BenchStep }) {
  const enCours = step.status === 'in_progress';
  return (
    <li className="flex min-h-[44px] items-baseline gap-5 py-4">
      <span className="ps-num w-[80px] shrink-0 text-[13px] text-[var(--ps-fg-secondary)]">
        {fmtCourt(step.date)}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-[14px] ${
          enCours ? 'font-semibold text-[var(--ps-fg)]' : 'font-normal text-[var(--ps-fg-secondary)]'
        }`}
      >
        {step.title}
      </span>
      {enCours && (
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[var(--ps-primary-text)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-primary)]" />
          En cours
        </span>
      )}
    </li>
  );
}
