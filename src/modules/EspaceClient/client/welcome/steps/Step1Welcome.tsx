import { Sparkles, Target, ExternalLink } from 'lucide-react';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import type { UseWelcomeWizardResult } from '../useWelcomeWizard';
import { Step1QualifRecap } from './Step1QualifRecap';

function NoQualifPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-elevated)] p-6 text-center shadow-[var(--ps-shadow-floating)]">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)]">
        <Target className="h-5 w-5 text-[var(--ps-primary-text)]" />
      </div>
      <div className="space-y-1">
        <p className="text-[14px] font-semibold tracking-tight text-[var(--ps-fg)]">
          Votre récap arrive bientôt
        </p>
        <p className="mx-auto max-w-[30ch] text-[12px] leading-relaxed text-[var(--ps-fg-secondary)]">
          On n'a pas encore reçu votre questionnaire — quelques minutes pour mieux comprendre votre projet.
        </p>
      </div>
      <a
        href="/diagnostic"
        target="_blank"
        rel="noopener noreferrer"
        className="ps-brand-gradient ps-glow-violet-soft ps-tap inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-semibold !text-white"
      >
        Compléter mon questionnaire
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

interface Step1WelcomeProps { wizard: UseWelcomeWizardResult }

export function Step1Welcome({ wizard }: Step1WelcomeProps) {
  const { project } = usePortal();
  const qualif = wizard.qualification;

  const firstName = wizard.row?.welcome_first_name
    ?? qualif?.full_name?.split(' ')[0]
    ?? project.client_name?.split(' ')[0]
    ?? 'là';
  const company = wizard.row?.welcome_company ?? qualif?.company_name ?? project.name ?? 'votre projet';

  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2">
      {/* Colonne gauche — salutation chaleureuse */}
      <div className="rounded-3xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-elevated)] p-6 shadow-[var(--ps-shadow-floating)]">
        <div className="ps-brand-gradient ps-glow-violet inline-flex h-11 w-11 items-center justify-center rounded-2xl">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h1 className="mt-4 text-[36px] font-light leading-[1] tracking-tight text-[var(--ps-fg)]">
          Bonjour,
          <br />
          <span className="font-semibold text-[var(--ps-primary-text)]">
            {firstName}.
          </span>
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--ps-fg-secondary)]">
          On démarre <span className="font-semibold text-[var(--ps-fg)]">{company}</span> ensemble.
          Quelques étapes pour personnaliser votre espace.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--ps-success-subtle)] px-3 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ps-success)]" />
          <span className="text-[11px] font-medium text-[var(--ps-success-text)]">Votre AE est en ligne</span>
        </div>
      </div>

      {/* Colonne droite — récap qualif OU CTA */}
      <div>
        {qualif ? <Step1QualifRecap qualif={qualif} /> : <NoQualifPanel />}
      </div>
    </div>
  );
}
