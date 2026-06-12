import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, PenLine } from 'lucide-react';
import type { BenchData, BenchStep } from '../../fixtures';
import { fmtEUR } from '../../fixtures';

const fmtJour = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—';

const fmtCourt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

/**
 * Direction A — « Éditorial calme ».
 * Une de revue (kicker unique, phrase d'état display, bande de repères sous
 * filets), action attendue en seule surface élevée, bas de page en deux
 * colonnes éditoriales (la suite + côté facturation), signature du référent.
 */
export function AccueilA({ data }: { data: BenchData }) {
  const { project, referent, steps, invoices, counts, nextAction } = data;

  const active = steps.find(s => s.status === 'in_progress') ?? null;
  const done = steps.filter(s => s.status === 'completed').length;
  const aVenir = steps.filter(s => s.status !== 'completed');
  const dues = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const totalDu = dues.reduce((somme, i) => somme + i.amount_ttc, 0);
  const totalRegle = invoices
    .filter(i => i.status === 'paid')
    .reduce((somme, i) => somme + i.amount_ttc, 0);
  const prochaineEcheance = dues[0]?.due_date ?? null;
  const initiales = referent.name
    .split(' ')
    .map(part => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const barStyle = { '--ps-bar-w': `${project.progress}%` } as CSSProperties;

  // Phrase d'état dérivée des données : attention > action attendue > générique.
  const pointAttention =
    steps.some(s => s.status === 'blocked') || invoices.some(i => i.status === 'overdue');
  const phraseEtat = pointAttention
    ? 'Votre projet a besoin de vous.'
    : nextAction
      ? 'Votre projet avance, une action vous attend.'
      : 'Votre projet avance bien.';

  return (
    <div className="ps-fade-in mx-auto w-full max-w-[1080px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-12">
      {/* ── Une de revue : kicker unique, phrase d'état, repères chiffrés ── */}
      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="ps-eyebrow">Votre espace projet</p>
          <p className="text-[12px] text-[var(--ps-fg-muted)]">
            {project.name} · {project.presta}
          </p>
        </div>
        <h1 className="mt-6 max-w-[18ch] text-[clamp(28px,4.2vw,42px)] font-bold leading-[1.12] tracking-[-0.025em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)] [text-wrap:balance] sm:mt-8">
          {phraseEtat}
        </h1>
        <p className="ps-body mt-5 max-w-[56ch]">
          {active ? `${active.title} est en cours` : 'Toutes les étapes sont terminées'}
          {active?.date && (
            <>
              , prochain jalon le{' '}
              <span className="ps-num font-medium text-[var(--ps-fg)]">{fmtJour(active.date)}</span>
            </>
          )}
          . Livraison estimée le{' '}
          <span className="ps-num font-medium text-[var(--ps-fg)]">{fmtJour(project.estimatedEnd)}</span>.
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-y-8 border-y border-[var(--ps-border)] py-7 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[var(--ps-border-soft)]">
          <Kpi libelle="Avancement global" valeur={`${project.progress} %`}>
            <div className="mt-3 h-0.5 w-full max-w-[140px] rounded-full bg-[var(--ps-primary-subtle)]" role="presentation">
              <div className="ps-progress-fill h-0.5 rounded-full bg-[var(--ps-primary)]" style={barStyle} />
            </div>
          </Kpi>
          <Kpi libelle="Prochain jalon" valeur={active?.date ? fmtCourt(active.date) : '—'} sous={active?.title} />
          <Kpi libelle="Jalons terminés" valeur={`${done} sur ${steps.length}`} sous={active ? `${active.title} en cours` : 'Projet terminé'} />
          <Kpi
            libelle="Documents partagés"
            valeur={String(counts.documents)}
            sous={counts.pendingSignatures > 0 ? `${counts.pendingSignatures} signature en attente` : 'Tout est signé'}
          />
        </dl>
      </header>

      {/* ── L'action attendue : LA carte de l'écran ── */}
      <section className="mt-12 sm:mt-16">
        <div className="ps-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
            <div className="flex min-w-0 items-start gap-4">
              <span
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] text-[13px] font-semibold text-[var(--ps-primary-text)] [font-family:var(--ps-font-display)] sm:flex"
                aria-hidden
              >
                {initiales}
              </span>
              <div className="min-w-0">
                <p className="ps-tiny">Action attendue de votre part</p>
                <h2 className="ps-h2 mt-1.5">{nextAction.title}</h2>
                <p className="ps-small mt-1.5 max-w-[58ch]">{nextAction.detail}</p>
              </div>
            </div>
            <button
              type="button"
              className="group ps-tap inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)] sm:w-auto"
            >
              {nextAction.cta}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
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

      {/* ── Bas de page en deux colonnes : la suite + côté facturation ── */}
      <section className="mt-14 grid gap-x-16 gap-y-12 sm:mt-20 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--ps-border)] pb-3">
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
        </div>
        <aside>
          <h2 className="ps-h3 border-b border-[var(--ps-border)] pb-3">Côté facturation</h2>
          <dl className="divide-y divide-[var(--ps-border-soft)]">
            <Repere label="À régler" valeur={totalDu > 0 ? fmtEUR(totalDu) : 'Rien en attente'} />
            <Repere label="Échéance" valeur={fmtCourt(prochaineEcheance)} />
            <Repere label="Réglé à ce jour" valeur={fmtEUR(totalRegle)} />
          </dl>
          <button
            type="button"
            className="group mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-150 hover:text-[var(--ps-primary-hover)]"
          >
            Consulter les factures
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
          </button>
        </aside>
      </section>

      {/* ── Clôture : signature humaine du référent ── */}
      <footer className="mt-14 flex flex-col gap-4 border-t border-[var(--ps-border)] pt-6 sm:mt-20 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ps-bg-subtle)] text-[12px] font-semibold text-[var(--ps-fg-secondary)] [font-family:var(--ps-font-display)]"
            aria-hidden
          >
            {initiales}
          </span>
          <div>
            <p className="text-[14px] font-medium text-[var(--ps-fg)]">{referent.name}</p>
            <p className="ps-tiny mt-0.5">{referent.role} · vous répond sous 24 h</p>
          </div>
        </div>
        <button
          type="button"
          className="group inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-150 hover:text-[var(--ps-primary-hover)]"
        >
          Écrire à {referent.name.split(' ')[0] ?? referent.name}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
        </button>
      </footer>
    </div>
  );
}

