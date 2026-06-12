import {
  ArrowRight, CalendarClock, ChevronRight, FolderOpen, Mail, PenLine, Receipt,
} from 'lucide-react';
import { ProgressRing, StatusBadge } from '@/modules/EspaceClient/shared/components';
import { fmtDateFR, fmtEUR, type BenchData } from '../../fixtures';

const DUE_STATUSES = new Set(['sent', 'overdue']);

// Direction B — « Matière & panneaux » : panneau d'en-tête porteur
// (identité + anneau + indicateurs intégrés), bandeau d'action, rail latéral.
export function AccueilB({ data }: { data: BenchData }) {
  const { project, referent, steps, invoices, counts, nextAction } = data;

  const dueInvoices = invoices.filter(i => DUE_STATUSES.has(i.status));
  const dueTotal = dueInvoices.reduce((sum, i) => sum + i.amount_ttc, 0);
  const current = steps.find(s => s.status === 'in_progress');
  const nextStep = current ?? steps.find(s => s.status === 'upcoming');
  const doneCount = steps.filter(s => s.status === 'completed').length;
  const initials = referent.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const firstName = referent.name.split(' ')[0];

  return (
    <div className="ps-fade-in mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      {/* ── Panneau d'en-tête : identité projet + anneau + indicateurs ── */}
      <section className="ps-surface overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between md:px-8 md:py-7">
          <div className="min-w-0">
            <p className="ps-eyebrow">Votre espace projet</p>
            <h1 className="ps-h1 pt-2">
              Votre projet est à{' '}
              <span className="ps-num text-[var(--ps-primary)]">{project.progress} %</span>
              {current ? <> — {current.title.toLowerCase()} en cours.</> : <> — tout avance comme prévu.</>}
            </h1>
            <p className="ps-small mt-2">{project.name} · {project.presta}</p>
            <p className="ps-small mt-1 text-[var(--ps-fg-secondary)]">
              Démarré le {fmtDateFR(project.startedAt)} · livraison estimée le {fmtDateFR(project.estimatedEnd)}
            </p>
          </div>
          <div className="hidden sm:block">
            <ProgressRing value={project.progress} size={116} />
          </div>
        </div>

        {/* Indicateurs intégrés au panneau — bandeau bg-subtle, pas de tuiles */}
        <div className="grid grid-cols-1 divide-y divide-[var(--ps-border-soft)] border-t border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <HeaderStat
            label="Reste à régler"
            value={dueTotal > 0 ? fmtEUR(dueTotal) : '0 €'}
            hint={dueInvoices.length > 0
              ? `${dueInvoices.length} facture${dueInvoices.length > 1 ? 's' : ''} en attente`
              : 'Vous êtes à jour'}
          />
          <HeaderStat
            label="Documents partagés"
            value={String(counts.documents)}
            hint="Disponibles dans votre espace"
          />
          <HeaderStat
            label="Signatures"
            value={String(counts.pendingSignatures)}
            hint={counts.pendingSignatures > 0 ? 'Document en attente de votre signature' : 'Tout est signé'}
          />
        </div>
      </section>

      {/* ── Bandeau action attendue ── */}
      <section className="mt-5 flex flex-col gap-4 rounded-[14px] bg-[var(--ps-primary-subtle)] p-5 sm:flex-row sm:items-center md:px-7">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary)] text-white">
          <PenLine className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[var(--ps-primary-text)]">Action attendue de votre part</p>
          <h2 className="ps-h3 mt-0.5 text-[var(--ps-fg)]">{nextAction.title}</h2>
          <p className="ps-small mt-0.5">{nextAction.detail}</p>
        </div>
        <button
          type="button"
          className="ps-tap inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--ps-primary)] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)]"
        >
          {nextAction.cta}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </section>

      {/* ── Zone principale + rail latéral ── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="ps-surface overflow-hidden">
          <div className="flex items-baseline justify-between gap-3 border-b border-[var(--ps-border-soft)] px-6 py-4">
            <h2 className="ps-h2">Avancement du projet</h2>
            <p className="ps-small ps-num text-[var(--ps-fg-secondary)]">{doneCount} sur {steps.length} jalons terminés</p>
          </div>
          <ul className="divide-y divide-[var(--ps-border-soft)]">
            {steps.map(step => (
              <li key={step.id} className="flex min-h-[44px] items-center gap-3.5 px-6 py-3.5">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    step.status === 'completed' ? 'bg-[var(--ps-success)]'
                      : step.status === 'in_progress' ? 'bg-[var(--ps-primary)]'
                      : step.status === 'blocked' ? 'bg-[var(--ps-danger)]'
                      : 'bg-[var(--ps-border-strong)]'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-[var(--ps-fg)]">{step.title}</span>
                  <span className="ps-small block text-[var(--ps-fg-secondary)]">
                    {step.status === 'completed' ? 'Terminé le ' : 'Échéance le '}
                    {fmtDateFR(step.date)}
                  </span>
                </span>
                <StatusBadge status={step.status} />
              </li>
            ))}
          </ul>
        </section>

        {/* Rail latéral sticky */}
        <aside className="space-y-5 self-start lg:sticky lg:top-8">
          <div className="ps-surface p-5">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)] font-[family-name:var(--ps-font-display)] text-[14px] font-semibold text-[var(--ps-primary-text)]">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="ps-h3 truncate">{referent.name}</p>
                <p className="ps-small text-[var(--ps-fg-secondary)]">{referent.role} — votre interlocuteur dédié</p>
              </div>
            </div>
            <button
              type="button"
              className="ps-tap mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] px-4 py-2.5 text-[13px] font-semibold text-[var(--ps-fg-secondary)] transition-colors hover:bg-[var(--ps-bg-subtle)]"
            >
              <Mail className="h-4 w-4" strokeWidth={2} />
              Écrire à {firstName}
            </button>
          </div>

          <div className="ps-surface p-5">
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ps-info-subtle)] text-[var(--ps-info-text)]">
                <CalendarClock className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="ps-small text-[var(--ps-fg-secondary)]">Prochaine échéance</p>
                <p className="ps-num pt-0.5 text-[15px] font-semibold text-[var(--ps-fg)]">
                  {nextStep ? fmtDateFR(nextStep.date) : 'Aucune à venir'}
                </p>
                {nextStep && <p className="ps-small mt-0.5 truncate text-[var(--ps-fg-secondary)]">{nextStep.title}</p>}
              </div>
            </div>
          </div>

          <div className="ps-surface overflow-hidden">
            <h2 className="ps-h3 border-b border-[var(--ps-border-soft)] px-5 py-3.5">Accès rapides</h2>
            <ul className="divide-y divide-[var(--ps-border-soft)]">
              <QuickLink icon={Receipt} label="Vos factures" hint={dueInvoices.length > 0 ? `${dueInvoices.length} à régler` : 'À jour'} />
              <QuickLink icon={FolderOpen} label="Vos documents" hint={`${counts.documents} fichiers`} />
              <QuickLink icon={PenLine} label="Vos signatures" hint={counts.pendingSignatures > 0 ? `${counts.pendingSignatures} en attente` : 'Tout est signé'} />
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function HeaderStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="px-6 py-4 md:px-8">
      <p className="ps-small text-[var(--ps-fg-secondary)]">{label}</p>
      <p className="ps-metric ps-num pt-1.5 text-[var(--ps-fg)]">{value}</p>
      <p className="mt-1 text-[12px] text-[var(--ps-fg-secondary)]">{hint}</p>
    </div>
  );
}

function QuickLink({ icon: Icon, label, hint }: { icon: typeof Receipt; label: string; hint: string }) {
  return (
    <li>
      <button
        type="button"
        className="ps-tap flex min-h-[48px] w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--ps-bg-subtle)]"
      >
        <Icon className="h-[18px] w-[18px] shrink-0 text-[var(--ps-fg-secondary)]" strokeWidth={2} />
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold text-[var(--ps-fg)]">{label}</span>
          <span className="ps-small block text-[var(--ps-fg-secondary)]">{hint}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ps-fg-muted)]" strokeWidth={2} />
      </button>
    </li>
  );
}
