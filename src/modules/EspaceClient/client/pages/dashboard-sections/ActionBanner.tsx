import { Link } from 'react-router-dom';
import { ArrowRight, PenLine, Receipt } from 'lucide-react';
import type { DashboardAction } from './lib';

const KIND_ICON = { invoice: Receipt, signature: PenLine } as const;

// Bandeau « action attendue » (fond primary-subtle + CTA violet) : porte
// l'action prioritaire réelle, triée par urgence dans DashboardPage
// (facture en retard > signature en attente > facture à régler).

export function ActionBanner({ action }: { action: DashboardAction }) {
  const Icon = KIND_ICON[action.kind];
  return (
    <section className="flex flex-col gap-4 rounded-[var(--ps-radius-card)] bg-[var(--ps-primary-subtle)] p-5 sm:flex-row sm:items-center md:px-7">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary)] text-white">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-[var(--ps-primary-text)]">Action attendue de votre part</p>
        <h2 className="ps-h3 ps-num mt-0.5 truncate text-[var(--ps-fg)]">{action.title}</h2>
        <p className="ps-small ps-num mt-0.5">{action.meta}</p>
      </div>
      <Link
        to={action.to}
        className="group ps-tap inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--ps-primary)] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)]"
      >
        {action.cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
      </Link>
    </section>
  );
}

// Actions en attente au-delà de la prioritaire — logique et liens préservés
// de la page d'origine (jusqu'à 3 lignes cliquables).
export function SecondaryActions({ actions }: { actions: DashboardAction[] }) {
  return (
    <section className="space-y-3">
      <h2 className="ps-h3 flex items-center gap-2">
        {actions.length > 1 ? 'Autres actions en attente' : 'Autre action en attente'}
        <span className="ps-num inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] px-1 text-[11px] font-semibold text-[var(--ps-primary-text)]">
          {actions.length}
        </span>
      </h2>
      {actions.map(a => {
        const Icon = KIND_ICON[a.kind];
        return (
          <Link
            key={a.key}
            to={a.to}
            className="group ps-surface ps-surface-hover ps-tap flex min-h-[44px] items-center gap-4 px-5 py-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]">
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="ps-num block truncate text-[13.5px] font-semibold text-[var(--ps-fg)]">{a.title}</span>
              <span className="ps-num block text-[12px] text-[var(--ps-fg-muted)]">{a.meta}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--ps-primary-subtle)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-200 group-hover:bg-[var(--ps-primary)] group-hover:text-white">
              {a.cta}
            </span>
          </Link>
        );
      })}
    </section>
  );
}