// ── Repère chiffré de la bande d'en-tête ───────────────────────────
function Kpi({ libelle, valeur, sous, children }: { libelle: string; valeur: string; sous?: string; children?: ReactNode }) {
  return (
    <div className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <dt className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">{libelle}</dt>
      <dd className="mt-2.5">
        <span className="ps-metric ps-num block text-[var(--ps-fg)]">{valeur}</span>
        {sous && <span className="ps-tiny mt-2 block truncate">{sous}</span>}
        {children}
      </dd>
    </div>
  );
}

// ── Ligne « côté facturation » (marginalia) ────────────────────────
function Repere({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="text-[13px] text-[var(--ps-fg-secondary)]">{label}</dt>
      <dd className="ps-num text-[13.5px] font-medium text-[var(--ps-fg)]">{valeur}</dd>
    </div>
  );
}

// ── Ligne de jalon à venir (date en marge, titre gradué) ──────────
function JalonLigne({ step }: { step: BenchStep }) {
  const enCours = step.status === 'in_progress';
  return (
    <li className="flex min-h-[44px] items-baseline gap-5 py-4">
      <span className="ps-num w-[72px] shrink-0 text-[13px] text-[var(--ps-fg-secondary)]">
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
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-primary)]" aria-hidden />
          En cours
        </span>
      )}
    </li>
  );
}
