import { Sparkles, Target, ExternalLink } from 'lucide-react';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import type { UseWelcomeWizardResult } from '../useWelcomeWizard';
import { Step1QualifRecap } from './Step1QualifRecap';

function NoQualifPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl bg-white p-6 text-center"
      style={{ boxShadow: '0 30px 60px -15px rgba(192,38,211,0.20), 0 0 0 1px rgba(192,38,211,0.06)' }}
    >
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 via-violet-100 to-pink-100 ring-1 ring-violet-200">
        <Target className="h-5 w-5 text-violet-700" />
      </div>
      <div className="space-y-1">
        <p className="text-[14px] font-semibold tracking-tight text-stone-900">
          Votre récap arrive bientôt
        </p>
        <p className="mx-auto max-w-[30ch] text-[12px] leading-relaxed text-stone-600">
          On n'a pas encore reçu votre questionnaire — quelques minutes pour mieux comprendre votre projet.
        </p>
      </div>
      <a
        href="/diagnostic"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-4 text-[12.5px] font-semibold text-white shadow-md shadow-violet-500/30 transition-shadow hover:shadow-violet-500/50"
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
      <div className="rounded-3xl bg-white p-6"
        style={{ boxShadow: '0 30px 60px -15px rgba(56,189,248,0.25), 0 0 0 1px rgba(56,189,248,0.08)' }}
      >
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-violet-500 to-pink-500"
          style={{ boxShadow: '0 10px 25px -5px rgba(139,92,246,0.5)' }}
        >
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h1 className="mt-4 text-[36px] font-light leading-[1] tracking-tight text-stone-900">
          Bonjour,
          <br />
          <span className="bg-gradient-to-r from-sky-600 via-violet-600 to-pink-600 bg-clip-text font-semibold text-transparent">
            {firstName}.
          </span>
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-stone-600">
          On démarre <span className="font-semibold text-stone-900">{company}</span> ensemble.
          Quelques étapes pour personnaliser votre espace.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-emerald-700">Votre AE est en ligne</span>
        </div>
      </div>

      {/* Colonne droite — récap qualif OU CTA */}
      <div>
        {qualif ? <Step1QualifRecap qualif={qualif} /> : <NoQualifPanel />}
      </div>
    </div>
  );
}
