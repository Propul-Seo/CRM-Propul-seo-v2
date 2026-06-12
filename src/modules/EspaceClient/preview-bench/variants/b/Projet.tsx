import type { CSSProperties } from 'react';
import { ArrowRight, Check, CheckCircle2, FileText, Receipt } from 'lucide-react';
import { StatusBadge } from '@/modules/EspaceClient/shared/components';
import { fmtDateFR, type BenchData, type BenchStep } from '../../fixtures';

// Direction B — « Matière & panneaux » : frise des jalons dans le panneau
// principal, rail droit sticky « Activité & prochaine étape ».
export function ProjetB({ data }: { data: BenchData }) {
  const { project, referent, steps, invoices, nextAction } = data;

  const doneCount = steps.filter(s => s.status === 'completed').length;
  const current = steps.find(s => s.status === 'in_progress');
  const initials = referent.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  const feed = [
    ...steps
      .filter(s => s.status === 'completed' && s.date)
      .map(s => ({ id: `st-${s.id}`, date: s.date as string, icon: CheckCircle2, label: `Jalon terminé — ${s.title}` })),
    ...invoices
      .filter(i => i.paid_at)
      .map(i => ({ id: `pay-${i.id}`, date: i.paid_at as string, icon: Receipt, label: `Paiement reçu — ${i.invoice_number}` })),
    ...invoices
      .filter(i => i.status === 'sent')
      .map(i => ({ id: `inv-${i.id}`, date: i.issued_at, icon: FileText, label: `Facture émise — ${i.invoice_number}` })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <div className="ps-fade-in mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      {/* ── En-tête de contenu ── */}
      <header>
        <h1 className="ps-h1">
          {current ? `${current.title} en cours` : 'Projet finalisé'} —{' '}
          <span className="ps-num">{doneCount}</span> jalon{doneCount > 1 ? 's' : ''} terminé{doneCount > 1 ? 's' : ''} sur{' '}
          <span className="ps-num">{steps.length}</span>.
        </h1>
        <p className="ps-small mt-2">
          {project.name} · {project.presta} · livraison estimée le {fmtDateFR(project.estimatedEnd)}
        </p>
        <div className="mt-4 flex max-w-md items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--ps-primary-subtle)]">
            <div
              className="ps-progress-fill h-full rounded-full bg-[var(--ps-primary)]"
              style={{ '--ps-bar-w': `${project.progress}%` } as CSSProperties}
            />
          </div>
          <span className="ps-num text-[13px] font-semibold text-[var(--ps-fg)]">{project.progress} %</span>
        </div>
      </header>

      {/* ── Split : frise + rail ── */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="ps-surface px-6 py-6 md:px-8">
          <h2 className="ps-h2">Les étapes de votre projet</h2>
          <ol className="mt-6">
            {steps.map((step, idx) => (
              <TimelineRow key={step.id} step={step} isLast={idx === steps.length - 1} />
            ))}
          </ol>
        </section>

        {/* Rail sticky : action attendue + fil récent + référent */}
        <aside className="self-start lg:sticky lg:top-8">
          <div className="ps-surface overflow-hidden">
            <div className="bg-[var(--ps-primary-subtle)] p-5">
              <p className="text-[12px] font-semibold text-[var(--ps-primary-text)]">Action attendue de votre part</p>
              <h2 className="ps-h3 mt-1.5 text-[var(--ps-fg)]">{nextAction.title}</h2>
              <p className="ps-small mt-1">{nextAction.detail}</p>
              <button
                type="button"
                className="ps-tap mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--ps-primary)] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)]"
              >
                {nextAction.cta}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="border-t border-[var(--ps-border-soft)] px-5 pb-2 pt-4">
              <h2 className="ps-h3">Activité récente</h2>
              <ul className="mt-1 divide-y divide-[var(--ps-border-soft)]">
                {feed.map(item => (
                  <li key={item.id} className="flex min-h-[44px] items-center gap-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-secondary)]">
                      <item.icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--ps-fg)]">{item.label}</span>
                      <span className="ps-small block text-[var(--ps-fg-secondary)]">{fmtDateFR(item.date)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-3 border-t border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] font-[family-name:var(--ps-font-display)] text-[13px] font-semibold text-[var(--ps-primary-text)]">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-[var(--ps-fg)]">{referent.name}</p>
                <p className="ps-small text-[var(--ps-fg-secondary)]">{referent.role} — il suit votre projet au quotidien</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Ligne de frise : dot statut + connecteur vertical fin ──────────
function TimelineRow({ step, isLast }: { step: BenchStep; isLast: boolean }) {
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast && (
        <span aria-hidden className="absolute bottom-0 left-3 top-7 w-px bg-[var(--ps-border)]" />
      )}
      <StepDot status={step.status} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <h3 className="ps-h3">{step.title}</h3>
          <StatusBadge status={step.status} />
        </div>
        <p className="ps-small mt-1">{step.description}</p>
        <p className="ps-small ps-num mt-1.5 text-[var(--ps-fg-secondary)]">
          {step.status === 'completed' ? 'Terminé le ' : step.status === 'in_progress' ? 'Échéance le ' : 'Prévu pour le '}
          {fmtDateFR(step.date)}
        </p>
      </div>
    </li>
  );
}

function StepDot({ status }: { status: BenchStep['status'] }) {
  if (status === 'completed') {
    return (
      <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)]">
        <span className="ps-pulse h-2.5 w-2.5 rounded-full bg-[var(--ps-primary)]" />
      </span>
    );
  }
  if (status === 'blocked') {
    return (
      <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ps-danger-subtle)]">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--ps-danger)]" />
      </span>
    );
  }
  return (
    <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--ps-border)] bg-[var(--ps-bg-subtle)]">
      <span className="h-2 w-2 rounded-full bg-[var(--ps-border-strong)]" />
    </span>
  );
}
